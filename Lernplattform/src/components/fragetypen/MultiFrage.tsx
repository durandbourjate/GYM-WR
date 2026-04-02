import { useState } from 'react'
import type { FrageKomponenteProps } from './index'

export default function MultiFrage({ frage, onAntwort, disabled, feedbackSichtbar, korrekt }: FrageKomponenteProps) {
  const [gewaehlt, setGewaehlt] = useState<string[]>([])
  const optionen = frage.optionen || []
  const korrekteOptionen = (frage.korrekt as string[]) || []

  const toggleOption = (option: string) => {
    if (disabled) return
    setGewaehlt(prev =>
      prev.includes(option) ? prev.filter(o => o !== option) : [...prev, option]
    )
  }

  const handleAbsenden = () => {
    if (gewaehlt.length === 0 || disabled) return
    onAntwort({ typ: 'multi', gewaehlt })
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500 dark:text-gray-400">Mehrere Antworten moeglich</p>
      {optionen.map((option, i) => {
        const istGewaehlt = gewaehlt.includes(option)
        const istKorrekt = feedbackSichtbar && korrekteOptionen.includes(option)
        const istFalsch = feedbackSichtbar && istGewaehlt && !korrekteOptionen.includes(option)

        return (
          <button
            key={i}
            onClick={() => toggleOption(option)}
            disabled={disabled}
            className={`w-full text-left p-4 rounded-xl border-2 transition-colors min-h-[48px] flex items-center gap-3
              ${istKorrekt ? 'border-green-500 bg-green-50 dark:bg-green-900/30' : ''}
              ${istFalsch ? 'border-red-500 bg-red-50 dark:bg-red-900/30' : ''}
              ${istGewaehlt && !feedbackSichtbar ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' : ''}
              ${!istGewaehlt && !istKorrekt ? 'border-gray-200 dark:border-gray-600 hover:border-gray-400' : ''}
              ${disabled ? 'cursor-default' : 'cursor-pointer'}
            `}
          >
            <span className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center text-xs
              ${istGewaehlt ? 'bg-blue-500 border-blue-500 text-white' : 'border-gray-300 dark:border-gray-500'}
            `}>
              {istGewaehlt ? '✓' : ''}
            </span>
            <span className="dark:text-white">{option}</span>
          </button>
        )
      })}

      {!disabled && gewaehlt.length > 0 && !feedbackSichtbar && (
        <button onClick={handleAbsenden} className="w-full bg-blue-500 text-white rounded-xl py-3 font-medium mt-2 min-h-[48px]">
          Pruefen
        </button>
      )}

      {feedbackSichtbar && korrekt !== null && (
        <div className={`p-4 rounded-xl mt-2 ${korrekt ? 'bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200' : 'bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200'}`}>
          <p className="font-medium">{korrekt ? 'Richtig!' : 'Nicht ganz.'}</p>
          {frage.erklaerung && <p className="mt-1 text-sm opacity-80">{frage.erklaerung}</p>}
        </div>
      )}
    </div>
  )
}
