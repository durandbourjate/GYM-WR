/**
 * PoolFrage Discriminated Union (Bundle L.b).
 *
 * Strategie-Entscheidung 29.04.2026: Discriminated Union (Spec-Option a)
 * statt Type-Guards (b) oder zod-Schema (c). Begründung: Pool-Format ist seit
 * S107 stabil und klar `type`-diskriminiert (20 String-Literal-Werte).
 * FiBu-Sub-Type-Felder aus Konverter-Body (`ExamLab/src/utils/poolConverter.ts`)
 * abgeleitet — der einzige Konsument der Pool-Daten in ExamLab.
 *
 * Diese Datei ersetzt das frühere Fat-Union-Interface in
 * `ExamLab/src/types/pool.ts:34`. Dort wird `PoolFrage` jetzt re-exportiert.
 */
// Storage-Frage-Types werden NICHT mehr direkt referenziert — Pool-Sub-Types
// modellieren ab Bundle L.b das echte Pool-Rohformat (z.B. `{soll, haben, betrag}`),
// das sich vom Storage-Format (`BuchungssatzZeile = {id, sollKonto, habenKonto, betrag}`)
// strukturell unterscheidet. Der Konverter (poolConverter.ts) übernimmt das Mapping.

// === Gemeinsame Felder aller Pool-Fragen ===

// Bilder werden in ~15 Sub-Types optional verwendet; gemeinsamer Helper-Type.
export interface PoolBild {
  src: string
  alt?: string
}

export interface PoolFrageBase {
  id: string
  topic: string
  diff: number
  tax: string
  q: string
  reviewed?: boolean
  /**
   * Erklärung — in fast allen Sub-Types optional verfügbar.
   * Im Base, damit Snapshot/Hash-Funktionen ohne Discriminator-Switch zugreifen.
   */
  explain?: string
  /**
   * Pool-Bild — in ~15 Sub-Types verwendet, im Base aus demselben Grund.
   * (Nur Sub-Types ohne Bild-Bezug — `formel`, `code`, `gruppe`, `pdf` —
   *  würden es semantisch nicht setzen, aber Type-system erlaubt es.)
   */
  img?: PoolBild
}

// === Standard-Sub-Types (aus altem Interface übernommen) ===

export interface PoolFrageMC extends PoolFrageBase {
  type: 'mc'
  options?: { v: string; t: string }[]
  correct?: string
}

export interface PoolFrageMulti extends PoolFrageBase {
  type: 'multi'
  options?: { v: string; t: string }[]
  correct?: string[]
}

export interface PoolFrageTF extends PoolFrageBase {
  type: 'tf'
  correct?: boolean
}

export interface PoolFrageFill extends PoolFrageBase {
  type: 'fill'
  blanks?: { answer: string; alts?: string[] }[]
}

export interface PoolFrageCalc extends PoolFrageBase {
  type: 'calc'
  rows?: { label: string; answer: number; tolerance: number; unit?: string }[]
}

export interface PoolFrageSort extends PoolFrageBase {
  type: 'sort'
  items?: ({ t: string; cat: number } | string)[]
  categories?: string[]
  correct?: number[]
}

export interface PoolFrageOpen extends PoolFrageBase {
  type: 'open'
  sample?: string
}

export interface PoolFrageSortierung extends PoolFrageBase {
  type: 'sortierung'
  items?: ({ t: string; cat: number } | string)[]
  correct?: number[]
}

export interface PoolFrageFormel extends PoolFrageBase {
  type: 'formel'
  hints?: string[]
  sample?: string
  correct?: string
}

export interface PoolFrageHotspot extends PoolFrageBase {
  type: 'hotspot'
  hotspots?: { x: number; y: number; r?: number; label?: string }[]
  /** Indices der korrekten Hotspots (in `hotspots[]`). */
  correct?: number[]
}

export interface PoolFrageBildbeschriftung extends PoolFrageBase {
  type: 'bildbeschriftung'
  labels?: { id: string; text?: string; x?: number; y?: number; zone?: string }[]
}

export interface PoolFrageDragDropBild extends PoolFrageBase {
  type: 'dragdrop_bild'
  zones?: { id: string; x: number; y: number; w: number; h: number }[]
  labels?: { id: string; text?: string; x?: number; y?: number; zone?: string }[]
}

export interface PoolFrageCode extends PoolFrageBase {
  type: 'code'
  sprache?: string
  starterCode?: string
  sample?: string
}

export interface PoolFrageZeichnen extends PoolFrageBase {
  type: 'zeichnen'
  sample?: string
}

// === FiBu-Sub-Types — Pool-Rohformat aus Uebungen/Uebungspools/config/bwl_fibu.js ===
// (Bundle L.b: Pool-Format != Storage-Format. Mapping in poolConverter.ts.)

