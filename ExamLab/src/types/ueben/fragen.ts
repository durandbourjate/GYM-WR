/**
 * Re-Exporte aus @shared/types/fragen.
 * ExamLab Üben nutzt dasselbe Frage-Format wie ExamLab Prüfen.
 * Antwort-Typen (LP-spezifisch) → siehe ./antworten.ts
 */

// Alle Frage-Typen und Interfaces aus Shared
export type {
  Frage,
  FrageBase,
  MCFrage,
  MCOption,
  FreitextFrage,
  ZuordnungFrage,
  LueckentextFrage,
  VisualisierungFrage,
  RichtigFalschFrage,
  BerechnungFrage,
  BuchungssatzFrage,
  TKontoFrage,
  KontenbestimmungFrage,
  BilanzERFrage,
  AufgabengruppeFrage,
  PDFFrage,
  SortierungFrage,
  HotspotFrage,
  BildbeschriftungFrage,
  AudioFrage,
  DragDropBildFrage,
  CodeFrage,
  FormelFrage,
  InlineTeilaufgabe,
  // Enums und Hilfstypen
  Fachbereich,
  BloomStufe,
  Bewertungskriterium,
  FrageAnhang,
  Lernziel,
  FragenPerformance,
  // FiBu-Hilfstypen
  Kontenkategorie,
  KontenauswahlConfig,
  BuchungssatzZeile,
  TKontoDefinition,
  TKontoEintrag,
  KontoMitSaldo,
  BilanzERLoesung,
  HotspotBereich,
  BildbeschriftungLabel,
  DragDropBildZielzone,
  CanvasConfig,
  DiagrammConfig,
} from '@shared/types/fragen'

/** Typ-Alias: alle möglichen Fragetyp-Strings */
import type { Frage } from '@shared/types/fragen'
export type FrageTyp = Frage['typ']

// Filter für Fragen-Abfragen
export interface FragenFilter {
  fach?: string
  thema?: string
  schwierigkeit?: number
  tags?: string[]
}
