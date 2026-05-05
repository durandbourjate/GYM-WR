import { describe, it, expect, vi, beforeEach } from 'vitest'
import { stelleWiederHer, hardDeleteFrage, listePapierkorb } from './draftApi'

vi.mock('./apiClient', () => ({
  postJson: vi.fn(),
}))

import { postJson } from './apiClient'

beforeEach(() => {
  vi.mocked(postJson).mockReset()
})

// ============================================================
// stelleWiederHer
// ============================================================

describe('draftApi.stelleWiederHer', () => {
  it('ruft postJson mit korrekter action + payload', async () => {
    vi.mocked(postJson).mockResolvedValueOnce({ success: true, id: 'f1' })
    await stelleWiederHer({ email: 'a@b.ch', frageId: 'f1', fachbereich: 'BWL' })
    expect(postJson).toHaveBeenCalledWith('stelleWiederHer', {
      email: 'a@b.ch', frageId: 'f1', fachbereich: 'BWL',
    })
  })

  it('wirft Error bei success:false', async () => {
    vi.mocked(postJson).mockResolvedValueOnce({ success: false, error: 'Nicht eigene Frage' })
    await expect(stelleWiederHer({ email: 'a@b.ch', frageId: 'f1', fachbereich: 'BWL' }))
      .rejects.toThrow('Nicht eigene Frage')
  })

  it('wirft Error bei response = null (Network-Fehler)', async () => {
    vi.mocked(postJson).mockResolvedValueOnce(null)
    await expect(stelleWiederHer({ email: 'a@b.ch', frageId: 'f1', fachbereich: 'BWL' }))
      .rejects.toThrow()
  })
})

// ============================================================
// hardDeleteFrage
// ============================================================

describe('draftApi.hardDeleteFrage', () => {
  it('ruft postJson mit korrekter action + payload', async () => {
    vi.mocked(postJson).mockResolvedValueOnce({ success: true })
    await hardDeleteFrage({ email: 'a@b.ch', frageId: 'f1', fachbereich: 'BWL' })
    expect(postJson).toHaveBeenCalledWith('hardDeleteFrage', {
      email: 'a@b.ch', frageId: 'f1', fachbereich: 'BWL',
    })
  })

  it('wirft Error bei success:false', async () => {
    vi.mocked(postJson).mockResolvedValueOnce({ success: false, error: 'Frage nicht im Papierkorb' })
    await expect(hardDeleteFrage({ email: 'a@b.ch', frageId: 'f1', fachbereich: 'BWL' }))
      .rejects.toThrow('Frage nicht im Papierkorb')
  })

  it('wirft Error bei response = null (Network-Fehler)', async () => {
    vi.mocked(postJson).mockResolvedValueOnce(null)
    await expect(hardDeleteFrage({ email: 'a@b.ch', frageId: 'f1', fachbereich: 'BWL' }))
      .rejects.toThrow()
  })
})

// ============================================================
// listePapierkorb
// ============================================================

describe('draftApi.listePapierkorb', () => {
  it('ruft postJson mit korrekter action + payload', async () => {
    vi.mocked(postJson).mockResolvedValueOnce({ success: true, fragen: [] })
    await listePapierkorb({ email: 'a@b.ch' })
    expect(postJson).toHaveBeenCalledWith('listePapierkorb', { email: 'a@b.ch' })
  })

  it('gibt das fragen-Array zurück (nicht das ganze Response-Objekt)', async () => {
    const mockFragen = [{ id: 'a', frageText: 'Test' }]
    vi.mocked(postJson).mockResolvedValueOnce({ success: true, fragen: mockFragen })
    const result = await listePapierkorb({ email: 'a@b.ch' })
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ id: 'a' })
  })

  it('wirft Error bei response = null (Network-Fehler)', async () => {
    vi.mocked(postJson).mockResolvedValueOnce(null)
    await expect(listePapierkorb({ email: 'a@b.ch' }))
      .rejects.toThrow()
  })
})
