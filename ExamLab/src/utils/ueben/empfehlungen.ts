import type { Frage } from '../../types/ueben/fragen'
import type { FragenFortschritt, MasteryStufe } from '../../types/ueben/fortschritt'
import type { Auftrag, Empfehlung } from '../../types/ueben/auftrag'
import type { ThemenFreischaltung } from '../../types/ueben/themenSichtbarkeit'
import type { GruppenEinstellungen } from '../../types/ueben/settings'
import { istDauerbaustelle } from './mastery'

const MAX_EMPFEHLUNGEN = 3

interface ThemaScore {
  fach: string
  thema: string
  gesamt: number
  masteryScore: number // 0 = alles neu, 100 = alles gemeistert
  hatGefestigt: boolean
  hatDauerbaustellen: boolean
  istAktiv: boolean
}

/**
 * Berechnet Empfehlungen mit erweiterter Priorisierung:
 * 1. LP-Aufträge (immer zuoberst)
 * 2. LP-Fokusthema (wenn gesetzt)
 * 3. Aktive Themen mit niedrigster Mastery
 * 4. Dauerbaustellen
 * 5. Festigung (fast gemeistert)
 */
export function berechneEmpfehlungen(
  fragen: Frage[],
  fortschritte: Record<string, FragenFortschritt>,
  auftraege: Auftrag[],
  email: string,
  freischaltungen?: ThemenFreischaltung[],
  einstellungen?: GruppenEinstellungen,
): Empfehlung[] {
  const empfehlungen: Empfehlung[] = []

  // 1. Aktive Aufträge (immer zuoberst)
  const aktiveAuftraege = auftraege.filter(a =>
    a.status === 'aktiv' && a.zielEmail.includes(email)
  )
  for (const auftrag of aktiveAuftraege) {
    if (empfehlungen.length >= MAX_EMPFEHLUNGEN) break
    empfehlungen.push({
      typ: 'auftrag',
      titel: auftrag.titel,
      beschreibung: auftrag.frist ? `Bis ${auftrag.frist}` : 'Kein Termin',
      fach: auftrag.filter.fach || '',
      thema: auftrag.filter.thema || '',
      auftragId: auftrag.id,
    })
  }

  if (empfehlungen.length >= MAX_EMPFEHLUNGEN) return empfehlungen

  // Themen-Scores berechnen
  const aktiveThemen = new Set(
    (freischaltungen || []).filter(f => f.status === 'aktiv').map(f => `${f.fach}|${f.thema}`)
  )

  const themenMap = new Map<string, ThemaScore>()
  for (const f of fragen) {
    const key = `${f.fach}|${f.thema}`
    if (!themenMap.has(key)) {
      themenMap.set(key, {
        fach: f.fach, thema: f.thema, gesamt: 0, masteryScore: 0,
        hatGefestigt: false, hatDauerbaustellen: false,
        istAktiv: aktiveThemen.has(key),
      })
    }
    const entry = themenMap.get(key)!
    entry.gesamt++

    const fp = fortschritte[f.id]
    const mastery = fp?.mastery || 'neu'
    entry.masteryScore += masteryZuScore(mastery)
    if (mastery === 'gefestigt') entry.hatGefestigt = true
    if (fp && istDauerbaustelle(fp.versuche, fp.richtig)) entry.hatDauerbaustellen = true
  }

  const themen = [...themenMap.values()]
    .filter(t => t.gesamt > 0)
    .map(t => ({ ...t, masteryScore: t.masteryScore / t.gesamt }))

  if (themen.every(t => t.masteryScore >= 100)) return empfehlungen

  // 2. LP-Fokusthema (wenn gesetzt und noch nicht empfohlen)
  const fokus = (einstellungen as { fokusThema?: { fach: string; thema: string } })?.fokusThema
  if (fokus && empfehlungen.length < MAX_EMPFEHLUNGEN) {
    const fokusThema = themen.find(t => t.fach === fokus.fach && t.thema === fokus.thema)
    if (fokusThema && fokusThema.masteryScore < 100) {
      empfehlungen.push({
        typ: 'luecke',
        titel: `Fokus: ${fokusThema.thema}`,
        beschreibung: `LP-Empfehlung · ${Math.round(fokusThema.masteryScore)}% beherrscht`,
        fach: fokusThema.fach,
        thema: fokusThema.thema,
      })
    }
  }

  if (empfehlungen.length >= MAX_EMPFEHLUNGEN) return empfehlungen

  // 3. Aktive Themen mit grösster Lücke
  const aktiveLuecken = themen
    .filter(t => t.istAktiv && t.masteryScore < 100)
    .filter(t => !empfehlungen.some(e => e.thema === t.thema))
    .sort((a, b) => a.masteryScore - b.masteryScore)

  if (aktiveLuecken.length > 0 && empfehlungen.length < MAX_EMPFEHLUNGEN) {
    const groesste = aktiveLuecken[0]
    empfehlungen.push({
      typ: 'luecke',
      titel: `${groesste.thema} vertiefen`,
      beschreibung: `Aktuelles Thema · ${Math.round(groesste.masteryScore)}% beherrscht`,
      fach: groesste.fach,
      thema: groesste.thema,
    })
  }

  if (empfehlungen.length >= MAX_EMPFEHLUNGEN) return empfehlungen

  // 4. Dauerbaustellen (themenübergreifend)
  if (empfehlungen.length < MAX_EMPFEHLUNGEN) {
    const dauerBau = themen
      .filter(t => t.hatDauerbaustellen)
      .filter(t => !empfehlungen.some(e => e.thema === t.thema))
      .sort((a, b) => a.masteryScore - b.masteryScore)

    if (dauerBau.length > 0) {
      empfehlungen.push({
        typ: 'luecke',
        titel: `${dauerBau[0].thema} wiederholen`,
        beschreibung: 'Dauerbaustelle — gezielt üben',
        fach: dauerBau[0].fach,
        thema: dauerBau[0].thema,
      })
    }
  }

  if (empfehlungen.length >= MAX_EMPFEHLUNGEN) return empfehlungen

  // 5. Festigung (fast gemeistert)
  if (empfehlungen.length < MAX_EMPFEHLUNGEN) {
    const festigung = themen
      .filter(t => t.hatGefestigt && t.masteryScore < 100)
      .filter(t => !empfehlungen.some(e => e.thema === t.thema))
      .sort((a, b) => b.masteryScore - a.masteryScore)

    if (festigung.length > 0) {
      empfehlungen.push({
        typ: 'festigung',
        titel: `${festigung[0].thema} festigen`,
        beschreibung: 'Fast gemeistert!',
        fach: festigung[0].fach,
        thema: festigung[0].thema,
      })
    }
  }

  // Fallback: Grösste Lücke allgemein (wenn keine aktiven Themen)
  if (empfehlungen.length === 0) {
    const alleLuecken = themen
      .filter(t => t.masteryScore < 100)
      .sort((a, b) => a.masteryScore - b.masteryScore)

    if (alleLuecken.length > 0) {
      empfehlungen.push({
        typ: 'luecke',
        titel: `${alleLuecken[0].thema} vertiefen`,
        beschreibung: `${Math.round(alleLuecken[0].masteryScore)}% beherrscht`,
        fach: alleLuecken[0].fach,
        thema: alleLuecken[0].thema,
      })
    }
  }

  return empfehlungen.slice(0, MAX_EMPFEHLUNGEN)
}

function masteryZuScore(mastery: MasteryStufe): number {
  switch (mastery) {
    case 'neu': return 0
    case 'ueben': return 25
    case 'gefestigt': return 75
    case 'gemeistert': return 100
  }
}
