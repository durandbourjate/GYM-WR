import { leseGespeicherteAnzahl } from '../../../utils/skeletonAnzahl'

/**
 * Skeleton-Variante der SuS-Reihen-Tabelle in DurchfuehrenDashboard
 * (Lobby/Live/Auswertung-Tabs). Anzahl Reihen = letzte gesehene Klassengrösse
 * für diese pruefungId aus localStorage (Cap 60, Min 5), Fallback 8 für Erst-Login.
 */
export default function DurchfuehrenSusReihenSkeleton({ pruefungId }: { pruefungId: string | null }) {
  const key = pruefungId ? `examlab-lp-letzte-sus-anzahl-${pruefungId}` : ''
  const anzahl = key ? leseGespeicherteAnzahl(key, 8, 60) : 8
  const rendered = Math.max(anzahl, 5) // visuelle Konsistenz: nie weniger als 5

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
      <div className="h-5 w-48 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-4" />
      <div className="space-y-3">
        {Array.from({ length: rendered }, (_, i) => (
          <div
            key={i}
            data-testid="sus-reihe-skeleton"
            className="flex items-center gap-3 py-2 border-b border-slate-100 dark:border-slate-700 last:border-0"
          >
            <div className="h-10 w-10 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse shrink-0" />
            <div className="flex-1 space-y-1">
              <div className="h-4 w-32 bg-slate-100 dark:bg-slate-600 rounded animate-pulse" />
              <div className="h-2 w-24 bg-slate-100 dark:bg-slate-600 rounded animate-pulse" />
            </div>
            <div className="h-6 w-20 bg-slate-100 dark:bg-slate-600 rounded-full animate-pulse shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}
