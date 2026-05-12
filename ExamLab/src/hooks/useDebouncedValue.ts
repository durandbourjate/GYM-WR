import { useEffect, useState } from 'react'

/**
 * Liefert einen verzögerten Wert. Nach jeder Value-Änderung wird der Timer
 * neu gestartet; erst wenn `delayMs` vergangen ist ohne weitere Änderung,
 * wird der neue Wert übernommen. Nützlich für search-as-you-type Debounce.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState<T>(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])
  return debounced
}
