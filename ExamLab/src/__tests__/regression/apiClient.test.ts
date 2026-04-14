/**
 * Regression-Tests: apiClient.ts
 *
 * Hintergrund: Session 34→35 — heartbeat/speichereAntworten nutzten raw fetch()
 * statt apiClient, wodurch der Session-Token nicht mitgesendet wurde.
 * Diese Tests stellen sicher, dass ALLE Request-Methoden den Token mitsenden.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock sessionStorage
const sessionStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value }),
    removeItem: vi.fn((key: string) => { delete store[key] }),
    clear: vi.fn(() => { store = {} }),
  }
})()

Object.defineProperty(globalThis, 'sessionStorage', { value: sessionStorageMock })

// Mock fetch
const fetchMock = vi.fn()
Object.defineProperty(globalThis, 'fetch', { value: fetchMock, writable: true })

// Mock import.meta.env
vi.stubEnv('VITE_APPS_SCRIPT_URL', 'https://script.google.com/test')

describe('apiClient — Session-Token Regression', () => {
  beforeEach(() => {
    vi.resetModules()
    sessionStorageMock.clear()
    fetchMock.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('getSessionToken()', () => {
    it('gibt Token zurück wenn vorhanden', async () => {
      sessionStorageMock.setItem('pruefung-auth', JSON.stringify({ sessionToken: 'abc123', email: 'test@stud.gymhofwil.ch' }))
      const { getSessionToken } = await import('../../services/apiClient.ts')
      expect(getSessionToken()).toBe('abc123')
    })

    it('gibt undefined zurück wenn kein Token', async () => {
      sessionStorageMock.setItem('pruefung-auth', JSON.stringify({ email: 'lp@gymhofwil.ch' }))
      const { getSessionToken } = await import('../../services/apiClient.ts')
      expect(getSessionToken()).toBeUndefined()
    })

    it('gibt undefined zurück bei korruptem JSON', async () => {
      sessionStorageMock.setItem('pruefung-auth', 'nicht-json')
      const { getSessionToken } = await import('../../services/apiClient.ts')
      expect(getSessionToken()).toBeUndefined()
    })

    it('gibt undefined zurück wenn sessionStorage leer', async () => {
      const { getSessionToken } = await import('../../services/apiClient.ts')
      expect(getSessionToken()).toBeUndefined()
    })
  })

  describe('postJson() — Token wird mitgesendet', () => {
    it('sendet sessionToken im Body wenn vorhanden', async () => {
      sessionStorageMock.setItem('pruefung-auth', JSON.stringify({ sessionToken: 'tok-123' }))
      fetchMock.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ success: true })),
      })

      const { postJson } = await import('../../services/apiClient.ts')
      await postJson('heartbeat', { pruefungId: 'test', email: 'sus@stud.gymhofwil.ch' })

      expect(fetchMock).toHaveBeenCalledTimes(1)
      const body = JSON.parse(fetchMock.mock.calls[0][1].body)
      expect(body.sessionToken).toBe('tok-123')
      expect(body.action).toBe('heartbeat')
    })

    it('sendet KEIN sessionToken-Feld wenn keins vorhanden (LP)', async () => {
      sessionStorageMock.setItem('pruefung-auth', JSON.stringify({ email: 'lp@gymhofwil.ch' }))
      fetchMock.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ success: true })),
      })

      const { postJson } = await import('../../services/apiClient.ts')
      await postJson('ladeMonitoring', { pruefungId: 'test' })

      const body = JSON.parse(fetchMock.mock.calls[0][1].body)
      expect(body.sessionToken).toBeUndefined()
    })
  })

  describe('postBool() — Token wird mitgesendet', () => {
    it('sendet sessionToken im Body wenn vorhanden', async () => {
      sessionStorageMock.setItem('pruefung-auth', JSON.stringify({ sessionToken: 'tok-456' }))
      fetchMock.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ success: true })),
      })

      const { postBool } = await import('../../services/apiClient.ts')
      await postBool('speichereAntworten', { pruefungId: 'test', email: 'sus@stud.gymhofwil.ch' })

      const body = JSON.parse(fetchMock.mock.calls[0][1].body)
      expect(body.sessionToken).toBe('tok-456')
    })
  })

  describe('getJson() — Token wird mitgesendet', () => {
    it('sendet sessionToken als Query-Parameter wenn vorhanden', async () => {
      sessionStorageMock.setItem('pruefung-auth', JSON.stringify({ sessionToken: 'tok-789' }))
      fetchMock.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ success: true })),
      })

      const { getJson } = await import('../../services/apiClient.ts')
      await getJson('ladePruefung', { pruefungId: 'test' })

      const url = fetchMock.mock.calls[0][0] as string
      expect(url).toContain('sessionToken=tok-789')
    })

    it('sendet KEIN sessionToken-Parameter wenn keins vorhanden', async () => {
      sessionStorageMock.setItem('pruefung-auth', JSON.stringify({ email: 'lp@gymhofwil.ch' }))
      fetchMock.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ success: true })),
      })

      const { getJson } = await import('../../services/apiClient.ts')
      await getJson('ladePruefung', { pruefungId: 'test' })

      const url = fetchMock.mock.calls[0][0] as string
      expect(url).not.toContain('sessionToken')
    })
  })
})
