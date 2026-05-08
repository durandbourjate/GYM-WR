import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

// === Module-Level mutable State (Closure-Ref-Mock-Pattern, Bundle Y) ===
const ladeTrackerMock = vi.fn()
const istKonfiguriertMock = vi.fn()
const erstelleDemoMock = vi.fn()
const aggregiereMock = vi.fn()

const userRef: { current: { email: string } | null } = { current: { email: 'lp@test' } }
const istDemoModusRef: { current: boolean } = { current: false }

vi.mock('../store/authStore', () => ({
  useAuthStore: (selector: (s: unknown) => unknown) =>
    selector({ user: userRef.current, istDemoModus: istDemoModusRef.current }),
}))

vi.mock('../services/apiService', () => ({
  apiService: {
    ladeTrackerDaten: (...args: unknown[]) => ladeTrackerMock(...args),
    istKonfiguriert: () => istKonfiguriertMock(),
  },
}))

vi.mock('../utils/trackerUtils', () => ({
  erstelleDemoTrackerDaten: (...args: unknown[]) => erstelleDemoMock(...args),
  aggregiereFragenPerformance: (...args: unknown[]) => aggregiereMock(...args),
}))

import { useFragenStats } from './useFragenStats'

beforeEach(() => {
  ladeTrackerMock.mockReset()
  istKonfiguriertMock.mockReset().mockReturnValue(true)
  erstelleDemoMock.mockReset().mockReturnValue([{ id: 'demo' }])
  aggregiereMock.mockReset().mockImplementation((data: unknown) => {
    const m = new Map<string, unknown>()
    m.set('agg', data)
    return m
  })
  userRef.current = { email: 'lp@test' }
  istDemoModusRef.current = false
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useFragenStats', () => {
  it('demo-mode: liefert sofort aggregierte Demo-Daten', async () => {
    istDemoModusRef.current = true
    const { result } = renderHook(() => useFragenStats())
    await waitFor(() => expect(result.current.has('agg')).toBe(true))
    expect(erstelleDemoMock).toHaveBeenCalledTimes(1)
    expect(aggregiereMock).toHaveBeenCalledWith([{ id: 'demo' }])
    expect(ladeTrackerMock).not.toHaveBeenCalled()
  })

  it('api nicht konfiguriert: nutzt Demo-Daten', async () => {
    istKonfiguriertMock.mockReturnValue(false)
    const { result } = renderHook(() => useFragenStats())
    await waitFor(() => expect(result.current.has('agg')).toBe(true))
    expect(erstelleDemoMock).toHaveBeenCalled()
    expect(ladeTrackerMock).not.toHaveBeenCalled()
  })

  it('produktiv ohne user: keine Daten geladen, leere Map', () => {
    userRef.current = null
    const { result } = renderHook(() => useFragenStats())
    expect(result.current.size).toBe(0)
    expect(ladeTrackerMock).not.toHaveBeenCalled()
  })

  it('produktiv mit user: ruft ladeTrackerDaten + aggregiert', async () => {
    ladeTrackerMock.mockResolvedValue([{ id: 'real' }])
    const { result } = renderHook(() => useFragenStats())
    await waitFor(() => expect(result.current.has('agg')).toBe(true))
    expect(ladeTrackerMock).toHaveBeenCalledWith('lp@test')
    expect(aggregiereMock).toHaveBeenCalledWith([{ id: 'real' }])
  })

  it('produktiv aber tracker null: aggregiere wird nicht aufgerufen', async () => {
    ladeTrackerMock.mockResolvedValue(null)
    const { result } = renderHook(() => useFragenStats())
    await waitFor(() => expect(ladeTrackerMock).toHaveBeenCalled())
    expect(aggregiereMock).not.toHaveBeenCalled()
    expect(result.current.size).toBe(0)
  })
})
