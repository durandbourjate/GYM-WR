import { useEffect, useRef, useCallback } from 'react'

/**
 * Bundle G.a — Hover-Hook mit Debounce.
 *
 * Liefert `onMouseEnter` + `onMouseLeave`-Handler. `callback` wird `delayMs`
 * nach `onMouseEnter` ausgelöst, sofern `onMouseLeave` nicht vorher feuert.
 * Re-Enter während laufendem Timer: kein erneutes Feuern.
 *
 * Verwendung in einem JSX-Element:
 *   const hover = useDebouncedHover(300, () => preWarmFragen(...))
 *   <div onMouseEnter={hover.onMouseEnter} onMouseLeave={hover.onMouseLeave}>
 */
export function useDebouncedHover(
  delayMs: number,
  callback: () => void,
): { onMouseEnter: () => void; onMouseLeave: () => void } {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  const onMouseEnter = useCallback(() => {
    if (timerRef.current !== null) return // bereits aktiv → nicht zurücksetzen
    timerRef.current = setTimeout(() => {
      timerRef.current = null
      callbackRef.current()
    }, delayMs)
  }, [delayMs])

  const onMouseLeave = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  // Cleanup bei Unmount
  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [])

  return { onMouseEnter, onMouseLeave }
}
