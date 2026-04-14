import { useState } from 'react'
import type { KontrollStufe } from '../../../types/lockdown'

interface Props {
  value: KontrollStufe
  onChange: (stufe: KontrollStufe) => void
  disabled?: boolean
}

const STUFEN: {
  key: KontrollStufe
  label: string
  icon: string
  beschreibung: string
  details: string[]
}[] = [
  {
    key: 'keine',
    label: 'Keine',
    icon: '⚪',
    beschreibung: 'Für Übungen',
    details: ['Kein Logging', 'Keine Einschränkungen', 'Kein Vollbild'],
  },
  {
    key: 'locker',
    label: 'Locker',
    icon: '🟢',
    beschreibung: 'Nur Logging',
    details: ['Verstösse geloggt', 'Warnung angezeigt', 'Kein Block'],
  },
  {
    key: 'standard',
    label: 'Standard',
    icon: '🟡',
    beschreibung: 'Vollbild + Block',
    details: ['Copy/Paste blockiert', 'Vollbild erzwungen', 'Tab-Wechsel erkannt', '3 Verstösse → Sperre'],
  },
  {
    key: 'streng',
    label: 'Streng',
    icon: '🔴',
    beschreibung: 'Sofort-Pause',
    details: ['Sofortige Pause', 'SEB empfohlen', 'Kein Tab-Wechsel'],
  },
]

export function KontrollStufeSelect({ value, onChange, disabled }: Props) {
  const [detailsOffen, setDetailsOffen] = useState(false)
  return (
    <div>
      {/* Titel — klickbar zum Ein-/Ausklappen */}
      <button
        type="button"
        onClick={() => setDetailsOffen(!detailsOffen)}
        className="flex items-center gap-1.5 mb-1 cursor-pointer group"
      >
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Kontrollstufe
        </span>
        <span className="text-[10px] text-slate-400 dark:text-slate-500 transition-transform duration-150 inline-block"
          style={{ transform: detailsOffen ? 'rotate(90deg)' : 'rotate(0deg)' }}
        >
          ▶
        </span>
      </button>

      {/* Stufen-Buttons + Beschreibung unter aktivem Button */}
      <div className={`grid grid-cols-4 border border-slate-300 dark:border-slate-600 ${detailsOffen ? 'rounded-t-lg' : 'rounded-lg'} overflow-hidden`}>
        {STUFEN.map((s) => {
          const istAktiv = value === s.key
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => !disabled && onChange(s.key)}
              disabled={disabled}
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                istAktiv
                  ? 'bg-blue-600 text-white'
                  : disabled
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-600'
                    : 'bg-white text-slate-700 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300'
              } ${s.key !== 'keine' ? 'border-l border-slate-300 dark:border-slate-600' : ''}`}
            >
              {s.icon} {s.label}
            </button>
          )
        })}
        {/* Beschreibung unter dem aktiven Button */}
        {STUFEN.map((s) => (
          <div
            key={s.key}
            className={`px-2 py-1 text-xs border-t border-slate-200 dark:border-slate-700 ${
              s.key !== 'keine' ? 'border-l border-slate-200 dark:border-slate-700' : ''
            } ${value === s.key ? 'text-slate-600 dark:text-slate-300' : 'text-transparent'}`}
          >
            {s.beschreibung}
          </div>
        ))}
      </div>

      {/* Details als Spalten unter den Buttons */}
      {detailsOffen && (
        <div className="grid grid-cols-4 gap-0 border border-t-0 border-slate-200 dark:border-slate-700 rounded-b-lg overflow-hidden bg-slate-50 dark:bg-slate-800/50">
          {STUFEN.map((s) => (
            <div
              key={s.key}
              className={`px-2 py-2 text-xs text-slate-600 dark:text-slate-400 ${
                s.key !== 'keine' ? 'border-l border-slate-200 dark:border-slate-700' : ''
              }`}
            >
              <ul className="space-y-0.5">
                {s.details.map((d, i) => (
                  <li key={i} className="flex items-start gap-1">
                    <span className="text-slate-400 dark:text-slate-500 shrink-0">•</span>
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {/* iPad-Hinweis über volle Breite */}
          <div className="col-span-4 px-3 py-1.5 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-400 dark:text-slate-500">
            Auf iPads wird die Stufe automatisch angepasst (kein Vollbild möglich).
          </div>
        </div>
      )}
    </div>
  )
}
