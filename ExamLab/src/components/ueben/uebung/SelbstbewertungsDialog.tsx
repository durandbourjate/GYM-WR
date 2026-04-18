import type { Selbstbewertung } from '../../../types/antworten'
import FrageText from '../../shared/FrageText'

interface Props {
  musterloesung: string
  onWahl: (bewertung: Selbstbewertung) => void
}

/**
 * Wird im Üben-Modus für Fragetypen ohne Auto-Korrektur (Freitext, Zeichnen,
 * PDF-Annotation, Audio, Code) gezeigt, nachdem SuS auf "Antwort prüfen" klickt.
 *
 * Pool-Pattern: Musterlösung sichtbar, SuS bewertet eigene Antwort selbst.
 */
export default function SelbstbewertungsDialog({ musterloesung, onWahl }: Props) {
  return (
    <div className="rounded-xl border-2 border-violet-300 dark:border-violet-700 bg-violet-50 dark:bg-violet-900/20 p-4 my-4">
      <div className="text-sm font-semibold text-violet-900 dark:text-violet-200 mb-2">
        Musterlösung
      </div>
      <FrageText text={musterloesung} className="text-sm leading-relaxed text-slate-800 dark:text-slate-100 mb-4" />

      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
        Wie hast du geantwortet?
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onWahl('korrekt')}
          className="min-h-[44px] px-4 py-2.5 rounded-xl text-sm font-medium bg-green-600 text-white hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600"
        >
          &#10003; Richtig
        </button>
        <button
          onClick={() => onWahl('teilweise')}
          className="min-h-[44px] px-4 py-2.5 rounded-xl text-sm font-medium bg-amber-500 text-white hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-500"
        >
          &#9899; Teilweise
        </button>
        <button
          onClick={() => onWahl('falsch')}
          className="min-h-[44px] px-4 py-2.5 rounded-xl text-sm font-medium bg-red-600 text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600"
        >
          &#10007; Falsch
        </button>
      </div>
    </div>
  )
}
