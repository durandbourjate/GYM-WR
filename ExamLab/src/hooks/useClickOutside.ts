import { useEffect, type RefObject } from 'react'

/**
 * Ruft `callback`, wenn Mousedown ausserhalb des Ref-Elements stattfindet.
 * Nutzt `mousedown` (nicht `click`), damit `onBlur`-Reihenfolge stimmig bleibt.
 */
export function useClickOutside<T extends HTMLElement>(
  ref: RefObject<T | null>,
  callback: () => void,
) {
  useEffect(() => {
    function handle(e: MouseEvent) {
      const target = e.target as Node | null
      if (!target) return
      if (ref.current && !ref.current.contains(target)) callback()
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [ref, callback])
}
