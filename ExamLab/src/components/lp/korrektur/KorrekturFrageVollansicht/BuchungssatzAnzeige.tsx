import type { Antwort } from '../../../../types/antworten'
import { KeineAntwort } from './util'

/** Buchungssatz-Antwort */
export default function BuchungssatzAnzeige({ antwort }: { antwort: Extract<Antwort, { typ: 'buchungssatz' }> | undefined }) {
  if (!antwort || antwort.buchungen.length === 0) return <KeineAntwort />
  return (
    <div className="rounded bg-slate-50 dark:bg-slate-700/50 px-3 py-2 mt-2 space-y-2">
      {antwort.buchungen.map((b, i) => (
        <div key={b.id ?? i} className="text-sm">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Buchung {i + 1}:</span>
          <div className="flex gap-4 mt-0.5">
            <div>
              <span className="text-xs text-slate-400 dark:text-slate-500">Soll: </span>
              <span className="text-slate-700 dark:text-slate-200">
                {b.sollKonto || '?'}: {b.betrag}
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-400 dark:text-slate-500">Haben: </span>
              <span className="text-slate-700 dark:text-slate-200">
                {b.habenKonto || '?'}: {b.betrag}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
