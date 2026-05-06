import type { ZuordnungFrage } from '../../../../types/fragen-storage'
import type { Antwort } from '../../../../types/antworten'
import { KeineAntwort } from './util'

/** Zuordnung-Antwort */
export default function ZuordnungAnzeige({ frage, antwort }: { frage: ZuordnungFrage; antwort: Extract<Antwort, { typ: 'zuordnung' }> | undefined }) {
  if (!antwort) return <KeineAntwort />
  return (
    <div className="rounded bg-slate-50 dark:bg-slate-700/50 px-3 py-2 mt-2 space-y-1">
      {frage.paare.map((paar) => {
        const zugeordnet = antwort.zuordnungen[paar.links]
        const korrekt = zugeordnet === paar.rechts
        return (
          <div key={paar.links} className="flex items-center gap-2 text-sm">
            <span className="text-slate-700 dark:text-slate-200">{paar.links}</span>
            <span className="text-slate-400">→</span>
            <span className={`font-medium ${korrekt ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {zugeordnet || '–'}
            </span>
          </div>
        )
      })}
    </div>
  )
}
