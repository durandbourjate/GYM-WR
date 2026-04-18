import { renderHook } from '@testing-library/react'
import { useTabAutoScroll } from './useTabAutoScroll'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('useTabAutoScroll', () => {
  let rafCallbacks: Array<(time: number) => void> = []
  let originalRAF: typeof requestAnimationFrame
  let originalCAF: typeof cancelAnimationFrame
  let rafIdCounter = 0

  beforeEach(() => {
    rafCallbacks = []
    rafIdCounter = 0
    originalRAF = globalThis.requestAnimationFrame
    originalCAF = globalThis.cancelAnimationFrame
    globalThis.requestAnimationFrame = (cb: FrameRequestCallback) => {
      rafIdCounter++
      const id = rafIdCounter
      rafCallbacks.push(cb)
      return id
    }
    globalThis.cancelAnimationFrame = vi.fn()
  })

  afterEach(() => {
    globalThis.requestAnimationFrame = originalRAF
    globalThis.cancelAnimationFrame = originalCAF
  })

  function flushRAF(times = 1) {
    for (let i = 0; i < times; i++) {
      const cb = rafCallbacks.shift()
      cb?.(performance.now())
    }
  }

  function makeScrollableEl(scrollWidth = 1000, clientWidth = 500, scrollLeft = 0) {
    const el = document.createElement('div')
    Object.defineProperty(el, 'scrollWidth', { value: scrollWidth, configurable: true })
    Object.defineProperty(el, 'clientWidth', { value: clientWidth, configurable: true })
    el.getBoundingClientRect = () => ({
      left: 0,
      right: clientWidth,
      top: 0,
      bottom: 40,
      width: clientWidth,
      height: 40,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    })
    el.scrollLeft = scrollLeft
    document.body.appendChild(el)
    return el
  }

  it('scrollt nach rechts wenn Maus am rechten Rand nahe + Overflow', () => {
    const el = makeScrollableEl(1000, 500, 100)
    const ref = { current: el }
    renderHook(() => useTabAutoScroll(ref))

    el.dispatchEvent(new MouseEvent('mousemove', { clientX: 490, bubbles: true }))
    flushRAF(1)
    expect(el.scrollLeft).toBeGreaterThan(100)

    document.body.removeChild(el)
  })

  it('scrollt nach links wenn Maus am linken Rand', () => {
    const el = makeScrollableEl(1000, 500, 200)
    const ref = { current: el }
    renderHook(() => useTabAutoScroll(ref))

    el.dispatchEvent(new MouseEvent('mousemove', { clientX: 10, bubbles: true }))
    flushRAF(1)
    expect(el.scrollLeft).toBeLessThan(200)

    document.body.removeChild(el)
  })

  it('scrollt nicht wenn scrollWidth == clientWidth (kein Overflow)', () => {
    const el = makeScrollableEl(500, 500, 0)
    const ref = { current: el }
    renderHook(() => useTabAutoScroll(ref))

    el.dispatchEvent(new MouseEvent('mousemove', { clientX: 490, bubbles: true }))
    flushRAF(1)
    expect(el.scrollLeft).toBe(0)

    document.body.removeChild(el)
  })

  it('stoppt bei mouseleave (kein weiteres Scrollen nach Maus-Austritt)', () => {
    const el = makeScrollableEl(1000, 500, 100)
    const ref = { current: el }
    renderHook(() => useTabAutoScroll(ref))

    // Maus bewegt sich an rechten Rand → RAF gestartet
    el.dispatchEvent(new MouseEvent('mousemove', { clientX: 490, bubbles: true }))
    // Maus verlässt Container → mouseX = null
    el.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }))
    const scrollBefore = el.scrollLeft
    // RAF ausführen — da mouseX null ist, soll kein Scroll passieren
    flushRAF(1)
    expect(el.scrollLeft).toBe(scrollBefore)

    document.body.removeChild(el)
  })

  it('räumt RAF bei unmount auf (cancelAnimationFrame wird gerufen)', () => {
    const el = makeScrollableEl(1000, 500, 100)
    const ref = { current: el }
    const { unmount } = renderHook(() => useTabAutoScroll(ref))

    el.dispatchEvent(new MouseEvent('mousemove', { clientX: 490, bubbles: true }))
    flushRAF(1)
    unmount()
    expect(globalThis.cancelAnimationFrame).toHaveBeenCalled()

    document.body.removeChild(el)
  })

  it('respektiert enabled=false — kein Event-Listener wird gesetzt', () => {
    const el = makeScrollableEl(1000, 500, 0)
    const addSpy = vi.spyOn(el, 'addEventListener')
    const ref = { current: el }
    renderHook(() => useTabAutoScroll(ref, { enabled: false }))

    expect(addSpy).not.toHaveBeenCalled()

    document.body.removeChild(el)
  })

  it('respektiert prefers-reduced-motion — kein Event-Listener', () => {
    const originalMatchMedia = window.matchMedia
    window.matchMedia = vi.fn().mockImplementation((q: string) => ({
      matches: q === '(prefers-reduced-motion: reduce)',
      media: q,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
      onchange: null,
    }))

    const el = makeScrollableEl(1000, 500, 0)
    const addSpy = vi.spyOn(el, 'addEventListener')
    const ref = { current: el }
    renderHook(() => useTabAutoScroll(ref))

    expect(addSpy).not.toHaveBeenCalled()

    document.body.removeChild(el)
    window.matchMedia = originalMatchMedia
  })
})
