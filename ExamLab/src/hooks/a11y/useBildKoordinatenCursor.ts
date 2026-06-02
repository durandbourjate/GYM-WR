import { useState, useCallback } from 'react'
import type { KeyboardEvent } from 'react'

const STANDARD_SCHRITT = 2     // % pro Pfeildruck
const FEIN_SCHRITT = 0.5       // % mit Shift
const clamp = (v: number) => Math.max(0, Math.min(100, v))

export function useBildKoordinatenCursor(opts: {
  onPlatzieren: (pos: { x: number; y: number }) => void
  disabled?: boolean
  start?: { x: number; y: number }
}) {
  const [pos, setPos] = useState(opts.start ?? { x: 50, y: 50 })
  const [aktiv, setAktiv] = useState(false)
  const onKeyDown = useCallback((e: KeyboardEvent) => {
    if (opts.disabled) return
    const s = e.shiftKey ? FEIN_SCHRITT : STANDARD_SCHRITT
    switch (e.key) {
      case 'ArrowLeft':  e.preventDefault(); setAktiv(true); setPos(p => ({ ...p, x: clamp(p.x - s) })); break
      case 'ArrowRight': e.preventDefault(); setAktiv(true); setPos(p => ({ ...p, x: clamp(p.x + s) })); break
      case 'ArrowUp':    e.preventDefault(); setAktiv(true); setPos(p => ({ ...p, y: clamp(p.y - s) })); break
      case 'ArrowDown':  e.preventDefault(); setAktiv(true); setPos(p => ({ ...p, y: clamp(p.y + s) })); break
      case 'Enter': case ' ': e.preventDefault(); opts.onPlatzieren(pos); break
    }
  }, [opts, pos])
  return { pos, aktiv, onKeyDown }
}
