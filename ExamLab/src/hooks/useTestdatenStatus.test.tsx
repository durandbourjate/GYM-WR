import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useTestdatenStatus } from './useTestdatenStatus'
import type { Stammdaten } from '../types/stammdaten'
import type { PruefungsConfig } from '../types/pruefung'

const mockStore = vi.hoisted(() => ({ stammdaten: null as Stammdaten | null }))
const ladeAlleConfigsMock = vi.hoisted(() => vi.fn())
const apiTestdatenLetzterSeedMock = vi.hoisted(() => vi.fn())

vi.mock('../store/stammdatenStore', () => ({
  useStammdatenStore: (sel: (s: typeof mockStore) => unknown) => sel(mockStore),
}))

vi.mock('../services/apiService', () => ({
  apiService: {
    ladeAlleConfigs: ladeAlleConfigsMock,
  },
}))

vi.mock('../services/testdatenApi', () => ({
  apiTestdatenLetzterSeed: apiTestdatenLetzterSeedMock,
}))

const echteSD: Stammdaten = {
  fachschaften: [],
  klassen: ['29c'],
  kurse: [{ id: 'sf-wr-29c', name: 'SF WR', fach: 'WR', fachschaft: 'WR', gefaess: 'SF', klassen: ['29c'] }],
  admins: [],
  gefaesse: [],
  faecher: [],
}

const echtePruefung: Partial<PruefungsConfig> = { id: 'pruefung-abc', klasse: '29c' }
const testPruefung: Partial<PruefungsConfig> = { id: 'test-pruefung-1', klasse: 'test-klasse-01' }

describe('useTestdatenStatus', () => {
  beforeEach(() => {
    mockStore.stammdaten = null
    ladeAlleConfigsMock.mockReset()
    apiTestdatenLetzterSeedMock.mockReset()
    apiTestdatenLetzterSeedMock.mockResolvedValue({ success: true, letzterSeedAm: '' })
  })

  it('initialisiert=false ohne email + ohne stammdaten', async () => {
    mockStore.stammdaten = null
    ladeAlleConfigsMock.mockResolvedValue([])
    const { result } = renderHook(() => useTestdatenStatus())
    expect(result.current.initialisiert).toBe(false)
  })

  it('initialisiert=true wenn Stammdaten-Marker vorhanden (zukünftiger Pfad)', async () => {
    mockStore.stammdaten = {
      ...echteSD,
      klassen: ['29c', 'test-klasse-01'],
      kurse: [
        ...echteSD.kurse,
        { id: 'test-kurs-01', name: '[Test] Kurs', fach: 'WR', fachschaft: 'WR', gefaess: 'SF', klassen: ['test-klasse-01'] },
      ],
    }
    ladeAlleConfigsMock.mockResolvedValue([])
    const { result } = renderHook(() => useTestdatenStatus({ email: 'lp@x.ch' }))
    expect(result.current.initialisiert).toBe(true)
  })

  it('initialisiert=true wenn ladeAlleConfigs eine Test-Pruefung enthält', async () => {
    mockStore.stammdaten = echteSD
    ladeAlleConfigsMock.mockResolvedValue([echtePruefung, testPruefung])
    const { result } = renderHook(() => useTestdatenStatus({ email: 'admin@x.ch' }))
    await waitFor(() => expect(result.current.ladestand).toBe('fertig'))
    expect(result.current.initialisiert).toBe(true)
  })

  it('initialisiert=false wenn ladeAlleConfigs nur echte Pruefungen enthält', async () => {
    mockStore.stammdaten = echteSD
    ladeAlleConfigsMock.mockResolvedValue([echtePruefung])
    const { result } = renderHook(() => useTestdatenStatus({ email: 'admin@x.ch' }))
    await waitFor(() => expect(result.current.ladestand).toBe('fertig'))
    expect(result.current.initialisiert).toBe(false)
  })

  it('ladestand=pruefe vor Promise-Resolve, =fertig nach Resolve', async () => {
    mockStore.stammdaten = echteSD
    let resolveFn: ((c: PruefungsConfig[] | null) => void) | undefined
    ladeAlleConfigsMock.mockImplementation(() => new Promise(r => { resolveFn = r }))
    const { result } = renderHook(() => useTestdatenStatus({ email: 'admin@x.ch' }))
    expect(result.current.ladestand).toBe('pruefe')
    resolveFn?.([])
    await waitFor(() => expect(result.current.ladestand).toBe('fertig'))
  })

  it('catch-Branch: ladestand=fertig auch bei Fehler', async () => {
    mockStore.stammdaten = echteSD
    ladeAlleConfigsMock.mockRejectedValue(new Error('Netzwerkfehler'))
    const { result } = renderHook(() => useTestdatenStatus({ email: 'admin@x.ch' }))
    await waitFor(() => expect(result.current.ladestand).toBe('fertig'))
    expect(result.current.initialisiert).toBe(false)
  })

  it('letzterSeedAm wird aus Backend-Response übernommen', async () => {
    mockStore.stammdaten = echteSD
    ladeAlleConfigsMock.mockResolvedValue([testPruefung])
    apiTestdatenLetzterSeedMock.mockResolvedValue({
      success: true,
      letzterSeedAm: '2026-05-17T10:30:00.000Z',
    })
    const { result } = renderHook(() => useTestdatenStatus({ email: 'admin@x.ch' }))
    await waitFor(() => expect(result.current.ladestand).toBe('fertig'))
    expect(result.current.letzterSeedAm).toBe('2026-05-17T10:30:00.000Z')
  })

  it('letzterSeedAm bleibt leer wenn Backend-Endpoint failt (alter Deploy)', async () => {
    mockStore.stammdaten = echteSD
    ladeAlleConfigsMock.mockResolvedValue([])
    apiTestdatenLetzterSeedMock.mockRejectedValue(new Error('Endpoint nicht gefunden'))
    const { result } = renderHook(() => useTestdatenStatus({ email: 'admin@x.ch' }))
    await waitFor(() => expect(result.current.ladestand).toBe('fertig'))
    expect(result.current.letzterSeedAm).toBe('')
  })
})
