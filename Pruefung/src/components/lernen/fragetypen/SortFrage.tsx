import { useState } from 'react'
import type { FrageKomponenteProps } from './index'
import FeedbackBox from './FeedbackBox'

export default function SortFrage({ frage, onAntwort, disabled, feedbackSichtbar, korrekt }: FrageKomponenteProps) {
  // SortFrage = Kategorisierung (Legacy-Typ). Type narrowing via runtime check.
  const frageAny = frage as unknown as Record<string, unknown>
  const kategorien = (frageAny.kategorien as string[]) || []
  const elemente = (frageAny.elemente as { text: string; kategorie: string }[]) || []
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
      <p className="text-sm text-slate-500 dark:text-slate-400">Tippe ein Element, dann die passende Kategorie.</p>

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
                ${istAktiv ? 'border-slate-500 bg-slate-100 dark:bg-slate-900/50' : ''}
                ${istKorrekt ? 'border-green-500 bg-green-50 dark:bg-green-900/30' : ''}
                ${istFalsch ? 'border-red-500 bg-red-50 dark:bg-red-900/30' : ''}
                ${!istAktiv && !istKorrekt && !istFalsch ? 'border-slate-200 dark:border-slate-600' : ''}
                dark:text-white
              `}
            >
              {el.text}
              {zugeordnet && !feedbackSichtbar && <span className="ml-1 text-xs text-slate-400"> → {zugeordnet}</span>}
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
              className="px-4 py-2 rounded-lg min-h-[44px] bg-slate-100 dark:bg-slate-700 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-600 font-medium"
            >
              {kat}
            </button>
          ))}
        </div>
      )}

      {!disabled && alleZugeordnet && !feedbackSichtbar && (
        <button onClick={handleAbsenden} className="w-full bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-800 rounded-xl py-3 font-medium min-h-[48px]">
          Prüfen
        </button>
      )}

      {feedbackSichtbar && korrekt !== null && <FeedbackBox korrekt={korrekt} erklaerung={frage.musterlosung} />}
    </div>
  )
}
