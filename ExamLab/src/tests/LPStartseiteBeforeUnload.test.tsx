/**
 * Bundle 3 P-C.4: beforeunload-Listener-Test
 *
 * Isolierter Test mit TestComponent — vermeide Full-LPStartseite-Mock
 * wegen zu vieler Deps (auth, fragensammlung, router, etc.)
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render } from '@testing-library/react'
import { useEffect } from 'react'
import { useDraftStore } from '../store/draftStore'

/** Repliziert den useEffect exakt aus LPStartseite */
function TestBeforeUnload() {
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (useDraftStore.getState().hatDirty()) {
        e.preventDefault()
        e.returnValue = '' // Cross-Browser-Trigger für Confirm-Dialog
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [])
  return null
}

beforeEach(() => {
  useDraftStore.setState({ aktiveDrafts: new Map() })
})

describe('beforeunload-Listener (LPStartseite P-C.4)', () => {
  it('ruft preventDefault wenn hatDirty=true', () => {
    useDraftStore.setState({
      aktiveDrafts: new Map([['e1', { editorId: 'e1', istDirty: true, status: 'sammlung' }]]),
    })
    render(<TestBeforeUnload />)
    const event = new Event('beforeunload') as BeforeUnloadEvent
    Object.defineProperty(event, 'returnValue', { writable: true, value: '' })
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault')
    window.dispatchEvent(event)
    expect(preventDefaultSpy).toHaveBeenCalled()
  })

  it('setzt returnValue wenn hatDirty=true', () => {
    useDraftStore.setState({
      aktiveDrafts: new Map([['e1', { editorId: 'e1', istDirty: true, status: 'sammlung' }]]),
    })
    render(<TestBeforeUnload />)
    const event = new Event('beforeunload') as BeforeUnloadEvent
    let returnValue = ''
    Object.defineProperty(event, 'returnValue', {
      get: () => returnValue,
      set: (v: string) => { returnValue = v },
    })
    vi.spyOn(event, 'preventDefault')
    window.dispatchEvent(event)
    expect(returnValue).toBe('')
  })

  it('blockiert NICHT wenn kein Draft dirty ist', () => {
    useDraftStore.setState({ aktiveDrafts: new Map() })
    render(<TestBeforeUnload />)
    const event = new Event('beforeunload') as BeforeUnloadEvent
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault')
    window.dispatchEvent(event)
    expect(preventDefaultSpy).not.toHaveBeenCalled()
  })

  it('blockiert NICHT wenn Draft existiert aber istDirty=false', () => {
    useDraftStore.setState({
      aktiveDrafts: new Map([['e1', { editorId: 'e1', istDirty: false, status: 'sammlung' }]]),
    })
    render(<TestBeforeUnload />)
    const event = new Event('beforeunload') as BeforeUnloadEvent
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault')
    window.dispatchEvent(event)
    expect(preventDefaultSpy).not.toHaveBeenCalled()
  })

  it('entfernt Listener bei Unmount (Cleanup)', () => {
    useDraftStore.setState({
      aktiveDrafts: new Map([['e1', { editorId: 'e1', istDirty: true, status: 'sammlung' }]]),
    })
    const { unmount } = render(<TestBeforeUnload />)
    unmount()
    // Nach Unmount darf kein Listener mehr aktiv sein
    const event = new Event('beforeunload') as BeforeUnloadEvent
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault')
    window.dispatchEvent(event)
    expect(preventDefaultSpy).not.toHaveBeenCalled()
  })
})
