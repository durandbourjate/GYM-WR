import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useState } from 'react'
import { useEditableList } from './useEditableList'

interface TestItem {
  id: string
  text: string
  korrekt: boolean
}

function useTestSetup(initial: TestItem[]) {
  const [items, setItems] = useState(initial)
  const list = useEditableList(items, setItems, {
    minItems: 1,
    createDefault: () => ({ id: `new-${Date.now()}`, text: '', korrekt: false }),
  })
  return { items, ...list }
}

describe('useEditableList', () => {
  it('addItem fügt ein neues Element hinzu', () => {
    const { result } = renderHook(() => useTestSetup([
      { id: '1', text: 'A', korrekt: true },
    ]))

    act(() => result.current.addItem())
    expect(result.current.items).toHaveLength(2)
    expect(result.current.items[1].text).toBe('')
  })

  it('removeItem entfernt ein Element', () => {
    const { result } = renderHook(() => useTestSetup([
      { id: '1', text: 'A', korrekt: true },
      { id: '2', text: 'B', korrekt: false },
    ]))

    act(() => result.current.removeItem(0))
    expect(result.current.items).toHaveLength(1)
    expect(result.current.items[0].id).toBe('2')
  })

  it('removeItem verhindert Unterschreitung von minItems', () => {
    const { result } = renderHook(() => useTestSetup([
      { id: '1', text: 'A', korrekt: true },
    ]))

    act(() => result.current.removeItem(0))
    expect(result.current.items).toHaveLength(1) // Nicht entfernt
    expect(result.current.canRemove).toBe(false)
  })

  it('updateItem aktualisiert ein Element', () => {
    const { result } = renderHook(() => useTestSetup([
      { id: '1', text: 'A', korrekt: false },
      { id: '2', text: 'B', korrekt: false },
    ]))

    act(() => result.current.updateItem(1, { korrekt: true, text: 'B (korrekt)' }))
    expect(result.current.items[1].korrekt).toBe(true)
    expect(result.current.items[1].text).toBe('B (korrekt)')
    expect(result.current.items[0].text).toBe('A') // Unverändert
  })

  it('canRemove ist korrekt', () => {
    const { result } = renderHook(() => useTestSetup([
      { id: '1', text: 'A', korrekt: true },
      { id: '2', text: 'B', korrekt: false },
    ]))

    expect(result.current.canRemove).toBe(true)
    act(() => result.current.removeItem(0))
    expect(result.current.canRemove).toBe(false)
  })
})
