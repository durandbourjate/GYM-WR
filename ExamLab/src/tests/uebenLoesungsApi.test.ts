import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ladeLoesungenApi } from '../services/uebenLoesungsApi'

vi.mock('../services/ueben/apiClient', () => ({
  uebenApiClient: {
    post: vi.fn(),
  },
}))

import { uebenApiClient } from '../services/ueben/apiClient'

describe('uebenLoesungsApi.ladeLoesungenApi', () => {
  beforeEach(() => {
    vi.mocked(uebenApiClient.post).mockReset()
  })

  const basisParams = {
    gruppeId: 'g1',
    fragenIds: ['f1', 'f2'],
    email: 'sus@stud.test',
    token: 'tok-abc',
    fachbereich: 'VWL',
  }

  it('ruft uebenLadeLoesungen mit korrektem Payload', async () => {
    vi.mocked(uebenApiClient.post).mockResolvedValue({
      success: true,
      loesungen: { f1: { musterlosung: 'X' }, f2: { optionen: [{ id: 'o1', korrekt: true }] } },
    })

    const result = await ladeLoesungenApi(basisParams)

    expect(uebenApiClient.post).toHaveBeenCalledWith(
      'uebenLadeLoesungen',
      {
        gruppeId: 'g1',
        fragenIds: ['f1', 'f2'],
        email: 'sus@stud.test',
        fachbereich: 'VWL',
      },
      'tok-abc',
    )
    expect(result).toEqual({
      f1: { musterlosung: 'X' },
      f2: { optionen: [{ id: 'o1', korrekt: true }] },
    })
  })

  it('wirft bei success:false', async () => {
    vi.mocked(uebenApiClient.post).mockResolvedValue({ success: false, error: 'Rate limit' })
    await expect(ladeLoesungenApi(basisParams)).rejects.toThrow('Rate limit')
  })

  it('wirft bei Netzwerk-Fehler', async () => {
    vi.mocked(uebenApiClient.post).mockRejectedValue(new Error('timeout'))
    await expect(ladeLoesungenApi(basisParams)).rejects.toThrow('timeout')
  })

  it('lässt fachbereich weg wenn nicht gesetzt', async () => {
    vi.mocked(uebenApiClient.post).mockResolvedValue({ success: true, loesungen: {} })

    await ladeLoesungenApi({ ...basisParams, fachbereich: undefined })

    expect(uebenApiClient.post).toHaveBeenCalledWith(
      'uebenLadeLoesungen',
      { gruppeId: 'g1', fragenIds: ['f1', 'f2'], email: 'sus@stud.test' },
      'tok-abc',
    )
  })
})
