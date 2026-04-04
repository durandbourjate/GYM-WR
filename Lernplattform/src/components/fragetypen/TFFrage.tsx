import { useState } from 'react'
import type { FrageKomponenteProps } from './index'
import FeedbackBox from './FeedbackBox'

export default function TFFrage({ frage, onAntwort, disabled, feedbackSichtbar, korrekt }: FrageKomponenteProps) {
  // Typ-Narrowing: shared = 'richtigfalsch', legacy = 'tf'
  if (frage.typ !== 'richtigfalsch' && (frage.typ as string) !== 'tf') return null
  // Nach dem Guard: Aussagen existieren auf dem Typ
  const aussagen = (frage as { aussagen: { id: string; text: string; korrekt: boolean; erklaerung?: string }[] }).aussagen || []

  const [bewertungen, setBewertungen] = useState<Record<string, boolean>>({})

  const alleBewertet = aussagen.every(a => a.id in bewertungen)

  const handleAbsenden = () => {
    if (!alleBewertet || disabled) return
    onAntwort({ typ: 'tf', bewertungen })
  }

  return (
    <div className="space-y-3">
      {aussagen.map((aussage) => {
        const key = aussage.id
        const wert = bewertungen[key]
        const istBewertet = key in bewertungen
        const istKorrekt = feedbackSichtbar && istBewertet && wert === aussage.korrekt
        const istFalsch = feedbackSichtbar && istBewertet && wert !== aussage.korrekt

        return (
          <div key={aussage.id} className={`p-4 rounded-xl border-2 transition-colors
            ${istKorrekt ? 'border-green-500 bg-green-50 dark:bg-green-900/30' : ''}
            ${istFalsch ? 'border-red-500 bg-red-50 dark:bg-red-900/30' : ''}
            ${!feedbackSichtbar ? 'border-gray-200 dark:border-gray-600' : ''}
          `}>
            <p className="mb-2 dark:text-white">{aussage.text}</p>
            <div className="flex gap-2">
              <button
                onClick={() => { if (!disabled) setBewertungen(prev => ({ ...prev, [key]: true })) }}
                disabled={disabled}
                className={`px-4 py-2 rounded-lg min-h-[44px] font-medium transition-colors
                  ${wert === true ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700 dark:text-white'}
                `}
              >
                Richtig
              </button>
              <button
                onClick={() => { if (!disabled) setBewertungen(prev => ({ ...prev, [key]: false })) }}
                disabled={disabled}
                className={`px-4 py-2 rounded-lg min-h-[44px] font-medium transition-colors
                  ${wert === false ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700 dark:text-white'}
                `}
              >
                Falsch
              </button>
            </div>
            {feedbackSichtbar && istFalsch && aussage.erklaerung && (
              <p className="text-xs mt-2 text-gray-500 dark:text-gray-400">{aussage.erklaerung}</p>
            )}
          </div>
        )
      })}

      {!disabled && alleBewertet && !feedbackSichtbar && (
        <button onClick={handleAbsenden} className="w-full bg-blue-500 text-white rounded-xl py-3 font-medium mt-2 min-h-[48px]">
          Prüfen
        </button>
      )}

      {feedbackSichtbar && korrekt !== null && <FeedbackBox korrekt={korrekt} erklaerung={frage.musterlosung} />}
    </div>
  )
}
