import type { Antwort } from '../../../../types/antworten'
import { KeineAntwort } from './util'

/** Sortierung-Antwort */
export default function SortierungAnzeige({ antwort }: { antwort: Extract<Antwort, { typ: 'sortierung' }> | undefined }) {
  if (!antwort) return <KeineAntwort />
  return (
    <div className="rounded bg-slate-50 dark:bg-slate-700/50 px-3 py-2 mt-2 space-y-0.5">
      {antwort.reihenfolge.map((item, i) => (
        <div key={i} className="text-sm text-slate-700 dark:text-slate-200">
          {i + 1}. {item}
        </div>
      ))}
    </div>
  )
}
