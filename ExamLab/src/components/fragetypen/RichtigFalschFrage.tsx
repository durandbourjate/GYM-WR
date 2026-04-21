import { useFrageAdapter } from '../../hooks/useFrageAdapter.ts'
import type { RichtigFalschFrage as RichtigFalschFrageType } from '../../types/fragen.ts'
import type { Antwort } from '../../types/antworten.ts'
import { renderMarkdown } from '../../utils/markdown.ts'
import { fachbereichFarbe } from '../../utils/fachUtils.ts'
import { AntwortZeile } from '@shared/ui/AntwortZeile'

interface Props {
  frage: RichtigFalschFrageType
  modus?: 'aufgabe' | 'loesung'
  antwort?: Antwort | null
}

export default function RichtigFalschFrage({ frage, modus = 'aufgabe', antwort: antwortProp }: Props) {
  if (modus === 'loesung') {
    return <RichtigFalschLoesung frage={frage} antwort={antwortProp ?? null} />
  }
  return <RichtigFalschAufgabe frage={frage} />
}

function RichtigFalschAufgabe({ frage }: { frage: RichtigFalschFrageType }) {
  const { antwort, onAntwort, disabled, feedbackSichtbar, korrekt } = useFrageAdapter(frage.id)

  const bewertungen: Record<string, boolean> =
    (antwort as Extract<Antwort, { typ: 'richtigfalsch' }> | null)?.bewertungen ?? {}

  const fragetextIstEinzelAussage =
    (frage.aussagen?.length ?? 0) === 1 && frage.aussagen?.[0]?.text?.trim() === frage.fragetext?.trim()

  function handleKlick(aussageId: string, wert: boolean) {
    if (disabled) return

    const neueBewertungen = { ...bewertungen }
    // Toggle: Wenn gleicher Wert nochmal geklickt → abwählen
    if (neueBewertungen[aussageId] === wert) {
      delete neueBewertungen[aussageId]
    } else {
      neueBewertungen[aussageId] = wert
    }
    onAntwort({ typ: 'richtigfalsch', bewertungen: neueBewertungen })
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

      {/* Fragetext (sticky) — unterdrückt wenn Einzel-Aussage identisch zum Fragetext (Pool-Daten-Artefakt) */}
      {!fragetextIstEinzelAussage && (
        <div
          className="text-base leading-relaxed text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-800/80 p-4 rounded-lg border border-slate-200 dark:border-slate-700"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(frage.fragetext) }}
        />
      )}

      {/* Aussagen */}
      <div className="flex flex-col gap-3">
        {(frage.aussagen ?? []).map((aussage, index) => {
          const gewaehlt = bewertungen[aussage.id]
          return (
            <div
              key={aussage.id}
              className={`p-4 rounded-xl border-2 transition-all
                ${gewaehlt !== undefined
                  ? 'border-slate-300 dark:border-slate-500 bg-slate-50 dark:bg-slate-700/30'
                  : !disabled
                    ? 'border-violet-400 dark:border-violet-500 bg-white dark:bg-slate-800'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                }
                ${disabled ? 'opacity-75' : ''}
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
                  disabled={disabled}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg border-2 transition-all cursor-pointer
                    ${gewaehlt === true
                      ? 'border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200'
                      : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-500'
                    }
                    ${disabled ? 'cursor-not-allowed' : ''}
                  `}
                >
                  <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full border-2 text-xs shrink-0 ${gewaehlt === true ? 'border-green-600 bg-green-600 text-white dark:border-green-400 dark:bg-green-400 dark:text-slate-900' : 'border-slate-300 dark:border-slate-600'}`}>{gewaehlt === true ? '✓' : ''}</span>
                  <span>Richtig</span>
                </button>
                <button
                  onClick={() => handleKlick(aussage.id, false)}
                  disabled={disabled}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg border-2 transition-all cursor-pointer
                    ${gewaehlt === false
                      ? 'border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200'
                      : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-500'
                    }
                    ${disabled ? 'cursor-not-allowed' : ''}
                  `}
                >
                  <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full border-2 text-xs shrink-0 ${gewaehlt === false ? 'border-red-600 bg-red-600 text-white dark:border-red-400 dark:bg-red-400 dark:text-slate-900' : 'border-slate-300 dark:border-slate-600'}`}>{gewaehlt === false ? '✗' : ''}</span>
                  <span>Falsch</span>
                </button>
              </div>
            </div>
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

function RichtigFalschLoesung({ frage, antwort }: { frage: RichtigFalschFrageType; antwort: Antwort | null }) {
  const bewertungen: Record<string, boolean> =
    (antwort as Extract<Antwort, { typ: 'richtigfalsch' }> | null)?.bewertungen ?? {}

  const fragetextIstEinzelAussage =
    (frage.aussagen?.length ?? 0) === 1 && frage.aussagen?.[0]?.text?.trim() === frage.fragetext?.trim()

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

      {!fragetextIstEinzelAussage && (
        <div
          className="text-base leading-relaxed text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-800/80 p-4 rounded-lg border border-slate-200 dark:border-slate-700"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(frage.fragetext) }}
        />
      )}

      {/* Aussagen — Lösungs-Ansicht */}
      <div className="flex flex-col">
        {(frage.aussagen ?? []).map((aussage, index) => {
          const susUrteil = bewertungen[aussage.id]
          const hatGeantwortet = susUrteil !== undefined
          const istKorrekt = hatGeantwortet && susUrteil === aussage.korrekt

          let marker: 'ja' | 'nein' | 'leer'
          if (!hatGeantwortet) marker = 'leer'
          else marker = susUrteil ? 'ja' : 'nein'

          let variant: 'korrekt' | 'falsch' | 'neutral'
          if (istKorrekt) variant = 'korrekt'
          else if (hatGeantwortet) variant = 'falsch'
          else variant = 'falsch' // verpasst

          const korrekteAntwortText = aussage.korrekt ? 'Richtig' : 'Falsch'
          const zusatz = !istKorrekt ? (
            <span className="text-xs text-slate-700 dark:text-slate-300">
              → Korrekte Antwort: <strong>{korrekteAntwortText}</strong>
            </span>
          ) : undefined

          return (
            <AntwortZeile
              key={aussage.id}
              marker={marker}
              variant={variant}
              label={
                <>
                  <span className="font-semibold text-slate-500 dark:text-slate-400 mr-2">{index + 1}.</span>
                  <span className="text-slate-800 dark:text-slate-100">{aussage.text}</span>
                </>
              }
              erklaerung={aussage.erklaerung}
              zusatz={zusatz}
            />
          )
        })}
      </div>
    </div>
  )
}
