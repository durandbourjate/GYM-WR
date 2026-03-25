import { usePruefungStore } from '../../store/pruefungStore.ts'
import type { RichtigFalschFrage as RichtigFalschFrageType } from '../../types/fragen.ts'
import { renderMarkdown } from '../../utils/markdown.ts'
import { fachbereichFarbe } from '../../utils/fachbereich.ts'

interface Props {
  frage: RichtigFalschFrageType
}

export default function RichtigFalschFrage({ frage }: Props) {
  const antworten = usePruefungStore((s) => s.antworten)
  const setAntwort = usePruefungStore((s) => s.setAntwort)
  const abgegeben = usePruefungStore((s) => s.abgegeben)

  const aktuelleAntwort = antworten[frage.id]
  const bewertungen: Record<string, boolean> =
    aktuelleAntwort?.typ === 'richtigfalsch' ? aktuelleAntwort.bewertungen : {}

  function handleKlick(aussageId: string, wert: boolean) {
    if (abgegeben) return

    const neueBewertungen = { ...bewertungen }
    // Toggle: Wenn gleicher Wert nochmal geklickt → abwählen
    if (neueBewertungen[aussageId] === wert) {
      delete neueBewertungen[aussageId]
    } else {
      neueBewertungen[aussageId] = wert
    }
    setAntwort(frage.id, { typ: 'richtigfalsch', bewertungen: neueBewertungen })
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header: Badges */}
      <div className="flex flex-wrap items-center gap-2">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${fachbereichFarbe(frage.fachbereich)}`}>
          {frage.fachbereich}
        </span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
          {frage.bloom}
        </span>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {frage.punkte} {frage.punkte === 1 ? 'Punkt' : 'Punkte'}
        </span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
          Richtig / Falsch
        </span>
      </div>

      {/* Fragetext (sticky) */}
      <div
        className="text-base leading-relaxed text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-800/80 p-4 rounded-lg border border-slate-200 dark:border-slate-700 sticky top-14 z-10"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(frage.fragetext) }}
      />

      {/* Aussagen */}
      <div className="flex flex-col gap-3">
        {frage.aussagen.map((aussage, index) => {
          const gewaehlt = bewertungen[aussage.id]
          return (
            <div
              key={aussage.id}
              className={`p-4 rounded-xl border-2 transition-all
                ${gewaehlt !== undefined
                  ? 'border-slate-300 dark:border-slate-500 bg-slate-50 dark:bg-slate-700/30'
                  : !abgegeben
                    ? 'border-violet-400 dark:border-violet-500 bg-white dark:bg-slate-800'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                }
                ${abgegeben ? 'opacity-75' : ''}
              `}
            >
              {/* Aussagentext */}
              <p className="text-sm text-slate-800 dark:text-slate-100 mb-3">
                <span className="font-semibold text-slate-500 dark:text-slate-400 mr-2">
                  {index + 1}.
                </span>
                {aussage.text}
              </p>

              {/* Richtig / Falsch Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleKlick(aussage.id, true)}
                  disabled={abgegeben}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg border-2 transition-all cursor-pointer
                    ${gewaehlt === true
                      ? 'border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200'
                      : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-500'
                    }
                    ${abgegeben ? 'cursor-not-allowed' : ''}
                  `}
                >
                  <span className={gewaehlt === true ? 'text-green-600 dark:text-green-400' : ''}>✓</span> Richtig
                </button>
                <button
                  onClick={() => handleKlick(aussage.id, false)}
                  disabled={abgegeben}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg border-2 transition-all cursor-pointer
                    ${gewaehlt === false
                      ? 'border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200'
                      : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-500'
                    }
                    ${abgegeben ? 'cursor-not-allowed' : ''}
                  `}
                >
                  <span className={gewaehlt === false ? 'text-red-600 dark:text-red-400' : ''}>✗</span> Falsch
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
