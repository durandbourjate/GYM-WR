import { useState } from 'react'
import type { FrageKomponenteProps } from './index'
import FeedbackBox from './FeedbackBox'
import BildContainer from './shared/BildContainer'

export default function BildbeschriftungFrage({ frage, onAntwort, disabled, feedbackSichtbar, korrekt }: FrageKomponenteProps) {
  const labels = frage.labels || []
  const [texte, setTexte] = useState<Record<string, string>>({})

  const handleChange = (id: string, text: string) => {
    if (disabled) return
    setTexte({ ...texte, [id]: text })
  }

  const istVollstaendig = labels.some(l => (texte[l.id] || '').trim())

  const handleAbsenden = () => {
    if (!istVollstaendig || disabled) return
    onAntwort({ typ: 'bildbeschriftung', texte })
  }

  return (
    <div className="space-y-3">
      {/* Bild mit Positions-Markern */}
      {frage.bild && (
        <BildContainer src={frage.bild.src} alt={frage.bild.alt}>
          {() => (
            <>
              {labels.map((l, i) => (
                <div
                  key={l.id}
                  className="absolute flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ left: `${l.x}%`, top: `${l.y}%` }}
                >
                  {i + 1}
                </div>
              ))}
            </>
          )}
        </BildContainer>
      )}

      {/* Eingabefelder */}
      <div className="space-y-2">
        {labels.map((l, i) => {
          const eingabe = (texte[l.id] || '').trim().toLowerCase()
          const korrektText = l.text.trim().toLowerCase()
          const istKorrekt = feedbackSichtbar && eingabe === korrektText

          return (
            <div key={l.id} className="flex gap-2 items-center">
              <span className="w-8 h-8 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center shrink-0">
                {i + 1}
              </span>
              <input
                type="text"
                value={texte[l.id] || ''}
                onChange={(e) => handleChange(l.id, e.target.value)}
                disabled={disabled}
                placeholder={`Beschriftung ${i + 1}`}
                className={`flex-1 p-3 rounded-lg border text-sm min-h-[44px] dark:bg-gray-800 dark:text-white
                  ${feedbackSichtbar
                    ? (istKorrekt ? 'border-green-400 ring-2 ring-green-400' : 'border-red-400 ring-2 ring-red-400')
                    : 'border-gray-300 dark:border-gray-600'}
                `}
              />
              {feedbackSichtbar && !istKorrekt && (
                <span className="text-xs text-green-600 dark:text-green-400 shrink-0 max-w-[150px] truncate" title={l.text}>
                  → {l.text}
                </span>
              )}
            </div>
          )
        })}
      </div>

      {!disabled && istVollstaendig && !feedbackSichtbar && (
        <button onClick={handleAbsenden} className="w-full bg-blue-500 text-white rounded-xl py-3 font-medium min-h-[48px]">
          Pruefen
        </button>
      )}

      {feedbackSichtbar && korrekt !== null && <FeedbackBox korrekt={korrekt} erklaerung={frage.erklaerung} />}
    </div>
  )
}
