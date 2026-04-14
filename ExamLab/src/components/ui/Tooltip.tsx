import { useState, useRef, useEffect, type ReactNode } from 'react'

interface Props {
  text: string
  position?: 'top' | 'bottom' | 'left' | 'right'
  children: ReactNode
}

/**
 * Wiederverwendbare Tooltip-Komponente.
 * Zeigt bei Hover einen Tooltip mit leichter Verzögerung (~300ms).
 * CSS-only Opacity-Transition, kein npm-Dependency.
 */
export default function Tooltip({ text, position = 'bottom', children }: Props) {
  const [sichtbar, setSichtbar] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleMouseEnter(): void {
    timerRef.current = setTimeout(() => setSichtbar(true), 300)
  }

  function handleMouseLeave(): void {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = null
    setSichtbar(false)
  }

  // Cleanup bei Unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  // Positionierungsklassen
  const posKlassen: Record<string, string> = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      <span
        className={`absolute z-[9999] pointer-events-none whitespace-nowrap px-2.5 py-1.5 text-xs font-medium rounded-md shadow-lg max-w-[240px] text-center transition-opacity duration-200 ${posKlassen[position]} ${
          sichtbar ? 'opacity-100' : 'opacity-0'
        } bg-slate-800/90 text-white dark:bg-slate-200/90 dark:text-slate-800`}
        role="tooltip"
      >
        {text}
      </span>
    </span>
  )
}
