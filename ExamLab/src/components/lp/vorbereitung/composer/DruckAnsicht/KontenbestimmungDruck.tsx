import type { KontenbestimmungFrage } from '../../../../../types/fragen-storage'

export default function KontenbestimmungDruck({ frage }: { frage: KontenbestimmungFrage }) {
  return (
    <table className="w-full text-sm border-collapse border border-slate-300 print:border-slate-400">
      <thead>
        <tr className="bg-slate-50 print:bg-white">
          <th className="border border-slate-300 print:border-slate-400 px-2 py-1 text-left font-medium">#</th>
          <th className="border border-slate-300 print:border-slate-400 px-2 py-1 text-left font-medium">Aufgabe</th>
          {frage.modus !== 'kategorie_bestimmen' && (
            <th className="border border-slate-300 print:border-slate-400 px-2 py-1 text-left font-medium">Konto</th>
          )}
          {frage.modus !== 'konto_bestimmen' && (
            <th className="border border-slate-300 print:border-slate-400 px-2 py-1 text-left font-medium">Kategorie</th>
          )}
          <th className="border border-slate-300 print:border-slate-400 px-2 py-1 text-center font-medium">S/H</th>
        </tr>
      </thead>
      <tbody>
        {(frage.aufgaben ?? []).map((aufgabe, i) => (
          <tr key={aufgabe.id}>
            <td className="border border-slate-300 print:border-slate-400 px-2 py-2 text-slate-600 print:text-black w-8">{i + 1}</td>
            <td className="border border-slate-300 print:border-slate-400 px-2 py-2 text-slate-700 print:text-black">{aufgabe.text}</td>
            {frage.modus !== 'kategorie_bestimmen' && (
              <td className="border border-slate-300 print:border-slate-400 px-2 py-2 w-32">&nbsp;</td>
            )}
            {frage.modus !== 'konto_bestimmen' && (
              <td className="border border-slate-300 print:border-slate-400 px-2 py-2 w-28">&nbsp;</td>
            )}
            <td className="border border-slate-300 print:border-slate-400 px-2 py-2 w-12">&nbsp;</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
