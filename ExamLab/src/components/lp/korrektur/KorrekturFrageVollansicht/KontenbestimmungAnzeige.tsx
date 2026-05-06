import type { KontenbestimmungFrage } from '../../../../types/fragen-storage'
import type { Antwort } from '../../../../types/antworten'
import { KeineAntwort } from './util'

/** Kontenbestimmung-Antwort */
export default function KontenbestimmungAnzeige({ frage, antwort }: { frage: KontenbestimmungFrage; antwort: Extract<Antwort, { typ: 'kontenbestimmung' }> | undefined }) {
  if (!antwort) return <KeineAntwort />
  return (
    <div className="rounded bg-slate-50 dark:bg-slate-700/50 px-3 py-2 mt-2 space-y-1">
      {frage.aufgaben.map((aufgabe) => {
        const antwortAufgabe = antwort.aufgaben[aufgabe.id]
        return (
          <div key={aufgabe.id} className="text-sm">
            <span className="text-slate-500 dark:text-slate-400">{aufgabe.text}: </span>
            <span className="text-slate-700 dark:text-slate-200">
              {antwortAufgabe?.antworten.map(a => [a.kontonummer, a.kategorie, a.seite].filter(Boolean).join(' / ')).join(', ') || '–'}
            </span>
          </div>
        )
      })}
    </div>
  )
}
