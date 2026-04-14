import { useState } from 'react'

interface AbschnittProps {
  titel: string
  children: React.ReactNode
  /** Optionaler Inhalt rechts neben dem Titel (z.B. Buttons) */
  titelRechts?: React.ReactNode
  /** Wenn true, kann der Abschnitt ein-/ausgeklappt werden */
  einklappbar?: boolean
  /** Initialer Zustand: offen (true) oder geschlossen (false). Standard: true */
  standardOffen?: boolean
}

export function Abschnitt({ titel, children, titelRechts, einklappbar, standardOffen = true }: AbschnittProps) {
  const [offen, setOffen] = useState(standardOffen)

  return (
    <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-4 transition-colors hover:border-slate-300 dark:hover:border-slate-600">
      <div
        className={`flex items-center justify-between ${einklappbar ? 'cursor-pointer select-none group' : ''}`}
        onClick={einklappbar ? () => setOffen(!offen) : undefined}
      >
        <div className="flex items-center gap-1.5">
          {einklappbar && (
            <span className="text-[10px] text-slate-400 dark:text-slate-500 transition-transform duration-150 group-hover:text-slate-600 dark:group-hover:text-slate-300"
              style={{ transform: offen ? 'rotate(90deg)' : 'rotate(0deg)', display: 'inline-block' }}
            >
              ▶
            </span>
          )}
          <h3 className={`text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide ${einklappbar ? 'group-hover:text-slate-800 dark:group-hover:text-slate-100 transition-colors' : ''}`}>
            {titel}
          </h3>
        </div>
        {titelRechts && <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>{titelRechts}</div>}
      </div>
      {(!einklappbar || offen) && (
        <div className={einklappbar ? 'mt-3' : 'mt-3'}>
          {children}
        </div>
      )}
    </div>
  )
}

export function Feld({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">{label}</label>
      {children}
    </div>
  )
}
