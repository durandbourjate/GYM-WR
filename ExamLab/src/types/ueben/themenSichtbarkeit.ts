/**
 * Themen-Sichtbarkeit: Steuert, welche Themen für SuS sichtbar/aktiv sind.
 *
 * 3 Stufen:
 *   - nicht_freigeschaltet: Nur via Filter "Alle Themen" sichtbar
 *   - aktiv: Hervorgehoben, max. 2–3 gleichzeitig
 *   - abgeschlossen: Sichtbar aber nicht hervorgehoben
 */

export type ThemenStatus = 'nicht_freigeschaltet' | 'aktiv' | 'abgeschlossen'

/** Wie wurde das Thema aktiviert? */
export type AktivierungsTyp = 'deeplink' | 'auftrag' | 'manuell'

/** Ein Eintrag pro Thema im ThemenSichtbarkeit-Tab */
export interface ThemenFreischaltung {
  fach: string
  thema: string
  status: ThemenStatus
  aktiviertAm: string          // ISO-Timestamp
  aktiviertVon: string         // Email der LP oder SuS (bei Deep-Link)
  typ: AktivierungsTyp
  /** Aktive Unterthemen. undefined/leer = alle Unterthemen aktiv */
  unterthemen?: string[]
}
