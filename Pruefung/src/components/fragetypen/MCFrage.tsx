import { useFrageAdapter } from '../../hooks/useFrageAdapter.ts'
import type { MCFrage as MCFrageType } from '../../types/fragen.ts'
import type { Antwort } from '../../types/antworten.ts'
import { renderMarkdown } from '../../utils/markdown.ts'
import { fachbereichFarbe } from '../../utils/fachUtils.ts'

interface Props {
  frage: MCFrageType
}

export default function MCFrage({ frage }: Props) {
  const { antwort, onAntwort, disabled, feedbackSichtbar, korrekt } = useFrageAdapter(frage.id)

  const gewaehlte: string[] =
    (antwort as Extract<Antwort, { typ: 'mc' }> | null)?.gewaehlteOptionen ?? []

  function handleKlick(optionId: string) {
    if (disabled) return

    let neueAuswahl: string[]
    if (frage.mehrfachauswahl) {
      neueAuswahl = gewaehlte.includes(optionId)
        ? gewaehlte.filter((id) => id !== optionId)
        : [...gewaehlte, optionId]
    } else {
      neueAuswahl = gewaehlte.includes(optionId) ? [] : [optionId]
    }
    onAntwort({ typ: 'mc', gewaehlteOptionen: neueAuswahl })
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
        {frage.mehrfachauswahl && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
            Mehrfachauswahl
          </span>
        )}
      </div>

      {/* Fragetext (sticky: bleibt beim Scrollen sichtbar) */}
      <div
        className="text-base leading-relaxed text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-800/80 p-4 rounded-lg border border-slate-200 dark:border-slate-700"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(frage.fragetext) }}
      />

      {/* Optionen */}
      <div className={`flex flex-col gap-2.5 ${!disabled && gewaehlte.length === 0 ? 'rounded-xl border-2 border-violet-400 dark:border-violet-500 p-1' : ''}`}>
        {(frage.optionen ?? []).map((option) => {
          const istGewaehlt = gewaehlte.includes(option.id)
          return (
            <button
              key={option.id}
              onClick={() => handleKlick(option.id)}
              disabled={disabled}
              className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all cursor-pointer
                ${istGewaehlt
                  ? 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 bg-white dark:bg-slate-800'
                }
                ${disabled ? 'opacity-75 cursor-not-allowed' : ''}
              `}
            >
              {/* Radio / Checkbox Icon */}
              <span className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-${frage.mehrfachauswahl ? 'md' : 'full'} border-2 flex items-center justify-center
                ${istGewaehlt
                  ? 'border-green-600 bg-green-600 dark:border-green-400 dark:bg-green-400'
                  : 'border-slate-300 dark:border-slate-600'
                }
              `}>
                {istGewaehlt && (
                  <svg className="w-3 h-3 text-white dark:text-slate-900" fill="currentColor" viewBox="0 0 12 12">
                    <path d="M10.28 2.28L3.989 8.575 1.695 6.28A1 1 0 00.28 7.695l3 3a1 1 0 001.414 0l7-7A1 1 0 0010.28 2.28z" />
                  </svg>
                )}
              </span>

              {/* Option Label + Text */}
              <div className="flex-1">
                <span className="font-semibold text-slate-500 dark:text-slate-400 mr-2">
                  {option.id.toUpperCase()})
                </span>
                <span className="text-slate-800 dark:text-slate-100">{option.text}</span>
              </div>
            </button>
          )
        })}
      </div>

      {/* Feedback (Üben-Modus) */}
      {feedbackSichtbar && korrekt !== null && (
        <div className={`mt-4 p-3 rounded-lg ${korrekt ? 'bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-300'}`}>
          {korrekt ? '\u2713 Richtig!' : '\u2717 Leider falsch.'}
          {frage.musterlosung && <p className="mt-1 text-sm">{frage.musterlosung}</p>}
        </div>
      )}
    </div>
  )
}
