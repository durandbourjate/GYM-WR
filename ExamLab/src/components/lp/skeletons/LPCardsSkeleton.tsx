import { leseGespeicherteAnzahl } from '../../../utils/skeletonAnzahl'

const STORAGE_KEY = 'examlab-lp-letzte-summative-anzahl'

/**
 * Skeleton-Variante des Prüfungs-/Karten-Grids in LPStartseite.
 * Anzahl Karten = letzte gesehene Anzahl summativer Configs (clamped 0..12),
 * Fallback 6 für Erst-Login.
 */
export default function LPCardsSkeleton() {
  const anzahl = leseGespeicherteAnzahl(STORAGE_KEY, 6, 12)
  const rendered = Math.max(anzahl, 3) // visuelle Konsistenz: nie weniger als 3

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: rendered }, (_, i) => (
        <div
          key={i}
          data-testid="lp-card-skeleton"
          className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700"
        >
          <div className="h-5 w-3/4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-3" />
          <div className="h-4 w-1/2 bg-slate-100 dark:bg-slate-600 rounded animate-pulse mb-2" />
          <div className="h-4 w-2/3 bg-slate-100 dark:bg-slate-600 rounded animate-pulse" />
          <div className="flex gap-2 mt-4">
            <div className="h-6 w-16 bg-slate-100 dark:bg-slate-600 rounded-full animate-pulse" />
            <div className="h-6 w-16 bg-slate-100 dark:bg-slate-600 rounded-full animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  )
}
