import type { Frage, BloomStufe } from '../types/fragen.ts'
import type { PruefungsConfig } from '../types/pruefung.ts'
import { berechneZeitbedarf } from './zeitbedarf.ts'
import { typLabel } from './fachUtils.ts'

/** Taxonomie-Verteilung (K1-K6) */
export interface TaxonomieVerteilung {
  stufe: BloomStufe
  anzahl: number
  prozent: number
  fragenNummern: number[]
}

/** Fragetypen-Mix */
export interface FragetypMix {
  typ: string
  label: string
  anzahl: number
  fragenNummern: number[]
}

/** Punkte pro Abschnitt */
export interface AbschnittPunkte {
  titel: string
  punkte: number
  prozent: number
}

/** Themen-Gruppierung */
export interface ThemaAbdeckung {
  thema: string
  anzahl: number
}

/** Fachbereich-Status */
export interface FachbereichStatus {
  fachbereich: string
  anzahl: number
  konfiguriert: boolean
}

/** Zeitbedarf pro Frage */
export interface ZeitbedarfDetail {
  frageId: string
  typ: string
  minuten: number
  frageNummer: number
  label: string
}

/** Warnung */
export interface AnalyseWarnung {
  text: string
  schwere: 'info' | 'warnung' | 'fehler'
}

/** Komplette lokale Analyse */
export interface PruefungsAnalyse {
  gesamtFragen: number
  gesamtPunkte: number
  gesamtPunkteKonfiguriert: number
  zeitbedarfSumme: number
  dauerMinuten: number
  zeitbedarfProzent: number
  taxonomie: TaxonomieVerteilung[]
  fragetypen: FragetypMix[]
  abschnittPunkte: AbschnittPunkte[]
  themen: ThemaAbdeckung[]
  fachbereiche: FachbereichStatus[]
  zeitbedarfDetails: ZeitbedarfDetail[]
  warnungen: AnalyseWarnung[]
}


