import { useState, useRef, useEffect } from 'react'
import { Settings, Sun, Moon, HelpCircle, AlertTriangle, LogOut } from 'lucide-react'
import type { Rolle } from './types'

interface Props {
  rolle: Rolle
  benutzerName: string
  theme: 'light' | 'dark'
  onThemeToggle: () => void
  onHilfe: () => void
  onFeedback: () => void
  onAbmelden: () => void
  onEinstellungen?: () => void
}

export function OptionenMenu({ rolle, benutzerName, theme, onThemeToggle, onHilfe, onFeedback, onAbmelden, onEinstellungen }: Props) {
  const [offen, setOffen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!offen) return
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOffen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOffen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [offen])

  function itemClass(danger = false) {
    return `w-full text-left px-2.5 py-1.5 text-sm rounded flex items-center gap-2.5 cursor-pointer ${
      danger
        ? 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950'
        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
    }`
  }

  const feedbackLabel = 'Problem melden'
  const hilfeLabel = rolle === 'sus' ? 'Hilfe (SuS)' : 'Hilfe & Anleitungen'

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOffen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={offen}
        aria-label="Menü"
        className="px-2 py-1 text-lg text-slate-600 dark:text-slate-300 rounded hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
      >
        ⋮
      </button>
      {offen && (
        <div role="menu" className="absolute right-0 top-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-lg min-w-[220px] p-1 z-30">
          <div className="px-2.5 py-1 text-[10px] uppercase tracking-wide text-slate-400">Benutzer</div>
          <div role="menuitem" className="px-2.5 py-1.5 text-sm text-slate-700 dark:text-slate-200 flex items-center justify-between">
            <span>{benutzerName}</span>
            <span className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-500 px-1.5 rounded">{rolle === 'lp' ? 'LP' : 'SuS'}</span>
          </div>
          <div className="h-px bg-slate-200 dark:bg-slate-700 my-1" role="separator" />
          {rolle === 'lp' && onEinstellungen && (
            <button role="menuitem" type="button" onClick={() => { onEinstellungen(); setOffen(false) }} className={itemClass()}>
              <Settings className="w-4 h-4 shrink-0 text-slate-500 dark:text-slate-400" aria-hidden="true" />Einstellungen
            </button>
          )}
          <button role="menuitem" type="button" onClick={() => { onThemeToggle() }} className={itemClass()}>
            {theme === 'dark'
              ? <Sun className="w-4 h-4 shrink-0 text-yellow-500" aria-hidden="true" />
              : <Moon className="w-4 h-4 shrink-0 text-slate-500 dark:text-slate-400" aria-hidden="true" />}
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
          <button role="menuitem" type="button" onClick={() => { onHilfe(); setOffen(false) }} className={itemClass()}>
            <HelpCircle className="w-4 h-4 shrink-0 text-slate-500 dark:text-slate-400" aria-hidden="true" />{hilfeLabel}
          </button>
          <button role="menuitem" type="button" onClick={() => { onFeedback(); setOffen(false) }} className={itemClass()}>
            <AlertTriangle className="w-4 h-4 shrink-0 text-yellow-500" aria-hidden="true" />{feedbackLabel}
          </button>
          <div className="h-px bg-slate-200 dark:bg-slate-700 my-1" role="separator" />
          <button role="menuitem" type="button" onClick={() => { onAbmelden(); setOffen(false) }} className={itemClass(true)}>
            <LogOut className="w-4 h-4 shrink-0" aria-hidden="true" />Abmelden
          </button>
        </div>
      )}
    </div>
  )
}
