import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../services/ueben/apiClient', () => ({
  uebenApiClient: { post: vi.fn() },
  uebenIstKonfiguriert: vi.fn(() => true),
}))

import { uebenApiClient } from '../../services/ueben/apiClient'
import { uebenFortschrittAdapter } from './appsScriptAdapter'

const postMock = vi.mocked(uebenApiClient.post)

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
})

describe('uebenFortschrittAdapter.ladeFortschritt', () => {
  it('mappt die Backend-Antwort auf FragenFortschritt[] inkl. email', async () => {
    postMock.mockResolvedValue({
      success: true,
      data: [
        { fragenId: 'f1', versuche: 3, richtig: 2, richtigInFolge: 1, mastery: 'ueben', letzterVersuch: '2026-05-01T10:00:00Z', sessionIds: ['s1', 's2'] },
      ],
    })
    const result = await uebenFortschrittAdapter.ladeFortschritt('g1', 'kind@x')
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ fragenId: 'f1', email: 'kind@x', versuche: 3, sessionIds: ['s1', 's2'] })
  })

  it('fehlende sessionIds (alter Backend-Stand) → leeres Array statt undefined', async () => {
    postMock.mockResolvedValue({
      success: true,
      data: [
        { fragenId: 'f1', versuche: 1, richtig: 1, richtigInFolge: 1, mastery: 'ueben', letzterVersuch: '2026-05-01T10:00:00Z' },
      ],
    })
    const result = await uebenFortschrittAdapter.ladeFortschritt('g1', 'kind@x')
    expect(result[0].sessionIds).toEqual([])
  })

  it('success=false → leeres Array (kein Throw)', async () => {
    postMock.mockResolvedValue({ success: false, error: 'Keine Berechtigung' })
    expect(await uebenFortschrittAdapter.ladeFortschritt('g1', 'kind@x')).toEqual([])
  })

  it('null-Response → leeres Array', async () => {
    postMock.mockResolvedValue(null)
    expect(await uebenFortschrittAdapter.ladeFortschritt('g1', 'kind@x')).toEqual([])
  })

  it('sendet action uebenLadeFortschritt mit gruppeId + email', async () => {
    postMock.mockResolvedValue({ success: true, data: [] })
    await uebenFortschrittAdapter.ladeFortschritt('g1', 'kind@x')
    expect(postMock).toHaveBeenCalledWith('uebenLadeFortschritt', { gruppeId: 'g1', email: 'kind@x' }, undefined)
  })
})
