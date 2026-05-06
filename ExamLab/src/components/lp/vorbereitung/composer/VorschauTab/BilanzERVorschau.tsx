import type { BilanzERFrage } from '../../../../../types/fragen-storage'
import { kontoLabel } from '../../../../../utils/kontenrahmen.ts'

export default function BilanzERVorschau({ frage }: { frage: BilanzERFrage }) {
  const zeigeBilanz = frage.modus === 'bilanz' || frage.modus === 'beides'
  const zeigeER = frage.modus === 'erfolgsrechnung' || frage.modus === 'beides'

  return (
    <div className="space-y-3">
      {/* Konten-Tabelle */}
      <div className="border border-slate-200 dark:border-slate-600 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-700/50 text-xs text-slate-500 dark:text-slate-400">
              <th className="px-3 py-2 text-left font-medium">Nr.</th>
              <th className="px-3 py-2 text-left font-medium">Konto</th>
              <th className="px-3 py-2 text-right font-medium">Saldo (CHF)</th>
            </tr>
          </thead>
          <tbody>
            {frage.kontenMitSaldi.map((k) => (
              <tr key={k.kontonummer} className="border-t border-slate-100 dark:border-slate-700">
                <td className="px-3 py-1.5 font-mono text-slate-700 dark:text-slate-200">{k.kontonummer}</td>
                <td className="px-3 py-1.5 text-slate-700 dark:text-slate-200">{kontoLabel(k.kontonummer)}</td>
                <td className="px-3 py-1.5 text-right font-mono text-slate-700 dark:text-slate-200">
                  {k.saldo.toLocaleString('de-CH', { minimumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Hinweis */}
      <div className="text-xs text-slate-400 dark:text-slate-500 italic">
        {zeigeBilanz && 'SuS erstellen die Bilanzstruktur (Aktiven/Passiven mit Gruppen).'}
        {zeigeBilanz && zeigeER && ' '}
        {zeigeER && 'SuS erstellen die mehrstufige Erfolgsrechnung.'}
      </div>
    </div>
  )
}
