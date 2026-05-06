import type { SortierungFrage } from '../../../../../types/fragen-storage'

export default function SortierungDruck({ frage }: { frage: SortierungFrage }) {
  // Elemente in zufälliger Reihenfolge zeigen (für Druck: einfach alphabetisch)
  const gemischt = [...frage.elemente].sort(() => 0.5 - Math.random())
  return (
    <div className="space-y-2">
      <p className="text-xs text-slate-500 print:text-slate-600">Bringen Sie die folgenden Elemente in die richtige Reihenfolge:</p>
      <div className="flex flex-wrap gap-2">
        {gemischt.map((el, i) => (
          <span key={i} className="px-2 py-1 text-sm border border-slate-300 print:border-slate-400 rounded bg-slate-50 print:bg-white text-slate-700 print:text-black">
            {el}
          </span>
        ))}
      </div>
      <div className="space-y-0 mt-2">
        {frage.elemente.map((_, i) => (
          <div key={i} className="flex items-baseline gap-2 text-sm">
            <span className="text-slate-500 print:text-black w-6">{i + 1}.</span>
            <span className="flex-1 border-b border-dotted border-slate-400 print:border-black">&nbsp;</span>
          </div>
        ))}
      </div>
    </div>
  )
}
