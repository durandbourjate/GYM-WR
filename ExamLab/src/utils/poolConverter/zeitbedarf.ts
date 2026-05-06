import type { PoolFrage } from '../../types/pool'

/** Schätzt den Zeitbedarf in Minuten für eine Pool-Frage */
export function schaetzeZeitbedarf(pf: PoolFrage): number {
  switch (pf.type) {
    case 'mc':
      return 1
    case 'tf':
      return 1
    case 'multi':
      return 2
    case 'fill':
      return Math.max(1, Math.ceil((pf.blanks?.length ?? 1) * 0.5))
    case 'calc':
      return (pf.rows?.length ?? 1) * 3
    case 'sort':
      return Math.max(1, Math.ceil((pf.items?.length ?? 2) * 0.5))
    case 'open':
      return 5
    case 'sortierung':
      return Math.max(2, (pf.items?.length ?? 3))
    case 'formel':
      return 3
    case 'hotspot':
      return 2
    case 'bildbeschriftung':
      return Math.max(2, (pf.labels?.length ?? 2))
    case 'dragdrop_bild':
      return Math.max(2, (pf.labels?.length ?? 2))
    case 'code':
      return 5
    case 'zeichnen':
      return 4
    case 'buchungssatz':
      return (pf.correct?.length ?? 1) * 3
    case 'tkonto':
      return (pf.geschaeftsfaelle?.length ?? 1) * 3
    case 'kontenbestimmung':
      return (pf.aufgaben?.length ?? 1) * 2
    case 'bilanz':
      return 5
    case 'gruppe':
      return (pf.teil?.length ?? 1) * 3
    default:
      return 2
  }
}
