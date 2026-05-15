import { describe, it, expect, vi, beforeEach } from 'vitest'
import { backfillStatusDefault } from './maintenanceApi'
import * as apiClient from './apiClient'

describe('maintenanceApi.backfillStatusDefault', () => {
  beforeEach(() => vi.restoreAllMocks())

  it('unwrappt success-Response', async () => {
    vi.spyOn(apiClient, 'postJson').mockResolvedValue({
      success: true,
      count: 42,
      defaultWert: 'sammlung',
      dauerMs: 1234,
    })
    const r = await backfillStatusDefault({ email: 'a@b.ch' })
    expect(r).toEqual({ count: 42, defaultWert: 'sammlung', dauerMs: 1234 })
  })

  it('wirft Error mit Backend-Detail bei success:false', async () => {
    vi.spyOn(apiClient, 'postJson').mockResolvedValue({
      success: false,
      error: 'Admin-Zugriff verweigert',
    })
    await expect(backfillStatusDefault({ email: 'a@b.ch' })).rejects.toThrow(
      'Admin-Zugriff verweigert',
    )
  })

  it('wirft Error bei null-Response (Backend-Error verschluckt durch postJson)', async () => {
    vi.spyOn(apiClient, 'postJson').mockResolvedValue(null)
    await expect(backfillStatusDefault({ email: 'a@b.ch' })).rejects.toThrow(
      'apiBackfillStatusDefault: keine Antwort vom Server',
    )
  })
})
