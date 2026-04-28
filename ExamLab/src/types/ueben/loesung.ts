/**
 * Lösungs-Slice einer Frage — nur Lösungs-relevante Felder.
 * Wird vom Apps-Script-Endpoint `lernplattformLadeLoesungen` geliefert und
 * vor der clientseitigen Korrektur in die Frage-Kopie gemerged.
 *
 * Aufgabengruppen werden flach serialisiert: jede Teilaufgabe ist ein
 * eigener Key in der LoesungsMap (keine Verschachtelung).
 *
 * Reihenfolgen-kritische Felder (Sortierung, Zuordnung) enthalten die
 * Original-Reihenfolge vor Fisher-Yates-Mischung — der Ladepfad liefert
 * gemischte Versionen, der Lösungspfad die Wahrheit.
 *
 * Die Feldliste spiegelt LOESUNGS_FELDER_ im Apps-Script-Backend.
 */
export interface LoesungsSlice {
  // Gemeinsame Lösungs-Metadaten
  musterlosung?: string
  bewertungsraster?: unknown

  // MC
  optionen?: Array<{ id: string; korrekt?: boolean; erklaerung?: string }>

  // R/F
  aussagen?: Array<{ id: string; korrekt?: boolean; erklaerung?: string }>

  // Lückentext
  luecken?: Array<{ id: string; korrekteAntworten?: string[]; korrekt?: string }>

  // Berechnung
  ergebnisse?: Array<{ id: string; korrekt?: number; toleranz?: number }>

  // Sortierung / Zuordnung — Reihenfolgen-kritisch
  elemente?: unknown[]
  paare?: Array<{ links: string; rechts: string }>

  // Formel
  korrekteFormel?: string
  korrekt?: string | number | boolean

  // Buchungssatz
  buchungen?: unknown[]
  korrektBuchung?: unknown
  sollEintraege?: unknown[]
  habenEintraege?: unknown[]

  // FiBu-Konten
  konten?: Array<{
    id: string
    korrekt?: boolean | string
    eintraege?: unknown[]
    saldo?: number
    anfangsbestand?: number
  }>

  // Bilanzstruktur
  bilanzEintraege?: Array<{ id: string; korrekt?: boolean }>
  loesung?: unknown

  // Kontenbestimmung
  aufgaben?: Array<{ id: string; erwarteteAntworten?: string[] }>

  // Bildbeschriftung / DragDrop
  labels?: Array<{ id: string; zoneId?: string; zone?: string; korrekt?: boolean }>
  beschriftungen?: Array<{ id: string; korrekt?: boolean }>
  zielzonen?: Array<{ id: string; korrekteLabels?: string[] }>

  // Hotspot
  bereiche?: Array<{ id: string; korrekt?: boolean }>
  hotspots?: Array<{ id: string; korrekt?: boolean }>
}

/**
 * Flache Map von frageId zu LoesungsSlice. Teilaufgaben von
 * Aufgabengruppen sind eigene Keys (nicht verschachtelt).
 */
export type LoesungsMap = Record<string, LoesungsSlice>
