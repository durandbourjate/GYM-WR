import { useState } from 'react'
import type { FrageKomponenteProps } from './index'
import FeedbackBox from './FeedbackBox'

export default function CodeFrage({ frage, onAntwort, disabled, feedbackSichtbar, korrekt }: FrageKomponenteProps) {
  // Typ-Narrowing auf CodeFrage (shared discriminated union)
  if (frage.typ !== 'code') return null
  const codeFrage = frage

  const [code, setCode] = useState(codeFrage.starterCode || '')
  const [selbstbewertung, setSelbstbewertung] = useState<'korrekt' | 'teilweise' | 'falsch' | null>(null)

  const handleAbsenden = () => {
    if (!code.trim() || disabled) return
    onAntwort({ typ: 'code', code: code.trim(), sprache: codeFrage.sprache })
  }

  const handleSelbstbewertung = (bewertung: 'korrekt' | 'teilweise' | 'falsch') => {
    setSelbstbewertung(bewertung)
    onAntwort({ typ: 'code', code: code.trim(), sprache: codeFrage.sprache, selbstbewertung: bewertung })
  }

  return (
    <div className="space-y-3">
      {codeFrage.sprache && (
        <span className="text-xs px-2 py-1 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
          {codeFrage.sprache}
        </span>
      )}

      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        disabled={disabled}
        autoFocus
        rows={10}
        spellCheck={false}
        className="w-full p-4 rounded-xl border-2 border-slate-200 dark:border-slate-600 dark:bg-slate-900 dark:text-green-400 font-mono text-sm resize-y min-h-[200px] focus:border-slate-500 focus:outline-none"
        placeholder="// Dein Code hier..."
      />

      {!disabled && code.trim() && !feedbackSichtbar && (
        <button onClick={handleAbsenden} className="w-full bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-800 rounded-xl py-3 font-medium min-h-[48px]">
          Prüfen
        </button>
      )}

      {feedbackSichtbar && (
        <div className="space-y-3">
          {codeFrage.musterLoesung && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800">
              <p className="font-medium text-sm mb-2 text-slate-600 dark:text-slate-400">Musterlösung:</p>
              <pre className="text-sm font-mono text-slate-800 dark:text-green-400 whitespace-pre-wrap">{codeFrage.musterLoesung}</pre>
            </div>
          )}

          {!selbstbewertung && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Wie hast du abgeschnitten?</p>
              <div className="flex gap-2">
                <button onClick={() => handleSelbstbewertung('korrekt')} className="flex-1 py-3 rounded-xl border-2 border-green-300 text-green-700 dark:text-green-300 dark:border-green-600 font-medium min-h-[48px]">Korrekt</button>
                <button onClick={() => handleSelbstbewertung('teilweise')} className="flex-1 py-3 rounded-xl border-2 border-amber-300 text-amber-700 dark:text-amber-300 dark:border-amber-600 font-medium min-h-[48px]">Teilweise</button>
                <button onClick={() => handleSelbstbewertung('falsch')} className="flex-1 py-3 rounded-xl border-2 border-red-300 text-red-700 dark:text-red-300 dark:border-red-600 font-medium min-h-[48px]">Falsch</button>
              </div>
            </div>
          )}

          {selbstbewertung && korrekt !== null && <FeedbackBox korrekt={korrekt} erklaerung={frage.musterlosung} />}
        </div>
      )}
    </div>
  )
}
