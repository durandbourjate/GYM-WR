import { useState } from 'react'
import type { FrageKomponenteProps } from './index'
import type { BildbeschriftungFrage as BildbeschriftungFrageTyp } from '../../../types/lernen/fragen'
import FeedbackBox from './FeedbackBox'
import BildContainer from './shared/BildContainer'

export default function BildbeschriftungFrage({ frage, onAntwort, disabled, feedbackSichtbar, korrekt }: FrageKomponenteProps) {
  // Type narrowing
  if (frage.typ !== 'bildbeschriftung') return null
  const bbFrage = frage as BildbeschriftungFrageTyp

  const beschriftungen = bbFrage.beschriftungen || []
  const [texte, setTexte] = useState<Record<string, string>>({})

  const handleChange = (id: string, text: string) => {
    if (disabled) return
    setTexte({ ...texte, [id]: text })
  }

  const istVollstaendig = beschriftungen.some(b => (texte[b.id] || '').trim())

  const handleAbsenden = () => {
    if (!istVollstaendig || disabled) return
    onAntwort({ typ: 'bildbeschriftung', texte })
  }

  return (
    <div className="space-y-3">
      {/* Bild mit Positions-Markern */}
      {bbFrage.bildUrl && (
        <BildContainer src={bbFrage.bildUrl} alt="Bildbeschriftung">
          {() => (
            <>
              {beschriftungen.map((b, i) => (
                <div
                  key={b.id}
                  className="absolute flex items-center justify-center w-6 h-6 rounded-full bg-slate-600 text-white text-xs font-bold -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ left: `${b.position.x}%`, top: `${b.position.y}%` }}
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
        {beschriftungen.map((b, i) => {
          const eingabe = (texte[b.id] || '').trim().toLowerCase()
          // Prüfe gegen alle akzeptierten Antworten
          const korrektAntworten = b.korrekt || []
          const ersteKorrekt = korrektAntworten[0] || ''
          const istKorrekt = feedbackSichtbar && korrektAntworten.some(
            k => eingabe === k.trim().toLowerCase()
          )

          return (
            <div key={b.id} className="flex gap-2 items-center">
              <span className="w-8 h-8 rounded-full bg-slate-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                {i + 1}
              </span>
              <input
                type="text"
                value={texte[b.id] || ''}
                onChange={(e) => handleChange(b.id, e.target.value)}
                disabled={disabled}
                placeholder={`Beschriftung ${i + 1}`}
                className={`flex-1 p-3 rounded-lg border text-sm min-h-[44px] dark:bg-slate-800 dark:text-white
                  ${feedbackSichtbar
                    ? (istKorrekt ? 'border-green-400 ring-2 ring-green-400' : 'border-red-400 ring-2 ring-red-400')
                    : 'border-slate-300 dark:border-slate-600'}
                `}
              />
              {feedbackSichtbar && !istKorrekt && (
                <span className="text-xs text-green-600 dark:text-green-400 shrink-0 max-w-[150px] truncate" title={ersteKorrekt}>
                  → {ersteKorrekt}
                </span>
              )}
            </div>
          )
        })}
      </div>

      {!disabled && istVollstaendig && !feedbackSichtbar && (
        <button onClick={handleAbsenden} className="w-full bg-slate-600 text-white rounded-xl py-3 font-medium min-h-[48px]">
          Prüfen
        </button>
      )}

      {feedbackSichtbar && korrekt !== null && <FeedbackBox korrekt={korrekt} erklaerung={bbFrage.musterlosung} />}
    </div>
  )
}
