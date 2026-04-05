import { useState } from 'react'
import type { FrageKomponenteProps } from './index'
import FeedbackBox from './FeedbackBox'

export default function MCFrage({ frage, onAntwort, disabled, feedbackSichtbar, korrekt }: FrageKomponenteProps) {
  // Typ-Narrowing auf MCFrage (shared discriminated union)
  if (frage.typ !== 'mc') return null
  const mc = frage

  const [gewaehlt, setGewaehlt] = useState<string | null>(null)
  const optionen = mc.optionen || []

  const handleWahl = (optionText: string) => {
    if (disabled) return
    setGewaehlt(optionText)
  }

  const handleAbsenden = () => {
    if (!gewaehlt || disabled) return
    onAntwort({ typ: 'mc', gewaehlt })
  }

  return (
    <div className="space-y-3">
      {optionen.map((option, i) => {
        const istGewaehlt = gewaehlt === option.text
        const istKorrekt = feedbackSichtbar && option.korrekt
        const istFalsch = feedbackSichtbar && istGewaehlt && !option.korrekt

        return (
          <button
            key={option.id || i}
            onClick={() => handleWahl(option.text)}
            disabled={disabled}
            className={`w-full text-left p-4 rounded-xl border-2 transition-colors min-h-[48px]
              ${istKorrekt ? 'border-green-500 bg-green-50 dark:bg-green-900/30' : ''}
              ${istFalsch ? 'border-red-500 bg-red-50 dark:bg-red-900/30' : ''}
              ${istGewaehlt && !feedbackSichtbar ? 'border-slate-500 bg-slate-50 dark:bg-slate-900/30' : ''}
              ${!istGewaehlt && !istKorrekt ? 'border-gray-200 dark:border-gray-600 hover:border-gray-400' : ''}
              ${disabled ? 'cursor-default' : 'cursor-pointer'}
            `}
          >
            <span className="dark:text-white">{option.text}</span>
            {feedbackSichtbar && option.erklaerung && (
              <span className="block text-xs mt-1 text-gray-500 dark:text-gray-400">{option.erklaerung}</span>
            )}
          </button>
        )
      })}

      {!disabled && gewaehlt && !feedbackSichtbar && (
        <button onClick={handleAbsenden} className="w-full bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-800 rounded-xl py-3 font-medium mt-2 min-h-[48px]">
          Prüfen
        </button>
      )}

      {feedbackSichtbar && korrekt !== null && <FeedbackBox korrekt={korrekt} erklaerung={mc.musterlosung} />}
    </div>
  )
}
