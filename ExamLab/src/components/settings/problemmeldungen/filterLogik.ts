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
  | { art: 'pruefung'; id: string; istUebung: boolean }
  | { art: 'gruppe'; id: string; istUebung: boolean }
  | { art: 'ort'; id: string }

export function priorisiereDeepLink(m: Problemmeldung): DeepLinkZiel | null {
  // Pool-importierte Fragen sind dennoch in der Fragensammlung erreichbar — Deep-Link trotzdem erlauben.
  if (m.frageId) return { art: 'frage', id: m.frageId }
  const istUebung = m.modus === 'ueben'
  if (m.pruefungId) return { art: 'pruefung', id: m.pruefungId, istUebung }
  if (m.gruppeId) return { art: 'gruppe', id: m.gruppeId, istUebung }
  if (m.ort) return { art: 'ort', id: m.ort }
  return null
}
