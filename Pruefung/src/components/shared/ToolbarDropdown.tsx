import { useState, useRef, useEffect, type ReactNode } from 'react'

interface Props {
  /** Icon im Button (ReactNode oder string) */
  icon: ReactNode
  /** Tooltip */
  label: string
  /** Button ist aktiv/hervorgehoben */
  aktiv?: boolean
  /** Toolbar-Layout bestimmt Dropdown-Richtung */
  horizontal?: boolean
  /** Inhalt des Dropdown-Panels */
  children: ReactNode
  /** Optionale zusätzliche CSS-Klassen für den Button */
  className?: string
  /** Wird beim Öffnen des Dropdowns aufgerufen (z.B. Werkzeug aktivieren) */
  onOpen?: () => void
}

/**
 * Toolbar-Button mit Modal-Dropdown.
 * Klick auf den Button öffnet das Dropdown UND ruft onOpen auf (z.B. Werkzeug aktivieren).
 * Panel schwebt über dem Canvas (absolute + z-index).
 * Vertikal: öffnet nach rechts. Horizontal: öffnet nach unten.
 */
export default function ToolbarDropdown({
  icon,
  label,
  aktiv = false,
  horizontal = false,
  children,
  className,
  onOpen,
}: Props) {
  const [offen, setOffen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Klick ausserhalb schliesst Dropdown
  useEffect(() => {
    if (!offen) return
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOffen(false)
      }
    }
    document.addEventListener('pointerdown', handleClickOutside)
    return () => document.removeEventListener('pointerdown', handleClickOutside)
  }, [offen])

  function handleButtonClick() {
    const wirdGeoeffnet = !offen
    setOffen(wirdGeoeffnet)
    // Werkzeug aktivieren beim Öffnen
    if (wirdGeoeffnet && onOpen) {
      onOpen()
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        title={label}
        onClick={handleButtonClick}
        className={[
          'min-w-[44px] min-h-[44px] flex items-center justify-center rounded text-sm font-medium transition-colors',
          aktiv
            ? 'bg-white dark:bg-slate-600 shadow-sm text-slate-900 dark:text-slate-100'
            : 'bg-transparent hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300',
          offen ? 'ring-1 ring-slate-400 dark:ring-slate-500' : '',
          className ?? '',
        ].join(' ')}
      >
        {icon}
        <span className="text-[8px] ml-0.5 opacity-50">▾</span>
      </button>

      {offen && (
        <div
          className={[
            'absolute z-[60] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg shadow-xl p-2',
            horizontal
              ? 'top-full left-0 mt-1'
              : 'left-full top-0 ml-1',
          ].join(' ')}
          onClick={() => setOffen(false)}
        >
          {children}
        </div>
      )}
    </div>
  )
}
