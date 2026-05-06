import type { BuchungssatzFrage } from '../../../../../types/fragen-storage'

export default function BuchungssatzDruck({ frage }: { frage: BuchungssatzFrage }) {
  const anzahlZeilen = Math.max(frage.buchungen.length, 3)
  return (
    <div className="space-y-2">
      <p className="text-sm text-slate-700 print:text-black italic">{frage.geschaeftsfall}</p>
      <table className="w-full text-sm border-collapse border border-slate-300 print:border-slate-400">
        <thead>
          <tr className="bg-slate-50 print:bg-white">
            <th className="border border-slate-300 print:border-slate-400 px-2 py-1 text-left font-medium">Soll</th>
            <th className="border border-slate-300 print:border-slate-400 px-2 py-1 text-right font-medium">Betrag</th>
            <th className="border border-slate-300 print:border-slate-400 px-2 py-1 text-left font-medium">Haben</th>
            <th className="border border-slate-300 print:border-slate-400 px-2 py-1 text-right font-medium">Betrag</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: anzahlZeilen }).map((_, i) => (
            <tr key={i}>
              <td className="border border-slate-300 print:border-slate-400 px-2 py-2 h-8">&nbsp;</td>
              <td className="border border-slate-300 print:border-slate-400 px-2 py-2 h-8">&nbsp;</td>
              <td className="border border-slate-300 print:border-slate-400 px-2 py-2 h-8">&nbsp;</td>
              <td className="border border-slate-300 print:border-slate-400 px-2 py-2 h-8">&nbsp;</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
