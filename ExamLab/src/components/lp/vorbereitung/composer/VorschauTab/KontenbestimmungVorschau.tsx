import type { KontenbestimmungFrage } from '../../../../../types/fragen-storage'

export default function KontenbestimmungVorschau({ frage }: { frage: KontenbestimmungFrage }) {
  const zeigeKonto = frage.modus === 'konto_bestimmen' || frage.modus === 'gemischt'
  const zeigeKategorie = frage.modus === 'kategorie_bestimmen' || frage.modus === 'gemischt'
  const zeigeSeite = frage.modus === 'kategorie_bestimmen' || frage.modus === 'gemischt'

  return (
    <div className="space-y-3">
      <div className="border border-slate-200 dark:border-slate-600 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-700/50 text-xs text-slate-500 dark:text-slate-400">
              <th className="px-3 py-2 text-left font-medium w-8">#</th>
              <th className="px-3 py-2 text-left font-medium">Geschaeftsfall</th>
              {zeigeKonto && <th className="px-3 py-2 text-left font-medium">Konto</th>}
              {zeigeKategorie && <th className="px-3 py-2 text-left font-medium">Kategorie</th>}
              {zeigeSeite && <th className="px-3 py-2 text-left font-medium">Buchungsseite</th>}
            </tr>
          </thead>
          <tbody>
            {frage.aufgaben.map((aufgabe, idx) =>
              aufgabe.erwarteteAntworten.map((_, aIdx) => (
                <tr key={`${aufgabe.id}-${aIdx}`} className="border-t border-slate-100 dark:border-slate-700">
                  {aIdx === 0 && (
                    <>
                      <td className="px-3 py-2 text-slate-400 dark:text-slate-500 align-top" rowSpan={aufgabe.erwarteteAntworten.length}>
                        {idx + 1}
                      </td>
                      <td className="px-3 py-2 text-slate-700 dark:text-slate-200 align-top" rowSpan={aufgabe.erwarteteAntworten.length}>
                        {aufgabe.text}
                      </td>
                    </>
                  )}
                  {zeigeKonto && <td className="px-3 py-2 text-slate-400 dark:text-slate-500">---</td>}
                  {zeigeKategorie && <td className="px-3 py-2 text-slate-400 dark:text-slate-500">---</td>}
                  {zeigeSeite && <td className="px-3 py-2 text-slate-400 dark:text-slate-500">---</td>}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
