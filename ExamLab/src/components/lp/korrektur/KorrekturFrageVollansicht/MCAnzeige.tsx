import type { MCFrage } from '../../../../types/fragen-storage'
import type { Antwort } from '../../../../types/antworten'

/** MC-Optionen mit Korrektheit-Anzeige */
export default function MCAnzeige({ frage, antwort }: { frage: MCFrage; antwort: Extract<Antwort, { typ: 'mc' }> | undefined }) {
  const gewaehlteIds = new Set(antwort?.gewaehlteOptionen ?? [])

  return (
    <div className="space-y-1 mt-2">
      {frage.optionen.map((option) => {
        const gewaehlt = gewaehlteIds.has(option.id)
        const korrekt = option.korrekt

        let bgClass = 'bg-slate-50 dark:bg-slate-700/50'
        if (gewaehlt && korrekt) bgClass = 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/40'
        else if (gewaehlt && !korrekt) bgClass = 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/40'
        else if (!gewaehlt && korrekt) bgClass = 'bg-green-50/50 dark:bg-green-900/10'

        return (
          <div key={option.id} className={`flex items-start gap-2 px-3 py-1.5 rounded border ${bgClass}`}>
            <span className="text-sm mt-0.5 shrink-0">
              {gewaehlt ? (korrekt ? '✓' : '✗') : (korrekt ? '○' : '')}
            </span>
            <span className="text-sm text-slate-700 dark:text-slate-200">{option.text}</span>
          </div>
        )
      })}
    </div>
  )
}
