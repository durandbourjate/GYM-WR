import type { ZuordnungFrage } from '../../../../../types/fragen-storage'

export default function ZuordnungVorschau({ frage }: { frage: ZuordnungFrage }) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-3">
        <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide px-1">
          Begriff
        </div>
        <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide px-1">
          Zuordnung
        </div>
      </div>
      {frage.paare.map((p, i) => (
        <div key={i} className="grid grid-cols-2 gap-3">
          <div className="px-3 py-2 bg-slate-50 dark:bg-slate-700/30 rounded-lg text-sm text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600">
            {p.links}
          </div>
          <select
            disabled
            className="px-3 py-2 bg-slate-50 dark:bg-slate-700/30 rounded-lg text-sm text-slate-400 dark:text-slate-500 border border-dashed border-slate-300 dark:border-slate-500 appearance-none"
          >
            <option>Zuordnung waehlen...</option>
          </select>
        </div>
      ))}
    </div>
  )
}
