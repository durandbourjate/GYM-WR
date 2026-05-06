import type { RichtigFalschFrage } from '../../../../../types/fragen-storage'

export default function RichtigFalschVorschau({ frage }: { frage: RichtigFalschFrage }) {
  return (
    <div className="space-y-2">
      {frage.aussagen.map((aussage) => (
        <div key={aussage.id} className="flex items-center gap-3 px-4 py-2.5 bg-slate-50 dark:bg-slate-700/30 rounded-lg border border-slate-200 dark:border-slate-600">
          <span className="text-sm text-slate-700 dark:text-slate-200 flex-1">{aussage.text}</span>
          <div className="flex gap-1 shrink-0">
            <button
              disabled
              className="px-3 py-1 text-xs font-medium border border-slate-300 dark:border-slate-500 rounded-l-lg bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300"
            >
              Richtig
            </button>
            <button
              disabled
              className="px-3 py-1 text-xs font-medium border border-slate-300 dark:border-slate-500 rounded-r-lg bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300"
            >
              Falsch
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
