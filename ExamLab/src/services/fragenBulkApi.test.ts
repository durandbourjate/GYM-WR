import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as apiClient from './apiClient'
import {
  bulkUpdateFragen,
  bulkLoescheFragen,
  type FragenBulkPatch,
} from './fragenBulkApi'

vi.mock('./apiClient', () => ({
  postJson: vi.fn(),
}))

describe('bulkUpdateFragen', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('wirft Error VOR Network-Call wenn zwei Tag-Modi gesetzt sind', async () => {
    const patch: FragenBulkPatch = {
      tagsHinzufuegen: ['t1'],
      tagsErsetzen: ['t2'],
    }
    await expect(bulkUpdateFragen(['f1'], patch, 'lp@example.ch')).rejects.toThrow(
      /Nur einer von tagsHinzufuegen\/tagsErsetzen\/tagsEntfernen/,
    )
    // Wichtig: postJson darf NICHT aufgerufen worden sein (Frontend-Validation vor Network)
    expect(apiClient.postJson).not.toHaveBeenCalled()
  })

  it('returnt strukturiertes Resultat bei success-Response', async () => {
    vi.mocked(apiClient.postJson).mockResolvedValue({
      success: true,
      erfolgreich: 2,
      affectedIds: ['f1', 'f2'],
      fehlgeschlagen: [],
    })
    const patch: FragenBulkPatch = { bloom: 'K2' }
    const r = await bulkUpdateFragen(['f1', 'f2'], patch, 'lp@example.ch')

    expect(apiClient.postJson).toHaveBeenCalledWith('apiBulkUpdateFragen', {
      email: 'lp@example.ch',
      ids: ['f1', 'f2'],
      patch: { bloom: 'K2' },
    })
    expect(r.erfolgreich).toBe(2)
    expect(r.affectedIds).toEqual(['f1', 'f2'])
    expect(r.fehlgeschlagen).toEqual([])
  })

  it('wirft Error mit Backend-Message bei success:false', async () => {
    vi.mocked(apiClient.postJson).mockResolvedValue({
      success: false,
      error: 'Nicht authentifiziert',
    })
    await expect(
      bulkUpdateFragen(['f1'], { bloom: 'K3' }, 'lp@example.ch'),
    ).rejects.toThrow('Nicht authentifiziert')
  })

  it('wirft Error bei null-Response (Network-Fehler)', async () => {
    vi.mocked(apiClient.postJson).mockResolvedValue(null)
    await expect(
      bulkUpdateFragen(['f1'], { bloom: 'K1' }, 'lp@example.ch'),
    ).rejects.toThrow(/keine Antwort vom Server/)
  })

  it('returnt partial-Resultat bei partial-failure (wirft NICHT)', async () => {
    vi.mocked(apiClient.postJson).mockResolvedValue({
      success: true,
      erfolgreich: 43,
      affectedIds: Array.from({ length: 43 }, (_, i) => `f${i}`),
      fehlgeschlagen: ['x', 'y'],
    })
    const ids = Array.from({ length: 45 }, (_, i) => `f${i}`)
    const r = await bulkUpdateFragen(ids, { status: 'sammlung' }, 'lp@example.ch')
    expect(r.erfolgreich).toBe(43)
    expect(r.affectedIds).toHaveLength(43)
    expect(r.fehlgeschlagen).toEqual(['x', 'y'])
  })
})

describe('bulkLoescheFragen', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returnt strukturiertes Resultat bei success-Response', async () => {
    vi.mocked(apiClient.postJson).mockResolvedValue({
      success: true,
      erfolgreich: 3,
      affectedIds: ['a', 'b', 'c'],
      fehlgeschlagen: [],
    })
    const r = await bulkLoescheFragen(['a', 'b', 'c'], 'lp@example.ch')
    expect(apiClient.postJson).toHaveBeenCalledWith('apiBulkLoescheFragen', {
      email: 'lp@example.ch',
      ids: ['a', 'b', 'c'],
    })
    expect(r.erfolgreich).toBe(3)
    expect(r.affectedIds).toEqual(['a', 'b', 'c'])
    expect(r.fehlgeschlagen).toEqual([])
  })

  it('wirft Error bei null-Response', async () => {
    vi.mocked(apiClient.postJson).mockResolvedValue(null)
    await expect(bulkLoescheFragen(['a'], 'lp@example.ch')).rejects.toThrow(
      /keine Antwort vom Server/,
    )
  })

  it('wirft Error mit Backend-Message bei success:false', async () => {
    vi.mocked(apiClient.postJson).mockResolvedValue({
      success: false,
      error: 'ids fehlt oder leer',
    })
    await expect(bulkLoescheFragen([], 'lp@example.ch')).rejects.toThrow(
      'ids fehlt oder leer',
    )
  })
})

describe('Backend-Guards (I-2 batch-cap, M-4 unknown patch keys)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('Backend wirft bei batch > 500 IDs — Frontend propagiert Error', async () => {
    vi.mocked(apiClient.postJson).mockResolvedValue({
      success: false,
      error: 'Bulk-Limit 500 ueberschritten (got 600)',
    })
    const ids = Array.from({ length: 600 }, (_, i) => `id${i}`)
    await expect(bulkUpdateFragen(ids, { bloom: 'K3' }, 'lp@example.ch')).rejects.toThrow(
      /Bulk-Limit 500 ueberschritten/,
    )
  })

  it('Backend wirft bei unbekanntem patch-Key — Frontend propagiert Error', async () => {
    vi.mocked(apiClient.postJson).mockResolvedValue({
      success: false,
      error: 'Unbekannte Patch-Felder: fragetext',
    })
    // TS verhindert das normalerweise, aber zur Laufzeit könnte ein Caller via
    // `as FragenBulkPatch`-Cast ein Extra-Feld senden — Backend fängt das ab.
    const badPatch = { fragetext: 'malicious' } as unknown as Parameters<typeof bulkUpdateFragen>[1]
    await expect(bulkUpdateFragen(['a'], badPatch, 'lp@example.ch')).rejects.toThrow(
      /Unbekannte Patch-Felder.*fragetext/,
    )
  })
})
