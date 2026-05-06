import type { Antwort } from '../../../../types/antworten'
import { KeineAntwort } from './util'

/** T-Konto-Antwort */
export default function TKontoAnzeige({ antwort }: { antwort: Extract<Antwort, { typ: 'tkonto' }> | undefined }) {
  if (!antwort || antwort.konten.length === 0) return <KeineAntwort />
  return (
    <div className="rounded bg-slate-50 dark:bg-slate-700/50 px-3 py-2 mt-2 space-y-2">
      {antwort.konten.map((k, i) => (
        <div key={k.id ?? i} className="text-sm">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            T-Konto {i + 1}{k.beschriftungLinks ? ` (${k.beschriftungLinks})` : ''}:
          </span>
          <div className="flex gap-4 mt-0.5">
            <div>
              <span className="text-xs text-slate-400 dark:text-slate-500">Links: </span>
              {k.eintraegeLinks.map((e, j) => (
                <span key={j} className="text-slate-700 dark:text-slate-200">
                  {e.gegenkonto}: {e.betrag}{j < k.eintraegeLinks.length - 1 ? ', ' : ''}
                </span>
              ))}
              {k.eintraegeLinks.length === 0 && <span className="text-slate-400">–</span>}
            </div>
            <div>
              <span className="text-xs text-slate-400 dark:text-slate-500">Rechts: </span>
              {k.eintraegeRechts.map((e, j) => (
                <span key={j} className="text-slate-700 dark:text-slate-200">
                  {e.gegenkonto}: {e.betrag}{j < k.eintraegeRechts.length - 1 ? ', ' : ''}
                </span>
              ))}
              {k.eintraegeRechts.length === 0 && <span className="text-slate-400">–</span>}
            </div>
          </div>
          {k.saldo && (
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Saldo: {k.saldo.betragLinks ? `Links ${k.saldo.betragLinks}` : ''}{k.saldo.betragRechts ? `Rechts ${k.saldo.betragRechts}` : ''}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
