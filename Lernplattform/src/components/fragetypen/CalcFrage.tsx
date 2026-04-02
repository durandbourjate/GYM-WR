import { useState } from 'react'
import type { FrageKomponenteProps } from './index'

export default function CalcFrage({ frage, onAntwort, disabled, feedbackSichtbar, korrekt }: FrageKomponenteProps) {
  const [wert, setWert] = useState('')

  const handleAbsenden = () => {
    if (!wert.trim() || disabled) return
    onAntwort({ typ: 'calc', wert: wert.trim() })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <input
          type="text"
          inputMode="decimal"
          value={wert}
          onChange={(e) => setWert(e.target.value)}
          disabled={disabled}
          placeholder="Ergebnis eingeben"
          autoFocus
          className={`flex-1 p-3 rounded-xl border-2 min-h-[48px] text-lg bg-white dark:bg-gray-700 dark:text-white focus:outline-none
            ${feedbackSichtbar && korrekt ? 'border-green-500' : ''}
            ${feedbackSichtbar && !korrekt ? 'border-red-500' : ''}
            ${!feedbackSichtbar ? 'border-gray-200 dark:border-gray-600 focus:border-blue-500' : ''}
          `}
          onKeyDown={(e) => { if (e.key === 'Enter') handleAbsenden() }}
        />
        {frage.einheit && <span className="text-gray-500 dark:text-gray-400">{frage.einheit}</span>}
      </div>

      {feedbackSichtbar && !korrekt && (
        <p className="text-sm text-red-500">Korrekt: {frage.korrekt}{frage.einheit ? ` ${frage.einheit}` : ''}{frage.toleranz ? ` (+-${frage.toleranz})` : ''}</p>
      )}

      {!disabled && wert.trim() && !feedbackSichtbar && (
        <button onClick={handleAbsenden} className="w-full bg-blue-500 text-white rounded-xl py-3 font-medium min-h-[48px]">
          Pruefen
        </button>
      )}

      {feedbackSichtbar && korrekt !== null && (
        <div className={`p-4 rounded-xl ${korrekt ? 'bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200' : 'bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200'}`}>
          <p className="font-medium">{korrekt ? 'Richtig!' : 'Leider falsch.'}</p>
          {frage.erklaerung && <p className="mt-1 text-sm opacity-80">{frage.erklaerung}</p>}
        </div>
      )}
    </div>
  )
}
