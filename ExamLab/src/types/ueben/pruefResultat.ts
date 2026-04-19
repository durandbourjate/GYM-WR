/**
 * Ergebnis einer Server-seitigen Antwort-Prüfung (Üben-Modus).
 * Vom Apps-Script-Endpoint `lernplattformPruefeAntwort` geliefert.
 *
 * - Auto-korrigierbare Typen: success:true + korrekt:boolean (+ optional musterlosung)
 * - Selbstbewertungstypen:   success:true + selbstbewertung:true (+ musterlosung/bewertungsraster)
 * - Fehler:                  success:false + error:string
 */
export interface PruefResultat {
  success: boolean
  korrekt?: boolean
  selbstbewertung?: boolean
  musterlosung?: string
  bewertungsraster?: unknown
  error?: string
}
