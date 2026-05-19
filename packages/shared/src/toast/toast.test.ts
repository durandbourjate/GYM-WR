import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useToastStore } from './toastStore'
import { useToast } from './useToast'

describe('toastStore.add', () => {
  beforeEach(() => {
    useToastStore.setState({ toasts: [] })
  })

  it('pushes a toast into the store', () => {
    useToastStore.getState().add('error', 'Test-Fehler')
    expect(useToastStore.getState().toasts).toHaveLength(1)
    expect(useToastStore.getState().toasts[0].message).toBe('Test-Fehler')
    expect(useToastStore.getState().toasts[0].variant).toBe('error')
  })
})

describe('useToast.error', () => {
  beforeEach(() => {
    useToastStore.setState({ toasts: [] })
  })

  it('creates a sticky toast by default for errors', () => {
    const { result } = renderHook(() => useToast())
    result.current.error('Bleibt')
    const toast = useToastStore.getState().toasts[0]
    expect(toast.variant).toBe('error')
    expect(toast.sticky).toBe(true)
  })
})

describe('useToast identity', () => {
  it('returns referentially stable api across renders', () => {
    const { result, rerender } = renderHook(() => useToast())
    const first = result.current
    rerender()
    const second = result.current
    expect(first).toBe(second)
  })
})
