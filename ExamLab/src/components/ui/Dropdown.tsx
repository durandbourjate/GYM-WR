import { useState, useRef, useEffect, useCallback, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'

export interface DropdownOption<TValue extends string> {
  value: TValue
  label: string
  count?: number
  icon?: ReactNode
  /** Optional aria-Disabled-Hint (Renderer bleibt aber clickable). */
  disabled?: boolean
}

interface DropdownProps<TValue extends string> {
  value: TValue
  onChange: (v: TValue) => void
  options: DropdownOption<TValue>[]
  /** Trigger-Label wenn `value` der placeholder-Wert ist (z.B. ''). */
  placeholderLabel?: string
  /** Override-Label für den Trigger (sonst label der gewählten Option). */
  triggerLabel?: string
  /** Aria-Label und title für den Trigger-Button. */
  ariaLabel: string
  /** Tailwind-Class für äußere Hülle (z.B. `max-w-[180px]`). */
  className?: string
  /** Tailwind-Class für Optionen-Panel-Width (Default: `min-w-[180px]`). */
  panelClassName?: string
  /** Icon-Slot vor dem Trigger-Label (statisch, nicht aus Option). */
  triggerIcon?: ReactNode
}

const TRIGGER_CLASSES =
  'text-xs px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg ' +
  'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer ' +
  'inline-flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-slate-400'

const OPTION_CLASSES =
  'w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-200 ' +
  'hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer ' +
  'inline-flex items-center gap-2 first:rounded-t-lg last:rounded-b-lg'

/**
 * Custom-Dropdown mit Lucide-Icon-Prefix pro Option. Ersatz für native
 * `<select>` wenn Option-Icons benötigt werden (Browser rendern keine
 * SVGs in `<option>`).
 *
 * Verhalten:
 * - Click-outside schliesst Panel
 * - Tastatur: ArrowUp/Down navigiert, Enter wählt, Escape schliesst,
 *   A-Z springt zur naechsten Option mit passendem Anfangsbuchstaben
 * - Aria-Role `listbox`/`option`, `aria-selected` auf aktiver Option
 */
export default function Dropdown<TValue extends string>({
  value,
  onChange,
  options,
  placeholderLabel,
  triggerLabel,
  ariaLabel,
  className,
  panelClassName,
  triggerIcon,
}: DropdownProps<TValue>) {
  const [offen, setOffen] = useState(false)
  const [fokusIdx, setFokusIdx] = useState<number>(-1)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const gewaehlt = options.find((o) => o.value === value)
  const label = triggerLabel ?? gewaehlt?.label ?? placeholderLabel ?? ''

  const schliessen = useCallback(() => {
    setOffen(false)
    setFokusIdx(-1)
  }, [])

  // Click-outside
  useEffect(() => {
    if (!offen) return
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        schliessen()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [offen, schliessen])

  // Fokus-Reset beim Öffnen: aktive Option in Sicht bringen
  useEffect(() => {
    if (!offen) return
    const aktivIdx = options.findIndex((o) => o.value === value)
    setFokusIdx(aktivIdx >= 0 ? aktivIdx : 0)
  }, [offen, options, value])

  const handleKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!offen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault()
        setOffen(true)
      }
      return
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      schliessen()
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setFokusIdx((idx) => Math.min(options.length - 1, idx + 1))
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setFokusIdx((idx) => Math.max(0, idx - 1))
      return
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      if (fokusIdx >= 0 && fokusIdx < options.length) {
        const opt = options[fokusIdx]
        onChange(opt.value)
        schliessen()
      }
      return
    }
    // Typeahead: A-Z springt zur nächsten Option mit passendem Anfangsbuchstaben
    if (e.key.length === 1 && /[a-z0-9]/i.test(e.key)) {
      const ch = e.key.toLowerCase()
      const start = fokusIdx + 1
      const fortsetzungsIdx = options.findIndex(
        (o, i) => i >= start && o.label.toLowerCase().startsWith(ch),
      )
      const von0Idx = options.findIndex((o) => o.label.toLowerCase().startsWith(ch))
      const treffer = fortsetzungsIdx >= 0 ? fortsetzungsIdx : von0Idx
      if (treffer >= 0) {
        e.preventDefault()
        setFokusIdx(treffer)
      }
    }
  }

  // Aktuell fokussierte Option in den sichtbaren Bereich scrollen
  // (defensiv: jsdom kennt scrollIntoView nicht — Test-Helfer)
  useEffect(() => {
    if (!offen || fokusIdx < 0 || !panelRef.current) return
    const optEl = panelRef.current.querySelector<HTMLElement>(`[data-idx="${fokusIdx}"]`)
    if (optEl && typeof optEl.scrollIntoView === 'function') {
      optEl.scrollIntoView({ block: 'nearest' })
    }
  }, [offen, fokusIdx])

  return (
    <div ref={wrapperRef} className={`relative ${className ?? ''}`} onKeyDown={handleKey}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={offen}
        aria-label={ariaLabel}
        title={ariaLabel}
        onClick={() => setOffen((v) => !v)}
        className={TRIGGER_CLASSES}
      >
        {triggerIcon}
        <span className="truncate">{label}</span>
        <ChevronDown className="w-3.5 h-3.5 opacity-70" aria-hidden="true" />
      </button>
      {offen && (
        <div
          ref={panelRef}
          role="listbox"
          aria-label={ariaLabel}
          className={`absolute left-0 top-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg shadow-lg z-50 max-h-72 overflow-y-auto ${panelClassName ?? 'min-w-[180px]'}`}
        >
          {options.map((opt, idx) => {
            const aktiv = opt.value === value
            const fokus = idx === fokusIdx
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={aktiv}
                data-idx={idx}
                onClick={() => {
                  onChange(opt.value)
                  schliessen()
                }}
                onMouseEnter={() => setFokusIdx(idx)}
                className={`${OPTION_CLASSES} ${fokus ? 'bg-slate-100 dark:bg-slate-700' : ''} ${aktiv ? 'font-semibold' : ''}`}
              >
                {opt.icon && (
                  <span aria-hidden="true" className="inline-flex items-center text-slate-500 dark:text-slate-400 shrink-0">
                    {opt.icon}
                  </span>
                )}
                <span className="truncate">{opt.label}</span>
                {opt.count !== undefined && (
                  <span className="ml-auto text-[10px] text-slate-400 dark:text-slate-500 font-mono shrink-0">
                    {opt.count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
