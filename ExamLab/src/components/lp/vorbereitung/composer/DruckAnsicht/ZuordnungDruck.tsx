import type { ZuordnungFrage } from '../../../../../types/fragen-storage'

export default function ZuordnungDruck({ frage }: { frage: ZuordnungFrage }) {
  return (
    <table className="w-full text-sm border-collapse">
      <thead>
        <tr className="border-b border-slate-300 print:border-slate-400">
          <th className="text-left py-1 font-medium text-slate-600 print:text-black w-1/2">Begriff</th>
          <th className="text-left py-1 font-medium text-slate-600 print:text-black w-1/2">Zuordnung</th>
        </tr>
      </thead>
      <tbody>
        {frage.paare.map((p, i) => (
          <tr key={i} className="border-b border-slate-200 print:border-slate-300">
            <td className="py-2 text-slate-700 print:text-black">{p.links}</td>
            <td className="py-2"><span className="inline-block w-full border-b border-dotted border-slate-400 print:border-black">&nbsp;</span></td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
