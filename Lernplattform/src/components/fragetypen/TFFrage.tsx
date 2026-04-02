import { useState } from 'react'
import type { FrageKomponenteProps } from './index'

export default function TFFrage({ frage, onAntwort, disabled, feedbackSichtbar, korrekt }: FrageKomponenteProps) {
  const aussagen = frage.aussagen || []
  const [bewertungen, setBewertungen] = useState<Record<string, boolean>>({})

  const alleBewertet = aussagen.every((_, i) => String(i) in bewertungen)

  const handleAbsenden = () => {
    if (!alleBewertet || disabled) return
    onAntwort({ typ: 'tf', bewertungen })
  }

  return (
    <div className="space-y-3">
      {aussagen.map((aussage, i) => {
        const key = String(i)
        const wert = bewertungen[key]
        const istBewertet = key in bewertungen
        const istKorrekt = feedbackSichtbar && istBewertet && wert === aussage.korrekt
        const istFalsch = feedbackSichtbar && istBewertet && wert !== aussage.korrekt

        return (
          <div key={i} className={`p-4 rounded-xl border-2 transition-colors
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
          </div>
        )
      })}

      {!disabled && alleBewertet && !feedbackSichtbar && (
        <button onClick={handleAbsenden} className="w-full bg-blue-500 text-white rounded-xl py-3 font-medium mt-2 min-h-[48px]">
          Pruefen
        </button>
      )}

      {feedbackSichtbar && korrekt !== null && (
        <div className={`p-4 rounded-xl mt-2 ${korrekt ? 'bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200' : 'bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200'}`}>
          <p className="font-medium">{korrekt ? 'Alles richtig!' : 'Nicht ganz.'}</p>
          {frage.erklaerung && <p className="mt-1 text-sm opacity-80">{frage.erklaerung}</p>}
        </div>
      )}
    </div>
  )
}
