import type { Antwort } from '../../../../types/antworten'
import { KeineAntwort } from './util'

/** Zeichnung/Visualisierung-Antwort (PNG-Export) */
export default function VisualisierungAnzeige({ antwort }: { antwort: Extract<Antwort, { typ: 'visualisierung' }> | undefined }) {
  if (!antwort) return <KeineAntwort />
  if (antwort.bildLink) {
    return (
      <div className="rounded bg-slate-50 dark:bg-slate-700/50 px-3 py-2 mt-2">
        <img src={antwort.bildLink} alt="SuS-Zeichnung" className="max-w-full border border-slate-200 dark:border-slate-600 rounded" />
      </div>
    )
  }
  return (
    <div className="rounded bg-slate-50 dark:bg-slate-700/50 px-3 py-2 mt-2">
      <span className="text-sm italic text-slate-400">[Zeichnungsdaten vorhanden, kein Bild-Export]</span>
    </div>
  )
}
