// Pruefung/src/types/pool.ts
import type { PoolFrage } from '@shared/types/pool-frage'

/** Snapshot einer Pool-Frage für Vergleich im Update-Dialog */
export interface PoolFrageSnapshot {
  fragetext: string
  typ: string
  optionen?: unknown[]
  korrekt?: unknown
  erklaerung?: string
  musterlosung?: string
  spezifisch?: unknown
  bloom?: string
  schwierigkeit?: number
}

/** Pool-Meta aus POOL_META global */
export interface PoolMeta {
  id: string
  fach: string
  title: string
  meta?: string
  color?: string
  lernziele: string[]
}

/** Topic-Eintrag aus TOPICS global */
export interface PoolTopic {
  label: string
  short: string
  lernziele: string[]
}

/**
 * Einzelne Pool-Frage (Rohformat aus JS-Config).
 * Ab Bundle L.b: Discriminated Union — siehe `@shared/types/pool-frage`.
 */
export type {
  PoolFrage, PoolFrageTyp, PoolFrageBase, PoolBild,
  PoolFrageMC, PoolFrageMulti, PoolFrageTF, PoolFrageFill, PoolFrageCalc,
  PoolFrageSort, PoolFrageOpen, PoolFrageSortierung, PoolFrageFormel,
  PoolFrageHotspot, PoolFrageBildbeschriftung, PoolFrageDragDropBild,
  PoolFrageCode, PoolFrageZeichnen,
  PoolFrageBuchungssatz, PoolFrageTKonto, PoolFrageKontenbestimmung,
  PoolFrageBilanz, PoolFrageGruppe, PoolFragePDF, PoolFrageTeilaufgabe,
} from '@shared/types/pool-frage'

/** Geparstes Pool-Config-Ergebnis */
export interface PoolConfig {
  meta: PoolMeta
  topics: Record<string, PoolTopic>
  questions: PoolFrage[]
}

/** Eintrag in config/index.json */
export interface PoolIndexEintrag {
  id: string
  file: string
  fach: string
  title: string
}

/** Lernziel für Lernziele-Sheet */
export interface Lernziel {
  id: string
  fach: string
  poolId?: string
  thema: string
  unterthema?: string
  text: string
  bloom: string
  aktiv?: boolean
}

/** Sync-Ergebnis pro Pool */
export interface PoolSyncErgebnis {
  poolId: string
  poolTitle: string
  neu: number
  aktualisiert: number
  unveraendert: number
  fehler?: string
}
