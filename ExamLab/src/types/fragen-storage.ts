// ExamLab/src/types/fragen-storage.ts
//
// Storage-Erweiterung der Editor-Types aus `@shared/types/fragen-core`.
// Ergänzt Backend-berechnete Felder (`_recht`, `poolVersion`) und erlaubt
// Tag-Objekte (Tag mit Farbe/Ebene) zusätzlich zu blossen string-Tags.

import type * as Core from '@shared/types/fragen-core'
import type { EffektivesRecht, Berechtigung } from './auth'
import type { Tag } from './tags'
import type { PoolFrageSnapshot } from './pool'

/**
 * ExamLab-Storage-Erweiterung der FrageBase.
 *
 * Erweitert die kanonische Core-Variante um drei Storage-spezifische Aspekte:
 * - `tags` akzeptiert zusätzlich Tag-Objekte (mit Farbe/Ebene), nicht nur Strings.
 * - `_recht` wird vom Backend pro Request berechnet (Inhaber/Bearbeiter/Betrachter).
 * - `poolVersion` ist ein Snapshot zur Update-Erkennung importierter Pool-Fragen.
 */
export interface FrageBase extends Omit<Core.FrageBase, 'tags'> {
  tags: (string | Tag)[]
  _recht?: EffektivesRecht
  poolVersion?: PoolFrageSnapshot
}

/**
 * Type-Helper: nimmt einen Core-Fragetyp und ersetzt seine FrageBase-Felder
 * durch die Storage-Version. Discriminator `typ` bleibt erhalten weil er
 * auf jedem Sub-Type direkt liegt (nicht in FrageBase).
 */
export type WithStorageBase<T extends Core.Frage> =
  Omit<T, keyof Core.FrageBase> & FrageBase

// ============================================================
// Storage-Sub-Types
// ============================================================
//
// Jeder Core-Fragetyp wird hier als Storage-Variante exportiert. Damit
// liefert `import { MCFrage } from '.../fragen-storage'` automatisch die
// Storage-Variante (mit Tag-Objekten, _recht, poolVersion) — kein
// `Extract<Frage, {typ:'mc'}>`-Alias mehr nötig in den Caller-Files.
//
// HINWEIS: Bei neuem Core-Fragetyp hier UND in der `Frage`-Union unten Arm
// ergänzen. TS fängt das nicht automatisch — Storage.Frage hätte den Typ
// sonst stillschweigend nicht.

export type MCFrage = WithStorageBase<Core.MCFrage>
export type FreitextFrage = WithStorageBase<Core.FreitextFrage>
export type ZuordnungFrage = WithStorageBase<Core.ZuordnungFrage>
export type LueckentextFrage = WithStorageBase<Core.LueckentextFrage>
export type VisualisierungFrage = WithStorageBase<Core.VisualisierungFrage>
export type RichtigFalschFrage = WithStorageBase<Core.RichtigFalschFrage>
export type BerechnungFrage = WithStorageBase<Core.BerechnungFrage>
export type BuchungssatzFrage = WithStorageBase<Core.BuchungssatzFrage>
export type TKontoFrage = WithStorageBase<Core.TKontoFrage>
export type KontenbestimmungFrage = WithStorageBase<Core.KontenbestimmungFrage>
export type BilanzERFrage = WithStorageBase<Core.BilanzERFrage>
export type AufgabengruppeFrage = WithStorageBase<Core.AufgabengruppeFrage>
export type PDFFrage = WithStorageBase<Core.PDFFrage>
export type SortierungFrage = WithStorageBase<Core.SortierungFrage>
export type HotspotFrage = WithStorageBase<Core.HotspotFrage>
export type BildbeschriftungFrage = WithStorageBase<Core.BildbeschriftungFrage>
export type AudioFrage = WithStorageBase<Core.AudioFrage>
export type DragDropBildFrage = WithStorageBase<Core.DragDropBildFrage>
export type CodeFrage = WithStorageBase<Core.CodeFrage>
export type FormelFrage = WithStorageBase<Core.FormelFrage>

