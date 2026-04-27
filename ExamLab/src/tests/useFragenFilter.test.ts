/**
 * Baseline-Tests für useFragenFilter (TDD vor Pagination-Cleanup).
 *
 * Der letzte Test ("liefert ALLE Fragen ohne Pagination-Slice") schlägt mit dem
 * aktuellen Code fehl (Slice auf 30) — das ist das Ziel-Verhalten nach Task 7.
 */
import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useFragenFilter } from '../hooks/useFragenFilter'
import type { FilterbareFrage } from '../hooks/useFragenFilter'

const f = (id: string, override: Partial<FilterbareFrage> = {}): FilterbareFrage =>
  ({
    id,
    typ: 'multiple_choice',
    fachbereich: 'BWL',
    thema: `Thema-${id}`,
    unterthema: '',
    bloom: 'k1',
    punkte: 1,
    schwierigkeit: 'mittel',
    tags: [],
    fragetext: `Frage ${id}`,
    ...override,
  }) as unknown as FilterbareFrage

describe('useFragenFilter', () => {
  const fragen: FilterbareFrage[] = [
    f('1'),
    f('2', { fachbereich: 'VWL' }),
    f('3'),
  ]

  it('liefert alle Fragen bei leerem Filter', () => {
    const { result } = renderHook(() => useFragenFilter(fragen, undefined, 'fertig'))
    expect(result.current.gefilterteFragen.length).toBe(3)
  })

  it('Suchtext filtert nach Frage-Inhalt', () => {
    const { result } = renderHook(() => useFragenFilter(fragen, undefined, 'fertig'))
    act(() => result.current.setSuchtext('1'))
    expect(result.current.gefilterteFragen.map(x => x.id)).toEqual(['1'])
  })

  it('Fachbereich-Filter wirkt', () => {
    const { result } = renderHook(() => useFragenFilter(fragen, undefined, 'fertig'))
    act(() => result.current.setFilterFachbereich('VWL'))
    expect(result.current.gefilterteFragen.map(x => x.id)).toEqual(['2'])
  })

  it('Gruppierung "fachbereich" baut korrekte Gruppen', () => {
    const { result } = renderHook(() => useFragenFilter(fragen, undefined, 'fertig'))
    act(() => result.current.setGruppierung('fachbereich'))
    const keys = result.current.gruppierteAnzeige.map(g => g.key).sort()
    expect(keys).toEqual(['BWL', 'VWL'])
  })

  it('liefert ALLE Fragen ohne Pagination-Slice (auch ohne Gruppierung)', () => {
    const grosseListe = Array.from({ length: 100 }, (_, i) => f(`${i}`))
    const { result } = renderHook(() => useFragenFilter(grosseListe, undefined, 'fertig'))
    act(() => result.current.setGruppierung('keine'))
    expect(result.current.gefilterteFragen.length).toBe(100)
    // gruppierteAnzeige (gruppierung='keine') sollte alle 100 enthalten
    const total = result.current.gruppierteAnzeige.reduce(
      (sum, g) => sum + g.fragen.length,
      0,
    )
    expect(total).toBe(100)
  })
})
