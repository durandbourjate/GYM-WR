import type { FragenBewertung, SchuelerKorrektur } from '../types/korrektur.ts'

/** Effektive Punkte: LP-Anpassung wenn vorhanden, sonst KI-Vorschlag, sonst 0 */
export function effektivePunkte(bewertung: FragenBewertung): number {
  return bewertung.lpPunkte ?? bewertung.kiPunkte ?? 0
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
    maxPunkte += b.maxPunkte
  }
  return { punkte, maxPunkte }
}

/**
 * Schweizer Note berechnen (1-6, 4 = genügend)
 * Lineare Skala: 0% → 1, 100% → 6
 * Auf 0.5 gerundet (Standard an Schweizer Gymnasien)
 */
export function berechneNote(punkte: number, maxPunkte: number): number {
  if (maxPunkte === 0) return 1
  const note = 1 + 5 * (punkte / maxPunkte)
  return Math.round(note * 2) / 2  // Auf 0.5 runden
}

/** Statistiken über alle SuS berechnen */
export function berechneStatistiken(schueler: SchuelerKorrektur[]): {
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

  const punkte = schueler.map((s) => s.gesamtPunkte)
  const maxPunkte = schueler[0]?.maxPunkte || 1
  const noten = punkte.map((p) => berechneNote(p, maxPunkte))

  const summe = punkte.reduce((a, b) => a + b, 0)
  const durchschnitt = Math.round((summe / punkte.length) * 10) / 10

  const sortiert = [...punkte].sort((a, b) => a - b)
  const mitte = Math.floor(sortiert.length / 2)
  const median = sortiert.length % 2 === 0
    ? (sortiert[mitte - 1] + sortiert[mitte]) / 2
    : sortiert[mitte]

  const summeNoten = noten.reduce((a, b) => a + b, 0)
  const durchschnittNote = Math.round((summeNoten / noten.length) * 2) / 2
  const notenSortiert = [...noten].sort((a, b) => a - b)
  const medianNote = notenSortiert.length % 2 === 0
    ? Math.round(((notenSortiert[mitte - 1] + notenSortiert[mitte]) / 2) * 2) / 2
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
export function statusFarbe(status: SchuelerKorrektur['korrekturStatus']): string {
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
