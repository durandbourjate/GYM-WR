import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useToastStore } from '../store/toastStore'
import { useToast } from './useToast'

describe('useToast', () => {
  beforeEach(() => {
    useToastStore.setState({ toasts: [] })
  })

  it('error() fügt error-Variant zum Store hinzu', () => {
    const { result } = renderHook(() => useToast())
    act(() => { result.current.error('Boom') })
    const t = useToastStore.getState().toasts
    expect(t).toHaveLength(1)
    expect(t[0].variant).toBe('error')
    expect(t[0].message).toBe('Boom')
  })

  it('success/info/warning rufen jeweils richtigen Variant', () => {
    const { result } = renderHook(() => useToast())
    act(() => {
      result.current.success('A')
      result.current.info('B')
      result.current.warning('C')
    })
    const t = useToastStore.getState().toasts
    expect(t.map(x => x.variant)).toEqual(['success', 'info', 'warning'])
  })

  it('dismiss(id) entfernt Toast', () => {
    const { result } = renderHook(() => useToast())
    let id: string = ''
    act(() => { id = result.current.error('X') })
    act(() => { result.current.dismiss(id) })
    expect(useToastStore.getState().toasts).toHaveLength(0)
  })

  it('opts werden durchgereicht (sticky override)', () => {
    const { result } = renderHook(() => useToast())
    act(() => { result.current.success('X', { sticky: true }) })
    expect(useToastStore.getState().toasts[0].sticky).toBe(true)
  })
})
