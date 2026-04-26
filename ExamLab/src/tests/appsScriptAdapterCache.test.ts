import { describe, it, expect, beforeEach } from 'vitest'

describe('AppsScriptFragenAdapter.getCachedFragen', () => {
  beforeEach(async () => {
    const { uebenFragenAdapter } = await import('../adapters/ueben/appsScriptAdapter')
    uebenFragenAdapter.invalidateCache()
  })

  it('liefert undefined wenn Cache leer', async () => {
    const { uebenFragenAdapter } = await import('../adapters/ueben/appsScriptAdapter')
    expect(uebenFragenAdapter.getCachedFragen('demo-gruppe')).toBeUndefined()
  })

  it('liefert Cache-Inhalt nach erfolgreichem ladeFragen', async () => {
    const { uebenFragenAdapter } = await import('../adapters/ueben/appsScriptAdapter')
    await uebenFragenAdapter.ladeFragen('demo-gruppe')
    const cached = uebenFragenAdapter.getCachedFragen('demo-gruppe')
    expect(Array.isArray(cached)).toBe(true)
    expect((cached?.length ?? 0)).toBeGreaterThan(0)
  })

  it('liefert undefined für unbekannte gruppeId', async () => {
    const { uebenFragenAdapter } = await import('../adapters/ueben/appsScriptAdapter')
    await uebenFragenAdapter.ladeFragen('demo-gruppe')
    expect(uebenFragenAdapter.getCachedFragen('andere-gruppe')).toBeUndefined()
  })
})
