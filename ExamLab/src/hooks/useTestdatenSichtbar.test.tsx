import { renderHook } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useTestdatenSichtbar } from './useTestdatenSichtbar'

const mockStore = vi.hoisted(() => ({ lpProfil: null as { testdatenSichtbar?: boolean } | null }))

vi.mock('../store/stammdatenStore', () => ({
  useStammdatenStore: (sel: (s: typeof mockStore) => unknown) => sel(mockStore),
}))

describe('useTestdatenSichtbar', () => {
  beforeEach(() => { mockStore.lpProfil = null })

  it('false wenn lpProfil null', () => {
    const { result } = renderHook(() => useTestdatenSichtbar())
    expect(result.current).toBe(false)
  })

  it('false wenn testdatenSichtbar undefined (default-Pfad)', () => {
    mockStore.lpProfil = {}
    const { result } = renderHook(() => useTestdatenSichtbar())
    expect(result.current).toBe(false)
  })

  it('true wenn explizit true', () => {
    mockStore.lpProfil = { testdatenSichtbar: true }
    const { result } = renderHook(() => useTestdatenSichtbar())
    expect(result.current).toBe(true)
  })

  it('false wenn explizit false', () => {
    mockStore.lpProfil = { testdatenSichtbar: false }
    const { result } = renderHook(() => useTestdatenSichtbar())
    expect(result.current).toBe(false)
  })
})
