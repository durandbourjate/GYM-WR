import { useState } from 'react'
import type { FrageKomponenteProps } from './index'
import { seededShuffle } from '../../utils/shuffle'

export default function SortierungFrage({ frage, onAntwort, disabled, feedbackSichtbar, korrekt }: FrageKomponenteProps) {
  const korrektReihenfolge = frage.reihenfolge || []
  const [reihenfolge, setReihenfolge] = useState<string[]>(() =>
    seededShuffle(korrektReihenfolge, frage.id)
  )
  const [ausgewaehlt, setAusgewaehlt] = useState<number | null>(null)

  const handleKlick = (index: number) => {
    if (disabled) return
    if (ausgewaehlt === null) {
      setAusgewaehlt(index)
    } else {
      const neu = [...reihenfolge]
      ;[neu[ausgewaehlt], neu[index]] = [neu[index], neu[ausgewaehlt]]
      setReihenfolge(neu)
      setAusgewaehlt(null)
    }
  }

  const handleAbsenden = () => {
    if (disabled) return
    onAntwort({ typ: 'sortierung', reihenfolge })
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500 dark:text-gray-400">Tippe zwei Elemente um sie zu tauschen.</p>

      {reihenfolge.map((element, i) => {
        const istAusgewaehlt = ausgewaehlt === i
        const istKorrekt = feedbackSichtbar && element === korrektReihenfolge[i]
        const istFalsch = feedbackSichtbar && element !== korrektReihenfolge[i]

        return (
          <button
            key={element}
            onClick={() => handleKlick(i)}
            disabled={disabled}
            className={`w-full text-left p-4 rounded-xl border-2 min-h-[48px] flex items-center gap-3 transition-colors
              ${istAusgewaehlt ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' : ''}
              ${istKorrekt ? 'border-green-500 bg-green-50 dark:bg-green-900/30' : ''}
              ${istFalsch ? 'border-red-500 bg-red-50 dark:bg-red-900/30' : ''}
              ${!istAusgewaehlt && !istKorrekt && !istFalsch ? 'border-gray-200 dark:border-gray-600' : ''}
            `}
          >
            <span className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-sm font-medium dark:text-white">
              {i + 1}
            </span>
            <span className="dark:text-white">{element}</span>
          </button>
        )
      })}

      {!disabled && !feedbackSichtbar && (
        <button onClick={handleAbsenden} className="w-full bg-blue-500 text-white rounded-xl py-3 font-medium min-h-[48px]">
          Pruefen
        </button>
      )}

      {feedbackSichtbar && korrekt !== null && (
        <div className={`p-4 rounded-xl ${korrekt ? 'bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200' : 'bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200'}`}>
          <p className="font-medium">{korrekt ? 'Perfekte Reihenfolge!' : 'Nicht ganz.'}</p>
          {!korrekt && <p className="mt-1 text-sm opacity-80">Richtig: {korrektReihenfolge.join(' → ')}</p>}
          {frage.erklaerung && <p className="mt-1 text-sm opacity-80">{frage.erklaerung}</p>}
        </div>
      )}
    </div>
  )
}
