import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'

describe('usePreWarm', () => {
  let apiCallMock: ReturnType<typeof vi.fn<(signal: AbortSignal) => Promise<void>>>

  beforeEach(() => {
    apiCallMock = vi.fn<(signal: AbortSignal) => Promise<void>>().mockResolvedValue(undefined)
  })

  it('feuert apiCall bei Mount', async () => {
    const { usePreWarm } = await import('../hooks/usePreWarm')
    renderHook(() => usePreWarm(apiCallMock, ['dep']))
    expect(apiCallMock).toHaveBeenCalledTimes(1)
  })

  it('übergibt AbortSignal an apiCall', async () => {
    const { usePreWarm } = await import('../hooks/usePreWarm')
    renderHook(() => usePreWarm(apiCallMock, ['dep']))
    expect(apiCallMock.mock.calls[0][0]).toBeInstanceOf(AbortSignal)
  })

  it('feuert AbortSignal bei Unmount', async () => {
    const { usePreWarm } = await import('../hooks/usePreWarm')
    const { unmount } = renderHook(() => usePreWarm(apiCallMock, ['dep']))
    const signal = apiCallMock.mock.calls[0][0] as AbortSignal
    expect(signal.aborted).toBe(false)
    unmount()
    expect(signal.aborted).toBe(true)
  })

  it('re-feuert bei Dep-Change', async () => {
    const { usePreWarm } = await import('../hooks/usePreWarm')
    const { rerender } = renderHook(
      ({ dep }) => usePreWarm(apiCallMock, [dep]),
      { initialProps: { dep: 'a' } },
    )
    expect(apiCallMock).toHaveBeenCalledTimes(1)
    rerender({ dep: 'b' })
    expect(apiCallMock).toHaveBeenCalledTimes(2)
  })

  it('cancelt vorherigen Call bei Dep-Change', async () => {
    const { usePreWarm } = await import('../hooks/usePreWarm')
    const { rerender } = renderHook(
      ({ dep }) => usePreWarm(apiCallMock, [dep]),
      { initialProps: { dep: 'a' } },
    )
    const signalA = apiCallMock.mock.calls[0][0] as AbortSignal
    rerender({ dep: 'b' })
    expect(signalA.aborted).toBe(true)
  })
})
