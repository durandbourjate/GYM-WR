import { renderHook } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { useTestdatenStatus } from './useTestdatenStatus'
import type { Stammdaten } from '../types/stammdaten'

const mockStore = vi.hoisted(() => ({ stammdaten: null as Stammdaten | null }))

vi.mock('../store/stammdatenStore', () => ({
  useStammdatenStore: (sel: (s: typeof mockStore) => unknown) => sel(mockStore),
}))

const echteSD: Stammdaten = {
  fachschaften: [],
  klassen: ['29c'],
  kurse: [{ id: 'sf-wr-29c', name: 'SF WR', fach: 'WR', fachschaft: 'WR', gefaess: 'SF', klassen: ['29c'] }],
  admins: [],
  gefaesse: [],
  faecher: [],
}

describe('useTestdatenStatus', () => {
  it('initialisiert=false wenn stammdaten null', () => {
    mockStore.stammdaten = null
    const { result } = renderHook(() => useTestdatenStatus())
    expect(result.current.initialisiert).toBe(false)
  })

  it('initialisiert=false ohne Test-Marker', () => {
    mockStore.stammdaten = echteSD
    const { result } = renderHook(() => useTestdatenStatus())
    expect(result.current.initialisiert).toBe(false)
  })

  it('initialisiert=true wenn beide Marker vorhanden', () => {
    mockStore.stammdaten = {
      ...echteSD,
      klassen: ['29c', 'test-klasse-01'],
      kurse: [
        ...echteSD.kurse,
        { id: 'test-kurs-01', name: '[Test] Kurs', fach: 'WR', fachschaft: 'WR', gefaess: 'SF', klassen: ['test-klasse-01'] },
      ],
    }
    const { result } = renderHook(() => useTestdatenStatus())
    expect(result.current.initialisiert).toBe(true)
  })

  it('initialisiert=false wenn nur Klasse aber kein Kurs', () => {
    mockStore.stammdaten = { ...echteSD, klassen: ['29c', 'test-klasse-01'] }
    const { result } = renderHook(() => useTestdatenStatus())
    expect(result.current.initialisiert).toBe(false)
  })
})
