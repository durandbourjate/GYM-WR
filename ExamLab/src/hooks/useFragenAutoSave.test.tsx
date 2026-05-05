import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type { DraftSyncState } from '../services/draftSync'
import { mockFrage } from '../__tests__/helpers/frageStorageMocks'

// === Mocks ===
const tippeFrageMock = vi.fn()
const finalisiereMock = vi.fn().mockResolvedValue(undefined)
const subscribeMock = vi.fn()

vi.mock('../services/draftSync', () => ({
  tippeFrage: (...args: unknown[]) => tippeFrageMock(...args),
  finalisiere: (...args: unknown[]) => finalisiereMock(...args),
  subscribe: (...args: unknown[]) => subscribeMock(...args),
  resetForTesting: vi.fn(),
}))

vi.mock('../store/authStore', () => ({
  useAuthStore: (selector: (s: { user: { email: string } | null }) => unknown) =>
    selector({ user: { email: 'lp@gymhofwil.ch' } }),
}))

import { useFragenAutoSave } from './useFragenAutoSave'

beforeEach(() => {
  tippeFrageMock.mockReset()
  finalisiereMock.mockReset().mockResolvedValue(undefined)
  subscribeMock.mockReset().mockImplementation(() => () => {})
})

describe('useFragenAutoSave', () => {
  it('frage === null → status sauber, fehlendePflichtfelder leer, kein tippeFrage', () => {
    const { result } = renderHook(() => useFragenAutoSave('e1', null))
    expect(result.current.status).toBe('sauber')
    expect(result.current.fehlendePflichtfelder).toEqual([])
    expect(tippeFrageMock).not.toHaveBeenCalled()
    expect(subscribeMock).not.toHaveBeenCalled()
  })

  it('frage gesetzt + valid → tippeFrage gerufen mit (email, frage)', () => {
    const frage = mockFrage('mc')
    renderHook(() => useFragenAutoSave('e1', frage))
    expect(tippeFrageMock).toHaveBeenCalledWith('lp@gymhofwil.ch', frage)
  })

  it('frage gesetzt + invalid (Pflichtfeld leer) → status entwurf', () => {
    // mockFrage liefert valide MC; Override macht fragetext leer → Pflichtfeld leer
    const frage = mockFrage('mc', { fragetext: '' })
    const { result } = renderHook(() => useFragenAutoSave('e1', frage))
    expect(result.current.status).toBe('entwurf')
    expect(result.current.fehlendePflichtfelder.length).toBeGreaterThan(0)
  })

  it('subscribe wird beim mount aufgerufen, unsubscribe beim unmount', () => {
    const unsubscribe = vi.fn()
    subscribeMock.mockImplementationOnce(() => unsubscribe)
    const frage = mockFrage('mc')
    const { unmount } = renderHook(() => useFragenAutoSave('e1', frage))
    expect(subscribeMock).toHaveBeenCalledWith(frage.id, expect.any(Function))
    unmount()
    expect(unsubscribe).toHaveBeenCalled()
  })

  it('subscribe-callback mit sync-läuft → status sync-läuft (auch wenn pflichtErfuellt)', () => {
    let cbRef: ((s: DraftSyncState) => void) | undefined
    subscribeMock.mockImplementationOnce((_id: string, cb: (s: DraftSyncState) => void) => {
      cbRef = cb
      return () => {}
    })
    const frage = mockFrage('mc')
    const { result } = renderHook(() => useFragenAutoSave('e1', frage))
    expect(cbRef).toBeDefined()
    act(() => cbRef!({ status: 'sync-läuft' }))
    expect(result.current.status).toBe('sync-läuft')
  })

  it('subscribe-callback mit server-down → status server-down', () => {
    let cbRef: ((s: DraftSyncState) => void) | undefined
    subscribeMock.mockImplementationOnce((_id: string, cb: (s: DraftSyncState) => void) => {
      cbRef = cb
      return () => {}
    })
    const frage = mockFrage('mc')
    const { result } = renderHook(() => useFragenAutoSave('e1', frage))
    act(() => cbRef!({ status: 'server-down' }))
    expect(result.current.status).toBe('server-down')
  })

  it('finalisiereVorClose ruft finalisiere(email, frage) und returnt Promise', async () => {
    const frage = mockFrage('mc')
    const { result } = renderHook(() => useFragenAutoSave('e1', frage))
    await act(async () => {
      await result.current.finalisiereVorClose()
    })
    expect(finalisiereMock).toHaveBeenCalledWith('lp@gymhofwil.ch', frage)
  })

  it('finalisiereVorClose bei frage=null → resolved Promise, finalisiere NICHT gerufen', async () => {
    const { result } = renderHook(() => useFragenAutoSave('e1', null))
    await act(async () => {
      await result.current.finalisiereVorClose()
    })
    expect(finalisiereMock).not.toHaveBeenCalled()
  })
})
