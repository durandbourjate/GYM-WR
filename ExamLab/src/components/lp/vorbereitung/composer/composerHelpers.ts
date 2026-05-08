import type { PruefungsConfig } from '../../../../types/pruefung'

/**
 * Generiert eine deterministische ID für Prüfungen aus Klasse + Datum + Random-Suffix.
 * Format: `<klasse-slug>-<datum-numerisch>-<rand4>`
 */
export function generiereId(config: PruefungsConfig): string {
  const klasse = config.klasse.replace(/[^a-zA-Z0-9]/g, '').toLowerCase().slice(0, 10)
  const datum = config.datum.replace(/-/g, '')
  const rand = Math.random().toString(36).slice(2, 6)
  return `${klasse}-${datum}-${rand}`
}
