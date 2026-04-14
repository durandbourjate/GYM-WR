import type { FehlenderSchueler } from '../../../types/tracker.ts'
import { formatDatum } from '../../../utils/zeit.ts'

interface Props {
  fehlende: (FehlenderSchueler & { pruefungId: string; pruefungTitel: string; datum: string })[]
  onNachpruefungPlanen?: (pruefungId: string, klasse: string, gefaess: string) => void
}

/**
 * Zeigt SuS die bei Prüfungen gefehlt haben, gruppiert nach Prüfung.
 */
export default function FehlendeSuSPanel({ fehlende, onNachpruefungPlanen }: Props) {
  if (fehlende.length === 0) {
    return (
      <div className="px-4 py-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-sm text-green-700 dark:text-green-300">
        &#10003; Alle SuS haben teilgenommen
      </div>
    )
  }

  // Gruppiere nach Prüfung
  const gruppen = new Map<string, {
    pruefungId: string
    pruefungTitel: string
    datum: string
    schueler: (FehlenderSchueler & { pruefungId: string })[]
  }>()

  for (const f of fehlende) {
    const key = f.pruefungId
    if (!gruppen.has(key)) {
      gruppen.set(key, {
        pruefungId: f.pruefungId,
        pruefungTitel: f.pruefungTitel,
        datum: f.datum,
        schueler: [],
      })
    }
    gruppen.get(key)!.schueler.push(f)
  }

  return (
    <div className="space-y-4">
      {Array.from(gruppen.values()).map((gruppe) => (
        <div key={gruppe.pruefungId}>
          {/* Header pro Prüfung */}
          <h4 className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
            {gruppe.pruefungTitel}
            <span className="text-slate-400 dark:text-slate-500 font-normal ml-2">
              {formatDatum(gruppe.datum)}
            </span>
          </h4>

          {/* Liste der fehlenden SuS */}
          <div className="space-y-1.5">
            {gruppe.schueler.map((sus) => (
              <div
                key={`${gruppe.pruefungId}-${sus.email}`}
                className="flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-800 dark:text-slate-100">{sus.name}</span>
                  <span className="text-xs text-slate-400 dark:text-slate-500">{sus.klasse}</span>
                </div>
                {onNachpruefungPlanen && (
                  <button
                    onClick={() => onNachpruefungPlanen(gruppe.pruefungId, sus.klasse, '')}
                    className="px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-600 border border-slate-200 dark:border-slate-500 rounded hover:bg-slate-100 dark:hover:bg-slate-500 transition-colors cursor-pointer"
                  >
                    Nachprüfung
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Zusammenfassung */}
      <p className="text-xs text-slate-400 dark:text-slate-500 pt-1">
        {fehlende.length} {fehlende.length === 1 ? 'Schüler/in' : 'Schüler/innen'} bei {gruppen.size} {gruppen.size === 1 ? 'Prüfung' : 'Prüfungen'} abwesend
      </p>
    </div>
  )
}
