/**
 * Skeleton-Variante der Fragensammlung-Liste in FragenBrowser.
 * 8 Karten fest — die Liste ist via G.e virtualisiert, sodass nur ~10 Karten
 * im Viewport sichtbar sind. Persist bringt keinen messbaren Effekt.
 */
export default function FragenListeSkeleton() {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: 8 }, (_, i) => (
        <div
          key={i}
          data-testid="fragen-liste-skeleton-karte"
          className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700 space-y-2"
        >
          <div className="h-5 w-3/4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
          <div className="flex gap-2">
            <div className="h-5 w-16 bg-slate-100 dark:bg-slate-600 rounded-full animate-pulse" />
            <div className="h-5 w-20 bg-slate-100 dark:bg-slate-600 rounded-full animate-pulse" />
          </div>
          <div className="flex justify-end">
            <div className="h-4 w-12 bg-slate-100 dark:bg-slate-600 rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  )
}
