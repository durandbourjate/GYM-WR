import type { MCFrage } from '../../../../../types/fragen-storage'

export default function MCVorschau({ frage }: { frage: MCFrage }) {
  const buchstaben = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
  return (
    <div className="space-y-2">
      {frage.optionen.map((option, idx) => (
        <div
          key={option.id}
          className="flex items-start gap-3 px-4 py-2.5 bg-slate-50 dark:bg-slate-700/30 rounded-lg border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
        >
          {/* Radio/Checkbox Indikator */}
          {frage.mehrfachauswahl ? (
            <div className="mt-0.5 w-4 h-4 rounded border-2 border-slate-300 dark:border-slate-500 shrink-0" />
          ) : (
            <div className="mt-0.5 w-4 h-4 rounded-full border-2 border-slate-300 dark:border-slate-500 shrink-0" />
          )}
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400 shrink-0 w-5">
            {buchstaben[idx] ?? String(idx + 1)}
          </span>
          <span className="text-sm text-slate-700 dark:text-slate-200">{option.text}</span>
        </div>
      ))}
      {frage.mehrfachauswahl && (
        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Mehrere Antworten moeglich</p>
      )}
    </div>
  )
}
