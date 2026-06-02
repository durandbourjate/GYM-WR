import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useBildKoordinatenCursor } from './useBildKoordinatenCursor.ts'

function key(k: string, shift = false) { return { key: k, shiftKey: shift, preventDefault: vi.fn() } as unknown as React.KeyboardEvent }

describe('useBildKoordinatenCursor', () => {
  it('Pfeil bewegt um 2 %, Shift um 0,5 %', () => {
    const { result } = renderHook(() => useBildKoordinatenCursor({ onPlatzieren: vi.fn() }))
    act(() => result.current.onKeyDown(key('ArrowRight')))
    expect(result.current.pos.x).toBe(52)
    act(() => result.current.onKeyDown(key('ArrowRight', true)))
    expect(result.current.pos.x).toBeCloseTo(52.5)
  })
  it('clamp 0–100', () => {
    const { result } = renderHook(() => useBildKoordinatenCursor({ onPlatzieren: vi.fn(), start: { x: 99, y: 1 } }))
    act(() => result.current.onKeyDown(key('ArrowRight'))); act(() => result.current.onKeyDown(key('ArrowRight')))
    expect(result.current.pos.x).toBe(100)
    act(() => result.current.onKeyDown(key('ArrowUp'))); act(() => result.current.onKeyDown(key('ArrowUp')))
    expect(result.current.pos.y).toBe(0)
  })
  it('Enter platziert an aktueller Position', () => {
    const onPlatzieren = vi.fn()
    const { result } = renderHook(() => useBildKoordinatenCursor({ onPlatzieren, start: { x: 30, y: 40 } }))
    act(() => result.current.onKeyDown(key('Enter')))
    expect(onPlatzieren).toHaveBeenCalledWith({ x: 30, y: 40 })
  })
  it('disabled: kein Move, kein Platzieren', () => {
    const onPlatzieren = vi.fn()
    const { result } = renderHook(() => useBildKoordinatenCursor({ onPlatzieren, disabled: true }))
    act(() => result.current.onKeyDown(key('ArrowRight'))); act(() => result.current.onKeyDown(key('Enter')))
    expect(result.current.pos.x).toBe(50); expect(onPlatzieren).not.toHaveBeenCalled()
  })
})
