import type { BerechnungFrage } from '../../../../../types/fragen-storage'

export default function BerechnungDruck({ frage }: { frage: BerechnungFrage }) {
  return (
    <div className="space-y-3">
      {frage.rechenwegErforderlich && (
        <div>
          <p className="text-xs font-medium text-slate-600 print:text-black mb-1">Rechenweg:</p>
          <div className="space-y-0">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="druck-linie" />
            ))}
          </div>
        </div>
      )}
      {frage.ergebnisse.map((erg) => (
        <div key={erg.id} className="flex items-baseline gap-2 text-sm">
          <span className="font-medium text-slate-700 print:text-black">{erg.label}:</span>
          <span className="flex-1 border-b border-dotted border-slate-400 print:border-black">&nbsp;</span>
          {erg.einheit && <span className="text-slate-500 print:text-slate-700">{erg.einheit}</span>}
        </div>
      ))}
    </div>
  )
}
