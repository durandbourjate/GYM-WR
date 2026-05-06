import type { RichtigFalschFrage } from '../../../../types/fragen-storage'
import type { Antwort } from '../../../../types/antworten'

/** Richtig/Falsch-Aussagen mit R/F-Anzeige */
export default function RFAnzeige({ frage, antwort }: { frage: RichtigFalschFrage; antwort: Extract<Antwort, { typ: 'richtigfalsch' }> | undefined }) {
  return (
    <div className="space-y-1 mt-2">
      {frage.aussagen.map((aussage) => {
        const bewertung = antwort?.bewertungen[aussage.id]
        const hatGeantwortet = bewertung !== undefined
        const korrekt = hatGeantwortet && bewertung === aussage.korrekt

        let bgClass = 'bg-slate-50 dark:bg-slate-700/50'
        if (hatGeantwortet && korrekt) bgClass = 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/40'
        else if (hatGeantwortet && !korrekt) bgClass = 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/40'

        return (
          <div key={aussage.id} className={`flex items-start gap-2 px-3 py-1.5 rounded border ${bgClass}`}>
            <span className="text-sm font-medium mt-0.5 shrink-0 w-5 text-center">
              {hatGeantwortet ? (bewertung ? 'R' : 'F') : '–'}
            </span>
            <span className="text-sm text-slate-700 dark:text-slate-200 flex-1">{aussage.text}</span>
            {hatGeantwortet && !korrekt && (
              <span className="text-xs text-red-500 dark:text-red-400 shrink-0">
                (korrekt: {aussage.korrekt ? 'R' : 'F'})
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
