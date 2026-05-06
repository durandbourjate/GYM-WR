import type { MCFrage } from '../../../../../types/fragen-storage'
import { BUCHSTABEN } from './util'

export default function MCDruck({ frage }: { frage: MCFrage }) {
  return (
    <div className="space-y-1.5">
      {frage.optionen.map((option, idx) => (
        <div key={option.id} className="flex items-start gap-2 text-sm print:text-black">
          {frage.mehrfachauswahl ? (
            <span className="shrink-0 w-4 h-4 mt-0.5 border border-slate-400 print:border-black rounded-sm" />
          ) : (
            <span className="shrink-0 w-4 h-4 mt-0.5 border border-slate-400 print:border-black rounded-full" />
          )}
          <span className="font-medium text-slate-500 print:text-black shrink-0 w-5">
            {BUCHSTABEN[idx] ?? String(idx + 1)})
          </span>
          <span className="text-slate-700 dark:text-slate-200 print:text-black">{option.text}</span>
        </div>
      ))}
      {frage.mehrfachauswahl && (
        <p className="text-[10px] text-slate-400 print:text-slate-600 mt-1">Mehrere Antworten möglich</p>
      )}
    </div>
  )
}
