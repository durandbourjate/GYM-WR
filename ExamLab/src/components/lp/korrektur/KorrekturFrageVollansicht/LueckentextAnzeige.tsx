import type { LueckentextFrage } from '../../../../types/fragen-storage'
import type { Antwort } from '../../../../types/antworten'
import { KeineAntwort } from './util'

/** Lückentext-Antwort */
export default function LueckentextAnzeige({ frage, antwort }: { frage: LueckentextFrage; antwort: Extract<Antwort, { typ: 'lueckentext' }> | undefined }) {
  if (!antwort) return <KeineAntwort />
  return (
    <div className="rounded bg-slate-50 dark:bg-slate-700/50 px-3 py-2 mt-2 space-y-1">
      {frage.luecken.map((luecke, i) => {
        const eingabe = antwort.eintraege[luecke.id] ?? ''
        return (
          <div key={luecke.id} className="flex items-center gap-2 text-sm">
            <span className="text-slate-500 dark:text-slate-400">Lücke {i + 1}:</span>
            <span className="font-medium text-slate-700 dark:text-slate-200">{eingabe || '–'}</span>
          </div>
        )
      })}
    </div>
  )
}
