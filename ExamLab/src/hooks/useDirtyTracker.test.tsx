import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDirtyTracker } from './useDirtyTracker'
import { useDraftStore } from '../store/draftStore'

beforeEach(() => {
  useDraftStore.setState({ aktiveDrafts: new Map() })
})

describe('useDirtyTracker', () => {
  it('registriert beim Mount', () => {
    renderHook(() => useDirtyTracker('e1'))
    expect(useDraftStore.getState().aktiveDrafts.has('e1')).toBe(true)
  })

  it('unregister beim Unmount', () => {
    const { unmount } = renderHook(() => useDirtyTracker('e1'))
    unmount()
    expect(useDraftStore.getState().aktiveDrafts.has('e1')).toBe(false)
  })

  it('markiereDirty updated istDirty', () => {
    const { result } = renderHook(() => useDirtyTracker('e1'))
    act(() => result.current.markiereDirty())
    expect(result.current.istDirty).toBe(true)
  })

  it('markiereSauber resettet istDirty', () => {
    const { result } = renderHook(() => useDirtyTracker('e1'))
    act(() => result.current.markiereDirty())
    act(() => result.current.markiereSauber())
    expect(result.current.istDirty).toBe(false)
  })
})
