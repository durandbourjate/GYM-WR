interface Props {
  kannZurueck: boolean
  istBeantwortet: boolean
  feedbackSichtbar: boolean
  hatZwischenstand: boolean
  istLetzteFrage: boolean
  istSessionFertig: boolean
  /** Server-Prüfung läuft → Spinner + disabled */
  speichertPruefung?: boolean
  onZurueck: () => void
  onUeberspringen: () => void
  onPruefen: () => void
  onWeiter: () => void
  onErgebnis: () => void
}

export default function QuizNavigation({
  kannZurueck, istBeantwortet, feedbackSichtbar, hatZwischenstand, istLetzteFrage: _istLetzteFrage, istSessionFertig,
  speichertPruefung = false,
  onZurueck, onUeberspringen, onPruefen, onWeiter, onErgebnis,
}: Props) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Zurück */}
      {kannZurueck && (
        <button
          onClick={onZurueck}
          className="px-4 py-2.5 rounded-xl text-sm font-medium min-h-[44px] bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
        >
          &#8592; Zurück
        </button>
      )}

      {/* Überspringen (nur wenn noch nicht beantwortet) */}
      {!istBeantwortet && !feedbackSichtbar && (
        <button
          onClick={onUeberspringen}
          className="px-4 py-2.5 rounded-xl text-sm font-medium min-h-[44px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
        >
          Überspringen &#8594;
        </button>
      )}

      {/* Antwort prüfen (nur wenn nicht geprüft + Zwischenstand vorhanden) */}
      {!feedbackSichtbar && hatZwischenstand && (
        <button
          onClick={onPruefen}
          disabled={speichertPruefung}
          aria-busy={speichertPruefung}
          className="ml-auto px-6 py-2.5 rounded-xl text-sm font-medium min-h-[44px] bg-violet-600 text-white hover:bg-violet-700 dark:bg-violet-500 dark:hover:bg-violet-400 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {speichertPruefung && (
            <span
              aria-hidden="true"
              className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
            />
          )}
          {speichertPruefung ? 'Korrektur lädt …' : 'Antwort prüfen'}
        </button>
      )}

      {/* Weiter / Ergebnis (nach Feedback) */}
      {feedbackSichtbar && (
        <button
          onClick={istSessionFertig ? onErgebnis : onWeiter}
          className="ml-auto px-6 py-2.5 rounded-xl text-sm font-medium min-h-[44px] bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 hover:bg-slate-700 dark:hover:bg-slate-300"
        >
          {istSessionFertig ? 'Ergebnis anzeigen' : 'Weiter \u2192'}
        </button>
      )}
    </div>
  )
}
