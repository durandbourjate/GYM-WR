import { typLabel } from '../../../../utils/fachUtils.ts'
import type { Frage, FrageSummary } from '../../../../types/fragen.ts'

export type Gruppierung = 'keine' | 'fachbereich' | 'thema' | 'typ' | 'bloom'

export function gruppenKey(frage: Frage | FrageSummary, gruppierung: Gruppierung): string {
  switch (gruppierung) {
    case 'fachbereich': return frage.fachbereich
    case 'thema': return frage.thema
    case 'typ': return frage.typ
    case 'bloom': return frage.bloom
    default: return ''
  }
}

export function gruppenLabel(key: string, gruppierung: Gruppierung): string {
  if (gruppierung === 'typ') return typLabel(key)
  return key
}

export function gruppenLabelFarbe(key: string, gruppierung: Gruppierung): string {
  if (gruppierung === 'fachbereich') {
    switch (key) {
      case 'VWL': return 'text-orange-700 dark:text-orange-300'
      case 'BWL': return 'text-blue-700 dark:text-blue-300'
      case 'Recht': return 'text-green-700 dark:text-green-300'
    }
  }
  return 'text-slate-700 dark:text-slate-200'
}
