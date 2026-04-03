// Alle Fragetypen: 8 bestehende + 12 neue aus Pools (kein "code" — existiert nicht in Pools)
export type FrageTyp =
  // Bestehende Typen
  | 'mc' | 'multi' | 'tf' | 'fill' | 'calc'
  | 'sort' | 'sortierung' | 'zuordnung'
  // FiBu-Typen
  | 'buchungssatz' | 'tkonto' | 'bilanz' | 'kontenbestimmung'
  // Bild-interaktive Typen
  | 'hotspot' | 'bildbeschriftung' | 'dragdrop_bild'
  // Weitere Typen
  | 'open' | 'formel' | 'zeichnen' | 'gruppe' | 'pdf'

// ── FiBu-Hilfstypen ──

export interface Konto {
  nr: string
  name: string
  kategorie?: string // aktiv | passiv | aufwand | ertrag
}

export interface BuchungssatzZeile {
  soll: string  // Kontonummer
  haben: string
  betrag: number
}

export interface TKontoEintrag {
  gegen: string  // Gegenkonto-Nr
  betrag: number
  gf?: number    // Geschäftsfall-Referenz (1-basiert)
}

export interface TKontoDaten {
  nr: string
  name: string
  ab?: number  // Anfangsbestand
  correctSoll: TKontoEintrag[]
  correctHaben: TKontoEintrag[]
  correctSaldo: { seite: 'soll' | 'haben'; betrag: number }
}

export interface KontoMitSaldo {
  nr: string
  name: string
  saldo: number
}

export interface BilanzKorrekt {
  aktiven: string[]   // Kontonummern
  passiven: string[]
  bilanzsumme: number
}

export interface KontenbestimmungAufgabe {
  text: string
  correct: { konto: string; seite: 'soll' | 'haben' }[]
}

// ── Bild-Hilfstypen ──

export interface BildReferenz {
  src: string
  alt: string
}

export interface Hotspot {
  x: number  // Prozent (0–100)
  y: number
  r: number  // Radius in Prozent
  label: string
}

export interface BildLabel {
  id: string
  text: string
  x: number  // Prozent
  y: number
}

export interface DropZone {
  id: string
  x: number  // Prozent
  y: number
  w: number
  h: number
}

export interface DragLabel {
  id: string
  text: string
  zone: string  // DropZone-ID = korrekte Zuordnung
}

// ── Gruppe-Hilfstyp ──

export interface GruppeTeil {
  sub: string  // "a", "b", "c" ...
  type: Exclude<FrageTyp, 'gruppe'>  // Kein verschachteltes gruppe
  q: string
  explain?: string
  // Typ-spezifische Felder (wie bei Frage, aber flach)
  options?: { v: string; t: string }[]
  correct?: string | string[] | number[]
  konten?: Konto[]
  rows?: CalcZeile[]
  blanks?: { answer: string; alts?: string[] }[]
  aussagen?: { text: string; korrekt: boolean }[]
  geschaeftsfaelle?: string[]
  gegenkonten?: Konto[]
}

// ── Calc-Hilfstyp (Pool-Format mit rows) ──

export interface CalcZeile {
  label: string
  answer: number
  tolerance: number
  unit?: string
}

// ── Hauptinterface ──

export interface Frage {
  id: string
  fach: string
  thema: string
  stufe?: string
  lernziel?: string
  typ: FrageTyp
  schwierigkeit: 1 | 2 | 3
  taxonomie?: string
  frage: string
  erklaerung?: string
  tags?: string[]
  uebung: boolean
  pruefungstauglich: boolean

  // ── Bestehende typ-spezifische Felder ──
  optionen?: string[]                                    // mc, multi
  korrekt?: string | string[] | number[]                 // mc, multi, hotspot (Indices), formel
  aussagen?: { text: string; korrekt: boolean }[]        // tf
  luecken?: { id: string; korrekt: string; optionen?: string[] }[] // fill
  toleranz?: number                                      // calc
  einheit?: string                                       // calc
  kategorien?: string[]                                  // sort
  elemente?: { text: string; kategorie: string }[]       // sort
  reihenfolge?: string[]                                 // sortierung
  paare?: { links: string; rechts: string }[]            // zuordnung

  // ── FiBu-Felder ──
  konten?: Konto[]                                       // buchungssatz, tkonto, kontenbestimmung
  buchungssatzKorrekt?: BuchungssatzZeile[]              // buchungssatz
  tkontoKonten?: TKontoDaten[]                           // tkonto
  gegenkonten?: Konto[]                                  // tkonto
  geschaeftsfaelle?: string[]                            // tkonto
  bilanzModus?: 'bilanz' | 'erfolgsrechnung'             // bilanz
  kontenMitSaldi?: KontoMitSaldo[]                       // bilanz
  bilanzKorrekt?: BilanzKorrekt                          // bilanz
  aufgaben?: KontenbestimmungAufgabe[]                   // kontenbestimmung

