import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

// === Module-Level mutable State (geschlossen in vi.mock-Factories) ===
const ladePruefungMock = vi.fn()
const setConfigUndFragenMock = vi.fn()
const setDurchfuehrungIdMock = vi.fn()
const resolveFragenMock = vi.fn()

const configRef: { current: unknown } = { current: null }
const fragenRef: { current: unknown[] } = { current: [] }
const userRef: { current: { email: string } | null } = { current: { email: 'sus@test' } }

vi.mock('../services/apiService', () => ({
  apiService: {
    ladePruefung: (...args: unknown[]) => ladePruefungMock(...args),
  },
}))

vi.mock('../store/pruefungStore', () => ({
  usePruefungStore: Object.assign(
    (selector: (s: unknown) => unknown) => selector({
      config: configRef.current,
      fragen: fragenRef.current,
    }),
    {
      getState: () => ({
        setConfigUndFragen: setConfigUndFragenMock,
        setDurchfuehrungId: setDurchfuehrungIdMock,
      }),
    },
  ),
}))

vi.mock('../store/authStore', () => ({
  useAuthStore: (selector: (s: unknown) => unknown) => selector({ user: userRef.current }),
}))

vi.mock('../utils/fragenResolver', () => ({
  resolveFragenFuerPruefung: (...args: unknown[]) => resolveFragenMock(...args),
}))

import { usePruefungsRecovery } from './usePruefungsRecovery'

// Helper to set window.location.search per test
const setUrl = (search: string) => {
  Object.defineProperty(window, 'location', {
    value: { search },
    writable: true,
    configurable: true,
  })
}

beforeEach(() => {
  ladePruefungMock.mockReset()
  setConfigUndFragenMock.mockReset()
  setDurchfuehrungIdMock.mockReset()
  resolveFragenMock.mockReset().mockReturnValue({
    navigationsFragen: [{ id: 'q1' }],
    alleFragen: [{ id: 'q1' }],
  })
  configRef.current = null
  fragenRef.current = []
  userRef.current = { email: 'sus@test' }
  setUrl('?id=p1')
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('usePruefungsRecovery', () => {
  it('idle: config + fragen vorhanden → kein API-Call, kein status-Wechsel', () => {
    configRef.current = { id: 'p1' }
    fragenRef.current = [{ id: 'q1' }]
    const { result } = renderHook(() => usePruefungsRecovery())
    expect(result.current.status).toBe('idle')
    expect(ladePruefungMock).not.toHaveBeenCalled()
  })

  it('failed direkt: kein url-id', async () => {
    setUrl('')  // kein ?id=
    const { result } = renderHook(() => usePruefungsRecovery())
    await waitFor(() => expect(result.current.status).toBe('failed'))
    expect(ladePruefungMock).not.toHaveBeenCalled()
  })

  it('failed direkt: kein user', async () => {
    userRef.current = null
    const { result } = renderHook(() => usePruefungsRecovery())
    await waitFor(() => expect(result.current.status).toBe('failed'))
    expect(ladePruefungMock).not.toHaveBeenCalled()
  })

  it('success: setConfigUndFragen + setDurchfuehrungId aufgerufen', async () => {
    ladePruefungMock.mockResolvedValue({
      config: { id: 'p1', durchfuehrungId: 'd1' },
      fragen: [{ id: 'q1' }],
    })
    renderHook(() => usePruefungsRecovery())
    await waitFor(() => expect(setConfigUndFragenMock).toHaveBeenCalled())
    expect(setConfigUndFragenMock).toHaveBeenCalledWith(
      { id: 'p1', durchfuehrungId: 'd1' },
      [{ id: 'q1' }],
      [{ id: 'q1' }],
    )
    expect(setDurchfuehrungIdMock).toHaveBeenCalledWith('d1')
    expect(resolveFragenMock).toHaveBeenCalledWith(
      { id: 'p1', durchfuehrungId: 'd1' },
      [{ id: 'q1' }],
    )
  })

  it('success ohne durchfuehrungId: setDurchfuehrungId NICHT aufgerufen', async () => {
    ladePruefungMock.mockResolvedValue({
      config: { id: 'p1' },  // keine durchfuehrungId
      fragen: [{ id: 'q1' }],
    })
    renderHook(() => usePruefungsRecovery())
    await waitFor(() => expect(setConfigUndFragenMock).toHaveBeenCalled())
    expect(setDurchfuehrungIdMock).not.toHaveBeenCalled()
  })

  it('failed: api-result null → status failed', async () => {
    ladePruefungMock.mockResolvedValue(null)
    const { result } = renderHook(() => usePruefungsRecovery())
    await waitFor(() => expect(result.current.status).toBe('failed'))
    expect(setConfigUndFragenMock).not.toHaveBeenCalled()
  })

  it('failed: api-throws → status failed + console.error', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    ladePruefungMock.mockRejectedValue(new Error('netzwerk'))
    const { result } = renderHook(() => usePruefungsRecovery())
    await waitFor(() => expect(result.current.status).toBe('failed'))
    expect(consoleSpy).toHaveBeenCalledWith(
      '[Layout] Recovery fehlgeschlagen:',
      expect.any(Error),
    )
    consoleSpy.mockRestore()
  })

  it('recoveryAttempted-guard: rerender mit denselben deps → 1× API-Call', async () => {
    ladePruefungMock.mockResolvedValue({
      config: { id: 'p1' },
      fragen: [{ id: 'q1' }],
    })
    const { rerender } = renderHook(() => usePruefungsRecovery())
    await waitFor(() => expect(ladePruefungMock).toHaveBeenCalledTimes(1))
    rerender()
    rerender()
    expect(ladePruefungMock).toHaveBeenCalledTimes(1)
  })
})
