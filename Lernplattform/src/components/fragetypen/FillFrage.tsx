import { useState } from 'react'
import type { FrageKomponenteProps } from './index'

export default function FillFrage({ frage, onAntwort, disabled, feedbackSichtbar, korrekt }: FrageKomponenteProps) {
  const luecken = frage.luecken || []
  const [eintraege, setEintraege] = useState<Record<string, string>>({})

  const alleAusgefuellt = luecken.every(l => (eintraege[l.id] || '').trim().length > 0)

  const handleAbsenden = () => {
    if (!alleAusgefuellt || disabled) return
    onAntwort({ typ: 'fill', eintraege })
  }

  return (
    <div className="space-y-4">
      {luecken.map((luecke) => {
        const wert = eintraege[luecke.id] || ''
        const istKorrekt = feedbackSichtbar && wert.trim().toLowerCase() === luecke.korrekt.trim().toLowerCase()
        const istFalsch = feedbackSichtbar && !istKorrekt

        return (
          <div key={luecke.id}>
            {luecke.optionen ? (
              <select
                value={wert}
                onChange={(e) => setEintraege(prev => ({ ...prev, [luecke.id]: e.target.value }))}
                disabled={disabled}
                className={`w-full p-3 rounded-xl border-2 min-h-[48px] bg-white dark:bg-gray-700 dark:text-white
                  ${istKorrekt ? 'border-green-500' : ''}
                  ${istFalsch ? 'border-red-500' : ''}
                  ${!feedbackSichtbar ? 'border-gray-200 dark:border-gray-600' : ''}
                `}
              >
                <option value="">-- Waehlen --</option>
                {luecke.optionen.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : (
              <input
                type="text"
                value={wert}
                onChange={(e) => setEintraege(prev => ({ ...prev, [luecke.id]: e.target.value }))}
                disabled={disabled}
                placeholder="Antwort eingeben"
                autoFocus={luecken.indexOf(luecke) === 0}
                className={`w-full p-3 rounded-xl border-2 min-h-[48px] bg-white dark:bg-gray-700 dark:text-white focus:outline-none
                  ${istKorrekt ? 'border-green-500' : ''}
                  ${istFalsch ? 'border-red-500' : ''}
                  ${!feedbackSichtbar ? 'border-gray-200 dark:border-gray-600 focus:border-blue-500' : ''}
                `}
              />
            )}
            {istFalsch && (
              <p className="text-sm text-red-500 mt-1">Korrekt: {luecke.korrekt}</p>
            )}
          </div>
        )
      })}

      {!disabled && alleAusgefuellt && !feedbackSichtbar && (
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
