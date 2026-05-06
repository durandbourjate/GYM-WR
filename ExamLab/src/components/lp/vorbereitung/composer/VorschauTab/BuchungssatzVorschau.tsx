import type { BuchungssatzFrage } from '../../../../../types/fragen-storage'

export default function BuchungssatzVorschau({ frage }: { frage: BuchungssatzFrage }) {
  return (
    <div className="space-y-3">
      {/* Geschäftsfall */}
      <div className="text-sm text-slate-700 dark:text-slate-200 mb-3 leading-relaxed whitespace-pre-wrap">
        {frage.geschaeftsfall}
      </div>
      {/* Buchungstabelle (leer für SuS) */}
      <div className="border border-slate-200 dark:border-slate-600 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-700/50 text-xs text-slate-500 dark:text-slate-400">
              <th className="px-3 py-2 text-left font-medium">Soll</th>
              <th className="px-3 py-2 text-right font-medium">Betrag</th>
              <th className="px-3 py-2 text-left font-medium">Haben</th>
              <th className="px-3 py-2 text-right font-medium">Betrag</th>
            </tr>
          </thead>
          <tbody>
            {frage.buchungen.map((b) => (
              <tr key={b.id} className="border-t border-slate-100 dark:border-slate-700">
                <td className="px-3 py-2 text-slate-400 dark:text-slate-500">---</td>
                <td className="px-3 py-2 text-right text-slate-400 dark:text-slate-500">---</td>
                <td className="px-3 py-2 text-slate-400 dark:text-slate-500">---</td>
                <td className="px-3 py-2 text-right text-slate-400 dark:text-slate-500">---</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
