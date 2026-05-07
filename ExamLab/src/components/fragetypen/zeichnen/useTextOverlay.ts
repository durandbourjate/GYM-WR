// ExamLab/src/components/fragetypen/zeichnen/useTextOverlay.ts
import { useCallback, useEffect, useRef, useState } from 'react'

interface TextOverlayState {
  sichtbar: boolean
  logischX: number
  logischY: number
  cssLeft: number
  cssTop: number
  text: string
}

const TEXT_OVERLAY_LEER: TextOverlayState = {
  sichtbar: false,
  logischX: 0,
  logischY: 0,
  cssLeft: 0,
  cssTop: 0,
  text: '',
}

interface UseTextOverlayOptions {
  /** Wird aufgerufen wenn der User den Text bestätigt (Enter/Blur mit Inhalt). text ist bereits getrimmt. */
  onCommit: (params: { text: string; logischX: number; logischY: number }) => void
}

interface UseTextOverlayResult {
  // Read-State (für JSX)
  sichtbar: boolean
  cssLeft: number
  cssTop: number
  text: string

  // Write-API
  setText: (text: string) => void
  oeffnen: (params: { logischX: number; logischY: number; cssLeft: number; cssTop: number }) => void
  abschliessen: (abbrechen?: boolean) => void
  /** Spezial-Variante für JSX-onBlur — ignoriert Blur in den ersten 400ms nach Öffnen. */
  abschliessenViaBlur: () => void

  // Refs (für JSX + usePointerEvents-Guard)
  inputRef: React.RefObject<HTMLInputElement | null>
  sichtbarRef: React.RefObject<boolean>
}

/**
 * Text-Overlay-State-Machine für ZeichnenCanvas.
 *
 * Verantwortlich für:
 * - State-Lifecycle (oeffnen → typing → abschliessen)
 * - Auto-Focus (sofort + 50ms-Fallback-Timer für iOS/Tablet)
 * - Outside-Click-Listener (capture: true, mit setTimeout(0)-Initial-Tick-Skip)
 * - Blur-Suppress in ersten 400ms nach Öffnen (Browser-Click-auf-Canvas-Blur ignorieren)
 *
 * Hook ist decoupled von Drawing-Engine: onCommit bekommt nur Text + Position.
 *
 * Byte-identische Behavior-Kontrakt mit Source ZeichnenCanvas.tsx Z. 169-178, 346-412.
 */
export function useTextOverlay({ onCommit }: UseTextOverlayOptions): UseTextOverlayResult {
  const [state, setState] = useState<TextOverlayState>(TEXT_OVERLAY_LEER)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const sichtbarRef = useRef<boolean>(false)
  const geoeffnetRef = useRef<number>(0)

  const onCommitRef = useRef(onCommit)
  onCommitRef.current = onCommit

  useEffect(() => {
    sichtbarRef.current = state.sichtbar
  }, [state.sichtbar])

  const oeffnen = useCallback(
    (params: { logischX: number; logischY: number; cssLeft: number; cssTop: number }) => {
      setState({
        sichtbar: true,
        logischX: params.logischX,
        logischY: params.logischY,
        cssLeft: params.cssLeft,
        cssTop: params.cssTop,
        text: '',
      })
    },
    [],
  )

  const setText = useCallback((text: string) => {
    setState(prev => ({ ...prev, text }))
  }, [])

  const abschliessen = useCallback((abbrechen = false) => {
    setState(prev => {
      if (!prev.sichtbar) return prev

      if (!abbrechen && prev.text.trim().length > 0) {
        onCommitRef.current({
          text: prev.text.trim(),
          logischX: prev.logischX,
          logischY: prev.logischY,
        })
      }

      return TEXT_OVERLAY_LEER
    })
  }, [])

  const abschliessenViaBlur = useCallback(() => {
    if (Date.now() - geoeffnetRef.current < 400) return
    setTimeout(() => abschliessen(false), 150)
  }, [abschliessen])

  useEffect(() => {
    if (state.sichtbar && inputRef.current) {
      geoeffnetRef.current = Date.now()
      inputRef.current.focus()
      const timer = setTimeout(() => {
        inputRef.current?.focus()
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [state.sichtbar])

  useEffect(() => {
    if (!state.sichtbar) return

    function handleAussenklick(e: PointerEvent) {
      const input = inputRef.current
      if (!input) return
      if (input.closest('div')?.contains(e.target as Node)) return
      abschliessen(false)
    }

    const timer = setTimeout(() => {
      document.addEventListener('pointerdown', handleAussenklick, { capture: true })
    }, 0)

    return () => {
      clearTimeout(timer)
      document.removeEventListener('pointerdown', handleAussenklick, { capture: true })
    }
  }, [state.sichtbar, abschliessen])

  return {
    sichtbar: state.sichtbar,
    cssLeft: state.cssLeft,
    cssTop: state.cssTop,
    text: state.text,
    setText,
    oeffnen,
    abschliessen,
    abschliessenViaBlur,
    inputRef,
    sichtbarRef,
  }
}
