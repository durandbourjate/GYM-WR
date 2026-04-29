import { useState } from 'react'
import type { Frage } from '../../../types/fragen-storage'

interface Props {
  frage: Frage
  onUebernehmen: () => void
  onIgnorieren: () => void
}

export default function PoolUpdateVergleich({ frage, onUebernehmen, onIgnorieren }: Props) {
  const [offen, setOffen] = useState(false)
  const pv = frage.poolVersion

  if (!pv) return null

  return (
    <div className="mt-2 border-t border-slate-200 dark:border-slate-600 pt-2">
      <button
        onClick={() => setOffen(!offen)}
        className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
      >
        <span className="animate-pulse">●</span>
        Pool-Update verfügbar — {offen ? 'zuklappen' : 'vergleichen'}
      </button>

      {offen && (
        <div className="mt-2 space-y-2">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="font-medium text-slate-500 dark:text-slate-400 mb-1">Aktuelle Version</div>
              <div className="p-2 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 whitespace-pre-wrap">
                {'fragetext' in frage ? (frage as { fragetext: string }).fragetext : ''}
              </div>
            </div>
            <div>
              <div className="font-medium text-slate-500 dark:text-slate-400 mb-1">Pool-Version</div>
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800 whitespace-pre-wrap">
                {pv.fragetext}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={onUebernehmen}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
              Übernehmen
            </button>
            <button onClick={onIgnorieren}
              className="px-3 py-1 text-sm border border-slate-300 rounded hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700">
              Ignorieren
            </button>
            <button onClick={() => setOffen(false)}
              className="px-3 py-1 text-sm border border-slate-300 rounded hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              Manuell anpassen
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
