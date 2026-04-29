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
import type {
  BuchungssatzZeile,
  TKontoDefinition,
  Kontenaufgabe,
  KontoMitSaldo,
  BilanzERLoesung,
} from './fragen-core'

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

// === FiBu-Sub-Types (abgeleitet aus poolConverter.ts:610-666) ===

export interface PoolFrageBuchungssatz extends PoolFrageBase {
  type: 'buchungssatz'
  /** Pool-Quelle der Buchungen → wird auf BuchungssatzFrage.buchungen gemappt */
  correct?: BuchungssatzZeile[]
  /** Erlaubte Konten → wird auf kontenauswahl.konten gemappt */
  konten?: string[]
}

export interface PoolFrageTKonto extends PoolFrageBase {
  type: 'tkonto'
  geschaeftsfaelle?: string[]
  konten?: TKontoDefinition[]
}

export interface PoolFrageKontenbestimmung extends PoolFrageBase {
  type: 'kontenbestimmung'
  aufgaben?: Kontenaufgabe[]
}

export interface PoolFrageBilanz extends PoolFrageBase {
  type: 'bilanz'
  modus?: 'bilanz' | 'erfolgsrechnung' | 'beides'
  kontenMitSaldi?: KontoMitSaldo[]
  /** Pool-Quelle der Lösung → wird auf BilanzERFrage.loesung gemappt */
  correct?: BilanzERLoesung
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
