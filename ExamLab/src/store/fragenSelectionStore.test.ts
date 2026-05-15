import { describe, it, expect, beforeEach } from 'vitest'
import { useFragenSelectionStore } from './fragenSelectionStore'

describe('fragenSelectionStore', () => {
  beforeEach(() => useFragenSelectionStore.getState().leereSelektion())

  it('toggle fügt ID hinzu', () => {
    useFragenSelectionStore.getState().toggle('id1')
    expect(useFragenSelectionStore.getState().selektiert.has('id1')).toBe(true)
  })

  it('toggle entfernt ID beim zweiten Klick', () => {
    useFragenSelectionStore.getState().toggle('id1')
    useFragenSelectionStore.getState().toggle('id1')
    expect(useFragenSelectionStore.getState().selektiert.has('id1')).toBe(false)
  })

  it('Shift-Click selektiert Range über sichtbareIds', () => {
    const sichtbareIds = ['a', 'b', 'c', 'd', 'e']
    useFragenSelectionStore.getState().toggle('a', { sichtbareIds })
    useFragenSelectionStore.getState().toggle('d', { shift: true, sichtbareIds })
    const s = useFragenSelectionStore.getState().selektiert
    expect(s.has('a') && s.has('b') && s.has('c') && s.has('d')).toBe(true)
  })

  it('Shift-Click rückwärts (höhere zu niedrigerer ID) funktioniert auch', () => {
    const sichtbareIds = ['a', 'b', 'c', 'd', 'e']
    useFragenSelectionStore.getState().toggle('d', { sichtbareIds })
    useFragenSelectionStore.getState().toggle('a', { shift: true, sichtbareIds })
    const s = useFragenSelectionStore.getState().selektiert
    expect(s.has('a') && s.has('b') && s.has('c') && s.has('d')).toBe(true)
  })

  it('beschraenkeAufFilter entfernt nicht-sichtbare IDs', () => {
    useFragenSelectionStore.getState().setzeSelektion(new Set(['a', 'b', 'c']))
    useFragenSelectionStore.getState().beschraenkeAufFilter(['a', 'c'])
    expect(Array.from(useFragenSelectionStore.getState().selektiert).sort()).toEqual(['a', 'c'])
  })

  it('alleSichtbarenAuswaehlen addiert alle sichtbare IDs zu bestehenden', () => {
    useFragenSelectionStore.getState().setzeSelektion(new Set(['x']))
    useFragenSelectionStore.getState().alleSichtbarenAuswaehlen(['a', 'b'])
    expect(useFragenSelectionStore.getState().selektiert.size).toBe(3)
  })

  it('leereSelektion setzt Set auf leer UND letzterKlick auf null', () => {
    useFragenSelectionStore.getState().toggle('a')
    useFragenSelectionStore.getState().leereSelektion()
    expect(useFragenSelectionStore.getState().selektiert.size).toBe(0)
    expect(useFragenSelectionStore.getState().letzterKlick).toBeNull()
  })

  it('toggle ohne sichtbareIds (kein Shift) funktioniert weiterhin', () => {
    useFragenSelectionStore.getState().toggle('a')
    useFragenSelectionStore.getState().toggle('b')
    expect(useFragenSelectionStore.getState().selektiert.size).toBe(2)
  })

  it('Shift-Klick ohne vorherigen Klick = regulärer Toggle (M4)', () => {
    useFragenSelectionStore.getState().toggle('a', { shift: true, sichtbareIds: ['a', 'b'] })
    expect(useFragenSelectionStore.getState().selektiert.has('a')).toBe(true)
    expect(useFragenSelectionStore.getState().selektiert.size).toBe(1)
  })

  it('Shift-Klick auf selektierte Target-ID deselektiert Range (M3)', () => {
    const sichtbareIds = ['a', 'b', 'c', 'd']
    useFragenSelectionStore.getState().setzeSelektion(new Set(['a', 'b', 'c', 'd']))
    // Single-Toggle a → setzt letzterKlick='a', deselektiert a (Set: {b,c,d})
    useFragenSelectionStore.getState().toggle('a', { sichtbareIds })
    // Shift+d → target = !has('d') = false → deselect Range a..d (Set: {})
    useFragenSelectionStore.getState().toggle('d', { shift: true, sichtbareIds })
    expect(useFragenSelectionStore.getState().selektiert.size).toBe(0)
  })
})

// useSelektierteIds-Hook — Re-Render-Test via useShallow (Memory-Lehre)
import { renderHook } from '@testing-library/react'
import { useSelektierteIds } from './fragenSelectionStore'

describe('useSelektierteIds (useShallow-Hook)', () => {
  beforeEach(() => useFragenSelectionStore.getState().leereSelektion())

  it('returnt Array der selektierten IDs', () => {
    useFragenSelectionStore.getState().setzeSelektion(new Set(['a', 'b']))
    const { result } = renderHook(() => useSelektierteIds())
    expect(result.current.sort()).toEqual(['a', 'b'])
  })

  it('returnt leeres Array wenn keine Selektion', () => {
    const { result } = renderHook(() => useSelektierteIds())
    expect(result.current).toEqual([])
  })

  it('gleicher Set-Content → gleiche Referenz (useShallow stabil)', () => {
    useFragenSelectionStore.getState().setzeSelektion(new Set(['a', 'b']))
    const { result, rerender } = renderHook(() => useSelektierteIds())
    const erste = result.current
    rerender()
    expect(result.current).toBe(erste) // strikt-gleiche Referenz dank useShallow
  })
})
