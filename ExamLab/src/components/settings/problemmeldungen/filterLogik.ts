import type { Problemmeldung } from '../../../types/problemmeldung'

export interface FilterConfig {
  status: 'offen' | 'erledigt' | 'alle'
  typ: 'alle' | 'problem' | 'wunsch'
  nurMeine: boolean
}

export function filterMeldungen(
  meldungen: Problemmeldung[],
  filter: FilterConfig,
): Problemmeldung[] {
  return meldungen.filter(m => {
    if (filter.status === 'offen' && m.erledigt) return false
    if (filter.status === 'erledigt' && !m.erledigt) return false
    if (filter.typ !== 'alle' && m.typ !== filter.typ) return false
    if (filter.nurMeine && m.recht !== 'inhaber') return false
    return true
  })
}

export type DeepLinkZiel =
  | { art: 'frage'; id: string }
  | { art: 'pruefung'; id: string }
  | { art: 'gruppe'; id: string }
  | { art: 'ort'; id: string }

export function priorisiereDeepLink(m: Problemmeldung): DeepLinkZiel | null {
  if (m.frageId && !m.istPoolFrage) return { art: 'frage', id: m.frageId }
  if (m.pruefungId) return { art: 'pruefung', id: m.pruefungId }
  if (m.gruppeId) return { art: 'gruppe', id: m.gruppeId }
  if (m.ort) return { art: 'ort', id: m.ort }
  return null
}
