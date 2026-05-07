// ExamLab/src/hooks/useDebounce.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDebounce } from './useDebounce'

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('feuert callback einmal nach delay-Ablauf', () => {
    const fn = vi.fn()
    const { result } = renderHook(() => useDebounce(fn, 400))

    act(() => result.current())
    expect(fn).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(400)
    })
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('multi-call innerhalb delay-Window collapsed zu einem Aufruf', () => {
    const fn = vi.fn()
    const { result } = renderHook(() => useDebounce(fn, 400))

    act(() => result.current())
    act(() => {
      vi.advanceTimersByTime(200)
    })
    act(() => result.current())
    act(() => {
      vi.advanceTimersByTime(200)
    })
    expect(fn).not.toHaveBeenCalled()  // Reset bei zweitem Call

    act(() => {
      vi.advanceTimersByTime(200)
    })
    expect(fn).toHaveBeenCalledTimes(1)  // Erst nach komplettem 400ms-Window
  })

  it('passt args an callback durch', () => {
    const fn = vi.fn()
    const { result } = renderHook(() => useDebounce<(x: number, y: string) => void>(fn, 100))

    act(() => result.current(42, 'test'))
    act(() => {
      vi.advanceTimersByTime(100)
    })

    expect(fn).toHaveBeenCalledWith(42, 'test')
  })
})