/** Pool-Konto-Eintrag in `konten[]`. Pool nutzt `nr` + `name`, optional `kategorie`. */
export interface PoolKonto {
  nr: string
  name: string
  /** Nur bei `kontenbestimmung` — sonst implizit aus Kontonummer ableitbar. */
  kategorie?: 'aktiv' | 'passiv' | 'aufwand' | 'ertrag'
}

/** Pool-Buchung in `buchungssatz.correct[]`. Pool nutzt `soll`/`haben`. */
export interface PoolBuchung {
  soll: string
  haben: string
  betrag: number
}

/** Pool-Antwort in `kontenbestimmung.aufgaben[].correct[]`. */
export interface PoolKontenAntwort {
  konto?: string
  kategorie?: 'aktiv' | 'passiv' | 'aufwand' | 'ertrag'
  seite?: 'soll' | 'haben'
}

/** Pool-Aufgabe in `kontenbestimmung.aufgaben[]`. */
export interface PoolKontenAufgabe {
  text: string
  correct?: PoolKontenAntwort[]
}

/** Pool-T-Konto-Eintrag in `tkonto.konten[].correctSoll/correctHaben`. */
export interface PoolTKontoEintrag {
  gegen: string
  betrag: number
  /** Geschäftsfall-Index (1-basiert) */
  gf?: number
}

/** Pool-T-Konto-Saldo in `tkonto.konten[].correctSaldo`. */
export interface PoolTKontoSaldo {
  seite: 'soll' | 'haben'
  betrag: number
}

/** Pool-T-Konto-Definition in `tkonto.konten[]`. */
export interface PoolTKontoKonto {
  nr: string
  name: string
  /** Anfangsbestand */
  ab?: number
  correctSoll?: PoolTKontoEintrag[]
  correctHaben?: PoolTKontoEintrag[]
  correctSaldo?: PoolTKontoSaldo
}

/** Pool-Lösung in `bilanz.correct`. */
export interface PoolBilanzLoesung {
  aktiven?: string[]
  passiven?: string[]
  bilanzsumme?: number
}

export interface PoolFrageBuchungssatz extends PoolFrageBase {
  type: 'buchungssatz'
  konten?: PoolKonto[]
  correct?: PoolBuchung[]
}

export interface PoolFrageTKonto extends PoolFrageBase {
  type: 'tkonto'
  geschaeftsfaelle?: string[]
  konten?: PoolTKontoKonto[]
  /** Optionale Liste der zur Auswahl stehenden Gegenkonten. */
  gegenkonten?: PoolKonto[]
}

export interface PoolFrageKontenbestimmung extends PoolFrageBase {
  type: 'kontenbestimmung'
  konten?: PoolKonto[]
  aufgaben?: PoolKontenAufgabe[]
}

export interface PoolFrageBilanz extends PoolFrageBase {
  type: 'bilanz'
  modus?: 'bilanz' | 'erfolgsrechnung' | 'beides'
  kontenMitSaldi?: { nr: string; name: string; saldo: number }[]
  correct?: PoolBilanzLoesung
}

/**
 * Inline-Teilaufgabe in einer Pool-Aufgabengruppe.
 * Felder werden im Konverter via `...teil` durchgereicht — hier breit typisiert
 * mit Index-Signatur, weil das Pool-Format Teilaufgaben heterogen erlaubt.
 */
export interface PoolFrageTeilaufgabe {
  type?: string
  q?: string
  [key: string]: unknown
}

export interface PoolFrageGruppe extends PoolFrageBase {
  type: 'gruppe'
  context?: string
  teil?: PoolFrageTeilaufgabe[]
}

export interface PoolFragePDF extends PoolFrageBase {
  type: 'pdf'
  /** PDF-Pool-Fragen fallen im Konverter in den Default-Branch (Freitext-Fallback). */
  pdfUrl?: string
}

// === Diskriminierte Union ===

export type PoolFrage =
  | PoolFrageMC
  | PoolFrageMulti
  | PoolFrageTF
  | PoolFrageFill
  | PoolFrageCalc
  | PoolFrageSort
  | PoolFrageOpen
  | PoolFrageSortierung
  | PoolFrageFormel
  | PoolFrageHotspot
  | PoolFrageBildbeschriftung
  | PoolFrageDragDropBild
  | PoolFrageCode
  | PoolFrageZeichnen
  | PoolFrageBuchungssatz
  | PoolFrageTKonto
  | PoolFrageKontenbestimmung
  | PoolFrageBilanz
  | PoolFrageGruppe
  | PoolFragePDF

export type PoolFrageTyp = PoolFrage['type']
