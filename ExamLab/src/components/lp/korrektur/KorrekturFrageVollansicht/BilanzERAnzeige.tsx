import type { Antwort } from '../../../../types/antworten'
import { KeineAntwort } from './util'

/** Bilanz/ER-Antwort (kompakte Zusammenfassung) */
export default function BilanzERAnzeige({ antwort }: { antwort: Extract<Antwort, { typ: 'bilanzstruktur' }> | undefined }) {
  if (!antwort) return <KeineAntwort />
  return (
    <div className="rounded bg-slate-50 dark:bg-slate-700/50 px-3 py-2 mt-2 space-y-2">
      {antwort.bilanz && (
        <div className="text-sm">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Bilanz:</span>
          <div className="flex gap-4 mt-0.5">
            <div>
              <span className="text-xs text-slate-400 dark:text-slate-500">{antwort.bilanz.linkeSeite.label}: </span>
              <span className="text-slate-700 dark:text-slate-200">
                {antwort.bilanz.linkeSeite.gruppen.flatMap(g => g.konten).length} Konten
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-400 dark:text-slate-500">{antwort.bilanz.rechteSeite.label}: </span>
              <span className="text-slate-700 dark:text-slate-200">
                {antwort.bilanz.rechteSeite.gruppen.flatMap(g => g.konten).length} Konten
              </span>
            </div>
          </div>
        </div>
      )}
      {antwort.erfolgsrechnung && (
        <div className="text-sm">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Erfolgsrechnung:</span>
          <span className="ml-1 text-slate-700 dark:text-slate-200">
            {antwort.erfolgsrechnung.stufen.length} Stufen
            {antwort.erfolgsrechnung.gewinnVerlust != null && ` | Ergebnis: ${antwort.erfolgsrechnung.gewinnVerlust}`}
          </span>
        </div>
      )}
    </div>
  )
}
