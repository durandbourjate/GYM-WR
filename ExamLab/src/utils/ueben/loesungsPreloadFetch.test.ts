import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { Frage } from '../../types/ueben/fragen'
import type { LoesungsMap } from '../../types/ueben/loesung'

vi.mock('../../services/uebenLoesungsApi', () => ({
  ladeLoesungenApi: vi.fn(),
}))

import { ladeLoesungenViaPreload } from './loesungsPreloadFetch'
import { ladeLoesungenApi } from '../../services/uebenLoesungsApi'

const mkFrage = (id: string, teilaufgaben?: Frage[]): Frage => ({
  id,
  typ: 'mc',
  frage: 'Test',
  fachbereich: 'wr',
  ...(teilaufgaben ? { teilaufgaben } : {}),
} as unknown as Frage)

describe('ladeLoesungenViaPreload', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(ladeLoesungenApi).mockResolvedValue({})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('user=null → leere LoesungsMap ohne API-Call', async () => {
    const result = await ladeLoesungenViaPreload({
      block: [mkFrage('q1')],
      gruppeId: 'g1',
      fachbereich: 'wr',
      user: null,
    })
    expect(result).toEqual({})
    expect(ladeLoesungenApi).not.toHaveBeenCalled()
  })

  it('user.sessionToken gesetzt + API-Erfolg → returns LoesungsMap', async () => {
    const apiResult = { q1: { musterlosung: 'A' } } as unknown as LoesungsMap
    vi.mocked(ladeLoesungenApi).mockResolvedValue(apiResult)
    const result = await ladeLoesungenViaPreload({
      block: [mkFrage('q1')],
      gruppeId: 'g1',
      fachbereich: 'wr',
      user: { email: 'sus@example.com', sessionToken: 'tok' },
    })
    expect(result).toEqual(apiResult)
    expect(ladeLoesungenApi).toHaveBeenCalledWith({
      gruppeId: 'g1',
      fragenIds: ['q1'],
      email: 'sus@example.com',
      token: 'tok',
      fachbereich: 'wr',
    })
  })

  it('teilaufgaben-IDs werden in fragenIds aufgenommen', async () => {
    const sub1 = mkFrage('sub1')
    const sub2 = mkFrage('sub2')
    const block = [mkFrage('q1', [sub1, sub2]), mkFrage('q2')]
    await ladeLoesungenViaPreload({
      block,
      gruppeId: 'g1',
      fachbereich: 'wr',
      user: { email: 'sus@example.com', sessionToken: 'tok' },
    })
    const aufruf = vi.mocked(ladeLoesungenApi).mock.calls[0][0]
    expect(aufruf.fragenIds).toEqual(['q1', 'q2', 'sub1', 'sub2'])
  })

  it('API wirft Error → returns leere Map + console.warn', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.mocked(ladeLoesungenApi).mockRejectedValue(new Error('Server-Fehler'))
    const result = await ladeLoesungenViaPreload({
      block: [mkFrage('q1')],
      gruppeId: 'g1',
      fachbereich: 'wr',
      user: { email: 'sus@example.com', sessionToken: 'tok' },
    })
    expect(result).toEqual({})
    expect(warnSpy).toHaveBeenCalledWith(
      '[uebungsStore] Lösungs-Preload fehlgeschlagen:',
      expect.any(Error),
    )
  })
})
