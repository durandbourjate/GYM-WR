import { useEffect, type RefObject } from 'react'

interface Options {
  triggerZoneWidth?: number
  maxSpeed?: number
  enabled?: boolean
}

export function useTabAutoScroll(
  containerRef: RefObject<HTMLElement | null>,
  options: Options = {},
) {
  const { triggerZoneWidth = 60, maxSpeed = 12, enabled = true } = options

  useEffect(() => {
    if (!enabled) return
    const el = containerRef.current
    if (!el) return

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
