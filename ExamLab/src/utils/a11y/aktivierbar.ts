import type { KeyboardEvent } from 'react'

/** Macht ein nicht-natives Control (z.B. <div>) per Tastatur bedienbar.
 *  Rein additiv neben bestehende onClick/Pointer-Handler verwenden. */
export function aktivierbar(
  onAktivieren: () => void,
  opts: { disabled?: boolean } = {},
): { role: 'button'; tabIndex: number; onKeyDown: (e: KeyboardEvent) => void } {
  return {
    role: 'button',
    tabIndex: opts.disabled ? -1 : 0,
    onKeyDown: (e) => {
      if (opts.disabled) return
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onAktivieren()
      }
    },
  }
}