  // ── Bild-Felder ──
  bild?: BildReferenz                                    // hotspot, bildbeschriftung, dragdrop_bild, zeichnen
  hotspots?: Hotspot[]                                   // hotspot
  labels?: BildLabel[]                                   // bildbeschriftung
  zones?: DropZone[]                                     // dragdrop_bild
  dragLabels?: DragLabel[]                               // dragdrop_bild

  // ── Gruppe-Felder ──
  kontext?: string                                       // gruppe
  teil?: GruppeTeil[]                                    // gruppe

  // ── Weitere Felder ──
  musterantwort?: string                                 // open, pdf
  musterbild?: BildReferenz                              // zeichnen
  hinweise?: string[]                                    // formel, zeichnen
  pdfUrl?: string                                        // pdf
  antwortTyp?: 'freitext' | 'mc'                         // pdf
  calcZeilen?: CalcZeile[]                               // calc (Pool-Format mit rows)
}

export interface FragenFilter {
  fach?: string
  thema?: string
  stufe?: string
  tags?: string[]
  schwierigkeit?: number
  nurUebung?: boolean
}

// ── Antwort-Typen ──

export type AntwortTyp =
  | MCAntwort | MultiAntwort | TFAntwort | FillAntwort
  | CalcAntwort | SortAntwort | SortierungAntwort | ZuordnungAntwort
  // Neue Antwort-Typen
  | BuchungssatzAntwort | TKontoAntwort | BilanzAntwort | KontenbestimmungAntwort
  | HotspotAntwort | BildbeschriftungAntwort | DragDropBildAntwort
  | OpenAntwort | FormelAntwort | ZeichnenAntwort | GruppeAntwort | PdfAntwort

// ── Bestehende Antworten ──

export interface MCAntwort {
  typ: 'mc'
  gewaehlt: string
}

export interface MultiAntwort {
  typ: 'multi'
  gewaehlt: string[]
}

export interface TFAntwort {
  typ: 'tf'
  bewertungen: Record<string, boolean>
}

export interface FillAntwort {
  typ: 'fill'
  eintraege: Record<string, string>
}

export interface CalcAntwort {
  typ: 'calc'
  wert: string
}

export interface SortAntwort {
  typ: 'sort'
  zuordnungen: Record<string, string>
}

export interface SortierungAntwort {
  typ: 'sortierung'
  reihenfolge: string[]
}

export interface ZuordnungAntwort {
  typ: 'zuordnung'
  paare: Record<string, string>
}

// ── FiBu-Antworten ──

export interface BuchungssatzAntwort {
  typ: 'buchungssatz'
  zeilen: BuchungssatzZeile[]
}

export interface TKontoAntwort {
  typ: 'tkonto'
  konten: Record<string, {  // Kontonummer → Einträge
    soll: { gegen: string; betrag: number }[]
    haben: { gegen: string; betrag: number }[]
    saldo: { seite: 'soll' | 'haben'; betrag: number }
  }>
}

export interface BilanzAntwort {
  typ: 'bilanz'
  aktiven: string[]    // Kontonummern
  passiven: string[]
  bilanzsumme: number
}

export interface KontenbestimmungAntwort {
  typ: 'kontenbestimmung'
  zuordnungen: { konto: string; seite: 'soll' | 'haben' }[][]  // Pro Aufgabe
}

// ── Bild-Antworten ──

export interface HotspotAntwort {
  typ: 'hotspot'
  klicks: { x: number; y: number }[]  // Prozent-Koordinaten
}

export interface BildbeschriftungAntwort {
  typ: 'bildbeschriftung'
  texte: Record<string, string>  // Label-ID → eingegebener Text
}

export interface DragDropBildAntwort {
  typ: 'dragdrop_bild'
  zuordnungen: Record<string, string>  // Label-ID → Zone-ID
}

// ── Weitere Antworten ──

export interface OpenAntwort {
  typ: 'open'
  text: string
  selbstbewertung?: 'korrekt' | 'teilweise' | 'falsch'
}

export interface FormelAntwort {
  typ: 'formel'
  latex: string
}

export interface ZeichnenAntwort {
  typ: 'zeichnen'
  datenUrl: string  // Canvas als Data-URL
  selbstbewertung?: 'korrekt' | 'teilweise' | 'falsch'
}

export interface GruppeAntwort {
  typ: 'gruppe'
  teilAntworten: Record<string, AntwortTyp>  // sub ("a", "b") → Antwort
}

export interface PdfAntwort {
  typ: 'pdf'
  text?: string        // Freitext-Antwort
  gewaehlt?: string    // MC-Antwort
  selbstbewertung?: 'korrekt' | 'teilweise' | 'falsch'
}
