/**
 * Gemeinsame Typen und Hilfsfunktionen für globale Suche (LP + SuS).
 *
 * WICHTIG: Sensible Lösungsfelder dürfen niemals indiziert werden.
 * Die INDEX_BLACKLIST verhindert Datenlecks zwischen LP und SuS.
 */

export const INDEX_BLACKLIST = [
  'musterlosung',
  'korrekt',
  'korrekteAntworten',
  'bewertungsraster',
  'toleranz',
  'hinweis',
] as const

export type TrefferKategorie = 'frage' | 'pruefung' | 'thema' | 'kurs'

export interface Treffer {
  id: string
  kategorie: TrefferKategorie
  titel: string
  meta?: string
  kontext?: string
  onOpen: () => void
}

export interface SucheGruppe {
  id: string
  label: string
  kontextTag?: string
  treffer: Treffer[]
}

export interface SucheErgebnis {
  gruppen: SucheGruppe[]
  istLadend: boolean
  fehler?: string
}

/**
 * Prüft ob der Suchstring in einem der Felder vorkommt (case-insensitive, Teilstring).
 * Leerer Suchstring ergibt immer false.
 */
export function machtMatch(such: string, ...felder: (string | undefined)[]): boolean {
  const s = such.trim().toLowerCase()
  if (!s) return false
  return felder.some((f) => f && f.toLowerCase().includes(s))
}

/**
 * Entfernt alle Blacklist-Felder aus einem Objekt.
 * Schutzmassnahme gegen versehentliches Indizieren von Lösungsdaten.
 */
export function stripSensibleFelder<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Record<string, unknown> = {}
  for (const k of Object.keys(obj)) {
    if (INDEX_BLACKLIST.includes(k as (typeof INDEX_BLACKLIST)[number])) continue
    out[k] = obj[k]
  }
  return out as Partial<T>
}
