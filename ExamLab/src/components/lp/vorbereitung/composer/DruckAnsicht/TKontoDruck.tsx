import type { TKontoFrage } from '../../../../../types/fragen-storage'
import { kontoLabel } from '../../../../../utils/kontenrahmen.ts'

export default function TKontoDruck({ frage }: { frage: TKontoFrage }) {
  return (
    <div className="space-y-3">
      {frage.geschaeftsfaelle && frage.geschaeftsfaelle.length > 0 && (
        <div className="text-sm text-slate-700 print:text-black">
          <p className="font-medium mb-1">Geschäftsfälle:</p>
          <ol className="list-decimal list-inside space-y-0.5">
            {frage.geschaeftsfaelle.map((gf, i) => (
              <li key={i}>{gf}</li>
            ))}
          </ol>
        </div>
      )}
      {/* T-Konto-Vorlagen */}
      <div className="grid grid-cols-2 gap-3 print:gap-2">
        {frage.konten.map((konto) => (
          <div key={konto.id} className="border border-slate-300 print:border-slate-400">
            {/* Konto-Header */}
            <div className="text-center text-xs font-bold border-b-2 border-slate-400 print:border-black py-1 bg-slate-50 print:bg-white text-slate-700 print:text-black">
              {kontoLabel(konto.kontonummer)}
            </div>
            {/* Soll / Haben */}
            <div className="grid grid-cols-2 divide-x divide-slate-300 print:divide-slate-400">
              <div className="text-center text-[10px] font-medium text-slate-500 print:text-slate-700 py-0.5 border-b border-slate-200 print:border-slate-300">Soll</div>
              <div className="text-center text-[10px] font-medium text-slate-500 print:text-slate-700 py-0.5 border-b border-slate-200 print:border-slate-300">Haben</div>
            </div>
            {/* Leere Zeilen */}
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="grid grid-cols-2 divide-x divide-slate-200 print:divide-slate-300 h-6 border-b border-slate-200 print:border-slate-300 last:border-b-0" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
