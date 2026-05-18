import type { SucheTreffer, SucheErgebnis, ProQuelleZahlen, SucheQuelle, HighlightStelle, SucheIndex } from '../types/suche'
import { QUELLEN_REIHENFOLGE, LEERES_ERGEBNIS, SCORE_BOUNDS } from '../types/suche'
import { indexEinstellungenTabs, indexHilfeTabs, indexKurse, indexSchueler, indexPruefungen, indexUebungen, indexFragen, indexFragenVolltext } from './sucheAdapter'

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
 *
 * Fuzzy-Fallback (C.5): Bei title-Feld und needle.length >= 3 wird
 * Levenshtein-Distanz pro Token im Haystack berechnet (max. dist=2).
 * ID/tag/subTitel bleiben exact-only (ID-Fuzzy würde Ranking verfälschen).
 */
export function scoreFromMatch(haystack: string, needle: string, feld: MatchFeld): number {
  const h = normalizeForSuche(haystack)
  const n = normalizeForSuche(needle)
  if (!n) return 0

  // 1. Exact-Substring (Phase-1-Pfad)
  if (h.includes(n)) {
    if (feld === 'id') return SCORE_BOUNDS.ID_EXACT
    if (feld === 'titel') {
      return h.startsWith(n) ? SCORE_BOUNDS.TITEL_PREFIX : SCORE_BOUNDS.TITEL_SUBSTRING
    }
    if (feld === 'tag') return SCORE_BOUNDS.TAG_THEMA
    return SCORE_BOUNDS.SUBTITEL
  }

  // 2. Fuzzy-Fallback (C.5): NUR für titel, min-length MIN_FUZZY_NEEDLE_LENGTH
  // ID/tag/subTitel bleiben exact-only (Spec §3.3: ID-Fuzzy würde Ranking verfälschen)
  if (feld === 'titel' && n.length >= MIN_FUZZY_NEEDLE_LENGTH) {
    const tokens = h.split(/\s+/)
    let minDist = Infinity
    for (const t of tokens) {
      const d = levenshtein(t, n, 2)
      if (d < minDist) minDist = d
      if (minDist === 0) break
    }
    if (minDist <= 2) {
      return Math.max(0, SCORE_BOUNDS.TITEL_SUBSTRING - (minDist === 1 ? 10 : 20))
    }
  }

  return 0
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

/* Min-Query-Längen: Orchestrator-Guard in fuehreSucheAus + UI-Gate in LPGlobalSuche. */

/** Cluster C.4: Minimale Query-Länge im normalen Modus (2 = "ek", "wr" etc.). */
export const MIN_QUERY_LENGTH = 2
/** Cluster C.4: Minimale Query-Länge im Volltext-Modus (3 = vermeidet zu viele Treffer in Fragetexten). */
export const MIN_VOLLTEXT_QUERY_LENGTH = 3
/**
 * Cluster C.5: Minimale Needle-Länge für Fuzzy-Fallback in scoreFromMatch.
 *
 * Bewusst UNABHÄNGIG von MIN_VOLLTEXT_QUERY_LENGTH: hier geht es um den
 * Levenshtein-Tokenizer (kurze Needles erzeugen zu viele Treffer mit dist≤2),
 * nicht um den Orchestrator-Guard. Werte können auseinanderlaufen, wenn z.B.
 * der Volltext-Threshold auf 4 erhöht würde, der Fuzzy aber bei 3 bleiben soll.
 */
export const MIN_FUZZY_NEEDLE_LENGTH = 3

/**
 * Orchestrator: führt Suche aus allen 6 Adaptern aus und gruppiert.
 * Min-Query-Guard zentral hier — Adapter dürfen davon ausgehen, dass query gültig ist.
 *
 * Cluster C.4: opts.volltext schaltet auf indexFragenVolltext (vollständige Frage-Objekte)
 * um, sofern index.fragenVoll vorhanden ist. Ohne fragenVoll fällt der Modus auf
 * indexFragen (Summary) zurück. Volltext-Modus erhöht Min-Query-Länge auf 3.
 */
export function fuehreSucheAus(
  query: string,
  index: SucheIndex,
  opts?: { volltext?: boolean },
): SucheErgebnis {
  const normalized = normalizeForSuche(query)
  const minLen = opts?.volltext ? MIN_VOLLTEXT_QUERY_LENGTH : MIN_QUERY_LENGTH
  if (normalized.length < minLen) return LEERES_ERGEBNIS

  const fragenTreffer = opts?.volltext && index.fragenVoll
    ? indexFragenVolltext(query, index.fragenVoll)
    : indexFragen(query, index.fragen)

  const alle: SucheTreffer[] = [
    ...indexEinstellungenTabs(query, index.einstellungenTabs),
    ...indexHilfeTabs(query, index.hilfeTabs),
    ...indexKurse(query, index.kurse),
    ...indexSchueler(query, index.schueler),    // NEU C.2
    ...indexPruefungen(query, index.pruefungen),
    ...indexUebungen(query, index.uebungen),
    ...fragenTreffer,
  ]

  return gruppiereUndLimitiere(alle, { maxProQuelle: 5 })
}
