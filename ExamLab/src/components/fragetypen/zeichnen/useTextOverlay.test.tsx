// ExamLab/src/components/fragetypen/zeichnen/useTextOverlay.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTextOverlay } from './useTextOverlay'

describe('useTextOverlay', () => {
  it('startet unsichtbar', () => {
    const { result } = renderHook(() => useTextOverlay({ onCommit: vi.fn() }))
    expect(result.current.sichtbar).toBe(false)
    expect(result.current.text).toBe('')
  })

  it('oeffnen setzt sichtbar=true und Position', () => {
    const { result } = renderHook(() => useTextOverlay({ onCommit: vi.fn() }))

    act(() => {
      result.current.oeffnen({ logischX: 100, logischY: 200, cssLeft: 25, cssTop: 50 })
    })

    expect(result.current.sichtbar).toBe(true)
    expect(result.current.cssLeft).toBe(25)
    expect(result.current.cssTop).toBe(50)
    expect(result.current.text).toBe('')
  })

  it('setText aktualisiert text', () => {
    const { result } = renderHook(() => useTextOverlay({ onCommit: vi.fn() }))

    act(() => {
      result.current.oeffnen({ logischX: 0, logischY: 0, cssLeft: 0, cssTop: 0 })
    })
    act(() => {
      result.current.setText('Hallo')
    })

    expect(result.current.text).toBe('Hallo')
  })

  it('abschliessen mit Inhalt → onCommit mit getrimmtem Text + Position', () => {
    const onCommit = vi.fn()
    const { result } = renderHook(() => useTextOverlay({ onCommit }))

    act(() => {
      result.current.oeffnen({ logischX: 100, logischY: 200, cssLeft: 0, cssTop: 0 })
    })
    act(() => {
      result.current.setText('  Hallo Welt  ')
    })
    act(() => {
      result.current.abschliessen(false)
    })

    expect(onCommit).toHaveBeenCalledTimes(1)
    expect(onCommit).toHaveBeenCalledWith({ text: 'Hallo Welt', logischX: 100, logischY: 200 })
    expect(result.current.sichtbar).toBe(false)
  })

  it('abschliessen mit abbrechen=true → kein onCommit, sichtbar=false', () => {
    const onCommit = vi.fn()
    const { result } = renderHook(() => useTextOverlay({ onCommit }))

    act(() => {
      result.current.oeffnen({ logischX: 0, logischY: 0, cssLeft: 0, cssTop: 0 })
    })
    act(() => {
      result.current.setText('Test')
    })
    act(() => {
      result.current.abschliessen(true)
    })

    expect(onCommit).not.toHaveBeenCalled()
    expect(result.current.sichtbar).toBe(false)
  })

  it('abschliessen mit leerem Text → kein onCommit', () => {
    const onCommit = vi.fn()
    const { result } = renderHook(() => useTextOverlay({ onCommit }))

    act(() => {
      result.current.oeffnen({ logischX: 0, logischY: 0, cssLeft: 0, cssTop: 0 })
    })
    act(() => {
      result.current.setText('   ')
    })
    act(() => {
      result.current.abschliessen(false)
    })

    expect(onCommit).not.toHaveBeenCalled()
    expect(result.current.sichtbar).toBe(false)
  })

  it('onCommit-Callback-Identity-Wechsel wird via Ref aktualisiert', () => {
    const onCommit1 = vi.fn()
    const onCommit2 = vi.fn()
    const { result, rerender } = renderHook(
      ({ cb }: { cb: (p: { text: string; logischX: number; logischY: number }) => void }) => useTextOverlay({ onCommit: cb }),
      { initialProps: { cb: onCommit1 } },
    )

    act(() => {
      result.current.oeffnen({ logischX: 0, logischY: 0, cssLeft: 0, cssTop: 0 })
    })
    act(() => {
      result.current.setText('A')
    })
    rerender({ cb: onCommit2 })
    act(() => {
      result.current.abschliessen(false)
    })

    expect(onCommit1).not.toHaveBeenCalled()
    expect(onCommit2).toHaveBeenCalledTimes(1)
    expect(onCommit2).toHaveBeenCalledWith({ text: 'A', logischX: 0, logischY: 0 })
  })
})
