/** Fallback-Spinner für lazy-geladene Komponenten */
export default function LazyFallback() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin h-6 w-6 border-2 border-slate-300 dark:border-slate-600 border-t-blue-500 rounded-full" />
    </div>
  )
}
