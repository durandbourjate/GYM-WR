import type { SchuelerStatus } from '../../../types/monitoring'

type Sortierung = 'name' | 'klasse' | 'fortschritt' | 'status'
type QuickFilter = 'alle' | 'aktiv' | 'abgegeben' | 'nicht-erschienen'

export type { Sortierung, QuickFilter }

export function statusReihenfolge(status: SchuelerStatus['status']): number {
  switch (status) {
    case 'aktiv': return 0
    case 'inaktiv': return 1
    case 'nicht-gestartet': return 2
    case 'abgegeben': return 3
    case 'beendet-lp': return 4
    default: return 5
  }
}

export function filterLabel(f: QuickFilter): string {
  switch (f) {
    case 'alle': return 'Alle'
    case 'aktiv': return 'Aktiv'
    case 'abgegeben': return 'Abgegeben'
    case 'nicht-erschienen': return 'Nicht erschienen'
  }
}

export function verstossTooltip(s: SchuelerStatus): string {
  if (!s.verstoesse?.length) return 'Keine Verstösse'
  return s.verstoesse.map(v =>
    `${new Date(v.zeitpunkt).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })} — ${v.typ}${v.dauer_sekunden ? ` (${v.dauer_sekunden}s)` : ''}`
  ).join('\n')
}

export function stufeIcon(stufe?: string): string {
  return stufe === 'locker' ? '🟢' : stufe === 'streng' ? '🔴' : '🟡'
}

export function statusBadge(status: SchuelerStatus['status']): React.JSX.Element {
  switch (status) {
    case 'aktiv':
      return <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">Aktiv</span>
    case 'abgegeben':
      return <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full">Abgegeben</span>
    case 'nicht-gestartet':
      return <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-full">Nicht da</span>
    case 'beendet-lp':
      return <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full">Beendet</span>
    case 'inaktiv':
      return <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full">Inaktiv</span>
    default:
      return <span>{status}</span>
  }
}
