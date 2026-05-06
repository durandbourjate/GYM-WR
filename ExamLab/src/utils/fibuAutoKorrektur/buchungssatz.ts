import type {
  BuchungssatzZeile,
  BuchungssatzFrage,
} from '../../types/fragen-storage'
import type { KorrekturErgebnis, KorrekturDetail } from './types'

/** U2: Auto-correct a Buchungssatz answer (vereinfachtes Format) */
export function korrigiereBuchungssatz(
  frage: BuchungssatzFrage,
  antwortBuchungen: {
    id: string
    sollKonto: string
    habenKonto: string
    betrag: number
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
      const score = bewerteBuchungVereinfacht(erwartet, antwortBuchungen[j])
      if (score > bestScore) {
        bestScore = score
        bestMatch = j
      }
    }

    if (bestMatch >= 0) {
      verwendeteAntworten.add(bestMatch)
    }

    const erreicht = bestScore * punkteProBuchung
    const eingabe = bestMatch >= 0 ? antwortBuchungen[bestMatch] : undefined
    details.push({
      bezeichnung: `Buchung ${i + 1}`,
      korrekt: bestScore >= 0.99,
      erreicht: Math.round(erreicht * 100) / 100,
      max: Math.round(punkteProBuchung * 100) / 100,
      kommentar: bestScore < 0.99
        ? !eingabe ? 'Buchung fehlt'
          : [
              eingabe.sollKonto !== erwartet.sollKonto ? 'Soll-Konto falsch' : '',
              eingabe.habenKonto !== erwartet.habenKonto ? 'Haben-Konto falsch' : '',
              eingabe.betrag !== erwartet.betrag ? 'Betrag falsch' : '',
            ].filter(Boolean).join(', ')
        : undefined,
    })
  }

  const erreichtePunkte = details.reduce((s, d) => s + d.erreicht, 0)
  return {
    erreichtePunkte: Math.round(erreichtePunkte * 100) / 100,
    maxPunkte: frage.punkte,
    details,
  }
}

/** Score: 1/3 je Soll-Konto, Haben-Konto, Betrag */
function bewerteBuchungVereinfacht(
  erwartet: BuchungssatzZeile,
  eingabe: { sollKonto: string; habenKonto: string; betrag: number }
): number {
  if (!eingabe) return 0
  let score = 0
  if (eingabe.sollKonto === erwartet.sollKonto) score += 1 / 3
  if (eingabe.habenKonto === erwartet.habenKonto) score += 1 / 3
  if (eingabe.betrag === erwartet.betrag) score += 1 / 3
  return score
}
