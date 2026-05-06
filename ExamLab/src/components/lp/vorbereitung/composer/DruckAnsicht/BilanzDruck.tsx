import type { BilanzERFrage } from '../../../../../types/fragen-storage'
import { kontoLabel } from '../../../../../utils/kontenrahmen.ts'

export default function BilanzDruck({ frage }: { frage: BilanzERFrage }) {
  return (
    <div className="space-y-3">
      {/* Konten als Referenz */}
      {frage.kontenMitSaldi.length > 0 && (
        <div>
          <p className="text-xs font-medium text-slate-600 print:text-black mb-1">Konten:</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-slate-700 print:text-black">
            {frage.kontenMitSaldi.map((k) => (
              <span key={k.kontonummer}>
                {kontoLabel(k.kontonummer)}: {k.saldo.toLocaleString('de-CH')}
              </span>
            ))}
          </div>
        </div>
      )}
      {/* Leere Bilanz-Struktur */}
      {(frage.modus === 'bilanz' || frage.modus === 'beides') && (
        <div>
          <p className="text-xs font-medium text-slate-600 print:text-black mb-1">Bilanz:</p>
          <div className="grid grid-cols-2 gap-0 border border-slate-300 print:border-slate-400">
            <div className="border-r border-slate-300 print:border-slate-400">
              <div className="text-center text-xs font-bold py-1 border-b border-slate-300 print:border-slate-400 bg-slate-50 print:bg-white">Aktiven</div>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-6 border-b border-slate-200 print:border-slate-300 last:border-b-0" />
              ))}
            </div>
            <div>
              <div className="text-center text-xs font-bold py-1 border-b border-slate-300 print:border-slate-400 bg-slate-50 print:bg-white">Passiven</div>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-6 border-b border-slate-200 print:border-slate-300 last:border-b-0" />
              ))}
            </div>
          </div>
        </div>
      )}
      {/* Leere ER-Struktur */}
      {(frage.modus === 'erfolgsrechnung' || frage.modus === 'beides') && (
        <div>
          <p className="text-xs font-medium text-slate-600 print:text-black mb-1">Erfolgsrechnung:</p>
          <div className="grid grid-cols-2 gap-0 border border-slate-300 print:border-slate-400">
            <div className="border-r border-slate-300 print:border-slate-400">
              <div className="text-center text-xs font-bold py-1 border-b border-slate-300 print:border-slate-400 bg-slate-50 print:bg-white">Aufwand</div>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-6 border-b border-slate-200 print:border-slate-300 last:border-b-0" />
              ))}
            </div>
            <div>
              <div className="text-center text-xs font-bold py-1 border-b border-slate-300 print:border-slate-400 bg-slate-50 print:bg-white">Ertrag</div>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-6 border-b border-slate-200 print:border-slate-300 last:border-b-0" />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
