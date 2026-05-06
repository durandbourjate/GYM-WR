import type { TKontoFrage } from '../../../../../types/fragen-storage'
import { kontoLabel } from '../../../../../utils/kontenrahmen.ts'

export default function TKontoVorschau({ frage }: { frage: TKontoFrage }) {
  return (
    <div className="space-y-3">
      {/* Geschäftsfälle */}
      {frage.geschaeftsfaelle && frage.geschaeftsfaelle.length > 0 && (
        <ol className="list-decimal list-inside space-y-1 text-sm text-slate-700 dark:text-slate-200">
          {frage.geschaeftsfaelle.map((gf, i) => (
            <li key={i}>{gf}</li>
          ))}
        </ol>
      )}
      {/* Leere T-Konten */}
      {frage.konten.map((konto) => (
        <div key={konto.id} className="border border-slate-200 dark:border-slate-600 rounded-lg overflow-hidden">
          <div className="px-3 py-2 bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-600">
            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{kontoLabel(konto.kontonummer)}</span>
          </div>
          <div className="grid grid-cols-2">
            <div className="px-3 py-2 border-r border-slate-200 dark:border-slate-600 text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
              Soll
            </div>
            <div className="px-3 py-2 text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
              Haben
            </div>
          </div>
          <div className="grid grid-cols-2 border-t border-slate-100 dark:border-slate-700">
            <div className="px-3 py-4 border-r border-slate-200 dark:border-slate-600 text-slate-400 dark:text-slate-500 text-sm">
              ---
            </div>
            <div className="px-3 py-4 text-slate-400 dark:text-slate-500 text-sm">
              ---
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
