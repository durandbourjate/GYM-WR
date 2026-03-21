// Pruefung/src/types/pool.ts

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

/** Einzelne Pool-Frage (Rohformat aus JS-Config) */
export interface PoolFrage {
  id: string
  topic: string
  type: 'mc' | 'multi' | 'tf' | 'fill' | 'calc' | 'sort' | 'open'
  diff: number
  tax: string
  q: string
  reviewed?: boolean
  options?: { v: string; t: string }[]
  correct?: string | string[] | boolean
  explain?: string
  blanks?: { answer: string; alts?: string[] }[]
  rows?: { label: string; answer: number; tolerance: number; unit?: string }[]
  categories?: string[]
  items?: { t: string; cat: number }[]
  sample?: string
  img?: { src: string; alt?: string }
}

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
  poolId: string
  thema: string
  text: string
  bloom: string
  aktiv: boolean
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
