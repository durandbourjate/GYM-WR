import type { LueckentextFrage } from '../../../../../types/fragen-storage'

export default function LueckentextDruck({ frage }: { frage: LueckentextFrage }) {
  const teile = frage.textMitLuecken.split(/(\{\{\d+\}\})/)
  return (
    <div className="text-sm text-slate-700 print:text-black leading-loose">
      {teile.map((teil, i) => {
        if (/^\{\{\d+\}\}$/.test(teil)) {
          return <span key={i} className="inline-block w-28 mx-1 border-b border-slate-400 print:border-black">&nbsp;</span>
        }
        return <span key={i}>{teil}</span>
      })}
    </div>
  )
}
