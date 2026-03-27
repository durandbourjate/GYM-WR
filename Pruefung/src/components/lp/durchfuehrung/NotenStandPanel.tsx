import type { NotenStandKurs } from '../../../types/tracker.ts'

interface Props {
  notenStand: NotenStandKurs[]
}

/** Farbklassen für Status-Punkt und Fortschrittsbalken */
function statusPunktKlasse(status: NotenStandKurs['status']): string {
  switch (status) {
    case 'ok': return 'bg-green-500'
    case 'warning': return 'bg-amber-500'
    case 'critical': return 'bg-red-500'
  }
}

function fortschrittFarbe(status: NotenStandKurs['status']): string {
  switch (status) {
    case 'ok': return 'bg-green-500'
    case 'warning': return 'bg-amber-400'
    case 'critical': return 'bg-red-500'
  }
}

/**
 * Zeigt den Noten-Stand pro Kurs gegenüber MiSDV-Vorgaben.
 */
export default function NotenStandPanel({ notenStand }: Props) {
  if (notenStand.length === 0) {
    return (
      <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-4">
        Keine Noten-Daten vorhanden. Summative Prüfungen werden nach der Korrektur hier angezeigt.
      </p>
    )
  }

  return (
    <div>
      {/* Tabelle */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide border-b border-slate-200 dark:border-slate-700">
              <th className="pb-2 pr-4">Kurs</th>
              <th className="pb-2 pr-4">Semester</th>
              <th className="pb-2 pr-4 text-right">Vorhanden</th>
              <th className="pb-2 pr-4 text-right">Nötig</th>
              <th className="pb-2 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {notenStand.map((n) => {
              const prozent = Math.min(100, Math.round((n.vorhandeneNoten / n.erforderlicheNoten) * 100))
              return (
                <tr key={`${n.kurs}-${n.semester}`} className="border-b border-slate-100 dark:border-slate-700/50 last:border-0">
                  <td className="py-3 pr-4">
                    <span className="font-medium text-slate-800 dark:text-slate-100">{n.kurs}</span>
                    <span className="text-xs text-slate-400 dark:text-slate-500 ml-1.5">{n.gefaess}</span>
                  </td>
                  <td className="py-3 pr-4 text-slate-600 dark:text-slate-300">{n.semester}</td>
                  <td className="py-3 pr-4 text-right font-medium text-slate-800 dark:text-slate-100">
                    {n.vorhandeneNoten}
                  </td>
                  <td className="py-3 pr-4 text-right text-slate-500 dark:text-slate-400">
                    {n.erforderlicheNoten}
                  </td>
                  <td className="py-3">
                    <div className="flex flex-col items-center gap-1.5">
                      {/* Status-Punkt */}
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${statusPunktKlasse(n.status)}`}
                        title={n.status === 'ok' ? 'Ausreichend' : n.status === 'warning' ? 'Knapp' : 'Zu wenig Noten'}
                      />
                      {/* Fortschrittsbalken */}
                      <div className="w-16 h-1 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${fortschrittFarbe(n.status)}`}
                          style={{ width: `${prozent}%` }}
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <p className="text-xs text-slate-400 dark:text-slate-500 mt-3 pt-2 border-t border-slate-100 dark:border-slate-700/50">
        Gemäss MiSDV Art. 4
      </p>
    </div>
  )
}
