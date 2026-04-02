import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ApiClient } from '../services/apiClient'

describe('ApiClient', () => {
  let client: ApiClient

  beforeEach(() => {
    client = new ApiClient('https://fake-script.google.com/exec')
    globalThis.fetch = vi.fn()
  })

  it('sendet POST mit action und sessionToken', async () => {
    const mockResponse = { success: true, data: { id: '123' } }
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    } as Response)

    const result = await client.post('ladeGruppen', { email: 'test@gmail.com' }, 'token-123')

    expect(fetch).toHaveBeenCalledWith(
      'https://fake-script.google.com/exec',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          action: 'ladeGruppen',
          sessionToken: 'token-123',
          email: 'test@gmail.com',
        }),
      })
    )
    expect(result).toEqual(mockResponse)
  })

  it('gibt null zurueck bei Netzwerkfehler', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('Network error'))

    const result = await client.post('ladeGruppen', { email: 'test@gmail.com' })

    expect(result).toBeNull()
  })

  it('gibt null zurueck bei nicht-ok Response', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 500,
    } as Response)

    const result = await client.post('test', { email: 'test@gmail.com' })

    expect(result).toBeNull()
  })

  it('gibt null zurueck wenn URL leer ist', async () => {
    const emptyClient = new ApiClient('')

    const result = await emptyClient.post('test', {})

    expect(result).toBeNull()
    expect(fetch).not.toHaveBeenCalled()
  })

  it('serialisiert Write-Requests in Queue', async () => {
    const callOrder: number[] = []
    let callCount = 0

    vi.mocked(fetch).mockImplementation(async () => {
      const myCall = ++callCount
      // Kein setTimeout — direkter async Ablauf
      callOrder.push(myCall)
      return { ok: true, json: () => Promise.resolve({ success: true }) } as Response
    })

    const p1 = client.postQueued('action1', {})
    const p2 = client.postQueued('action2', {})

    await Promise.all([p1, p2])

    expect(callOrder).toEqual([1, 2])
  })

  it('sendet GET mit action und params', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: 'test' }),
    } as Response)

    await client.get('ladeGruppen', { email: 'test@gmail.com' }, 'tok-1')

    const calledUrl = vi.mocked(fetch).mock.calls[0][0] as string
    expect(calledUrl).toContain('action=ladeGruppen')
    expect(calledUrl).toContain('email=test%40gmail.com')
    expect(calledUrl).toContain('sessionToken=tok-1')
  })
})
