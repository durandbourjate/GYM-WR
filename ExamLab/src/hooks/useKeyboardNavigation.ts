import { useState, useCallback } from 'react'

export interface UseKeyboardNavigationOpts {
  itemCount: number
  onEnter: (index: number) => void
  onEscape: () => void
}

/**
 * Generischer Keyboard-Nav-Hook für Listen mit Pfeil-Hoch/Runter,
 * Enter (öffnet aktiv oder Index 0) und Escape.
 */
export function useKeyboardNavigation(opts: UseKeyboardNavigationOpts) {
  const [activeIndex, setActiveIndex] = useState(-1)

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLElement> | KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault?.()
        setActiveIndex(prev => Math.min(prev + 1, opts.itemCount - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault?.()
        setActiveIndex(prev => Math.max(prev - 1, -1))
      } else if (e.key === 'Enter') {
        e.preventDefault?.()
        const idx = activeIndex >= 0 ? activeIndex : 0
        if (opts.itemCount > 0) opts.onEnter(idx)
      } else if (e.key === 'Escape') {
        opts.onEscape()
      }
    },
    [activeIndex, opts],
  )

  const reset = useCallback(() => setActiveIndex(-1), [])

  return { activeIndex, handleKeyDown, reset, setActiveIndex }
}
