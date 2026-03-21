import type { BuchungssatzFrage, SollHabenZeile, BuchungsKonto, TKontoFrage, TKontoEintrag } from '../types/fragen'
import type { Antwort } from '../types/antworten'
import { findKonto } from './kontenrahmen'

export interface KorrekturErgebnis {
  erreichtePunkte: number
  maxPunkte: number
  details: KorrekturDetail[]
}

export interface KorrekturDetail {
  bezeichnung: string
  korrekt: boolean
  erreicht: number
  max: number
  kommentar?: string
}

/** Auto-correct a Buchungssatz answer */
export function korrigiereBuchungssatz(
  frage: BuchungssatzFrage,
  antwortBuchungen: {
    id: string
    sollKonten: { kontonummer: string; betrag: number }[]
    habenKonten: { kontonummer: string; betrag: number }[]
    buchungstext?: string
  }[]
): KorrekturErgebnis {
  const details: KorrekturDetail[] = []
  const punkteProBuchung = frage.punkte / Math.max(1, frage.buchungen.length)

  // Match each expected Buchung to the best submitted one (order-independent)
  const verwendeteAntworten = new Set<number>()

  for (let i = 0; i < frage.buchungen.length; i++) {
    const erwartet = frage.buchungen[i]
    let bestMatch = -1
    let bestScore = 0

    for (let j = 0; j < antwortBuchungen.length; j++) {
      if (verwendeteAntworten.has(j)) continue
      const score = bewerteBuchung(erwartet, antwortBuchungen[j])
      if (score > bestScore) {
        bestScore = score
        bestMatch = j
      }
    }

    if (bestMatch >= 0) {
      verwendeteAntworten.add(bestMatch)
    }

    const erreicht = bestScore * punkteProBuchung
    details.push({
      bezeichnung: `Buchung ${i + 1}`,
      korrekt: bestScore >= 0.99,
      erreicht: Math.round(erreicht * 100) / 100,
      max: Math.round(punkteProBuchung * 100) / 100,
      kommentar: bestScore < 0.99 ? beschreibeFehler(erwartet, bestMatch >= 0 ? antwortBuchungen[bestMatch] : undefined) : undefined,
    })
  }

  const erreichtePunkte = details.reduce((s, d) => s + d.erreicht, 0)
  return {
    erreichtePunkte: Math.round(erreichtePunkte * 100) / 100,
    maxPunkte: frage.punkte,
    details,
  }
}

/** Score how well a submitted Buchung matches an expected one (0-1) */
function bewerteBuchung(
  erwartet: SollHabenZeile,
  eingabe: { sollKonten: { kontonummer: string; betrag: number }[]; habenKonten: { kontonummer: string; betrag: number }[] }
): number {
  if (!eingabe) return 0

  const sollScore = bewerteKontenListe(erwartet.sollKonten, eingabe.sollKonten)
  const habenScore = bewerteKontenListe(erwartet.habenKonten, eingabe.habenKonten)

  // 50% for Soll, 50% for Haben
  return (sollScore + habenScore) / 2
}

/** Score how well submitted Konten match expected ones (0-1) */
function bewerteKontenListe(
  erwartet: BuchungsKonto[],
  eingabe: { kontonummer: string; betrag: number }[]
): number {
  if (erwartet.length === 0) return eingabe.length === 0 ? 1 : 0
  if (eingabe.length === 0) return 0

  let treffer = 0
  const verwendet = new Set<number>()

  for (const ek of erwartet) {
    for (let j = 0; j < eingabe.length; j++) {
      if (verwendet.has(j)) continue
      if (eingabe[j].kontonummer === ek.kontonummer && eingabe[j].betrag === ek.betrag) {
        treffer++
        verwendet.add(j)
        break
      }
    }
  }

  // Partial credit: correct matches / max(expected, submitted)
  return treffer / Math.max(erwartet.length, eingabe.length)
}

/** Describe what's wrong with a Buchung */
function beschreibeFehler(
  erwartet: SollHabenZeile,
  eingabe?: { sollKonten: { kontonummer: string; betrag: number }[]; habenKonten: { kontonummer: string; betrag: number }[] }
): string {
  if (!eingabe) return 'Buchung fehlt'
  const teile: string[] = []

  const sollOk = bewerteKontenListe(erwartet.sollKonten, eingabe.sollKonten) >= 0.99
  const habenOk = bewerteKontenListe(erwartet.habenKonten, eingabe.habenKonten) >= 0.99

  if (!sollOk) teile.push('Soll-Seite fehlerhaft')
  if (!habenOk) teile.push('Haben-Seite fehlerhaft')

  return teile.join(', ')
}

// === T-KONTO AUTO-KORREKTUR ===

