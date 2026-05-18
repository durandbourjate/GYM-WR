import { normalizeForSuche } from './sucheEngine'

/**
 * Erzeugt Kontext-Snippet um die Match-Stelle für Volltext-Treffer.
 *
 * Achtung Umlaut-Offset-Drift: `idx` wird auf dem normalisierten Text berechnet
 * (`normalizeForSuche` ersetzt ä→ae, ö→oe, ü→ue, ß→ss), `text.slice` arbeitet
 * jedoch auf dem Original. Pro Umlaut/ß VOR der Match-Stelle wandert der Slice
 * um 1 Zeichen nach hinten. Bei `kontext ≥ 20` ist die Drift im Snippet-Fenster
 * absorbiert; bei kleineren `kontext`-Werten kann das Snippet die Match-Stelle
 * verfehlen. Caller in indexFragenVolltext nutzen `kontext=50` → inert.
 */
export function generiereSnippet(text: string, query: string, kontext: number): string {
  if (!text) return ''
  const n = normalizeForSuche(query)
  const tLower = normalizeForSuche(text)
  const idx = tLower.indexOf(n)
  if (idx < 0) {
    return text.length > kontext * 2 + 3 ? text.slice(0, kontext * 2 + 3) : text
  }
  const start = Math.max(0, idx - kontext)
  const end = Math.min(text.length, idx + n.length + kontext)
  const prefix = start > 0 ? '…' : ''
  const suffix = end < text.length ? '…' : ''
  return prefix + text.slice(start, end) + suffix
}
