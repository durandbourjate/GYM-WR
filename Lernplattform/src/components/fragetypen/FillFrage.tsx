import { useState } from 'react'
import type { FrageKomponenteProps } from './index'
import FeedbackBox from './FeedbackBox'

export default function FillFrage({ frage, onAntwort, disabled, feedbackSichtbar, korrekt }: FrageKomponenteProps) {
  // Typ-Narrowing auf LueckentextFrage (shared = 'lueckentext', legacy = 'fill')
  if (frage.typ !== 'lueckentext' && (frage.typ as string) !== 'fill') return null
  const lt = frage as import('../../types/fragen').LueckentextFrage

  const luecken = lt.luecken || []
  const [eintraege, setEintraege] = useState<Record<string, string>>({})

  const alleAusgefuellt = luecken.every(l => (eintraege[l.id] || '').trim().length > 0)

  const handleAbsenden = () => {
    if (!alleAusgefuellt || disabled) return
    onAntwort({ typ: 'fill', eintraege })
  }

  return (
    <div className="space-y-4">
      {luecken.map((luecke, i) => {
        const wert = eintraege[luecke.id] || ''
        const korrekteAntwort = luecke.korrekteAntworten[0] || ''
        const istKorrekt = feedbackSichtbar && wert.trim().toLowerCase() === korrekteAntwort.trim().toLowerCase()
        const istFalsch = feedbackSichtbar && !istKorrekt

        return (
          <div key={luecke.id}>
            {luecke.dropdownOptionen && luecke.dropdownOptionen.length > 0 ? (
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
                {luecke.dropdownOptionen.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : (
              <input
                type="text"
                value={wert}
                onChange={(e) => setEintraege(prev => ({ ...prev, [luecke.id]: e.target.value }))}
                disabled={disabled}
                placeholder="Antwort eingeben"
                autoFocus={i === 0}
                className={`w-full p-3 rounded-xl border-2 min-h-[48px] bg-white dark:bg-gray-700 dark:text-white focus:outline-none
                  ${istKorrekt ? 'border-green-500' : ''}
                  ${istFalsch ? 'border-red-500' : ''}
                  ${!feedbackSichtbar ? 'border-gray-200 dark:border-gray-600 focus:border-blue-500' : ''}
                `}
              />
            )}
            {istFalsch && (
              <p className="text-sm text-red-500 mt-1">Korrekt: {korrekteAntwort}</p>
            )}
          </div>
        )
      })}

      {!disabled && alleAusgefuellt && !feedbackSichtbar && (
        <button onClick={handleAbsenden} className="w-full bg-blue-500 text-white rounded-xl py-3 font-medium min-h-[48px]">
          Prüfen
        </button>
      )}

      {feedbackSichtbar && korrekt !== null && <FeedbackBox korrekt={korrekt} erklaerung={frage.musterlosung} />}
    </div>
  )
}
