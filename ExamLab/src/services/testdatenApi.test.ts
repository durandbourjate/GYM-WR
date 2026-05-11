import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as apiClient from './apiClient'
import { apiAdminSeedTestdaten, type SeedStatistik } from './testdatenApi'

vi.mock('./apiClient', () => ({
  postJson: vi.fn(),
}))

describe('apiAdminSeedTestdaten', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('postet action="apiAdminSeedTestdaten" mit email + mode initial', async () => {
    vi.mocked(apiClient.postJson).mockResolvedValue({
      success: true,
      statistik: { mode: 'initial', testSuSAngelegt: 20 } as SeedStatistik,
      dauerMs: 1234,
    })
    const r = await apiAdminSeedTestdaten({ email: 'a@x.ch', mode: 'initial' })
    expect(apiClient.postJson).toHaveBeenCalledWith('apiAdminSeedTestdaten', { email: 'a@x.ch', mode: 'initial' })
    expect(r.success).toBe(true)
    expect(r.statistik?.testSuSAngelegt).toBe(20)
  })

  it('reicht Backend-Fehler durch', async () => {
    vi.mocked(apiClient.postJson).mockResolvedValue({ success: false, error: 'Nur Admins' })
    const r = await apiAdminSeedTestdaten({ email: 'a@x.ch', mode: 'initial' })
    expect(r.success).toBe(false)
    expect(r.error).toBe('Nur Admins')
  })

  it('wirft bei Netzwerk-Fehler', async () => {
    vi.mocked(apiClient.postJson).mockRejectedValue(new Error('Network'))
    await expect(apiAdminSeedTestdaten({ email: 'a@x.ch', mode: 'reset' })).rejects.toThrow('Network')
  })

  it('akzeptiert mode reset', async () => {
    vi.mocked(apiClient.postJson).mockResolvedValue({ success: true })
    await apiAdminSeedTestdaten({ email: 'a@x.ch', mode: 'reset' })
    expect(apiClient.postJson).toHaveBeenCalledWith('apiAdminSeedTestdaten', { email: 'a@x.ch', mode: 'reset' })
  })

  it('liefert Fallback wenn postJson null returnt', async () => {
    vi.mocked(apiClient.postJson).mockResolvedValue(null)
    const r = await apiAdminSeedTestdaten({ email: 'a@x.ch', mode: 'initial' })
    expect(r.success).toBe(false)
    expect(r.error).toContain('Keine Antwort')
  })
})
