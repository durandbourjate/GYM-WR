import { renderHook } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useTestBadgeVisible } from './useTestBadgeVisible'

const mockStore = vi.hoisted(() => ({ lpProfil: null as { testdatenSichtbar?: boolean } | null }))

vi.mock('../store/stammdatenStore', () => ({
  useStammdatenStore: (sel: (s: typeof mockStore) => unknown) => sel(mockStore),
}))

describe('useTestBadgeVisible', () => {
  beforeEach(() => {
    mockStore.lpProfil = null
  })

  it('false wenn lpProfil null', () => {
    const { result } = renderHook(() => useTestBadgeVisible({ kursId: 'test-kurs-01' }))
    expect(result.current).toBe(false)
  })

  it('false wenn record kein Test-Record', () => {
    mockStore.lpProfil = { testdatenSichtbar: true }
    const { result } = renderHook(() => useTestBadgeVisible({ kursId: 'sf-wr-29c' }))
    expect(result.current).toBe(false)
  })

  it('false wenn record Test-Record aber testdatenSichtbar=false', () => {
    mockStore.lpProfil = { testdatenSichtbar: false }
    const { result } = renderHook(() => useTestBadgeVisible({ kursId: 'test-kurs-01' }))
    expect(result.current).toBe(false)
  })

  it('true wenn Test-Record + testdatenSichtbar=true', () => {
    mockStore.lpProfil = { testdatenSichtbar: true }
    const { result } = renderHook(() => useTestBadgeVisible({ kursId: 'test-kurs-01' }))
    expect(result.current).toBe(true)
  })

  it('true für Test-Email-Record', () => {
    mockStore.lpProfil = { testdatenSichtbar: true }
    const { result } = renderHook(() => useTestBadgeVisible({ userEmail: 'wr.test@stud.gymhofwil.ch' }))
    expect(result.current).toBe(true)
  })
})
