// Sterne: 0-3 basierend auf Mastery-Quote (gefestigt + gemeistert)
export function berechneSterne(masteryQuote: number): number {
  if (masteryQuote >= 75) return 3
  if (masteryQuote >= 50) return 2
  if (masteryQuote >= 20) return 1
  return 0
}

// Streak: Anzahl Sessions ohne >14 Tage Pause
const STREAK_TIMEOUT_TAGE = 14

export function berechneStreak(sessionDaten: string[]): number {
  if (sessionDaten.length === 0) return 0

  // Sortiere absteigend (neueste zuerst)
  const sortiert = [...sessionDaten]
    .map(d => new Date(d).getTime())
    .sort((a, b) => b - a)

  let streak = 1
  for (let i = 1; i < sortiert.length; i++) {
    const differenzTage = (sortiert[i - 1] - sortiert[i]) / (1000 * 60 * 60 * 24)
    if (differenzTage > STREAK_TIMEOUT_TAGE) break
    streak++
  }

  return streak
}

// Sterne als Text
export function sterneText(anzahl: number): string {
  return '★'.repeat(anzahl) + '☆'.repeat(3 - anzahl)
}

// Variierende Feedback-Texte
const LOB_TEXTE = [
  'Super!', 'Genau!', 'Stark!', 'Perfekt!', 'Richtig!',
  'Sehr gut!', 'Klasse!', 'Toll gemacht!', 'Bravo!', 'Weiter so!',
]

const TROST_TEXTE = [
  'Fast! Schau dir die richtige Antwort an.',
  'Nicht ganz. Beim nächsten Mal klappt es!',
  'Knapp daneben. Versuch es nochmal!',
  'Das wird schon! Übung macht den Meister.',
  'Noch nicht ganz. Schau dir die Erklärung an.',
]

export function zufaelligesLob(): string {
  return LOB_TEXTE[Math.floor(Math.random() * LOB_TEXTE.length)]
}

export function zufaelligerTrost(): string {
  return TROST_TEXTE[Math.floor(Math.random() * TROST_TEXTE.length)]
}
