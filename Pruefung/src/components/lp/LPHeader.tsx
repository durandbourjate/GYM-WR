import { useEffect } from 'react'
import { useAuthStore } from '../../store/authStore.ts'
import ThemeToggle from '../ThemeToggle.tsx'
import { APP_VERSION } from '../../version'

interface Props {
  titel: string
  untertitel?: string
  zurueck?: () => void
  statusText?: string
  ansichtsButtons?: React.ReactNode
  onFragenbank?: () => void
  onHilfe?: () => void
  fragebankOffen?: boolean
  hilfeOffen?: boolean
}

export default function LPHeader({ titel, untertitel, zurueck, statusText, ansichtsButtons, onFragenbank, onHilfe, fragebankOffen, hilfeOffen }: Props) {
  const abmelden = useAuthStore((s) => s.abmelden)

  // ESC-Handler: schliesst oberstes Panel
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent): void {
      if (e.key !== 'Escape') return
      if (fragebankOffen && onFragenbank) onFragenbank()
      else if (hilfeOffen && onHilfe) onHilfe()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [fragebankOffen, hilfeOffen, onFragenbank, onHilfe])

  const buttonClass = 'px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer'

  return (
    <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-2.5 sticky top-0 z-[60]">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          {zurueck && (
            <button onClick={zurueck} className={buttonClass}>
              ← Zurück
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100">{titel}</h1>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">{APP_VERSION}</span>
            </div>
            {untertitel && (
              <p className="text-sm text-slate-500 dark:text-slate-400">{untertitel}</p>
            )}
          </div>
          {statusText && (
            <span className="text-sm text-green-600 dark:text-green-400">{statusText}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {ansichtsButtons}
          {ansichtsButtons && (
            <span className="w-px h-5 bg-slate-200 dark:bg-slate-600 mx-1" />
          )}
          {onFragenbank && (
            <button onClick={onFragenbank} className={buttonClass}>Fragenbank</button>
          )}
          {onHilfe && (
            <button onClick={onHilfe} className={buttonClass}>Hilfe</button>
          )}
          <ThemeToggle />
          <button
            onClick={abmelden}
            className="px-2 py-1.5 text-sm text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            Abmelden
          </button>
        </div>
      </div>
    </header>
  )
}
