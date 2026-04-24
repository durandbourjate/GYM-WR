/**
 * Tests für useResizableHandle
 * Geteilter Hook für Drag-to-Resize-Verhalten (Sidebar-Breite + localStorage-Persistenz).
 * Ersetzt dupliziertes Drag-Handler-Pattern in ResizableSidebar, Layout-aside, MaterialPanel.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useResizableHandle } from '@shared/ui/useResizableHandle'

function dispatchPointer(type: string, init: { clientX?: number } = {}) {
  const ev = new MouseEvent(type, { bubbles: true, cancelable: true, ...init })
  document.dispatchEvent(ev)
}

describe('useResizableHandle', () => {
  beforeEach(() => {
    localStorage.clear()
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  })

  it('initialisiert mit defaultWidth wenn kein storageKey', () => {
    const { result } = renderHook(() =>
      useResizableHandle({ defaultWidth: 500, minWidth: 200 })
    )
    expect(result.current.width).toBe(500)
    expect(result.current.isDragging).toBe(false)
  })

  it('lädt Breite aus localStorage wenn storageKey gesetzt', () => {
    localStorage.setItem('sidebar-test', '700')
    const { result } = renderHook(() =>
      useResizableHandle({ defaultWidth: 500, minWidth: 200, storageKey: 'test' })
    )
    expect(result.current.width).toBe(700)
  })

  it('clampt gespeicherte Breite an min/max beim Laden', () => {
    localStorage.setItem('sidebar-test', '10000')
    const { result } = renderHook(() =>
      useResizableHandle({ defaultWidth: 500, minWidth: 200, maxWidth: 800, storageKey: 'test' })
    )
    expect(result.current.width).toBe(800)
  })

  it('clampt zu kleine gespeicherte Breite auf minWidth', () => {
    localStorage.setItem('sidebar-test', '50')
    const { result } = renderHook(() =>
      useResizableHandle({ defaultWidth: 500, minWidth: 200, storageKey: 'test' })
    )
    expect(result.current.width).toBe(200)
  })

  it('ignoriert ungültigen localStorage-Wert, nimmt default', () => {
    localStorage.setItem('sidebar-test', 'abc')
    const { result } = renderHook(() =>
      useResizableHandle({ defaultWidth: 500, minWidth: 200, storageKey: 'test' })
    )
    expect(result.current.width).toBe(500)
  })

  it('setWidth aktualisiert Breite manuell', () => {
    const { result } = renderHook(() =>
      useResizableHandle({ defaultWidth: 500, minWidth: 200 })
    )
    act(() => {
      result.current.setWidth(600)
    })
    expect(result.current.width).toBe(600)
  })

  it('side=right: Drag nach rechts vergrössert Breite', () => {
    const { result } = renderHook(() =>
      useResizableHandle({ defaultWidth: 500, minWidth: 200, maxWidth: 1000, side: 'right' })
    )

    act(() => {
      result.current.onPointerDown({
        clientX: 100,
        preventDefault: () => {},
      } as unknown as React.PointerEvent)
    })
    expect(result.current.isDragging).toBe(true)

    act(() => {
      dispatchPointer('pointermove', { clientX: 150 })
    })
    expect(result.current.width).toBe(550) // 500 + (150-100)

    act(() => {
      dispatchPointer('pointerup')
    })
    expect(result.current.isDragging).toBe(false)
  })

  it('side=left: Drag nach links vergrössert Breite', () => {
    const { result } = renderHook(() =>
      useResizableHandle({ defaultWidth: 500, minWidth: 200, maxWidth: 1000, side: 'left' })
    )

    act(() => {
      result.current.onPointerDown({
        clientX: 500,
        preventDefault: () => {},
      } as unknown as React.PointerEvent)
    })

    act(() => {
      dispatchPointer('pointermove', { clientX: 400 })
    })
    expect(result.current.width).toBe(600) // 500 + (500-400)
  })

  it('respektiert minWidth während Drag', () => {
    const { result } = renderHook(() =>
      useResizableHandle({ defaultWidth: 500, minWidth: 300, maxWidth: 1000, side: 'right' })
    )

    act(() => {
      result.current.onPointerDown({
        clientX: 500,
        preventDefault: () => {},
      } as unknown as React.PointerEvent)
    })

    act(() => {
      dispatchPointer('pointermove', { clientX: 100 })
    })
    expect(result.current.width).toBe(300)
  })

  it('respektiert maxWidth während Drag', () => {
    const { result } = renderHook(() =>
      useResizableHandle({ defaultWidth: 500, minWidth: 200, maxWidth: 700, side: 'right' })
    )

    act(() => {
      result.current.onPointerDown({
        clientX: 0,
        preventDefault: () => {},
      } as unknown as React.PointerEvent)
    })

    act(() => {
      dispatchPointer('pointermove', { clientX: 1000 })
    })
    expect(result.current.width).toBe(700)
  })

  it('persistiert Breite in localStorage bei pointerup wenn storageKey gesetzt', () => {
    const { result } = renderHook(() =>
      useResizableHandle({ defaultWidth: 500, minWidth: 200, maxWidth: 1000, storageKey: 'test' })
    )

    act(() => {
      result.current.onPointerDown({
        clientX: 100,
        preventDefault: () => {},
      } as unknown as React.PointerEvent)
    })
    act(() => {
      dispatchPointer('pointermove', { clientX: 150 })
    })
    act(() => {
      dispatchPointer('pointerup')
    })

    expect(localStorage.getItem('sidebar-test')).toBe('550')
  })

  it('persistiert nicht wenn kein storageKey', () => {
    const { result } = renderHook(() =>
      useResizableHandle({ defaultWidth: 500, minWidth: 200 })
    )

    act(() => {
      result.current.onPointerDown({
        clientX: 100,
        preventDefault: () => {},
      } as unknown as React.PointerEvent)
    })
    act(() => {
      dispatchPointer('pointermove', { clientX: 150 })
    })
    act(() => {
      dispatchPointer('pointerup')
    })

    const sidebarKeys = Object.keys(localStorage).filter((k) => k.startsWith('sidebar-'))
    expect(sidebarKeys.length).toBe(0)
  })

  it('setzt document.body cursor+userSelect während Drag zurück', () => {
    const { result } = renderHook(() =>
      useResizableHandle({ defaultWidth: 500, minWidth: 200 })
    )

    act(() => {
      result.current.onPointerDown({
        clientX: 100,
        preventDefault: () => {},
      } as unknown as React.PointerEvent)
    })
    expect(document.body.style.cursor).toBe('col-resize')
    expect(document.body.style.userSelect).toBe('none')

    act(() => {
      dispatchPointer('pointerup')
    })
    expect(document.body.style.cursor).toBe('')
    expect(document.body.style.userSelect).toBe('')
  })

  it('cleanup: unmount während Drag räumt Listener + Body-Styles auf', () => {
    const { result, unmount } = renderHook(() =>
      useResizableHandle({ defaultWidth: 500, minWidth: 200 })
    )

    act(() => {
      result.current.onPointerDown({
        clientX: 100,
        preventDefault: () => {},
      } as unknown as React.PointerEvent)
    })
    expect(document.body.style.cursor).toBe('col-resize')

    unmount()
    expect(document.body.style.cursor).toBe('')
    expect(document.body.style.userSelect).toBe('')
  })
})
