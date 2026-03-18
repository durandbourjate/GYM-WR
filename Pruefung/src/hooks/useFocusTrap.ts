import { useEffect, useRef, type RefObject } from 'react'

const FOCUSABLE_SELECTOR =
  'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'

/** Hält den Keyboard-Fokus innerhalb eines Containers (Modal/Dialog) */
export function useFocusTrap(containerRef: RefObject<HTMLElement | null>): void {
  const previousFocusRef = useRef<Element | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Vorherigen Fokus merken
    previousFocusRef.current = document.activeElement

    // Erstes fokussierbares Element fokussieren
    const erstesElement = container.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)
    erstesElement?.focus()

    function handleKeyDown(e: KeyboardEvent): void {
      if (e.key !== 'Tab') return

      const container = containerRef.current
      if (!container) return

      // Fokussierbare Elemente bei jedem Tab neu abfragen (dynamischer Inhalt)
      const focusable = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
      if (focusable.length === 0) {
        e.preventDefault()
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (e.shiftKey) {
        // Shift+Tab: Am Anfang → zum Ende springen
        if (document.activeElement === first) {
          e.preventDefault()
          last.focus()
        }
      } else {
        // Tab: Am Ende → zum Anfang springen
        if (document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      // Vorherigen Fokus wiederherstellen
      if (previousFocusRef.current instanceof HTMLElement) {
        previousFocusRef.current.focus()
      }
    }
  }, [containerRef])
}
