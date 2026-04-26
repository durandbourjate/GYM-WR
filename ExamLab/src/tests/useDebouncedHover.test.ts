import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

describe('useDebouncedHover', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('feuert callback NACH 300ms onMouseEnter', async () => {
    const callback = vi.fn()
    const { useDebouncedHover } = await import('../hooks/useDebouncedHover')
    const { result } = renderHook(() => useDebouncedHover(300, callback))

    act(() => result.current.onMouseEnter())
    expect(callback).not.toHaveBeenCalled()

    await act(async () => { vi.advanceTimersByTime(299) })
    expect(callback).not.toHaveBeenCalled()

    await act(async () => { vi.advanceTimersByTime(1) })
    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('cancelt callback wenn Mouse vor 300ms leaved', async () => {
    const callback = vi.fn()
    const { useDebouncedHover } = await import('../hooks/useDebouncedHover')
    const { result } = renderHook(() => useDebouncedHover(300, callback))

    act(() => result.current.onMouseEnter())
    await act(async () => { vi.advanceTimersByTime(200) })
    act(() => result.current.onMouseLeave())
    await act(async () => { vi.advanceTimersByTime(500) })

    expect(callback).not.toHaveBeenCalled()
  })

  it('feuert nicht erneut wenn onMouseEnter mehrfach gerufen', async () => {
    const callback = vi.fn()
    const { useDebouncedHover } = await import('../hooks/useDebouncedHover')
    const { result } = renderHook(() => useDebouncedHover(300, callback))

    act(() => result.current.onMouseEnter())
    act(() => result.current.onMouseEnter()) // Re-Enter darf Timer nicht zurücksetzen ODER nicht doppelt feuern
    await act(async () => { vi.advanceTimersByTime(300) })

    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('cancelt Timer bei Unmount', async () => {
    const callback = vi.fn()
    const { useDebouncedHover } = await import('../hooks/useDebouncedHover')
    const { result, unmount } = renderHook(() => useDebouncedHover(300, callback))

    act(() => result.current.onMouseEnter())
    unmount()
    await act(async () => { vi.advanceTimersByTime(500) })

    expect(callback).not.toHaveBeenCalled()
  })
})
