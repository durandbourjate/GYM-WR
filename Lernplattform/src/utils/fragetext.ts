/**
 * Extrahiert den Fragetext aus einer shared Frage.
 * Shared-Fragen haben je nach Typ verschiedene Text-Felder:
 * - fragetext (die meisten Typen)
 * - aufgabentext (TKonto, Kontenbestimmung, BilanzER)
 * - geschaeftsfall (Buchungssatz)
 * - kontext (Aufgabengruppe)
 */
import type { Frage } from '@shared/types/fragen'

export function getFragetext(frage: Frage): string {
  switch (frage.typ) {
    case 'buchungssatz':
      return frage.geschaeftsfall || ''
    case 'tkonto':
    case 'kontenbestimmung':
    case 'bilanzstruktur':
      return frage.aufgabentext || ''
    case 'aufgabengruppe':
      return frage.kontext || ''
    default:
      return 'fragetext' in frage ? (frage as { fragetext: string }).fragetext : ''
  }
}

/** Ersetzt {0}, {1} etc. und {{1}} Platzhalter im Fragetext durch Lückenstriche */
export function bereinigePlatzhalter(text: string): string {
  if (!text) return text
  return text.replace(/\{\{?\d+\}?\}/g, '___')
}
