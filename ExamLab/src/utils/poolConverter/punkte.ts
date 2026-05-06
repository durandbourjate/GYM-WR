import type { PoolFrage } from '../../types/pool'

/** Berechnet die Standardpunktzahl für einen Fragetyp */
export function berechnePunkte(pf: PoolFrage): number {
  switch (pf.type) {
    case 'mc':
      return 1
    case 'tf':
      return 1
    case 'multi':
      return 2
    case 'fill':
      return pf.blanks?.length ?? 1
    case 'calc':
      return (pf.rows?.length ?? 1) * 2
    case 'sort':
      return Math.ceil((pf.items?.length ?? 2) / 2)
    case 'open':
      return 4
    case 'sortierung':
      return Math.max(2, (pf.items?.length ?? 3))
    case 'formel':
      return 2
    case 'hotspot':
      return pf.hotspots?.length ?? 1
    case 'bildbeschriftung':
      return pf.labels?.length ?? 2
    case 'dragdrop_bild':
      return pf.labels?.length ?? 2
    case 'code':
      return 4
    case 'zeichnen':
      return 3
    case 'buchungssatz':
      return (pf.correct?.length ?? 1) * 2
    case 'tkonto':
      return (pf.geschaeftsfaelle?.length ?? 1) * 2
    case 'kontenbestimmung':
      return (pf.aufgaben?.length ?? 1) * 2
    case 'bilanz':
      return (pf.kontenMitSaldi?.length ?? 4)
    case 'gruppe':
      return (pf.teil?.length ?? 1) * 2
    default:
      return 1
  }
}
