import { useEffect, useRef, useState } from 'react'
import type { SucheErgebnis } from '../../../hooks/useGlobalSuche.shared'

interface Props {
  suchen: string
  onSuchen: (s: string) => void
  ergebnis: SucheErgebnis
  istFokussiert?: boolean
  placeholder?: string
}

const IS_MAC = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform)
const SHORTCUT_KEY = IS_MAC ? '⌘K' : 'Ctrl+K'

export function GlobalSuche({ suchen, onSuchen, ergebnis, istFokussiert, placeholder = 'Suchen …' }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [fokussiert, setFokussiert] = useState(!!istFokussiert)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const isMetaK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k'
      if (isMetaK) {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      onSuchen('')
      inputRef.current?.blur()
    } else if (e.key === 'Enter') {
      const ersterTreffer = ergebnis.gruppen[0]?.treffer[0]
      if (ersterTreffer) ersterTreffer.onOpen()
    }
  }

  const panelOffen = (fokussiert || istFokussiert) && suchen.trim().length > 0
  const totalTreffer = ergebnis.gruppen.reduce((acc, g) => acc + g.treffer.length, 0)

  return (
    <div className="relative flex-shrink-0">
      {/* Höhe: py-1.5 + text-sm → matcht TabKaskade-Tabs (TAB_BASE). */}
      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">⌕</span>
      <input
        ref={inputRef}
        role="searchbox"
        aria-label="ExamLab durchsuchen"
        type="search"
        placeholder={placeholder}
        value={suchen}
        onChange={(e) => onSuchen(e.target.value)}
        onFocus={() => setFokussiert(true)}
        onBlur={() => setTimeout(() => setFokussiert(false), 150)}
        onKeyDown={handleKeyDown}
        className={`bg-slate-100 dark:bg-slate-700 rounded-md pl-8 pr-12 py-1.5 text-sm text-slate-900 dark:text-slate-100 outline-none border border-transparent transition-all ${
          fokussiert ? 'bg-white dark:bg-slate-800 border-violet-500 w-[360px]' : 'w-[220px]'
        }`}
      />
      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] bg-slate-200 dark:bg-slate-600 text-slate-500 dark:text-slate-300 px-1 rounded pointer-events-none">
        {fokussiert ? 'ESC' : SHORTCUT_KEY}
      </span>
      {panelOffen && (
        <div role="listbox" className="absolute top-full left-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-xl min-w-[440px] max-h-[420px] overflow-y-auto p-1 z-20">
          {ergebnis.istLadend && (
            <div className="px-3 py-4 text-sm text-slate-500 text-center">Lade Daten …</div>
          )}
          {!ergebnis.istLadend && ergebnis.gruppen.length === 0 && (
            <div className="px-3 py-4 text-sm text-slate-500 text-center">Keine Treffer</div>
          )}
          {!ergebnis.istLadend && ergebnis.gruppen.map((g) => (
            <div key={g.id} role="group" aria-label={g.label}>
              <div className="flex items-center justify-between px-2.5 pt-2 pb-1">
                <span className="text-[10px] uppercase tracking-wide text-slate-500">{g.label}</span>
                {g.kontextTag && (
                  <span className="text-[10px] bg-violet-100 dark:bg-violet-900 text-violet-700 dark:text-violet-300 px-1.5 rounded-full">{g.kontextTag}</span>
                )}
              </div>
              {g.treffer.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="option"
                  aria-selected={false}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={t.onOpen}
                  className="w-full text-left px-2.5 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer text-sm text-slate-900 dark:text-slate-100"
                >
                  <div className="font-medium">{t.titel}</div>
                  {t.meta && <div className="text-xs text-slate-500">{t.meta}</div>}
                </button>
              ))}
            </div>
          ))}
          {!ergebnis.istLadend && totalTreffer > 0 && (
            <div className="border-t border-slate-100 dark:border-slate-700 mt-1 px-2.5 py-1.5 text-[11px] text-slate-500 flex justify-between">
              <span>↑↓ navigieren · Enter öffnen · {SHORTCUT_KEY} fokussieren</span>
              <span>{totalTreffer} Treffer</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
