import type { BerechnungFrage } from '../../../../../types/fragen-storage'

export default function BerechnungVorschau({ frage }: { frage: BerechnungFrage }) {
  return (
    <div className="space-y-3">
      {frage.ergebnisse.map((erg) => (
        <div key={erg.id} className="flex items-center gap-2">
          <span className="text-sm text-slate-700 dark:text-slate-200 font-medium">{erg.label}:</span>
          <input
            disabled
            placeholder="..."
            className="w-32 border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700/30 px-3 py-1.5 text-sm text-slate-400 dark:text-slate-500 text-right"
          />
          {erg.einheit && (
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{erg.einheit}</span>
          )}
        </div>
      ))}
      {frage.rechenwegErforderlich && (
        <div>
          <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Rechenweg:</p>
          <textarea
            disabled
            placeholder="Rechenweg hier eingeben..."
            className="w-full border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700/30 px-3 py-2 text-sm text-slate-400 dark:text-slate-500 resize-none"
            rows={4}
          />
        </div>
      )}
    </div>
  )
}
