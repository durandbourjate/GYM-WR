import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useViewport } from './useViewport'

function mockMatchMedia(desktopMatches: boolean, schmalMatches: boolean) {
  window.matchMedia = vi.fn().mockImplementation((q: string) => ({
    matches: q === '(min-width: 900px)' ? desktopMatches : q === '(min-width: 600px)' ? schmalMatches : false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    media: q,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
}

describe('useViewport', () => {
  beforeEach(() => {
    // Default: desktop
    mockMatchMedia(true, true)
  })

  it('gibt "desktop" bei ≥ 900 px', () => {
    mockMatchMedia(true, true)
    const { result } = renderHook(() => useViewport())
    expect(result.current).toBe('desktop')
  })

  it('gibt "schmal" bei 600-899 px', () => {
    mockMatchMedia(false, true)
    const { result } = renderHook(() => useViewport())
    expect(result.current).toBe('schmal')
  })

  it('gibt "phone" bei < 600 px', () => {
    mockMatchMedia(false, false)
    const { result } = renderHook(() => useViewport())
    expect(result.current).toBe('phone')
  })
})
