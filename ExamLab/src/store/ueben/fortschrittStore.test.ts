import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { FragenFortschritt } from '../../types/ueben/fortschritt'

vi.mock('../../utils/ueben/indexedDB', () => ({
  db: { getFortschritt: vi.fn(), setFortschritt: vi.fn(() => Promise.resolve()) },
}))
vi.mock('../../adapters/ueben/appsScriptAdapter', () => ({
  uebenFortschrittAdapter: { ladeFortschritt: vi.fn() },
}))
vi.mock('./gruppenStore', () => ({
  useUebenGruppenStore: { getState: vi.fn(() => ({ aktiveGruppe: null })) },
}))
vi.mock('./authStore', () => ({
  useUebenAuthStore: { getState: vi.fn(() => ({ user: null })) },
}))

import { db } from '../../utils/ueben/indexedDB'
import { uebenFortschrittAdapter } from '../../adapters/ueben/appsScriptAdapter'
import { useUebenGruppenStore } from './gruppenStore'
import { useUebenAuthStore } from './authStore'
import { useUebenFortschrittStore } from './fortschrittStore'

const fp = (override: Partial<FragenFortschritt> = {}): FragenFortschritt => ({
  fragenId: 'f1',
  email: 'kind@x',
  versuche: 1,
  richtig: 1,
  richtigInFolge: 1,
  sessionIds: ['s1'],
  letzterVersuch: '2026-05-01T10:00:00Z',
  mastery: 'ueben',
  ...override,
})

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  useUebenFortschrittStore.setState({ fortschritte: {} })
  vi.mocked(useUebenGruppenStore.getState).mockReturnValue({ aktiveGruppe: null } as ReturnType<typeof useUebenGruppenStore.getState>)
  vi.mocked(useUebenAuthStore.getState).mockReturnValue({ user: null } as ReturnType<typeof useUebenAuthStore.getState>)
})

describe('fortschrittStore.ladeFortschritt', () => {
  it('ohne aktive Gruppe → nur lokaler Stand, kein Backend-Aufruf', async () => {
    vi.mocked(db.getFortschritt).mockResolvedValue({ f1: fp({ fragenId: 'f1', versuche: 2 }) })
    await useUebenFortschrittStore.getState().ladeFortschritt()
    expect(useUebenFortschrittStore.getState().fortschritte.f1.versuche).toBe(2)
    expect(uebenFortschrittAdapter.ladeFortschritt).not.toHaveBeenCalled()
  })

  it('mit Gruppe + Email → Backend-Read-Back wird gemerged', async () => {
    vi.mocked(db.getFortschritt).mockResolvedValue({ f1: fp({ fragenId: 'f1', versuche: 2 }) })
    vi.mocked(useUebenGruppenStore.getState).mockReturnValue({ aktiveGruppe: { id: 'g1' } } as ReturnType<typeof useUebenGruppenStore.getState>)
    vi.mocked(useUebenAuthStore.getState).mockReturnValue({ user: { email: 'kind@x' } } as ReturnType<typeof useUebenAuthStore.getState>)
    vi.mocked(uebenFortschrittAdapter.ladeFortschritt).mockResolvedValue([
      fp({ fragenId: 'f1', versuche: 8, mastery: 'gemeistert' }),
    ])
    await useUebenFortschrittStore.getState().ladeFortschritt()
    expect(uebenFortschrittAdapter.ladeFortschritt).toHaveBeenCalledWith('g1', 'kind@x')
    expect(useUebenFortschrittStore.getState().fortschritte.f1.versuche).toBe(8)
    expect(useUebenFortschrittStore.getState().fortschritte.f1.mastery).toBe('gemeistert')
  })

  it('Backend-Fehler → lokaler Stand bleibt erhalten', async () => {
    vi.mocked(db.getFortschritt).mockResolvedValue({ f1: fp({ fragenId: 'f1', versuche: 3 }) })
    vi.mocked(useUebenGruppenStore.getState).mockReturnValue({ aktiveGruppe: { id: 'g1' } } as ReturnType<typeof useUebenGruppenStore.getState>)
    vi.mocked(useUebenAuthStore.getState).mockReturnValue({ user: { email: 'kind@x' } } as ReturnType<typeof useUebenAuthStore.getState>)
    vi.mocked(uebenFortschrittAdapter.ladeFortschritt).mockRejectedValue(new Error('Netzwerk'))
    await useUebenFortschrittStore.getState().ladeFortschritt()
    expect(useUebenFortschrittStore.getState().fortschritte.f1.versuche).toBe(3)
  })
})
