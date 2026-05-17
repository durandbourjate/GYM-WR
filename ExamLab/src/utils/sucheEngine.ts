import type { SucheTreffer, SucheErgebnis, ProQuelleZahlen, SucheQuelle, HighlightStelle, SucheIndex } from '../types/suche'
import { QUELLEN_REIHENFOLGE, LEERES_ERGEBNIS, SCORE_BOUNDS } from '../types/suche'
import { indexEinstellungenTabs, indexHilfeTabs, indexKurse, indexPruefungen, indexUebungen, indexFragen } from './sucheAdapter'

/**
 * Normalisiert Text für Suche:
 * 1. Lowercase
 * 2. Deutsche Ersatzregel: ä→ae, ö→oe, ü→ue, ß→ss (damit "uebung" matched "Übung")
 * 3. NFD + Diakritik-Entfernung (für andere Akzente wie é, è, ñ etc.)
 */
export function normalizeForSuche(text: string): string {
  return text
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
}

export type MatchFeld = 'titel' | 'id' | 'tag' | 'subTitel'

/**
 * Levenshtein-Distanz mit klassischem DP-Tableau.
 * Optionaler maxDist-Parameter erlaubt early-exit (ungenutzt = ∞).
 * Cluster C.5 (17.05.2026).
 */
export function levenshtein(a: string, b: string, maxDist: number = Infinity): number {
  if (a === b) return 0
  if (a.length === 0) return b.length
  if (b.length === 0) return a.length
  // Early-exit wenn Längen-Diff schon > maxDist
  if (Math.abs(a.length - b.length) > maxDist) return Math.abs(a.length - b.length)

  let prev = new Array(b.length + 1).fill(0).map((_, j) => j)
  let curr = new Array(b.length + 1).fill(0)

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      curr[j] = Math.min(
        curr[j - 1] + 1,      // insertion
        prev[j] + 1,          // deletion
        prev[j - 1] + cost,   // substitution
      )
    }
    ;[prev, curr] = [curr, prev]
  }
  return prev[b.length]
}

/**
 * Bewertet ein Match. Score-Tabelle: Titel-Prefix=100, ID-Exact=95,
 * Titel-Substring=70, Tag/Thema=50, Subtitel=30. No-match=0.
 */
export function scoreFromMatch(haystack: string, needle: string, feld: MatchFeld): number {
  const h = normalizeForSuche(haystack)
  const n = normalizeForSuche(needle)
  if (!n || !h.includes(n)) return 0
  if (feld === 'id') return SCORE_BOUNDS.ID_EXACT
  if (feld === 'titel') {
    return h.startsWith(n) ? SCORE_BOUNDS.TITEL_PREFIX : SCORE_BOUNDS.TITEL_SUBSTRING
  }
  if (feld === 'tag') return SCORE_BOUNDS.TAG_THEMA
  return SCORE_BOUNDS.SUBTITEL
}

/**
 * Findet alle Match-Positionen im Text. Arbeitet case-insensitive auf dem
 * Original-String, damit Indices direkt zu Original-Zeichen passen.
 *
 * Hinweis: bei Diakritik-Ersatz-Match (z.B. needle "uebung" matched Original
 * "Übung" via normalizeForSuche, aber die Strings sind nicht Substring-gleich)
 * gibt es kein Highlight — Entry erscheint trotzdem in den Treffern, weil
 * Score-Computation auf der normalisierten Form arbeitet.
 */
export function findeHighlightStellen(
  text: string,
  needle: string,
  feld: 'titel' | 'subTitel',
): HighlightStelle[] {
  const n = needle.trim().toLowerCase()
  if (!n) return []
  const tLower = text.toLowerCase()
  const stellen: HighlightStelle[] = []
  let cursor = 0
  while (cursor <= tLower.length - n.length) {
    const idx = tLower.indexOf(n, cursor)
    if (idx < 0) break
    stellen.push({ start: idx, end: idx + n.length, feld })
    cursor = idx + n.length
  }
  return stellen
}

function leereZahlen(): ProQuelleZahlen {
  return QUELLEN_REIHENFOLGE.reduce(
    (acc, q) => ({ ...acc, [q]: 0 }),
    {} as ProQuelleZahlen,
  )
}

/**
 * Sortiert Treffer pro Quelle (score absteigend, tie-break alphabetisch nach titel)
 * und limitiert auf maxProQuelle pro Sektion. Liefert Sichtbar- und Gesamt-Zahlen.
 */
export function gruppiereUndLimitiere(
  treffer: SucheTreffer[],
  opts: { maxProQuelle: number },
): SucheErgebnis {
  const proQuelleGesamt = leereZahlen()
  const proQuelleSichtbar = leereZahlen()
  const grouped: Record<SucheQuelle, SucheTreffer[]> = {} as Record<SucheQuelle, SucheTreffer[]>
  for (const q of QUELLEN_REIHENFOLGE) grouped[q] = []
  for (const t of treffer) {
    grouped[t.quelle].push(t)
    proQuelleGesamt[t.quelle]++
  }
  const result: SucheTreffer[] = []
  for (const q of QUELLEN_REIHENFOLGE) {
    const sortiert = grouped[q].sort(
      (a, b) => b.score - a.score || a.titel.localeCompare(b.titel, 'de'),
    )
    const limited = sortiert.slice(0, opts.maxProQuelle)
    proQuelleSichtbar[q] = limited.length
    result.push(...limited)
  }
  return { treffer: result, proQuelleSichtbar, proQuelleGesamt }
}

/**
 * Orchestrator: führt Suche aus allen 6 Adaptern aus und gruppiert.
 * Min-Query-Guard zentral hier — Adapter dürfen davon ausgehen, dass query gültig ist.
 */
export function fuehreSucheAus(query: string, index: SucheIndex): SucheErgebnis {
  if (normalizeForSuche(query).length < 2) return LEERES_ERGEBNIS

  const alle: SucheTreffer[] = [
    ...indexEinstellungenTabs(query, index.einstellungenTabs),
    ...indexHilfeTabs(query, index.hilfeTabs),
    ...indexKurse(query, index.kurse),
    ...indexPruefungen(query, index.pruefungen),
    ...indexUebungen(query, index.uebungen),
    ...indexFragen(query, index.fragen),
  ]

  return gruppiereUndLimitiere(alle, { maxProQuelle: 5 })
}
