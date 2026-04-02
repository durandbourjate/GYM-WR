import { useState } from 'react'
import type { FrageKomponenteProps } from './index'

export default function SortFrage({ frage, onAntwort, disabled, feedbackSichtbar, korrekt }: FrageKomponenteProps) {
  const kategorien = frage.kategorien || []
  const elemente = frage.elemente || []
  const [zuordnungen, setZuordnungen] = useState<Record<string, string>>({})
  const [aktiv, setAktiv] = useState<string | null>(null)

  const handleElementKlick = (text: string) => {
    if (disabled) return
    setAktiv(aktiv === text ? null : text)
  }

  const handleKategorieKlick = (kategorie: string) => {
    if (disabled || !aktiv) return
    setZuordnungen(prev => ({ ...prev, [aktiv]: kategorie }))
    setAktiv(null)
  }

  const alleZugeordnet = elemente.every(e => e.text in zuordnungen)

  const handleAbsenden = () => {
    if (!alleZugeordnet || disabled) return
    onAntwort({ typ: 'sort', zuordnungen })
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500 dark:text-gray-400">Tippe ein Element, dann die passende Kategorie.</p>

      <div className="flex flex-wrap gap-2">
        {elemente.map((el) => {
          const zugeordnet = zuordnungen[el.text]
          const istAktiv = aktiv === el.text
          const istKorrekt = feedbackSichtbar && zugeordnet === el.kategorie
          const istFalsch = feedbackSichtbar && zugeordnet !== undefined && zugeordnet !== el.kategorie

          return (
            <button
              key={el.text}
              onClick={() => handleElementKlick(el.text)}
              disabled={disabled}
              className={`px-4 py-2 rounded-lg min-h-[44px] font-medium transition-colors border-2
                ${istAktiv ? 'border-blue-500 bg-blue-100 dark:bg-blue-900/50' : ''}
                ${istKorrekt ? 'border-green-500 bg-green-50 dark:bg-green-900/30' : ''}
                ${istFalsch ? 'border-red-500 bg-red-50 dark:bg-red-900/30' : ''}
                ${!istAktiv && !istKorrekt && !istFalsch ? 'border-gray-200 dark:border-gray-600' : ''}
                dark:text-white
              `}
            >
              {el.text}
              {zugeordnet && !feedbackSichtbar && <span className="ml-1 text-xs text-gray-400"> → {zugeordnet}</span>}
            </button>
          )
        })}
      </div>

      {aktiv && (
        <div className="flex flex-wrap gap-2">
          {kategorien.map((kat) => (
            <button
              key={kat}
              onClick={() => handleKategorieKlick(kat)}
              className="px-4 py-2 rounded-lg min-h-[44px] bg-gray-100 dark:bg-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600 font-medium"
            >
              {kat}
            </button>
          ))}
        </div>
      )}

      {!disabled && alleZugeordnet && !feedbackSichtbar && (
        <button onClick={handleAbsenden} className="w-full bg-blue-500 text-white rounded-xl py-3 font-medium min-h-[48px]">
          Pruefen
        </button>
      )}

      {feedbackSichtbar && korrekt !== null && (
        <div className={`p-4 rounded-xl ${korrekt ? 'bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200' : 'bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200'}`}>
          <p className="font-medium">{korrekt ? 'Alles richtig zugeordnet!' : 'Nicht ganz.'}</p>
          {frage.erklaerung && <p className="mt-1 text-sm opacity-80">{frage.erklaerung}</p>}
        </div>
      )}
    </div>
  )
}
