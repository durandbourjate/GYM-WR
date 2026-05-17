import { normalizeForSuche } from './sucheEngine'

/** Erzeugt Kontext-Snippet um die Match-Stelle für Volltext-Treffer. */
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
