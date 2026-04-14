import { useMemo } from 'react'
import type { Lernziel } from '../../types/pool'
import type { FragenFortschritt } from '../../types/ueben/fortschritt'
import { lernzielStatus } from '../../utils/ueben/mastery'

interface LernzielAnzeigeProps {
  lernziele: Lernziel[]
  fortschritte: Record<string, FragenFortschritt>
  fach?: string
  thema?: string
}

const STATUS_CONFIG: Record<string, { label: string; farbe: string; bg: string }> = {
  offen: { label: 'Offen', farbe: 'text-slate-400', bg: 'bg-slate-100 dark:bg-slate-700' },
  inArbeit: { label: 'In Arbeit', farbe: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
  gefestigt: { label: 'Gefestigt', farbe: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  gemeistert: { label: 'Gemeistert', farbe: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20' },
}

/**
 * Zeigt Lernziele zu einem Thema/Fach an, mit aktuellem Mastery-Status.
 * Wird in der Thema-Detailansicht und in der SuS-Analyse verwendet.
 */
export default function LernzielAnzeige({ lernziele, fortschritte, fach, thema }: LernzielAnzeigeProps) {
  // Lernziele filtern (nach Fach/Thema wenn angegeben)
  const relevante = useMemo(() => {
    return lernziele.filter(lz => {
      if (!lz.aktiv) return false
      if (fach && lz.fach !== fach) return false
      if (thema && lz.thema !== thema) return false
      return true
    })
  }, [lernziele, fach, thema])

  if (relevante.length === 0) return null

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">
        Lernziele ({relevante.length})
      </h4>
      <div className="space-y-2">
        {relevante.map(lz => {
          const status = lernzielStatus(
            { ...lz, fragenIds: lz.id ? [lz.id] : [] },
            fortschritte
          )
          const config = STATUS_CONFIG[status] || STATUS_CONFIG.offen
          return (
            <div
              key={lz.id}
              className={`flex items-start gap-3 p-3 rounded-lg ${config.bg}`}
            >
              <StatusIcon status={status} />
              <div className="flex-1 min-w-0">
                <p className="text-sm dark:text-white">{lz.text}</p>
                {lz.bloom && (
                  <span className="text-[10px] text-slate-400 mt-0.5 inline-block">
                    {lz.bloom}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-medium shrink-0 ${config.farbe}`}>
                {config.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'gemeistert': return <span className="text-green-500 mt-0.5">✓</span>
    case 'gefestigt': return <span className="text-blue-400 mt-0.5">◉</span>
    case 'inArbeit': return <span className="text-yellow-400 mt-0.5">◎</span>
    default: return <span className="text-slate-300 mt-0.5">○</span>
  }
}
