import { useState } from 'react'
import type { FrageKomponenteProps } from './index'
import { seededShuffle } from '../../utils/shuffle'
import FeedbackBox from './FeedbackBox'

export default function SortierungFrage({ frage, onAntwort, disabled, feedbackSichtbar, korrekt }: FrageKomponenteProps) {
  // Typ-Narrowing auf SortierungFrage (shared discriminated union)
  if (frage.typ !== 'sortierung') return null
  const sort = frage

  const korrektReihenfolge = sort.elemente || []
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
      <p className="text-sm text-slate-500 dark:text-slate-400">Tippe zwei Elemente um sie zu tauschen.</p>

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
              ${istAusgewaehlt ? 'border-slate-500 bg-slate-50 dark:bg-slate-900/30' : ''}
              ${istKorrekt ? 'border-green-500 bg-green-50 dark:bg-green-900/30' : ''}
              ${istFalsch ? 'border-red-500 bg-red-50 dark:bg-red-900/30' : ''}
              ${!istAusgewaehlt && !istKorrekt && !istFalsch ? 'border-slate-200 dark:border-slate-600' : ''}
            `}
          >
            <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center text-sm font-medium dark:text-white">
              {i + 1}
            </span>
            <span className="dark:text-white">{element}</span>
          </button>
        )
      })}

      {!disabled && !feedbackSichtbar && (
        <button onClick={handleAbsenden} className="w-full bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-800 rounded-xl py-3 font-medium min-h-[48px]">
          Prüfen
        </button>
      )}

      {feedbackSichtbar && korrekt !== null && (
        <>
          {!korrekt && (
            <p className="text-sm text-red-500 mt-2">Richtig: {korrektReihenfolge.join(' \u2192 ')}</p>
          )}
          <FeedbackBox korrekt={korrekt} erklaerung={frage.musterlosung} />
        </>
      )}
    </div>
  )
}
