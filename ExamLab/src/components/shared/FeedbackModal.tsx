import { useState, useCallback } from 'react'

// ExamLab Problemmeldungen — Sheet "ExamLab Problemmeldungen", Tab "ExamLab-Problemmeldungen"
const FEEDBACK_ENDPOINT = 'https://script.google.com/macros/s/AKfycbwSxIOqGhAbnNM2-Y4ulgBY3usVEC6cKT4S5sEk4sf2CMognF5qxopj3FJtnTpm3nq7TQ/exec'

export interface FeedbackContext {
  rolle: 'lp' | 'sus'
  ort: string
  pruefungId?: string
  frageId?: string
  frageText?: string
  zusatzinfo?: string
  frageTyp?: string
  modus?: 'pruefen' | 'ueben' | 'fragensammlung'
  bildschirm?: string
  appVersion?: string
  gruppeId?: string
}

interface Props {
  isOpen: boolean
  onClose: () => void
  context: FeedbackContext
}

type FeedbackTyp = 'problem' | 'wunsch'

function getCategories(ort: string, typ: FeedbackTyp): string[] {
  if (ort.includes('frage')) {
    return typ === 'problem'
      ? ['Fachlicher Fehler', 'Unklar formuliert', 'Bewertung fragwürdig', 'Technisches Problem']
      : ['Bessere Formulierung', 'Zusätzliche Erklärung', 'Anderes']
  }
  return typ === 'problem'
    ? ['Bedienung/UX', 'Technisches Problem', 'Fehlende Funktion', 'Anderes']
    : ['Feature-Wunsch', 'UX-Verbesserung', 'Anderes']
}

export default function FeedbackModal({ isOpen, onClose, context }: Props) {
  const [typ, setTyp] = useState<FeedbackTyp | null>(null)
  const [category, setCategory] = useState<string | null>(null)
  const [comment, setComment] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const reset = useCallback(() => {
    setTyp(null)
    setCategory(null)
    setComment('')
    setSending(false)
    setSent(false)
    setError('')
  }, [])

  const handleClose = useCallback(() => {
    reset()
    onClose()
  }, [reset, onClose])

  const handleSend = useCallback(() => {
    if (!typ) { setError('Bitte wähle Problem oder Wunsch.'); return }
    if (!category) { setError('Bitte wähle eine Kategorie.'); return }
    setError('')
    setSending(true)

    const params = new URLSearchParams({
      source: 'pruefung',
      rolle: context.rolle,
      ort: context.ort,
      typ,
      category,
      comment: comment.trim(),
      pruefungId: context.pruefungId || '',
      frageId: context.frageId || '',
      frageText: (context.frageText || '').replace(/<[^>]*>/g, '').substring(0, 200),
      zusatzinfo: context.zusatzinfo || '',
      frageTyp: context.frageTyp || '',
      modus: context.modus || '',
      bildschirm: context.bildschirm || '',
      appVersion: context.appVersion || (typeof __BUILD_TIMESTAMP__ === 'string' ? __BUILD_TIMESTAMP__ : ''),
      gruppeId: context.gruppeId || '',
    })

    // fetch no-cors — umgeht Multi-Account-Routing (/u/N/) das Image-Ping in 503 laufen lässt
    const done = () => {
      setSending(false)
      setSent(true)
      setTimeout(handleClose, 1800)
    }
    fetch(FEEDBACK_ENDPOINT + '?' + params.toString(), {
      method: 'GET',
      mode: 'no-cors',
      credentials: 'omit',
    }).finally(done)

    // Fallback
    setTimeout(() => {
      if (!sent) done()
    }, 5000)
  }, [typ, category, comment, context, sent, handleClose])

  if (!isOpen) return null

  const categories = typ ? getCategories(context.ort, typ) : []

  return (
    <div
      className="fixed inset-0 bg-black/50 z-[500] flex items-center justify-center p-4 backdrop-blur-[2px]"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
    >
      <div className="bg-white dark:bg-slate-800 rounded-xl max-w-md w-full shadow-2xl overflow-hidden animate-[slideUp_0.2s_ease]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
            Rückmeldung geben
          </h3>
          <button
            onClick={handleClose}
            className="text-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 px-2 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 leading-none cursor-pointer"
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4">
          {sent ? (
            <div className="text-center py-6">
              <div className="text-3xl mb-2">✅</div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                <strong>Vielen Dank!</strong><br />Deine Rückmeldung wurde gesendet.
              </p>
            </div>
          ) : (
            <>
              {/* Kontext-Info */}
              {(context.frageId || context.pruefungId) && (
                <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-700/50 rounded-lg p-2.5 mb-4 leading-relaxed">
                  {context.pruefungId && (
                    <div><span className="font-semibold text-slate-600 dark:text-slate-300">Prüfung:</span> {context.pruefungId}</div>
                  )}
                  {context.frageId && (
                    <div><span className="font-semibold text-slate-600 dark:text-slate-300">Frage:</span> {context.frageId}</div>
                  )}
                  {context.frageText && (
                    <div className="mt-1 truncate">{context.frageText.replace(/<[^>]*>/g, '').substring(0, 120)}</div>
                  )}
                </div>
              )}

              {/* Typ-Auswahl */}
              <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Was möchtest du melden?</div>
              <div className="grid grid-cols-2 gap-2 mb-4">
                <button
                  onClick={() => { setTyp('problem'); setCategory(null) }}
                  className={`p-3 rounded-lg border-2 text-sm font-medium transition-all cursor-pointer ${
                    typ === 'problem'
                      ? 'border-red-400 bg-red-50 text-red-700 dark:border-red-500 dark:bg-red-900/30 dark:text-red-300'
                      : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-500'
                  }`}
                >
                  🔴 Problem
                </button>
                <button
                  onClick={() => { setTyp('wunsch'); setCategory(null) }}
                  className={`p-3 rounded-lg border-2 text-sm font-medium transition-all cursor-pointer ${
                    typ === 'wunsch'
                      ? 'border-amber-400 bg-amber-50 text-amber-700 dark:border-amber-500 dark:bg-amber-900/30 dark:text-amber-300'
                      : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-500'
                  }`}
                >
                  💡 Wunsch
                </button>
              </div>

              {/* Kategorie-Chips */}
              {typ && (
                <>
                  <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Kategorie</div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setCategory(cat)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border-2 transition-all cursor-pointer ${
                          category === cat
                            ? 'border-blue-500 bg-blue-500 text-white dark:border-blue-400 dark:bg-blue-500'
                            : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-500'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* Kommentar */}
              {typ && (
                <>
                  <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Beschreibung <span className="font-normal text-slate-400">(optional)</span>
                  </div>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Was genau ist das Problem / dein Wunsch?"
                    maxLength={500}
                    className="w-full min-h-[70px] p-2.5 text-sm border-2 border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-blue-400 dark:focus:border-blue-500 resize-y"
                  />
                </>
              )}

              {/* Error */}
              {error && (
                <p className="text-xs text-red-500 mt-2">{error}</p>
              )}

              {/* Actions */}
              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleClose}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 border-2 border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleSend}
                  disabled={sending || !typ}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-blue-500 rounded-lg hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  {sending ? 'Wird gesendet…' : '📨 Senden'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
