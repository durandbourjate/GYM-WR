import { useState } from 'react'
import type { FrageKomponenteProps } from './index'
import FeedbackBox from './FeedbackBox'

export default function CalcFrage({ frage, onAntwort, disabled, feedbackSichtbar, korrekt }: FrageKomponenteProps) {
  // Typ-Narrowing auf BerechnungFrage (shared = 'berechnung', legacy = 'calc')
  if (frage.typ !== 'berechnung' && (frage.typ as string) !== 'calc') return null
  const calc = frage as import('../../types/fragen').BerechnungFrage

  const erstesErgebnis = calc.ergebnisse?.[0]
  const einheit = erstesErgebnis?.einheit
  const toleranz = erstesErgebnis?.toleranz
  const korrektWert = erstesErgebnis?.korrekt

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
        {einheit && <span className="text-gray-500 dark:text-gray-400">{einheit}</span>}
      </div>

      {feedbackSichtbar && !korrekt && korrektWert !== undefined && (
        <p className="text-sm text-red-500">Korrekt: {korrektWert}{einheit ? ` ${einheit}` : ''}{toleranz ? ` (+-${toleranz})` : ''}</p>
      )}

      {!disabled && wert.trim() && !feedbackSichtbar && (
        <button onClick={handleAbsenden} className="w-full bg-blue-500 text-white rounded-xl py-3 font-medium min-h-[48px]">
          Prüfen
        </button>
      )}

      {feedbackSichtbar && korrekt !== null && <FeedbackBox korrekt={korrekt} erklaerung={frage.musterlosung} />}
    </div>
  )
}
