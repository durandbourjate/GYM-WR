import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useKeyboardNavigation } from './useKeyboardNavigation'

const mkEvent = (key: string): React.KeyboardEvent<HTMLElement> =>
  ({ key, preventDefault: () => {} } as React.KeyboardEvent<HTMLElement>)

describe('useKeyboardNavigation', () => {
  it('initial activeIndex = -1', () => {
    const { result } = renderHook(() =>
      useKeyboardNavigation({ itemCount: 5, onEnter: () => {}, onEscape: () => {} }),
    )
    expect(result.current.activeIndex).toBe(-1)
  })

  it('ArrowDown inkrementiert', () => {
    const { result } = renderHook(() =>
      useKeyboardNavigation({ itemCount: 5, onEnter: () => {}, onEscape: () => {} }),
    )
    act(() => result.current.handleKeyDown(mkEvent('ArrowDown')))
    expect(result.current.activeIndex).toBe(0)
    act(() => result.current.handleKeyDown(mkEvent('ArrowDown')))
    expect(result.current.activeIndex).toBe(1)
  })

  it('ArrowDown clamping bei itemCount-1', () => {
    const { result } = renderHook(() =>
      useKeyboardNavigation({ itemCount: 2, onEnter: () => {}, onEscape: () => {} }),
    )
    act(() => result.current.handleKeyDown(mkEvent('ArrowDown')))
    act(() => result.current.handleKeyDown(mkEvent('ArrowDown')))
    act(() => result.current.handleKeyDown(mkEvent('ArrowDown')))
    expect(result.current.activeIndex).toBe(1)
  })

  it('ArrowUp clamping bei -1', () => {
    const { result } = renderHook(() =>
      useKeyboardNavigation({ itemCount: 3, onEnter: () => {}, onEscape: () => {} }),
    )
    act(() => result.current.handleKeyDown(mkEvent('ArrowUp')))
    expect(result.current.activeIndex).toBe(-1)
  })

  it('Enter ruft onEnter mit activeIndex', () => {
    const onEnter = vi.fn()
    const { result } = renderHook(() =>
      useKeyboardNavigation({ itemCount: 3, onEnter, onEscape: () => {} }),
    )
    act(() => result.current.handleKeyDown(mkEvent('ArrowDown')))
    act(() => result.current.handleKeyDown(mkEvent('Enter')))
    expect(onEnter).toHaveBeenCalledWith(0)
  })

  it('Enter ruft onEnter(0) wenn activeIndex=-1', () => {
    const onEnter = vi.fn()
    const { result } = renderHook(() =>
      useKeyboardNavigation({ itemCount: 3, onEnter, onEscape: () => {} }),
    )
    act(() => result.current.handleKeyDown(mkEvent('Enter')))
    expect(onEnter).toHaveBeenCalledWith(0)
  })

  it('Enter ohne items macht nichts', () => {
    const onEnter = vi.fn()
    const { result } = renderHook(() =>
      useKeyboardNavigation({ itemCount: 0, onEnter, onEscape: () => {} }),
    )
    act(() => result.current.handleKeyDown(mkEvent('Enter')))
    expect(onEnter).not.toHaveBeenCalled()
  })

  it('Escape ruft onEscape', () => {
    const onEscape = vi.fn()
    const { result } = renderHook(() =>
      useKeyboardNavigation({ itemCount: 3, onEnter: () => {}, onEscape }),
    )
    act(() => result.current.handleKeyDown(mkEvent('Escape')))
    expect(onEscape).toHaveBeenCalled()
  })

  it('reset setzt activeIndex zurück', () => {
    const { result } = renderHook(() =>
      useKeyboardNavigation({ itemCount: 3, onEnter: () => {}, onEscape: () => {} }),
    )
    act(() => result.current.handleKeyDown(mkEvent('ArrowDown')))
    act(() => result.current.reset())
    expect(result.current.activeIndex).toBe(-1)
  })
})
