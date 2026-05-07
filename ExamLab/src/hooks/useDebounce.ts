// ExamLab/src/hooks/useDebounce.ts
import { useCallback, useRef } from 'react'

/**
 * Debounce-Wrapper für Callbacks. Multiple Aufrufe innerhalb `delay` ms collapsen
 * zu einem Aufruf nach Ende der Pause.
 *
 * Byte-identisch zum vormaligen inline-Helper in ZeichnenCanvas.tsx.
 *
 * @example
 *   const debouncedSave = useDebounce(saveFn, 400);
 *   debouncedSave();  // einmaliger Aufruf nach 400ms ohne weitere Calls
 */
export function useDebounce<T extends (...args: Parameters<T>) => void>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  return useCallback(
    (...args: Parameters<T>) => {
      if (timerRef.current !== null) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => fn(...args), delay)
    },
    [fn, delay],
  )
}