/** Bewerte T-Konto-Einträge: Vergleich Musterlösung vs. Eingabe (reihenfolge-unabhängig) */
function bewerteTKontoEintraege(
  erwartet: TKontoEintrag[],
  eingabe: {
    eintraegeLinks: { gegenkonto: string; betrag: number }[]
    eintraegeRechts: { gegenkonto: string; betrag: number }[]
  }
): number {
  if (erwartet.length === 0) {
    return (eingabe.eintraegeLinks.length === 0 && eingabe.eintraegeRechts.length === 0) ? 1 : 0
  }

  // Flache Liste aller Eingabe-Einträge mit Seite
  const eingabeListe = [
    ...eingabe.eintraegeLinks.map(e => ({ seite: 'links' as const, gegenkonto: e.gegenkonto, betrag: e.betrag })),
    ...eingabe.eintraegeRechts.map(e => ({ seite: 'rechts' as const, gegenkonto: e.gegenkonto, betrag: e.betrag })),
  ]

  let treffer = 0
  const verwendet = new Set<number>()

  for (const ek of erwartet) {
    const erwarteteSeite = ek.seite === 'soll' ? 'links' : 'rechts'
    for (let j = 0; j < eingabeListe.length; j++) {
      if (verwendet.has(j)) continue
      const eg = eingabeListe[j]
      if (eg.seite === erwarteteSeite && eg.gegenkonto === ek.gegenkonto && eg.betrag === ek.betrag) {
        treffer++
        verwendet.add(j)
        break
      }
    }
  }

  return treffer / Math.max(erwartet.length, eingabeListe.length)
}

/** Auto-Korrektur für T-Konto-Fragen */
export function korrigiereTKonto(
  frage: TKontoFrage,
  antwortKonten: Extract<Antwort, { typ: 'tkonto' }>['konten']
): KorrekturErgebnis {
  const details: KorrekturDetail[] = []
  const opts = frage.bewertungsoptionen

  // Aktive Kriterien zählen
  const aktivKriterien = [opts.beschriftungSollHaben, opts.kontenkategorie,
    opts.zunahmeAbnahme, opts.buchungenKorrekt, opts.saldoKorrekt].filter(Boolean).length
  const punkteProKonto = frage.punkte / Math.max(1, frage.konten.length)
  const punkteProKriterium = punkteProKonto / Math.max(1, aktivKriterien)

  for (let i = 0; i < frage.konten.length; i++) {
    const erwartet = frage.konten[i]
    const eingabe = antwortKonten.find(k => k.id === erwartet.id)

    if (!eingabe) {
      details.push({ bezeichnung: `T-Konto ${i + 1}`, korrekt: false, erreicht: 0, max: punkteProKonto })
      continue
    }

    // Beschriftung Soll/Haben
    if (opts.beschriftungSollHaben) {
      const korrekt = eingabe.beschriftungLinks === 'Soll' && eingabe.beschriftungRechts === 'Haben'
      details.push({
        bezeichnung: `T-Konto ${i + 1}: Beschriftung`,
        korrekt,
        erreicht: korrekt ? punkteProKriterium : 0,
        max: punkteProKriterium,
      })
    }

    // Kontenkategorie
    if (opts.kontenkategorie) {
      const expected = findKonto(erwartet.kontonummer)?.kategorie
      const korrekt = eingabe.kontenkategorie === expected
      details.push({
        bezeichnung: `T-Konto ${i + 1}: Kontenkategorie`,
        korrekt,
        erreicht: korrekt ? punkteProKriterium : 0,
        max: punkteProKriterium,
      })
    }

    // Buchungen korrekt
    if (opts.buchungenKorrekt) {
      const score = bewerteTKontoEintraege(erwartet.eintraege, eingabe)
      details.push({
        bezeichnung: `T-Konto ${i + 1}: Buchungen`,
        korrekt: score >= 0.99,
        erreicht: score * punkteProKriterium,
        max: punkteProKriterium,
      })
    }

    // Saldo korrekt
    if (opts.saldoKorrekt) {
      const korrekt = eingabe.saldo
        && eingabe.saldo.betrag === erwartet.saldo.betrag
        && ((eingabe.saldo.seite === 'links' && erwartet.saldo.seite === 'soll')
          || (eingabe.saldo.seite === 'rechts' && erwartet.saldo.seite === 'haben'))
      details.push({
        bezeichnung: `T-Konto ${i + 1}: Saldo`,
        korrekt: !!korrekt,
        erreicht: korrekt ? punkteProKriterium : 0,
        max: punkteProKriterium,
      })
    }
  }

  const erreichtePunkte = details.reduce((s, d) => s + d.erreicht, 0)
  return {
    erreichtePunkte: Math.round(erreichtePunkte * 100) / 100,
    maxPunkte: frage.punkte,
    details,
  }
}
