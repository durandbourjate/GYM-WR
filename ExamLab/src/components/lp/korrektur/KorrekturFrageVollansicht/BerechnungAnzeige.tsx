import type { BerechnungFrage } from '../../../../types/fragen-storage'
import type { Antwort } from '../../../../types/antworten'
import { KeineAntwort } from './util'

/** Berechnung-Antwort */
export default function BerechnungAnzeige({ frage, antwort }: { frage: BerechnungFrage; antwort: Extract<Antwort, { typ: 'berechnung' }> | undefined }) {
  if (!antwort) return <KeineAntwort />
  return (
    <div className="rounded bg-slate-50 dark:bg-slate-700/50 px-3 py-2 mt-2 space-y-1">
      {frage.ergebnisse.map((erg) => {
        const eingabe = antwort.ergebnisse[erg.id] ?? ''
        return (
          <div key={erg.id} className="flex items-center gap-2 text-sm">
            <span className="text-slate-500 dark:text-slate-400">{erg.label}:</span>
            <span className="font-medium text-slate-700 dark:text-slate-200">{eingabe || '–'}</span>
            {erg.einheit && <span className="text-slate-400 dark:text-slate-500">{erg.einheit}</span>}
          </div>
        )
      })}
      {antwort.rechenweg && (
        <div className="pt-1 border-t border-slate-200 dark:border-slate-600 mt-1">
          <span className="text-xs text-slate-500 dark:text-slate-400">Rechenweg:</span>
          <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap">{antwort.rechenweg}</p>
        </div>
      )}
    </div>
  )
}
