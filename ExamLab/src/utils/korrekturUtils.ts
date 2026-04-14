import type { FragenBewertung, SchuelerKorrektur, PruefungsKorrektur } from '../types/korrektur.ts'
import type { NotenConfig } from '../types/pruefung.ts'

/** Standard-Notenkonfiguration (Schweizer Gymnasium) */
export const DEFAULT_NOTEN_CONFIG: NotenConfig = {
  punkteFuerSechs: 0, // 0 = maxPunkte verwenden
  rundung: 0.5,
}

/** Rundet auf die gewählte Genauigkeit */
function rundeNote(note: number, rundung: NotenConfig['rundung']): number {
  const gerundet = Math.round(note / rundung) * rundung
  // Auf max. 2 Dezimalstellen begrenzen (Floating-Point-Artefakte)
  return Math.round(gerundet * 100) / 100
}

/** Prüft ob ein Punktewert gesetzt ist (nicht null, undefined oder leerer String vom Backend) */
function istPunkteGesetzt(wert: number | null | undefined): wert is number {
  return wert != null && wert !== ('' as unknown as number) && Number.isFinite(wert as number)
}

/** Effektive Punkte: LP-Anpassung wenn vorhanden, sonst KI-Vorschlag, sonst 0 */
export function effektivePunkte(bewertung: FragenBewertung): number {
  if (istPunkteGesetzt(bewertung.lpPunkte)) return bewertung.lpPunkte
  if (istPunkteGesetzt(bewertung.kiPunkte)) return bewertung.kiPunkte
  return 0
}

/** Gesamtpunkte eines SuS aus Bewertungen berechnen */
export function berechneGesamtpunkte(bewertungen: Record<string, FragenBewertung>): {
  punkte: number
  maxPunkte: number
} {
  let punkte = 0
  let maxPunkte = 0
  for (const b of Object.values(bewertungen)) {
    punkte += effektivePunkte(b)
    // NaN-Schutz: maxPunkte kann bei Daten aus dem Backend fehlen
    maxPunkte += (Number.isFinite(b.maxPunkte) ? b.maxPunkte : 0)
  }
  return { punkte, maxPunkte }
}

/**
 * Schweizer Note berechnen (1-6, 4 = genügend)
 * Formel: Note = 1 + 5 × (erreichtePunkte / punkteFuerSechs)
 *
 * @param punkte — erreichte Punkte
 * @param maxPunkte — maximale Punkte der Prüfung
 * @param config — optionale Konfiguration (punkteFuerSechs, Rundung)
 */
export function berechneNote(punkte: number, maxPunkte: number, config?: Partial<NotenConfig>): number {
  const punkteFuerSechs = (config?.punkteFuerSechs && config.punkteFuerSechs > 0)
    ? config.punkteFuerSechs
    : maxPunkte
  const rundung = config?.rundung ?? 0.5

  // NaN-Schutz: Fehlende/ungültige Punkte → Note 1
  if (punkteFuerSechs === 0 || !Number.isFinite(punkte) || !Number.isFinite(punkteFuerSechs)) return 1
  const note = 1 + 5 * (punkte / punkteFuerSechs)
  const begrenzt = Math.min(6, Math.max(1, note)) // Auf 1-6 begrenzen
  return rundeNote(begrenzt, rundung)
}

/** Statistiken über alle SuS berechnen */
export function berechneStatistiken(schueler: SchuelerKorrektur[], notenConfig?: Partial<NotenConfig>): {
  durchschnitt: number
  median: number
  bestanden: number
  durchgefallen: number
  durchschnittNote: number
  medianNote: number
} {
  if (schueler.length === 0) {
    return { durchschnitt: 0, median: 0, bestanden: 0, durchgefallen: 0, durchschnittNote: 1, medianNote: 1 }
  }

  const punkte = schueler.map((s) => Number.isFinite(s.gesamtPunkte) ? s.gesamtPunkte : 0)
  const maxPunkte = schueler[0]?.maxPunkte || 1
  const rundung = notenConfig?.rundung ?? 0.5
  const noten = punkte.map((p) => berechneNote(p, maxPunkte, notenConfig))

  const summe = punkte.reduce((a, b) => a + b, 0)
  const durchschnitt = Math.round((summe / punkte.length) * 10) / 10

  const sortiert = [...punkte].sort((a, b) => a - b)
  const mitte = Math.floor(sortiert.length / 2)
  const median = sortiert.length % 2 === 0
    ? (sortiert[mitte - 1] + sortiert[mitte]) / 2
    : sortiert[mitte]

  const summeNoten = noten.reduce((a, b) => a + b, 0)
  const durchschnittNote = rundeNote(summeNoten / noten.length, rundung)
  const notenSortiert = [...noten].sort((a, b) => a - b)
  const medianNote = notenSortiert.length % 2 === 0
    ? rundeNote((notenSortiert[mitte - 1] + notenSortiert[mitte]) / 2, rundung)
    : notenSortiert[mitte]

  const bestanden = noten.filter((n) => n >= 4).length
  const durchgefallen = noten.filter((n) => n < 4).length

  return { durchschnitt, median, bestanden, durchgefallen, durchschnittNote, medianNote }
}

/** Korrektur-Status-Label */
export function statusLabel(status: SchuelerKorrektur['korrekturStatus']): string {
  switch (status) {
    case 'offen': return 'Offen'
    case 'ki-bewertet': return 'KI bewertet'
    case 'review-fertig': return 'Review fertig'
    case 'versendet': return 'Versendet'
    default: return status
  }
}

