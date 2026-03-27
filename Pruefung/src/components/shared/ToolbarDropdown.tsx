import { useState, useRef, useEffect, useCallback, type ReactNode } from 'react'

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
}

/**
 * Toolbar-Button mit Dropdown-Panel.
 * Panel wird mit fixed-Position gerendert (nicht vom overflow: hidden abgeschnitten).
 * - Horizontal: Panel öffnet nach unten
 * - Vertikal: Panel öffnet nach rechts
 */
export default function ToolbarDropdown({
  icon,
  label,
  aktiv = false,
  horizontal = false,
  children,
  className,
}: Props) {
  const [offen, setOffen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [panelPos, setPanelPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 })

  // Panel-Position beim Öffnen berechnen
  const berechnePanelPosition = useCallback(() => {
    if (!buttonRef.current) return
    const rect = buttonRef.current.getBoundingClientRect()
    if (horizontal) {
      setPanelPos({ top: rect.bottom + 4, left: rect.left })
    } else {
      setPanelPos({ top: rect.top, left: rect.right + 4 })
    }
  }, [horizontal])

  // Klick ausserhalb schliesst Dropdown
  useEffect(() => {
    if (!offen) return
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node
      if (
        buttonRef.current && !buttonRef.current.contains(target) &&
        panelRef.current && !panelRef.current.contains(target)
      ) {
        setOffen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [offen])

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        title={label}
        onClick={() => {
          if (!offen) berechnePanelPosition()
          setOffen(!offen)
        }}
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
          ref={panelRef}
          className="fixed z-[60] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg shadow-lg p-1.5"
          style={{ top: panelPos.top, left: panelPos.left }}
          onClick={() => setOffen(false)}
        >
          {children}
        </div>
      )}
    </>
  )
}
