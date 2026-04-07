import { useState } from 'react'
import type { FrageKomponenteProps } from './index'
import FeedbackBox from './FeedbackBox'

export default function MultiFrage({ frage, onAntwort, disabled, feedbackSichtbar, korrekt }: FrageKomponenteProps) {
  // Typ-Narrowing auf MCFrage mit mehrfachauswahl (shared discriminated union)
  if (frage.typ !== 'mc') return null
  const mc = frage

  const [gewaehlt, setGewaehlt] = useState<string[]>([])
  const optionen = mc.optionen || []

  const toggleOption = (optionText: string) => {
    if (disabled) return
    setGewaehlt(prev =>
      prev.includes(optionText) ? prev.filter(o => o !== optionText) : [...prev, optionText]
    )
  }

  const handleAbsenden = () => {
    if (gewaehlt.length === 0 || disabled) return
    onAntwort({ typ: 'multi', gewaehlt })
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-500 dark:text-slate-400">Mehrere Antworten moeglich</p>
      {optionen.map((option, i) => {
        const istGewaehlt = gewaehlt.includes(option.text)
        const istKorrekt = feedbackSichtbar && option.korrekt
        const istFalsch = feedbackSichtbar && istGewaehlt && !option.korrekt

        return (
          <button
            key={option.id || i}
            onClick={() => toggleOption(option.text)}
            disabled={disabled}
            className={`w-full text-left p-4 rounded-xl border-2 transition-colors min-h-[48px] flex items-center gap-3
              ${istKorrekt ? 'border-green-500 bg-green-50 dark:bg-green-900/30' : ''}
              ${istFalsch ? 'border-red-500 bg-red-50 dark:bg-red-900/30' : ''}
              ${istGewaehlt && !feedbackSichtbar ? 'border-slate-500 bg-slate-50 dark:bg-slate-900/30' : ''}
              ${!istGewaehlt && !istKorrekt ? 'border-slate-200 dark:border-slate-600 hover:border-slate-400' : ''}
              ${disabled ? 'cursor-default' : 'cursor-pointer'}
            `}
          >
            <span className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center text-xs
              ${istGewaehlt ? 'bg-slate-800 border-slate-800 text-white dark:bg-slate-200 dark:border-slate-200 dark:text-slate-800' : 'border-slate-300 dark:border-slate-500'}
            `}>
              {istGewaehlt ? '✓' : ''}
            </span>
            <span className="dark:text-white">{option.text}</span>
            {feedbackSichtbar && option.erklaerung && (
              <span className="block text-xs mt-1 text-slate-500 dark:text-slate-400">{option.erklaerung}</span>
            )}
          </button>
        )
      })}

      {!disabled && gewaehlt.length > 0 && !feedbackSichtbar && (
        <button onClick={handleAbsenden} className="w-full bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-800 rounded-xl py-3 font-medium mt-2 min-h-[48px]">
          Prüfen
        </button>
      )}

      {feedbackSichtbar && korrekt !== null && <FeedbackBox korrekt={korrekt} erklaerung={mc.musterlosung} />}
    </div>
  )
}
