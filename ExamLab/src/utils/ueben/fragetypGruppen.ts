import type { Frage } from '../../types/ueben/fragen'

/**
 * Frage-Typen, deren Antwort vom SuS selbst bewertet wird (anstatt automatisch
 * via Server gegen Musterlösung). Genutzt im Üben-Modus zur Pfad-Auswahl
 * (clientseitige Auto-Korrektur vs. Self-Assessment-UI).
 */
export const SELBSTBEWERTBARE_TYPEN: readonly Frage['typ'][] = [
  'freitext',
  'visualisierung',
  'pdf',
  'audio',
  'code',
]

export function istSelbstbewertbar(typ: Frage['typ']): boolean {
  return SELBSTBEWERTBARE_TYPEN.includes(typ)
}
