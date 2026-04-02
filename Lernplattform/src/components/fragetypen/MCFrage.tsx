import { useState } from 'react'
import type { FrageKomponenteProps } from './index'

export default function MCFrage({ frage, onAntwort, disabled, feedbackSichtbar, korrekt }: FrageKomponenteProps) {
  const [gewaehlt, setGewaehlt] = useState<string | null>(null)
  const optionen = frage.optionen || []

  const handleWahl = (option: string) => {
    if (disabled) return
    setGewaehlt(option)
  }

  const handleAbsenden = () => {
    if (!gewaehlt || disabled) return
    onAntwort({ typ: 'mc', gewaehlt })
  }

  return (
    <div className="space-y-3">
      {optionen.map((option, i) => {
        const istGewaehlt = gewaehlt === option
        const istKorrekt = feedbackSichtbar && option === frage.korrekt
        const istFalsch = feedbackSichtbar && istGewaehlt && option !== frage.korrekt

        return (
          <button
            key={i}
            onClick={() => handleWahl(option)}
            disabled={disabled}
            className={`w-full text-left p-4 rounded-xl border-2 transition-colors min-h-[48px]
              ${istKorrekt ? 'border-green-500 bg-green-50 dark:bg-green-900/30' : ''}
              ${istFalsch ? 'border-red-500 bg-red-50 dark:bg-red-900/30' : ''}
              ${istGewaehlt && !feedbackSichtbar ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' : ''}
              ${!istGewaehlt && !istKorrekt ? 'border-gray-200 dark:border-gray-600 hover:border-gray-400' : ''}
              ${disabled ? 'cursor-default' : 'cursor-pointer'}
            `}
          >
            <span className="dark:text-white">{option}</span>
          </button>
        )
      })}

      {!disabled && gewaehlt && !feedbackSichtbar && (
        <button onClick={handleAbsenden} className="w-full bg-blue-500 text-white rounded-xl py-3 font-medium mt-2 min-h-[48px]">
          Pruefen
        </button>
      )}

      {feedbackSichtbar && korrekt !== null && (
        <div className={`p-4 rounded-xl mt-2 ${korrekt ? 'bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200' : 'bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200'}`}>
          <p className="font-medium">{korrekt ? 'Richtig!' : 'Leider falsch.'}</p>
          {frage.erklaerung && <p className="mt-1 text-sm opacity-80">{frage.erklaerung}</p>}
        </div>
      )}
    </div>
  )
}
