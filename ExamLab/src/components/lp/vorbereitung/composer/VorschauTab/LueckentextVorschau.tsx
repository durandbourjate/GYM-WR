import type { LueckentextFrage } from '../../../../../types/fragen-storage'

export default function LueckentextVorschau({ frage }: { frage: LueckentextFrage }) {
  const teile = frage.textMitLuecken.split(/(\{\{\d+\}\})/)
  return (
    <div className="text-sm text-slate-700 dark:text-slate-200 leading-loose">
      {teile.map((teil, i) => {
        if (/^\{\{\d+\}\}$/.test(teil)) {
          return (
            <input
              key={i}
              disabled
              placeholder="..."
              className="inline-block w-28 mx-1 px-2 py-0.5 border border-slate-300 dark:border-slate-500 rounded bg-slate-50 dark:bg-slate-700/30 text-center text-sm text-slate-400 dark:text-slate-500"
            />
          )
        }
        return <span key={i}>{teil}</span>
      })}
    </div>
  )
}
