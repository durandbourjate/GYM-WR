/**
 * Skeleton-Variante des Vorbereitungs-Tab in DurchfuehrenDashboard.
 * Layout-Match: 2 Settings-Karten oben (Konfigurations-Bereich) + 1 Teilnehmer-Tabellen-Container.
 * Festes Layout — keine Persistenz nötig.
 */
export default function DurchfuehrenVorbereitungSkeleton() {
  return (
    <div className="space-y-4">
      {/* 2 Settings-Karten (Konfigurations-Bereich) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[3, 4].map((zeilen, idx) => (
          <div
            key={idx}
            data-testid="vorbereitung-settings-card"
            className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5"
          >
            <div className="h-5 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-4" />
            <div className="space-y-2">
              {Array.from({ length: zeilen }, (_, i) => (
                <div key={i} className="flex justify-between gap-2">
                  <div className="h-4 w-1/2 bg-slate-100 dark:bg-slate-600 rounded animate-pulse" />
                  <div className="h-4 w-1/3 bg-slate-100 dark:bg-slate-600 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Teilnehmer-Container */}
      <div
        data-testid="vorbereitung-teilnehmer-container"
        className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5"
      >
        <div className="h-5 w-40 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-10 w-10 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse" />
              <div className="h-4 w-32 bg-slate-100 dark:bg-slate-600 rounded animate-pulse" />
              <div className="ml-auto h-6 w-20 bg-slate-100 dark:bg-slate-600 rounded-full animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
