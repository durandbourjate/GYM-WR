// Pruefung/src/utils/poolConverter.ts
// Konvertiert Pool-Frageformate ins ExamLab-Format

import type {
  Frage,
  Fachbereich,
  BloomStufe,
  Bewertungskriterium,
  Verwendung,
  FrageAnhang,
} from '../../types/fragen-storage'
import type { PoolFrage, PoolMeta, PoolTopic } from '../../types/pool'

import { genId, jetzt } from './konstanten'
import { mapFachbereich, mapBloom, konvertierePoolBild } from './helpers'
import { berechnePunkte } from './punkte'
import { schaetzeZeitbedarf } from './zeitbedarf'
import { konvertiereStandard } from './konvertiereStandard'
import { konvertiereBild } from './konvertiereBild'
import { konvertiereFibu } from './konvertiereFibu'
import { konvertiereAufgabengruppe } from './konvertiereAufgabengruppe'

// Public API re-exports
export { mapFachbereich, mapBloom, konvertierePoolBild } from './helpers'
export { berechnePunkte } from './punkte'
export { schaetzeZeitbedarf } from './zeitbedarf'
export { erzeugeSnapshot } from './snapshot'
export { POOL_IMG_BASE_URL } from './konstanten'

/** Felder, die ALLE konvertierten Fragen teilen — wird vom konvertierePoolFrage-Dispatcher gebaut und in jede Strategy gespreaded. */
export interface BasisFelder {
  id: string
  version: number
  erstelltAm: string
  geaendertAm: string
  fachbereich: Fachbereich
  fach: string
  thema: string
  unterthema: string
  semester: string[]
  gefaesse: string[]
  bloom: BloomStufe
  tags: string[]
  punkte: number
  musterlosung: string
  bewertungsraster: Bewertungskriterium[]
  schwierigkeit: number
  verwendungen: Verwendung[]
  zeitbedarf: number
  quelle: 'pool'
  quellReferenz: string
  autor: string
  geteilt: 'schule'
  poolId: string
  poolGeprueft: boolean
  pruefungstauglich: boolean
  poolContentHash: string
  poolUpdateVerfuegbar: boolean
  lernzielIds: string[]
  anhaenge?: FrageAnhang[]
}

/**
 * Konvertiert eine Pool-Frage ins ExamLab-Format.
 *
 * @param poolFrage  - Die Rohfrage aus dem Pool
 * @param poolMeta   - Pool-Metadaten (id, title, fach)
 * @param topics     - Topic-Map für Thema-Lookup
 * @param lernzielIds - Zugeordnete Lernziel-IDs (vom Caller)
 * @returns          Fertige Frage im ExamLab-Format
 */
export function konvertierePoolFrage(
  poolFrage: PoolFrage,
  poolMeta: PoolMeta,
  topics: Record<string, PoolTopic>,
  lernzielIds: string[] = [],
): Frage {
  const now = jetzt()
  const topic = topics[poolFrage.topic]
  // Pool-Titel = Thema, Topic-Label = Unterthema
  const thema = poolMeta.title || topic?.label || poolFrage.topic
  const unterthema = topic?.label ?? poolFrage.topic

  // Basis-Felder die alle konvertierten Fragen teilen
  const basis: BasisFelder = {
    id: genId(),
    version: 1,
    erstelltAm: now,
    geaendertAm: now,

    fachbereich: mapFachbereich(poolMeta.fach),
    fach: poolMeta.fach || 'Allgemein',
    thema,
    unterthema,
    semester: [] as string[],
    gefaesse: [] as string[],

    bloom: mapBloom(poolFrage.tax),
    tags: [poolFrage.topic, `diff:${poolFrage.diff}`],

    punkte: berechnePunkte(poolFrage),
    musterlosung: poolFrage.explain ?? ('sample' in poolFrage ? poolFrage.sample : undefined) ?? '',
    bewertungsraster: [] as Bewertungskriterium[],

    schwierigkeit: poolFrage.diff,
    verwendungen: [] as Verwendung[],

    zeitbedarf: schaetzeZeitbedarf(poolFrage),

    // Herkunft
    quelle: 'pool' as const,
    quellReferenz: `Pool: ${poolMeta.title}`,

    // Sharing — Pool-Fragen sind für alle LP sichtbar
    autor: 'pool-import',
    geteilt: 'schule' as const,

    // Pool-Sync Felder
    poolId: `${poolMeta.id}:${poolFrage.id}`,
    poolGeprueft: poolFrage.reviewed ?? false,
    pruefungstauglich: false,
    poolContentHash: '',
    poolUpdateVerfuegbar: false,
    lernzielIds,

    // Pool-Bilder als Anhänge
    ...(poolFrage.img ? { anhaenge: [konvertierePoolBild(poolFrage.img)] } : {}),
  }

  switch (poolFrage.type) {
    case 'mc':
    case 'multi':
    case 'tf':
    case 'fill':
    case 'calc':
    case 'sort':
    case 'open':
    case 'sortierung':
    case 'formel':
    case 'code':
    case 'zeichnen':
      return konvertiereStandard(poolFrage, basis)
    case 'hotspot':
    case 'bildbeschriftung':
    case 'dragdrop_bild':
      return konvertiereBild(poolFrage, basis)
    case 'bilanz':
    case 'buchungssatz':
    case 'tkonto':
    case 'kontenbestimmung':
      return konvertiereFibu(poolFrage, basis)
    case 'gruppe':
    default:
      return konvertiereAufgabengruppe(poolFrage, basis)
  }
}
