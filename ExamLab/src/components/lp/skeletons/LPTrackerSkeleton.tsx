/**
 * Skeleton-Variante des Tracker-Tabs in LPStartseite.
 * Layout-Match zu TrackerSection: Zusammenfassungs-Box mit 5 Kennzahl-Tiles
 * + 2 Akkordeon-Sektionen (FehlendeSuS + Noten-Stand).
 */
export default function LPTrackerSkeleton() {
  return (
    <div className="space-y-4">
      {/* Zusammenfassung-Box mit 5 Kennzahl-Tiles */}
      <div
        data-testid="lp-tracker-summary"
        className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5"
      >
        <div className="h-5 w-48 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-16 bg-slate-100 dark:bg-slate-600 rounded animate-pulse" />
              <div className="h-7 w-12 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>

      {/* 2 Akkordeon-Sektionen (FehlendeSuS + Noten-Stand) */}
      {['fehlende', 'noten'].map(key => (
        <div
          key={key}
          data-testid="lp-tracker-section"
          className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5"
        >
          <div className="flex items-center justify-between">
            <div className="h-5 w-40 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            <div className="h-5 w-5 bg-slate-100 dark:bg-slate-600 rounded animate-pulse" />
          </div>
          <div className="space-y-2 mt-4">
            <div className="h-4 w-full bg-slate-100 dark:bg-slate-600 rounded animate-pulse" />
            <div className="h-4 w-5/6 bg-slate-100 dark:bg-slate-600 rounded animate-pulse" />
            <div className="h-4 w-3/4 bg-slate-100 dark:bg-slate-600 rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  )
}
