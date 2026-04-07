import type { Frage } from '../../types/ueben/fragen'
import type { FragenFortschritt, MasteryStufe } from '../../types/ueben/fortschritt'
import type { Auftrag, Empfehlung } from '../../types/ueben/auftrag'

const MAX_EMPFEHLUNGEN = 3

interface ThemaScore {
  fach: string
  thema: string
  gesamt: number
  masteryScore: number // 0 = alles neu, 100 = alles gemeistert
  hatGefestigt: boolean // mind. 1 Frage gefestigt (kurz vor gemeistert)
}

export function berechneEmpfehlungen(
  fragen: Frage[],
  fortschritte: Record<string, FragenFortschritt>,
  auftraege: Auftrag[],
  email: string
): Empfehlung[] {
  const empfehlungen: Empfehlung[] = []

  // 1. Aktive Auftraege (immer zuoberst)
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
  const themenMap = new Map<string, ThemaScore>()
  for (const f of fragen) {
    const key = `${f.fach}|${f.thema}`
    if (!themenMap.has(key)) {
      themenMap.set(key, { fach: f.fach, thema: f.thema, gesamt: 0, masteryScore: 0, hatGefestigt: false })
    }
    const entry = themenMap.get(key)!
    entry.gesamt++

    const mastery = fortschritte[f.id]?.mastery || 'neu'
    entry.masteryScore += masteryZuScore(mastery)
    if (mastery === 'gefestigt') entry.hatGefestigt = true
  }

  const themen = [...themenMap.values()]
    .filter(t => t.gesamt > 0)
    .map(t => ({ ...t, masteryScore: t.masteryScore / t.gesamt }))

  // Alle gemeistert? Keine Empfehlungen noetig
  if (themen.every(t => t.masteryScore >= 100)) return empfehlungen

  // 2. Groesste Luecke (tiefster Score, nicht 100%)
  const luecken = themen
    .filter(t => t.masteryScore < 100)
    .sort((a, b) => a.masteryScore - b.masteryScore)

  if (luecken.length > 0 && empfehlungen.length < MAX_EMPFEHLUNGEN) {
    const groesste = luecken[0]
    empfehlungen.push({
      typ: 'luecke',
      titel: `${groesste.thema} vertiefen`,
      beschreibung: `${Math.round(groesste.masteryScore)}% beherrscht`,
      fach: groesste.fach,
      thema: groesste.thema,
    })
  }

  // 3. Festigung (Thema mit gefestigten Fragen — kurz vor gemeistert)
  if (empfehlungen.length < MAX_EMPFEHLUNGEN) {
    const festigung = themen
      .filter(t => t.hatGefestigt && t.masteryScore < 100)
      .sort((a, b) => b.masteryScore - a.masteryScore) // Hoechster Score zuerst (am naechsten an gemeistert)

    if (festigung.length > 0) {
      const naechstes = festigung[0]
      // Nicht duplizieren wenn schon als Luecke empfohlen
      if (!empfehlungen.some(e => e.thema === naechstes.thema)) {
        empfehlungen.push({
          typ: 'festigung',
          titel: `${naechstes.thema} festigen`,
          beschreibung: 'Fast gemeistert!',
          fach: naechstes.fach,
          thema: naechstes.thema,
        })
      }
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