/** Korrektur-Status-Farbe (Tailwind) */
export function korrekturStatusFarbe(status: SchuelerKorrektur['korrekturStatus']): string {
  switch (status) {
    case 'offen': return 'text-slate-500 bg-slate-100 dark:text-slate-400 dark:bg-slate-700'
    case 'ki-bewertet': return 'text-amber-700 bg-amber-100 dark:text-amber-300 dark:bg-amber-900/30'
    case 'review-fertig': return 'text-green-700 bg-green-100 dark:text-green-300 dark:bg-green-900/30'
    case 'versendet': return 'text-blue-700 bg-blue-100 dark:text-blue-300 dark:bg-blue-900/30'
    default: return 'text-slate-500 bg-slate-100'
  }
}

/** Quelle-Label für Bewertungsherkunft */
export function quelleLabel(quelle: FragenBewertung['quelle']): string {
  switch (quelle) {
    case 'auto': return 'Auto'
    case 'ki': return 'KI'
    case 'manuell': return 'Manuell'
    case 'fehler': return 'Fehler'
    default: return quelle
  }
}

// === Fragen-Statistiken ===

export interface FragenStatistik {
  frageId: string
  fragenTyp: string
  maxPunkte: number
  durchschnittPunkte: number
  loesungsquote: number  // 0-100%
  anzahlBewertet: number
  trennschaerfe: number | null       // Punkt-biseriale Korrelation (-1 bis +1)
  trennschaerfeLabel: string | null  // 'schlecht' | 'akzeptabel' | 'gut' | 'sehr gut'
}

/**
 * Punkt-biseriale Korrelation: Misst den Zusammenhang zwischen
 * Item-Score (Punkte auf einer Frage) und Gesamtscore (Total aller Fragen).
 *
 * r_pb = (M_1 - M_0) / S_t * sqrt(p * q)
 * Für polytome Items (Teilpunkte): Pearson-Korrelation zwischen Item-Score und Gesamtscore.
 *
 * Interpretation: <0.2 schlecht, 0.2-0.3 akzeptabel, 0.3-0.4 gut, >0.4 sehr gut
 */
function berechneTrennschaerfe(
  frageId: string,
  korrektur: PruefungsKorrektur
): { wert: number | null; label: string | null } {
  // Gesamtpunkte pro SuS berechnen (ohne diese Frage = part-whole-correction)
  const paare: Array<{ itemScore: number; restScore: number }> = []

  for (const s of korrektur.schueler) {
    const bewertung = s.bewertungen[frageId]
    if (!bewertung) continue

    const itemScore = effektivePunkte(bewertung)
    let restScore = 0
    for (const [fId, b] of Object.entries(s.bewertungen)) {
      if (fId !== frageId) restScore += effektivePunkte(b)
    }
    paare.push({ itemScore, restScore })
  }

  // Mindestens 5 SuS nötig für sinnvolle Korrelation
  if (paare.length < 5) return { wert: null, label: null }

  // Pearson-Korrelation berechnen
  const n = paare.length
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0
  for (const { itemScore: x, restScore: y } of paare) {
    sumX += x; sumY += y; sumXY += x * y; sumX2 += x * x; sumY2 += y * y
  }
  const denom = Math.sqrt((n * sumX2 - sumX ** 2) * (n * sumY2 - sumY ** 2))
  if (denom === 0) return { wert: 0, label: 'schlecht' }

  const r = (n * sumXY - sumX * sumY) / denom
  const wert = Math.round(r * 100) / 100

  let label: string
  if (wert >= 0.4) label = 'sehr gut'
  else if (wert >= 0.3) label = 'gut'
  else if (wert >= 0.2) label = 'akzeptabel'
  else label = 'schlecht'

  return { wert, label }
}

/**
 * Berechnet Statistiken pro Frage über alle SuS.
 * Für jede eindeutige frageId: Durchschnitt, Lösungsquote, Trennschärfe, Anzahl bewerteter SuS.
 */
export function berechneFragenStatistiken(korrektur: PruefungsKorrektur): FragenStatistik[] {
  // Alle Frage-IDs sammeln
  const fragenDaten = new Map<string, {
    typ: string
    maxPunkte: number
    sumPunkte: number
    anzahl: number
  }>()

  for (const schueler of korrektur.schueler) {
    for (const [frageId, bewertung] of Object.entries(schueler.bewertungen)) {
      const bestehend = fragenDaten.get(frageId)
      const punkte = effektivePunkte(bewertung)

      if (bestehend) {
        bestehend.sumPunkte += punkte
        bestehend.anzahl += 1
      } else {
        fragenDaten.set(frageId, {
          typ: bewertung.fragenTyp,
          maxPunkte: bewertung.maxPunkte,
          sumPunkte: punkte,
          anzahl: 1,
        })
      }
    }
  }

  const statistiken: FragenStatistik[] = []
  for (const [frageId, daten] of fragenDaten) {
    const durchschnitt = daten.anzahl > 0
      ? Math.round((daten.sumPunkte / daten.anzahl) * 100) / 100
      : 0
    const loesungsquote = daten.maxPunkte > 0
      ? Math.round((durchschnitt / daten.maxPunkte) * 1000) / 10
      : 0

    const ts = berechneTrennschaerfe(frageId, korrektur)

    statistiken.push({
      frageId,
      fragenTyp: daten.typ,
      maxPunkte: daten.maxPunkte,
      durchschnittPunkte: durchschnitt,
      loesungsquote,
      anzahlBewertet: daten.anzahl,
      trennschaerfe: ts.wert,
      trennschaerfeLabel: ts.label,
    })
  }

  return statistiken
}
