import type { AufgabengruppeFrage } from '../../../../../types/fragen-storage'

export default function AufgabengruppeVorschau({ frage }: { frage: AufgabengruppeFrage }) {
  const teilaufgaben = frage.teilaufgaben ?? []
  const teilaufgabenIds = frage.teilaufgabenIds ?? []
  const anzahl = teilaufgaben.length || teilaufgabenIds.length
  return (
    <div className="space-y-2">
      <div className="text-xs text-slate-500 dark:text-slate-400">
        {anzahl} Teilaufgabe{anzahl !== 1 ? 'n' : ''}
      </div>
      <div className="space-y-1">
        {teilaufgaben.length > 0
          ? teilaufgaben.map((ta, i) => (
              <div key={ta.id} className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-700/30 rounded text-sm">
                <span className="font-medium text-slate-600 dark:text-slate-300">
                  {String.fromCharCode(97 + i)})
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">{ta.typ}</span>
                <span className="text-xs text-slate-600 dark:text-slate-300 truncate">{ta.fragetext || '(kein Text)'}</span>
                <span className="text-xs text-slate-400">{ta.punkte} P.</span>
              </div>
            ))
          : teilaufgabenIds.map((id, i) => (
              <div key={id} className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-700/30 rounded text-sm">
                <span className="font-medium text-slate-600 dark:text-slate-300">
                  {String.fromCharCode(97 + i)})
                </span>
                <code className="text-xs font-mono text-slate-500 dark:text-slate-400">{id}</code>
              </div>
            ))
        }
      </div>
    </div>
  )
}
