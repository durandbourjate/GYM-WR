import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useStammdatenStore } from './stammdatenStore'

vi.mock('../services/apiClient', () => ({
  postJson: vi.fn(),
}))
import { postJson } from '../services/apiClient'

describe('stammdatenStore.ladeLPProfil — Cluster E.3 Legacy-Drop', () => {
  beforeEach(() => {
    useStammdatenStore.setState({ lpProfil: null, stammdaten: useStammdatenStore.getState().stammdaten })
    vi.mocked(postJson).mockReset()
  })

  it('droppt Legacy-AppOrt-Favoriten (kein typ-Feld)', async () => {
    vi.mocked(postJson).mockResolvedValue({
      profil: {
        email: 'lp@test.ch',
        kursIds: [],
        fachschaftIds: [],
        gefaesse: [],
        favoriten: [
          { id: 'old-1', titel: 'Alt', screen: 'pruefung', params: { configId: 'x' }, erstelltAm: '2026-01-01' },
        ],
      },
    })
    await useStammdatenStore.getState().ladeLPProfil('lp@test.ch')
    expect(useStammdatenStore.getState().lpProfil?.favoriten).toEqual([])
  })

  it('akzeptiert neue Favorit-Shape', async () => {
    vi.mocked(postJson).mockResolvedValue({
      profil: {
        email: 'lp@test.ch',
        kursIds: [],
        fachschaftIds: [],
        gefaesse: [],
        favoriten: [
          { typ: 'ort', ziel: '/a', label: 'A', sortierung: 0 },
        ],
      },
    })
    await useStammdatenStore.getState().ladeLPProfil('lp@test.ch')
    const fav = useStammdatenStore.getState().lpProfil?.favoriten
    expect(fav).toHaveLength(1)
    expect(fav?.[0].ziel).toBe('/a')
  })
})
