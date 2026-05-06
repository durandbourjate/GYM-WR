import type { KontenbestimmungFrage } from '../../types/fragen-storage'
import type { KorrekturErgebnis, KorrekturDetail } from './types'

// === KONTENBESTIMMUNG AUTO-KORREKTUR ===

/** Auto-Korrektur für Kontenbestimmung-Fragen */
export function korrigiereKontenbestimmung(
  frage: KontenbestimmungFrage,
  antwortAufgaben: Record<string, { antworten: { kontonummer?: string; kategorie?: string; seite?: string }[] }>
): KorrekturErgebnis {
  const details: KorrekturDetail[] = []
  const punkteProAufgabe = frage.punkte / Math.max(1, frage.aufgaben.length)

  // Modus-aware: SuS gibt nur die Felder ein, die laut modus auch abgefragt werden.
  // Erwartete Antworten können mehr Felder haben (z.B. kontonummer als Identifier).
  // Ohne Modus-Filter würde z.B. bei kategorie_bestimmen die fehlende Kontonummer als "falsch" zählen.
  const zeigeKonto = frage.modus === 'konto_bestimmen' || frage.modus === 'gemischt'
  const zeigeKategorie = frage.modus === 'kategorie_bestimmen' || frage.modus === 'gemischt'
  const zeigeSeite = frage.modus === 'kategorie_bestimmen' || frage.modus === 'gemischt'

  for (const aufgabe of frage.aufgaben) {
    const eingabe = antwortAufgaben[aufgabe.id]
    if (!eingabe || eingabe.antworten.length === 0) {
      details.push({ bezeichnung: aufgabe.text, korrekt: false, erreicht: 0, max: Math.round(punkteProAufgabe * 100) / 100 })
      continue
    }

    let korrektCount = 0
    const total = aufgabe.erwarteteAntworten.length

    for (let i = 0; i < total; i++) {
      const erwartet = aufgabe.erwarteteAntworten[i]
      const antwort = eingabe.antworten[i]
      if (!antwort) continue

      let teilKorrekt = true
      if (zeigeKonto && erwartet.kontonummer && antwort.kontonummer !== erwartet.kontonummer) teilKorrekt = false
      if (zeigeKategorie && erwartet.kategorie && antwort.kategorie !== erwartet.kategorie) teilKorrekt = false
      if (zeigeSeite && erwartet.seite && antwort.seite !== erwartet.seite) teilKorrekt = false

      if (teilKorrekt) korrektCount++
    }

    const score = total > 0 ? korrektCount / total : 0
    details.push({
      bezeichnung: aufgabe.text,
      korrekt: score >= 0.99,
      erreicht: Math.round(score * punkteProAufgabe * 100) / 100,
      max: Math.round(punkteProAufgabe * 100) / 100,
    })
  }

  return {
    erreichtePunkte: Math.round(details.reduce((s, d) => s + d.erreicht, 0) * 100) / 100,
    maxPunkte: frage.punkte,
    details,
  }
}
