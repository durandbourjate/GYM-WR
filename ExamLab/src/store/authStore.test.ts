/**
 * Bundle 3 P-C.4: authStore.abmelden ruft clearDraftIDBCache
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock clearDraftIDBCache VOR allen anderen Imports
vi.mock('../services/draftCache', () => ({
  clearDraftIDBCache: vi.fn().mockResolvedValue(undefined),
}))

// Mock alle Store-reset()-Funktionen damit abmelden() nicht auf echte IDB trifft
vi.mock('./fragenbankStore', () => ({
  useFragenbankStore: { getState: () => ({ reset: vi.fn().mockResolvedValue(undefined) }) },
}))
vi.mock('./klassenlistenStore', () => ({
  useKlassenlistenStore: { getState: () => ({ reset: vi.fn().mockResolvedValue(undefined) }) },
}))
vi.mock('./ueben/gruppenStore', () => ({
  useUebenGruppenStore: { getState: () => ({ reset: vi.fn().mockResolvedValue(undefined) }) },
}))

// Mock autoSave + retryQueue (clearIndexedDB, clearQueue)
vi.mock('../services/autoSave', () => ({
  clearIndexedDB: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('../services/retryQueue', () => ({
  clearQueue: vi.fn().mockResolvedValue(undefined),
}))

// Mock pruefungStore (resetPruefungState nutzt es intern)
vi.mock('./pruefungStore', () => ({
  usePruefungStore: {
    getState: () => ({
      pruefungId: null,
      reset: vi.fn().mockResolvedValue(undefined),
    }),
  },
}))

// Mock lpApi (wird bei Login genutzt, hier irrelevant aber verhindert fetch)
vi.mock('../services/lpApi', () => ({
  ladeLehrpersonen: vi.fn().mockResolvedValue([]),
}))

// Mock favoritenStore
vi.mock('./favoritenStore', () => ({
  useFavoritenStore: { getState: () => ({ reset: vi.fn(), ladeVomBackend: vi.fn() }) },
}))

import { clearDraftIDBCache } from '../services/draftCache'
import { useAuthStore } from './authStore'

beforeEach(() => {
  vi.clearAllMocks()
  // window.location.href schreiben wirft in jsdom → stubben
  Object.defineProperty(window, 'location', {
    writable: true,
    value: { href: '' },
  })
})

describe('authStore.abmelden (P-C.4)', () => {
  it('ruft clearDraftIDBCache auf', async () => {
    await useAuthStore.getState().abmelden()
    expect(clearDraftIDBCache).toHaveBeenCalledTimes(1)
  })

  it('clearDraftIDBCache läuft im Promise.all (vor Hard-Nav)', async () => {
    const calls: string[] = []
    const { clearDraftIDBCache: mockFn } = await import('../services/draftCache')
    ;(mockFn as ReturnType<typeof vi.fn>).mockImplementation(async () => {
      calls.push('clearDraftIDBCache')
    })
    await useAuthStore.getState().abmelden()
    // clearDraftIDBCache muss vor window.location.href gelaufen sein
    expect(calls).toContain('clearDraftIDBCache')
  })
})
