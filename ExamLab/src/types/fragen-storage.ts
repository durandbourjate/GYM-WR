// ExamLab/src/types/fragen-storage.ts
//
// Storage-Erweiterung der Editor-Types aus `@shared/types/fragen-core`.
// Ergänzt Backend-berechnete Felder (`_recht`, `poolVersion`) und erlaubt
// Tag-Objekte (Tag mit Farbe/Ebene) zusätzlich zu blossen string-Tags.

import type * as Core from '@shared/types/fragen-core'
import type { EffektivesRecht } from './auth'
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

/**
 * Storage-Variante der diskriminierten Frage-Union.
 *
 * Strukturell kompatibel zu Core.Frage für alle Core-Felder, aber typisiert
 * mit der Storage-Erweiterung (FrageBase mit `tags: (string | Tag)[]`,
 * `_recht`, `poolVersion`).
 *
 * HINWEIS: Bei neuem Core-Fragetyp hier Arm ergänzen — TS fängt das nicht
 * automatisch (Storage.Frage hätte den Typ sonst stillschweigend nicht).
 */
export type Frage =
  | WithStorageBase<Core.MCFrage>
  | WithStorageBase<Core.FreitextFrage>
  | WithStorageBase<Core.ZuordnungFrage>
  | WithStorageBase<Core.LueckentextFrage>
  | WithStorageBase<Core.VisualisierungFrage>
  | WithStorageBase<Core.RichtigFalschFrage>
  | WithStorageBase<Core.BerechnungFrage>
  | WithStorageBase<Core.BuchungssatzFrage>
  | WithStorageBase<Core.TKontoFrage>
  | WithStorageBase<Core.KontenbestimmungFrage>
  | WithStorageBase<Core.BilanzERFrage>
  | WithStorageBase<Core.AufgabengruppeFrage>
  | WithStorageBase<Core.PDFFrage>
  | WithStorageBase<Core.SortierungFrage>
  | WithStorageBase<Core.HotspotFrage>
  | WithStorageBase<Core.BildbeschriftungFrage>
  | WithStorageBase<Core.AudioFrage>
  | WithStorageBase<Core.DragDropBildFrage>
  | WithStorageBase<Core.CodeFrage>
  | WithStorageBase<Core.FormelFrage>

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
  berechtigungen?: import('./auth').Berechtigung[]
  _recht?: EffektivesRecht
  lernzielIds?: string[]
  semester?: string[]
  gefaesse?: string[]
}

// Re-Export aller Editor-Types aus Core, damit Storage-Caller nur EINE Datei
// importieren müssen. `export type *` (TS 5.0+) re-exportiert alle Type-Exports
// von Core automatisch — vermeidet brüchige named-export-Listen, die bei
// neuen Sub-Types nachgepflegt werden müssten.
export type * from '@shared/types/fragen-core'
