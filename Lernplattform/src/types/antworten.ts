/**
 * Antwort-Typen für die Lernplattform-Übungskorrektur.
 * LP-spezifisch: repräsentieren SuS-Eingaben beim Üben, nicht Frage-Definitionen.
 */

export type AntwortTyp =
  | MCAntwort | MultiAntwort | TFAntwort | FillAntwort
  | CalcAntwort | SortAntwort | SortierungAntwort | ZuordnungAntwort
  | BuchungssatzAntwort | TKontoAntwort | BilanzAntwort | KontenbestimmungAntwort
  | HotspotAntwort | BildbeschriftungAntwort | DragDropBildAntwort
  | OpenAntwort | FormelAntwort | ZeichnenAntwort | GruppeAntwort | PdfAntwort
  | AudioAntwort | CodeAntwort

// ── Standard-Antworten ──

export interface MCAntwort {
  typ: 'mc'
  gewaehlt: string  // Option-ID
}

export interface MultiAntwort {
  typ: 'multi'
  gewaehlt: string[]  // Option-IDs
}

export interface TFAntwort {
  typ: 'tf' | 'richtigfalsch'
  bewertungen: Record<string, boolean>  // Aussagen-ID → true/false
}

export interface FillAntwort {
  typ: 'fill' | 'lueckentext'
  eintraege: Record<string, string>  // Lücken-ID → eingegebener Text
}

export interface CalcAntwort {
  typ: 'calc' | 'berechnung'
  wert: string
  werte?: Record<string, string>  // Für Mehrfach-Ergebnisse: ID → Wert
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
  zeilen: { soll: string; haben: string; betrag: number }[]
}

export interface TKontoAntwort {
  typ: 'tkonto'
  konten: Record<string, {
    soll: { gegen: string; betrag: number }[]
    haben: { gegen: string; betrag: number }[]
    saldo: { seite: 'soll' | 'haben'; betrag: number }
  }>
}

export interface BilanzAntwort {
  typ: 'bilanz' | 'bilanzstruktur'
  aktiven: string[]
  passiven: string[]
  bilanzsumme: number
}

export interface KontenbestimmungAntwort {
  typ: 'kontenbestimmung'
  zuordnungen: { konto: string; seite: 'soll' | 'haben' }[][]
}

// ── Bild-Antworten ──

export interface HotspotAntwort {
  typ: 'hotspot'
  klicks: { x: number; y: number }[]
}

export interface BildbeschriftungAntwort {
  typ: 'bildbeschriftung'
  texte: Record<string, string>
}

export interface DragDropBildAntwort {
  typ: 'dragdrop_bild'
  zuordnungen: Record<string, string>
}

// ── Selbstbewertete Antworten ──

export interface OpenAntwort {
  typ: 'open' | 'freitext'
  text: string
  selbstbewertung?: 'korrekt' | 'teilweise' | 'falsch'
}

export interface FormelAntwort {
  typ: 'formel'
  latex: string
}

export interface ZeichnenAntwort {
  typ: 'zeichnen' | 'visualisierung'
  datenUrl: string
  selbstbewertung?: 'korrekt' | 'teilweise' | 'falsch'
}

export interface GruppeAntwort {
  typ: 'gruppe' | 'aufgabengruppe'
  teilAntworten: Record<string, AntwortTyp>
}

export interface PdfAntwort {
  typ: 'pdf'
  text?: string
  gewaehlt?: string
  selbstbewertung?: 'korrekt' | 'teilweise' | 'falsch'
}

export interface AudioAntwort {
  typ: 'audio'
  datenUrl: string
  selbstbewertung?: 'korrekt' | 'teilweise' | 'falsch'
}

export interface CodeAntwort {
  typ: 'code'
  code: string
  sprache?: string
  selbstbewertung?: 'korrekt' | 'teilweise' | 'falsch'
}
