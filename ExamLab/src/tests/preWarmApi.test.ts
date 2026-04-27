import { describe, it, expect, beforeEach, vi } from 'vitest'

const postJsonMock = vi.fn()

vi.mock('../services/ueben/apiClient', () => ({
  uebenApiClient: {
    post: postJsonMock,
  },
}))

vi.mock('../store/ueben/authStore', () => ({
  useUebenAuthStore: {
    getState: () => ({ user: { email: 'test@test.ch', sessionToken: 'tok-123' } }),
  },
}))

describe('preWarmFragen', () => {
  beforeEach(() => {
    postJsonMock.mockReset()
  })

  it('returned Promise<void> auch bei erfolgreichem Call', async () => {
    postJsonMock.mockResolvedValue({ success: true, fragenAnzahl: 10, latenzMs: 150 })
    const { preWarmFragen } = await import('../services/preWarmApi')
    const result = await preWarmFragen(['f1', 'f2'], 'gruppe1', 'BWL')
    expect(result).toBeUndefined()
    expect(postJsonMock).toHaveBeenCalledWith(
      'lernplattformPreWarmFragen',
      expect.objectContaining({ fragenIds: ['f1', 'f2'], gruppeId: 'gruppe1', fachbereich: 'BWL' }),
      expect.anything(),
    )
  })

  it('schluckt Backend-Error silent (fail-silent)', async () => {
    postJsonMock.mockResolvedValue({ error: 'Nicht autorisiert' })
    const { preWarmFragen } = await import('../services/preWarmApi')
    await expect(preWarmFragen(['f1'], 'gruppe1', 'BWL')).resolves.toBeUndefined()
  })

  it('schluckt Network-Error silent', async () => {
    postJsonMock.mockRejectedValue(new Error('network'))
    const { preWarmFragen } = await import('../services/preWarmApi')
    await expect(preWarmFragen(['f1'], 'gruppe1', 'BWL')).resolves.toBeUndefined()
  })

  it('macht keinen Call wenn fragenIds leer', async () => {
    const { preWarmFragen } = await import('../services/preWarmApi')
    await preWarmFragen([], 'gruppe1', 'BWL')
    expect(postJsonMock).not.toHaveBeenCalled()
  })

  it('macht keinen Call wenn signal bereits aborted', async () => {
    const { preWarmFragen } = await import('../services/preWarmApi')
    const abortController = new AbortController()
    abortController.abort()
    await preWarmFragen(['f1'], 'gruppe1', 'BWL', abortController.signal)
    expect(postJsonMock).not.toHaveBeenCalled()
  })

  it('macht keinen Call wenn gruppeId leer', async () => {
    const { preWarmFragen } = await import('../services/preWarmApi')
    await preWarmFragen(['f1'], '', 'BWL')
    expect(postJsonMock).not.toHaveBeenCalled()
  })
})

describe('preWarmKorrektur', () => {
  beforeEach(() => {
    postJsonMock.mockReset()
  })

  it('ruft Backend-Endpoint mit pruefungId und email auf', async () => {
    postJsonMock.mockResolvedValueOnce({ success: true, latenzMs: 800 })
    const { preWarmKorrektur } = await import('../services/preWarmApi')
    await preWarmKorrektur('p123', 'lp@gymhofwil.ch')
    expect(postJsonMock).toHaveBeenCalledWith(
      'lernplattformPreWarmKorrektur',
      expect.objectContaining({ pruefungId: 'p123', email: 'lp@gymhofwil.ch' }),
      expect.anything(),
    )
  })

  it('resolved mit void bei Backend-Error', async () => {
    postJsonMock.mockResolvedValueOnce({ error: 'Nicht autorisiert' })
    const { preWarmKorrektur } = await import('../services/preWarmApi')
    await expect(preWarmKorrektur('p123', 'lp@gymhofwil.ch')).resolves.toBeUndefined()
  })

  it('resolved mit void bei deduped-Response', async () => {
    postJsonMock.mockResolvedValueOnce({ success: true, deduped: true })
    const { preWarmKorrektur } = await import('../services/preWarmApi')
    await expect(preWarmKorrektur('p123', 'lp@gymhofwil.ch')).resolves.toBeUndefined()
  })

  it('skippt API-Call bei signal.aborted', async () => {
    const { preWarmKorrektur } = await import('../services/preWarmApi')
    const abortController = new AbortController()
    abortController.abort()
    await preWarmKorrektur('p123', 'lp@gymhofwil.ch', abortController.signal)
    expect(postJsonMock).not.toHaveBeenCalled()
  })

  it('skippt API-Call bei leerer pruefungId', async () => {
    const { preWarmKorrektur } = await import('../services/preWarmApi')
    await preWarmKorrektur('', 'lp@gymhofwil.ch')
    expect(postJsonMock).not.toHaveBeenCalled()
  })

  it('skippt API-Call bei leerer email', async () => {
    const { preWarmKorrektur } = await import('../services/preWarmApi')
    await preWarmKorrektur('p123', '')
    expect(postJsonMock).not.toHaveBeenCalled()
  })
})