/**
 * Storage-Variante der diskriminierten Frage-Union.
 *
 * Strukturell kompatibel zu Core.Frage für alle Core-Felder, aber typisiert
 * mit der Storage-Erweiterung (FrageBase mit `tags: (string | Tag)[]`,
 * `_recht`, `poolVersion`).
 */
export type Frage =
  | MCFrage
  | FreitextFrage
  | ZuordnungFrage
  | LueckentextFrage
  | VisualisierungFrage
  | RichtigFalschFrage
  | BerechnungFrage
  | BuchungssatzFrage
  | TKontoFrage
  | KontenbestimmungFrage
  | BilanzERFrage
  | AufgabengruppeFrage
  | PDFFrage
  | SortierungFrage
  | HotspotFrage
  | BildbeschriftungFrage
  | AudioFrage
  | DragDropBildFrage
  | CodeFrage
  | FormelFrage

/**
 * Leichtgewichtige Frage-Zusammenfassung für Listenansicht (~200 Bytes statt ~1500).
 *
 * Storage-only: kommt nicht aus Core, weil Core ausschliesslich kanonische
 * Editor-Types definiert. FrageSummary ist eine ExamLab-spezifische
 * Backend-Projektion mit `_recht`-Auflösung.
 */
export interface FrageSummary {
  id: string
  typ: string
  fachbereich: Core.Fachbereich
  thema: string
  unterthema?: string
  fragetext: string  // Gekürzt auf max. 200 Zeichen
  bloom: Core.BloomStufe
  punkte: number
  tags: (string | Tag)[]
  quelle?: 'pool' | 'papier' | 'manuell' | 'ki-generiert'
  autor?: string
  erstelltVon?: string
  erstelltAm: string
  geteilt?: 'privat' | 'fachschaft' | 'schule'
  geteiltVon?: string
  poolId?: string
  poolGeprueft?: boolean
  pruefungstauglich?: boolean
  poolUpdateVerfuegbar?: boolean
  hatAnhang: boolean
  hatMaterial: boolean
  schwierigkeit?: number
  fach: string
  berechtigungen?: Berechtigung[]
  _recht?: EffektivesRecht
  lernzielIds?: string[]
  semester?: string[]
  gefaesse?: string[]
}

// ============================================================
// Helper-Types aus Core re-exportieren
// ============================================================
//
// Alle Nicht-Sub-Type-Exports von Core werden hier weitergereicht, damit
// Caller nur EINE Datei importieren müssen. Sub-Types (MCFrage etc.) und
// die `Frage`-Union sind oben mit Storage-Semantik überschrieben.

export type {
  // Anhang & Bewertung
  FrageAnhang,
  Bewertungskriterium,
  Niveaustufe,
  Verwendung,
  // Diskriminatoren / Enums
  Fachbereich,
  Gefaess,
  BloomStufe,
  // MC / Lückentext / Zuordnung / Berechnung
  MCOption,
  Luecke,
  ZuordnungPaar,
  // Visualisierung
  DiagrammConfig,
  DiagrammElement,
  CanvasConfig,
  // FiBu
  Kontenkategorie,
  KontenauswahlConfig,
  BuchungsKonto,
  BuchungssatzZeile,
  SollHabenZeile,
  TKontoEintrag,
  TKontoDefinition,
  TKontoBewertung,
  KontenAntwort,
  Kontenaufgabe,
  KontoMitSaldo,
  BilanzGruppe,
  BilanzStruktur,
  ERStufe,
  ERStruktur,
  BilanzERLoesung,
  BilanzERBewertung,
  // Aufgabengruppe
  InlineTeilaufgabe,
  // PDF
  PDFAnnotationsWerkzeug,
  PDFToolbarWerkzeug,
  PDFKategorie,
  PDFTextRange,
  PDFHighlightAnnotation,
  PDFKommentarAnnotation,
  PDFFreihandAnnotation,
  PDFLabelAnnotation,
  PDFTextAnnotation,
  PDFAnnotation,
  // Sortierung / Bild-Fragetypen
  HotspotBereich,
  BildbeschriftungLabel,
  DragDropBildZielzone,
  DragDropBildLabel,
  // Sonstige
  Lernziel,
  FragenPerformance,
} from '@shared/types/fragen-core'
