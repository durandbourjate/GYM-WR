import type { Antwort } from '../../../../types/antworten'
import { KeineAntwort } from './util'

/** Code-Antwort */
export default function CodeAnzeige({ antwort }: { antwort: Extract<Antwort, { typ: 'code' }> | undefined }) {
  if (!antwort?.code) return <KeineAntwort />
  return (
    <div className="rounded bg-slate-50 dark:bg-slate-700/50 mt-2 overflow-x-auto">
      <pre className="text-sm text-slate-700 dark:text-slate-200 px-3 py-2 font-mono whitespace-pre-wrap">{antwort.code}</pre>
    </div>
  )
}
