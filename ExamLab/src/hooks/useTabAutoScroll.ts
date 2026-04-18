import { useEffect, type RefObject } from 'react'

interface Options {
  /** Distanz vom Container-Rand in px, ab der Auto-Scroll einsetzt. Default 60. */
  triggerZoneWidth?: number
  /** Maximale Scroll-Geschwindigkeit in px pro Frame (direkt am Rand). Default 12. */
  maxSpeed?: number
  /** Wenn false, kein Listener. Default true. */
  enabled?: boolean
}

/**
 * Scrollt einen horizontalen Container automatisch, wenn die Maus nahe am Rand ist.
 * Geschwindigkeit skaliert linear (0 am Zonen-Rand → maxSpeed direkt am Container-Rand).
 *
 * Respektiert `prefers-reduced-motion` (kein Auto-Scroll wenn User diese Präferenz hat).
 * Scrollt nur wenn der Container tatsächlich überläuft (scrollWidth > clientWidth).
 * Kein Touch-Fallback — iPad/Touch nutzt native horizontale Scroll-Gesten.
 */
export function useTabAutoScroll(
  containerRef: RefObject<HTMLElement | null>,
  options: Options = {},
) {
  const { triggerZoneWidth = 60, maxSpeed = 12, enabled = true } = options

  useEffect(() => {
    if (!enabled) return
    const el = containerRef.current
    if (!el) return

    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion) return

    let mouseX: number | null = null
    let rafId: number | null = null

    const step = () => {
      if (mouseX === null) {
        rafId = null
        return
      }
      const rect = el.getBoundingClientRect()
      const canScroll = el.scrollWidth > el.clientWidth
      if (canScroll) {
        const fromLeft = mouseX - rect.left
        const fromRight = rect.right - mouseX
        if (fromLeft < triggerZoneWidth && fromLeft >= 0) {
          const speed = (1 - fromLeft / triggerZoneWidth) * maxSpeed
          el.scrollLeft -= speed
        } else if (fromRight < triggerZoneWidth && fromRight >= 0) {
          const speed = (1 - fromRight / triggerZoneWidth) * maxSpeed
          el.scrollLeft += speed
        }
      }
      rafId = requestAnimationFrame(step)
    }

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX
      if (rafId === null) rafId = requestAnimationFrame(step)
    }
    const onMouseLeave = () => {
      mouseX = null
    }

    el.addEventListener('mousemove', onMouseMove)
    el.addEventListener('mouseleave', onMouseLeave)
    return () => {
      el.removeEventListener('mousemove', onMouseMove)
      el.removeEventListener('mouseleave', onMouseLeave)
      if (rafId !== null) cancelAnimationFrame(rafId)
    }
  }, [containerRef, triggerZoneWidth, maxSpeed, enabled])
}