/** Berechnet die komplette lokale Analyse einer Prüfung */
export function berechnePruefungsAnalyse(
  pruefung: PruefungsConfig,
  fragenMap: Record<string, Frage>,
): PruefungsAnalyse {
  // Alle Fragen der Prüfung sammeln
  const fragenIds = pruefung.abschnitte.flatMap((a) => a.fragenIds)
  const fragen = fragenIds.map((id) => fragenMap[id]).filter(Boolean)

  // Taxonomie (mit Frage-Nummern)
  const bloomCounts: Record<BloomStufe, number> = { K1: 0, K2: 0, K3: 0, K4: 0, K5: 0, K6: 0 }
  const bloomFragen: Record<BloomStufe, number[]> = { K1: [], K2: [], K3: [], K4: [], K5: [], K6: [] }
  for (let i = 0; i < fragen.length; i++) {
    const f = fragen[i]
    if (f.bloom && bloomCounts[f.bloom] !== undefined) {
      bloomCounts[f.bloom]++
      bloomFragen[f.bloom].push(i + 1)
    }
  }
  const taxonomie: TaxonomieVerteilung[] = (['K1', 'K2', 'K3', 'K4', 'K5', 'K6'] as BloomStufe[]).map((stufe) => ({
    stufe,
    anzahl: bloomCounts[stufe],
    prozent: fragen.length > 0 ? Math.round((bloomCounts[stufe] / fragen.length) * 100) : 0,
    fragenNummern: bloomFragen[stufe],
  }))

  // Fragetypen (mit Frage-Nummern)
  const typCounts: Record<string, number> = {}
  const typFragen: Record<string, number[]> = {}
  for (let i = 0; i < fragen.length; i++) {
    const typ = fragen[i].typ
    typCounts[typ] = (typCounts[typ] || 0) + 1
    if (!typFragen[typ]) typFragen[typ] = []
    typFragen[typ].push(i + 1)
  }
  const fragetypen: FragetypMix[] = Object.entries(typCounts)
    .map(([typ, anzahl]) => ({ typ, label: typLabel(typ), anzahl, fragenNummern: typFragen[typ] || [] }))
    .sort((a, b) => b.anzahl - a.anzahl)

  // Punkte pro Abschnitt
  const gesamtPunkte = fragen.reduce((s, f) => s + f.punkte, 0)
  const abschnittPunkte: AbschnittPunkte[] = pruefung.abschnitte.map((a) => {
    const pkt = a.fragenIds.reduce((s, id) => s + (fragenMap[id]?.punkte ?? 0), 0)
    return {
      titel: a.titel,
      punkte: pkt,
      prozent: gesamtPunkte > 0 ? Math.round((pkt / gesamtPunkte) * 100) : 0,
    }
  })

  // Themen (normalisiert: Trim + erster Buchstabe gross)
  const themenMap: Record<string, number> = {}
  for (const f of fragen) {
    const raw = (f.thema || '').trim()
    const t = raw ? raw.charAt(0).toUpperCase() + raw.slice(1) : '(Kein Thema)'
    themenMap[t] = (themenMap[t] || 0) + 1
  }
  const themen: ThemaAbdeckung[] = Object.entries(themenMap)
    .map(([thema, anzahl]) => ({ thema, anzahl }))
    .sort((a, b) => b.anzahl - a.anzahl)

  // Fachbereiche
  const fbCounts: Record<string, number> = {}
  for (const f of fragen) fbCounts[f.fachbereich] = (fbCounts[f.fachbereich] || 0) + 1
  const fachbereiche: FachbereichStatus[] = ['VWL', 'BWL', 'Recht'].map((fb) => ({
    fachbereich: fb,
    anzahl: fbCounts[fb] || 0,
    konfiguriert: pruefung.fachbereiche.includes(fb),
  }))

  // Zeitbedarf (mit Frage-Nummer und Label)
  const zeitbedarfDetails: ZeitbedarfDetail[] = fragen.map((f, i) => {
    const minuten = f.zeitbedarf ?? berechneZeitbedarf(
      f.typ as 'mc' | 'freitext' | 'lueckentext' | 'zuordnung' | 'richtigfalsch' | 'berechnung' | 'visualisierung',
      f.bloom || 'K2',
      f.typ === 'freitext' && 'laenge' in f ? { laenge: (f as { laenge: 'kurz' | 'mittel' | 'lang' }).laenge } : undefined,
    )
    return { frageId: f.id, typ: f.typ, minuten, frageNummer: i + 1, label: typLabel(f.typ) }
  })
  const zeitbedarfSumme = zeitbedarfDetails.reduce((s, z) => s + z.minuten, 0)
  const zeitbedarfProzent = pruefung.dauerMinuten > 0
    ? Math.round((zeitbedarfSumme / pruefung.dauerMinuten) * 100)
    : 0

  // Warnungen
  const warnungen: AnalyseWarnung[] = []

  if (zeitbedarfProzent > 120) {
    warnungen.push({ text: `Zeitbedarf (${zeitbedarfSumme} Min.) überschreitet die Prüfungsdauer (${pruefung.dauerMinuten} Min.) deutlich`, schwere: 'fehler' })
  } else if (zeitbedarfProzent > 100) {
    warnungen.push({ text: `Zeitbedarf (${zeitbedarfSumme} Min.) übersteigt die Prüfungsdauer (${pruefung.dauerMinuten} Min.) leicht`, schwere: 'warnung' })
  } else if (zeitbedarfProzent < 60 && fragen.length > 0) {
    warnungen.push({ text: `Zeitbedarf (${zeitbedarfSumme} Min.) liegt deutlich unter der Prüfungsdauer (${pruefung.dauerMinuten} Min.)`, schwere: 'warnung' })
  }

  const k1k2 = bloomCounts.K1 + bloomCounts.K2
  const k1k2Prozent = fragen.length > 0 ? (k1k2 / fragen.length) * 100 : 0
  if (k1k2Prozent > 60 && fragen.length >= 3) {
    warnungen.push({ text: `${Math.round(k1k2Prozent)}% der Fragen auf K1/K2 — wenig anspruchsvolle Taxonomiestufen`, schwere: 'warnung' })
  }

  if (bloomCounts.K5 + bloomCounts.K6 === 0 && fragen.length >= 5) {
    warnungen.push({ text: 'Keine Fragen auf K5/K6 — keine anspruchsvollen Aufgaben', schwere: 'info' })
  }

  const verwendeteTypen = Object.keys(typCounts).length
  if (verwendeteTypen === 1 && fragen.length >= 3) {
    warnungen.push({ text: `Nur ein Fragetyp (${typLabel(Object.keys(typCounts)[0])}) verwendet`, schwere: 'info' })
  }

  for (const fb of fachbereiche) {
    if (fb.konfiguriert && fb.anzahl === 0) {
      warnungen.push({ text: `Fachbereich ${fb.fachbereich} ist konfiguriert, hat aber keine Fragen`, schwere: 'warnung' })
    }
  }

  if (gesamtPunkte !== pruefung.gesamtpunkte && pruefung.gesamtpunkte > 0) {
    warnungen.push({ text: `Summe der Fragenpunkte (${gesamtPunkte}) ≠ konfigurierte Gesamtpunkte (${pruefung.gesamtpunkte})`, schwere: 'warnung' })
  }

  return {
    gesamtFragen: fragen.length,
    gesamtPunkte,
    gesamtPunkteKonfiguriert: pruefung.gesamtpunkte,
    zeitbedarfSumme,
    dauerMinuten: pruefung.dauerMinuten,
    zeitbedarfProzent,
    taxonomie,
    fragetypen,
    abschnittPunkte,
    themen,
    fachbereiche,
    zeitbedarfDetails,
    warnungen,
  }
}
