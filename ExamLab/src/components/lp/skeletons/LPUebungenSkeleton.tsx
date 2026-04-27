import { leseGespeicherteAnzahl } from '../../../utils/skeletonAnzahl'

const STORAGE_KEY = 'examlab-lp-letzte-formative-anzahl'

/**
 * Skeleton-Variante des Übungs-Karten-Grids in LPStartseite.
 * Layout identisch zu LPCardsSkeleton — Übungen rendern dieselben Karten,
 * nur eigener localStorage-Key (formative Configs).
 */
export default function LPUebungenSkeleton() {
  const anzahl = leseGespeicherteAnzahl(STORAGE_KEY, 4, 12)
  const rendered = Math.max(anzahl, 3) // visuelle Konsistenz: nie weniger als 3

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: rendered }, (_, i) => (
        <div
          key={i}
          data-testid="lp-ueb-skeleton"
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
