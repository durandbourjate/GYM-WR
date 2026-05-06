import type { RichtigFalschFrage } from '../../../../../types/fragen-storage'

export default function RichtigFalschDruck({ frage }: { frage: RichtigFalschFrage }) {
  return (
    <table className="w-full text-sm border-collapse">
      <thead>
        <tr className="border-b border-slate-300 print:border-slate-400">
          <th className="text-left py-1 font-medium text-slate-600 print:text-black">Aussage</th>
          <th className="w-12 text-center py-1 font-medium text-slate-600 print:text-black">R</th>
          <th className="w-12 text-center py-1 font-medium text-slate-600 print:text-black">F</th>
        </tr>
      </thead>
      <tbody>
        {frage.aussagen.map((aussage) => (
          <tr key={aussage.id} className="border-b border-slate-200 print:border-slate-300">
            <td className="py-2 text-slate-700 print:text-black">{aussage.text}</td>
            <td className="text-center"><span className="inline-block w-4 h-4 border border-slate-400 print:border-black rounded-sm" /></td>
            <td className="text-center"><span className="inline-block w-4 h-4 border border-slate-400 print:border-black rounded-sm" /></td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
