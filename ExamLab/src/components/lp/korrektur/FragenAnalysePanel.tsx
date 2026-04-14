import { useState } from 'react'
import type { FragenStatistik } from '../../../utils/korrekturUtils.ts'

type AnalyseSortierung = 'frageId' | 'loesungsquote' | 'durchschnitt' | 'trennschaerfe'

interface Props {
  fragenStats: FragenStatistik[]
  offen: boolean
  toggleOffen: () => void
}

export default function FragenAnalysePanel({ fragenStats, offen, toggleOffen }: Props) {
  const [sortierung, setSortierung] = useState<AnalyseSortierung>('frageId')
  const [asc, setAsc] = useState(true)

  function handleSortierung(spalte: AnalyseSortierung): void {
    if (sortierung === spalte) {
      setAsc((prev) => !prev)
    } else {
      setSortierung(spalte)
      setAsc(spalte === 'frageId')
    }
  }

  const sortiert = [...fragenStats].sort((a, b) => {
    let cmp = 0
    switch (sortierung) {
      case 'frageId': cmp = a.frageId.localeCompare(b.frageId); break
      case 'loesungsquote': cmp = a.loesungsquote - b.loesungsquote; break
      case 'durchschnitt': cmp = a.durchschnittPunkte - b.durchschnittPunkte; break
      case 'trennschaerfe': cmp = (a.trennschaerfe ?? -2) - (b.trennschaerfe ?? -2); break
    }
    return asc ? cmp : -cmp
  })

  const pfeil = (spalte: AnalyseSortierung) => sortierung === spalte ? (asc ? '↑' : '↓') : ''

  return (
    <div className="mb-6">
      <button
        onClick={toggleOffen}
        className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2 mb-3 cursor-pointer hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
      >
        <span className={`inline-block transition-transform ${offen ? 'rotate-90' : ''}`}>&#9654;</span>
        Fragen-Analyse
      </button>
      {offen && (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-left">
                <th
                  className="px-4 py-2 text-slate-500 dark:text-slate-400 font-medium cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 select-none"
                  onClick={() => handleSortierung('frageId')}
                >
                  Frage-ID {pfeil('frageId')}
                </th>
                <th className="px-4 py-2 text-slate-500 dark:text-slate-400 font-medium">Typ</th>
                <th
                  className="px-4 py-2 text-slate-500 dark:text-slate-400 font-medium cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 select-none text-right"
                  onClick={() => handleSortierung('durchschnitt')}
                >
                  Punkte {pfeil('durchschnitt')}
                </th>
                <th
                  className="px-4 py-2 text-slate-500 dark:text-slate-400 font-medium cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 select-none"
                  onClick={() => handleSortierung('loesungsquote')}
                >
                  Lösungsquote {pfeil('loesungsquote')}
                </th>
                <th
                  className="px-4 py-2 text-slate-500 dark:text-slate-400 font-medium cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 select-none text-right"
                  onClick={() => handleSortierung('trennschaerfe')}
                >
                  Trennschärfe {pfeil('trennschaerfe')}
                </th>
              </tr>
            </thead>
            <tbody>
              {sortiert.map((stat) => {
                const farbe = stat.loesungsquote > 70
                  ? 'text-green-700 dark:text-green-400'
                  : stat.loesungsquote >= 40
                    ? 'text-amber-700 dark:text-amber-400'
                    : 'text-red-700 dark:text-red-400'
                const barFarbe = stat.loesungsquote > 70
                  ? 'bg-green-500 dark:bg-green-400'
                  : stat.loesungsquote >= 40
                    ? 'bg-amber-500 dark:bg-amber-400'
                    : 'bg-red-500 dark:bg-red-400'
                return (
                  <tr key={stat.frageId} className="border-b border-slate-100 dark:border-slate-700/50 last:border-0">
                    <td className="px-4 py-2 font-mono text-slate-800 dark:text-slate-200">{stat.frageId}</td>
                    <td className="px-4 py-2 text-slate-500 dark:text-slate-400 capitalize">{stat.fragenTyp}</td>
                    <td className="px-4 py-2 text-right text-slate-800 dark:text-slate-200 tabular-nums">
                      {stat.durchschnittPunkte} / {stat.maxPunkte}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${barFarbe}`}
                            style={{ width: `${Math.min(stat.loesungsquote, 100)}%` }}
                          />
                        </div>
                        <span className={`text-xs font-medium tabular-nums w-12 text-right ${farbe}`}>
                          {stat.loesungsquote}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-right">
                      {stat.trennschaerfe !== null ? (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          stat.trennschaerfe >= 0.4 ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                          stat.trennschaerfe >= 0.3 ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' :
                          stat.trennschaerfe >= 0.2 ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' :
                          'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                        }`} title={`Trennschärfe: ${stat.trennschaerfeLabel}`}>
                          {stat.trennschaerfe.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 dark:text-slate-500">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
