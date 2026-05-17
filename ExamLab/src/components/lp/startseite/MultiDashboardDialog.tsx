import { X } from 'lucide-react'
import type { PruefungsConfig } from '../../../types/pruefung'
import { TYPO } from '../../../styles/typografie'

export interface MultiDashboardDialogProps {
  summativeConfigs: PruefungsConfig[]
  auswahl: Set<string>
  setAuswahl: (s: Set<string>) => void
  onSchliessen: () => void
}

/**
 * Multi-Dashboard-Auswahl-Dialog. Vorher inline in LPStartseite.tsx Z. 778-818.
 */
export function MultiDashboardDialog({ summativeConfigs, auswahl, setAuswahl, onSchliessen }: MultiDashboardDialogProps) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-lg space-y-3">
      <div className="flex items-center justify-between">
        <h2 className={`${TYPO.h2} text-slate-800 dark:text-slate-100`}>Prüfungen für Multi-Dashboard wählen</h2>
        <button onClick={onSchliessen} className="text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100 inline-flex items-center" aria-label="Schliessen"><X className="w-4 h-4" aria-hidden="true" /></button>
      </div>
      <div className="space-y-1 max-h-60 overflow-y-auto">
        {summativeConfigs.map(c => (
          <label key={c.id} className="flex items-center gap-2.5 py-1.5 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer text-sm">
            <input
              type="checkbox"
              checked={auswahl.has(c.id)}
              onChange={() => {
                const neu = new Set(auswahl)
                if (neu.has(c.id)) neu.delete(c.id)
                else neu.add(c.id)
                setAuswahl(neu)
              }}
              className="rounded border-slate-300 dark:border-slate-600"
            />
            <span className="dark:text-slate-200">{c.titel}</span>
            <span className="text-xs text-slate-400 ml-auto">{c.klasse}</span>
          </label>
        ))}
      </div>
      <div className="flex justify-end gap-2">
        <button onClick={onSchliessen} className="text-xs px-3 py-1.5 text-slate-500 hover:text-slate-700 dark:text-slate-400">Abbrechen</button>
        <button
          disabled={auswahl.size < 2}
          onClick={() => {
            const ids = [...auswahl].join(',')
            window.open(`${import.meta.env.BASE_URL}pruefung/monitoring?ids=${ids}`, '_blank')
            onSchliessen()
          }}
          className="text-xs px-3 py-1.5 rounded-lg font-medium text-white bg-slate-800 dark:bg-slate-200 dark:text-slate-800 disabled:opacity-40 hover:bg-slate-900 dark:hover:bg-slate-100 transition-colors"
        >
          Dashboard öffnen ({auswahl.size} Prüfungen)
        </button>
      </div>
    </div>
  )
}
