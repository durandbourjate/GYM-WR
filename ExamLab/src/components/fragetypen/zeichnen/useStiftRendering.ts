import { useCallback, useEffect, useRef } from 'react'
import type { DrawCommand, Point } from './ZeichnenTypes'

interface StiftMeta {
  id: string
  farbe: string
  breite: number
  gestrichelt?: boolean
}

interface UseStiftRenderingOptions {
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  /** Engine-Render-Funktion mit optionalem Preview-Command */
  renderMitPreview: (ctx: CanvasRenderingContext2D, previewCmd: DrawCommand | null) => void
}

interface UseStiftRenderingResult {
  stiftBufferRef: React.MutableRefObject<Point[]>
  stiftMetaRef: React.MutableRefObject<StiftMeta | null>
  /** Read-only-Ref für Render-Loop-Guard (true wenn rAF aktiv) */
  istAktivRef: React.RefObject<boolean>
  starteRendering: () => void
  stoppeRendering: () => void
}

/**
 * rAF-basiertes Stift-Preview-Rendering ohne React-State-Updates.
 *
 * Performance-Pattern (Session 50): Pointer-Move-Events füllen stiftBufferRef
 * direkt (kein State-Update); rAF-Loop liest den Buffer pro Frame und ruft
 * renderMitPreview(ctx, previewCmd). Verhindert Re-Render pro Pointer-Event
 * bei schnellem Zeichnen auf Tablet.
 *
 * Byte-identische Behavior-Kontrakt mit Source ZeichnenCanvas.tsx Z. 188-263.
 */
export function useStiftRendering({
  canvasRef,
  renderMitPreview,
}: UseStiftRenderingOptions): UseStiftRenderingResult {
  const stiftBufferRef = useRef<Point[]>([])
  const stiftMetaRef = useRef<StiftMeta | null>(null)
  const rafIdRef = useRef<number | null>(null)
  const istAktivRef = useRef<boolean>(false)

  const renderMitPreviewRef = useRef(renderMitPreview)
  renderMitPreviewRef.current = renderMitPreview

  const starteRendering = useCallback(() => {
    if (istAktivRef.current) return
    istAktivRef.current = true

    const cvs: HTMLCanvasElement | null = canvasRef.current
    if (!cvs) return
    const context: CanvasRenderingContext2D | null = cvs.getContext('2d')
    if (!context) return

    const c = context
    const el = cvs
    const dpr = window.devicePixelRatio || 1

    function frame() {
      if (!istAktivRef.current) return

      const meta = stiftMetaRef.current
      const punkte = stiftBufferRef.current

      const previewCmd: DrawCommand | null =
        meta && punkte.length > 0
          ? { id: meta.id, typ: 'stift', punkte, farbe: meta.farbe, breite: meta.breite, gestrichelt: meta.gestrichelt }
          : null

      c.save()
      c.fillStyle = '#ffffff'
      c.fillRect(0, 0, el.width, el.height)
      c.restore()

      c.save()
      c.scale(dpr, dpr)
      renderMitPreviewRef.current(c, previewCmd)
      c.restore()

      rafIdRef.current = requestAnimationFrame(frame)
    }

    rafIdRef.current = requestAnimationFrame(frame)
  }, [canvasRef])

  const stoppeRendering = useCallback(() => {
    istAktivRef.current = false
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current)
      rafIdRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => {
      istAktivRef.current = false
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current)
      }
    }
  }, [])

  return { stiftBufferRef, stiftMetaRef, istAktivRef, starteRendering, stoppeRendering }
}
