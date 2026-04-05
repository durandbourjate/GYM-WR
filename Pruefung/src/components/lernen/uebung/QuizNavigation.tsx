interface Props {
  kannZurueck: boolean
  istBeantwortet: boolean
  feedbackSichtbar: boolean
  istLetzteFrage: boolean
  istSessionFertig: boolean
  onZurueck: () => void
  onUeberspringen: () => void
  onWeiter: () => void
  onErgebnis: () => void
}

export default function QuizNavigation({
  kannZurueck, istBeantwortet, feedbackSichtbar, istLetzteFrage: _istLetzteFrage, istSessionFertig,
  onZurueck, onUeberspringen, onWeiter, onErgebnis,
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
