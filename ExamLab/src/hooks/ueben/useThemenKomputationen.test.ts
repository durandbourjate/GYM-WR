import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useThemenKomputationen, type ThemenKomputationenInputs } from './useThemenKomputationen'
import type { Frage } from '../../types/ueben/fragen'
import type { FragenFortschritt, ThemenFortschritt } from '../../types/ueben/fortschritt'

// Module-level mocks
vi.mock('../../store/authStore', () => ({
  useAuthStore: { getState: vi.fn(() => ({ istDemoModus: false })) },
}))

vi.mock('../../utils/ueben/empfehlungen', () => ({
  berechneEmpfehlungen: vi.fn(() => []),
}))

vi.mock('../../utils/poolTitelMapping', () => ({
  poolTitel: vi.fn(() => null),
}))

import { useAuthStore } from '../../store/authStore'
import { berechneEmpfehlungen } from '../../utils/ueben/empfehlungen'
import { poolTitel } from '../../utils/poolTitelMapping'

// Helpers
const leererFortschritt: ThemenFortschritt = {
  fach: 'M',
  thema: 'A',
  gesamt: 0,
  gemeistert: 0,
  gefestigt: 0,
  ueben: 0,
  neu: 0,
  quote: 0,
}

const fragenFortschritt = (override: Partial<FragenFortschritt> = {}): FragenFortschritt => ({
  fragenId: 'f1',
  email: 'test@x',
  versuche: 0,
  richtig: 0,
  richtigInFolge: 0,
  sessionIds: [],
  letzterVersuch: '',
  mastery: 'neu',
  ...override,
})

const mockFrage = (override: Partial<Frage> = {}): Frage => ({
  id: 'f1',
  fach: 'Mathe',
  thema: 'Algebra',
  typ: 'mc',
  schwierigkeit: 2,
  fragetext: 'Test-Frage',
  ...override,
} as Frage)

const baseInputs = (override: Partial<ThemenKomputationenInputs> = {}): ThemenKomputationenInputs => ({
  alleFragen: [],
  fortschritte: {},
  auftraege: [],
  user: null,
  freischaltungen: [],
  einstellungen: null,
  sichtbareFaecher: [],
  aktiverFach: null,
  aktivesThema: null,
  alleThemenAnzeigen: false,
  suchtext: '',
  unterthemaFilter: new Set(),
  schwierigkeitFilter: new Set(),
  typFilter: new Set(),
  sortierung: 'alphabetisch',
  getThemenFortschritt: vi.fn(() => leererFortschritt),
  getStatus: vi.fn(() => 'aktiv' as const),
  getAktiveUnterthemen: vi.fn(() => undefined),
  ...override,
})

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(useAuthStore.getState).mockReturnValue({ istDemoModus: false } as ReturnType<typeof useAuthStore.getState>)
  vi.mocked(poolTitel).mockReturnValue(null)
  vi.mocked(berechneEmpfehlungen).mockReturnValue([])
})

describe('useThemenKomputationen — themenMap', () => {
  it('non-Demo blendet Einrichtungstest-Fragen aus', () => {
    const fragen: Frage[] = [
      mockFrage({ id: 'f1', fach: 'Mathe', thema: 'Einrichtungstest' }),
      mockFrage({ id: 'f2', fach: 'Mathe', thema: 'Algebra' }),
    ]
    const { result } = renderHook(() => useThemenKomputationen(baseInputs({ alleFragen: fragen })))
    expect(result.current.themenMap).toEqual({ Mathe: expect.arrayContaining([
      expect.objectContaining({ thema: 'Algebra' }),
    ]) })
    expect(result.current.themenMap.Mathe).toHaveLength(1)
  })

  it('Demo-Modus zeigt Einrichtungstest-Fragen', () => {
    vi.mocked(useAuthStore.getState).mockReturnValue({ istDemoModus: true } as ReturnType<typeof useAuthStore.getState>)
    const fragen: Frage[] = [
      mockFrage({ id: 'f1', fach: 'Mathe', thema: 'Einrichtungstest' }),
    ]
    const { result } = renderHook(() => useThemenKomputationen(baseInputs({ alleFragen: fragen })))
    expect(result.current.themenMap.Mathe).toEqual(expect.arrayContaining([
      expect.objectContaining({ thema: 'Einrichtungstest' }),
    ]))
  })

  it('Pool-Mapping ersetzt thema durch poolTitel', () => {
    vi.mocked(poolTitel).mockReturnValue('Marketing-Mix-Pool')
    const fragen: Frage[] = [
      mockFrage({ id: 'f1', fach: 'Wirtschaft', thema: 'OriginalThema', poolId: 'pool-x:variant' } as Frage & { poolId: string }),
    ]
    const { result } = renderHook(() => useThemenKomputationen(baseInputs({ alleFragen: fragen })))
    expect(result.current.themenMap.Wirtschaft).toEqual(expect.arrayContaining([
      expect.objectContaining({ thema: 'Marketing-Mix-Pool' }),
    ]))
  })

  it('sichtbareFaecher-Filter blendet andere Fächer aus', () => {
    const fragen: Frage[] = [
      mockFrage({ id: 'f1', fach: 'Mathe', thema: 'Algebra' }),
      mockFrage({ id: 'f2', fach: 'Geographie', thema: 'Klima' }),
    ]
    const { result } = renderHook(() => useThemenKomputationen(baseInputs({
      alleFragen: fragen,
      sichtbareFaecher: ['Mathe'],
    })))
    expect(Object.keys(result.current.themenMap)).toEqual(['Mathe'])
  })

  it('mehrere Fächer/Themen werden korrekt gruppiert', () => {
    const fragen: Frage[] = [
      mockFrage({ id: 'f1', fach: 'Mathe', thema: 'Algebra' }),
      mockFrage({ id: 'f2', fach: 'Mathe', thema: 'Algebra' }),
      mockFrage({ id: 'f3', fach: 'Mathe', thema: 'Geometrie' }),
      mockFrage({ id: 'f4', fach: 'Wirtschaft', thema: 'BWL' }),
    ]
    const { result } = renderHook(() => useThemenKomputationen(baseInputs({ alleFragen: fragen })))
    expect(result.current.themenMap.Mathe).toHaveLength(2) // Algebra + Geometrie
    expect(result.current.themenMap.Wirtschaft).toHaveLength(1)
  })
})

describe('useThemenKomputationen — verfuegbareFaecher', () => {
  it('sortiert alphabetisch', () => {
    const fragen: Frage[] = [
      mockFrage({ id: 'f1', fach: 'Wirtschaft', thema: 'BWL' }),
      mockFrage({ id: 'f2', fach: 'Mathe', thema: 'Algebra' }),
      mockFrage({ id: 'f3', fach: 'Deutsch', thema: 'Grammatik' }),
    ]
    const { result } = renderHook(() => useThemenKomputationen(baseInputs({ alleFragen: fragen })))
    expect(result.current.verfuegbareFaecher).toEqual(['Deutsch', 'Mathe', 'Wirtschaft'])
  })
})

describe('useThemenKomputationen — sichtbareThemenListe', () => {
  it('freischaltungen-leer-Fallback zeigt alle Themen', () => {
    const fragen: Frage[] = [mockFrage({ fach: 'M', thema: 'A' })]
    const { result } = renderHook(() => useThemenKomputationen(baseInputs({
      alleFragen: fragen,
      freischaltungen: [],
    })))
    expect(result.current.sichtbareThemenListe).toHaveLength(1)
  })

  it('status-Filter zeigt nur aktiv + abgeschlossen wenn Freischaltungen existieren', () => {
    const fragen: Frage[] = [
      mockFrage({ id: 'f1', fach: 'M', thema: 'A' }),
      mockFrage({ id: 'f2', fach: 'M', thema: 'B' }),
    ]
    const getStatus = vi.fn((_fach: string, thema: string) =>
      thema === 'A' ? ('aktiv' as const) : ('nicht_freigeschaltet' as const)
    )
    const { result } = renderHook(() => useThemenKomputationen(baseInputs({
      alleFragen: fragen,
      freischaltungen: [{ fach: 'M', thema: 'A', status: 'aktiv', aktiviertAm: '', aktiviertVon: '', typ: 'manuell' }] as ThemenKomputationenInputs['freischaltungen'],
      getStatus,
    })))
    expect(result.current.sichtbareThemenListe).toHaveLength(1)
    expect(result.current.sichtbareThemenListe[0].thema).toBe('A')
  })

  it('alleThemenAnzeigen true zeigt auch nicht-freigeschaltete', () => {
    const fragen: Frage[] = [
      mockFrage({ id: 'f1', fach: 'M', thema: 'A' }),
      mockFrage({ id: 'f2', fach: 'M', thema: 'B' }),
    ]
    const getStatus = vi.fn(() => 'nicht_freigeschaltet' as const)
    const { result } = renderHook(() => useThemenKomputationen(baseInputs({
      alleFragen: fragen,
      freischaltungen: [{ fach: 'M', thema: 'A', status: 'aktiv', aktiviertAm: '', aktiviertVon: '', typ: 'manuell' }] as ThemenKomputationenInputs['freischaltungen'],
      alleThemenAnzeigen: true,
      getStatus,
    })))
    expect(result.current.sichtbareThemenListe).toHaveLength(2)
  })

  it('suchtext matcht Thema-Name', () => {
    const fragen: Frage[] = [
      mockFrage({ id: 'f1', fach: 'M', thema: 'Algebra' }),
      mockFrage({ id: 'f2', fach: 'M', thema: 'Geometrie' }),
    ]
    // suchtext-Filter ist nur aktiv, wenn auch Freischaltungen existieren
    const { result } = renderHook(() => useThemenKomputationen(baseInputs({
      alleFragen: fragen,
      freischaltungen: [{ fach: 'M', thema: 'A', status: 'aktiv', aktiviertAm: '', aktiviertVon: '', typ: 'manuell' }] as ThemenKomputationenInputs['freischaltungen'],
      suchtext: 'algebra',
    })))
    expect(result.current.sichtbareThemenListe).toHaveLength(1)
    expect(result.current.sichtbareThemenListe[0].thema).toBe('Algebra')
  })
})

describe('useThemenKomputationen — letzteUebungProThema', () => {
  it('leerer fortschritte → leere Map', () => {
    const { result } = renderHook(() => useThemenKomputationen(baseInputs()))
    expect(result.current.letzteUebungProThema.size).toBe(0)
  })

  it('neuester Versuch pro Thema gewinnt', () => {
    const fragen: Frage[] = [
      mockFrage({ id: 'f1', fach: 'M', thema: 'A' }),
      mockFrage({ id: 'f2', fach: 'M', thema: 'A' }),
    ]
    const fortschritte: Record<string, FragenFortschritt> = {
      f1: fragenFortschritt({ fragenId: 'f1', letzterVersuch: '2026-05-01T10:00:00Z' }),
      f2: fragenFortschritt({ fragenId: 'f2', letzterVersuch: '2026-05-05T10:00:00Z' }),
    }
    const { result } = renderHook(() => useThemenKomputationen(baseInputs({
      alleFragen: fragen,
      fortschritte,
    })))
    expect(result.current.letzteUebungProThema.get('M|A')).toBe('2026-05-05T10:00:00Z')
  })

  it('mehrere Themen werden separat gespeichert', () => {
    const fragen: Frage[] = [
      mockFrage({ id: 'f1', fach: 'M', thema: 'A' }),
      mockFrage({ id: 'f2', fach: 'M', thema: 'B' }),
    ]
    const fortschritte: Record<string, FragenFortschritt> = {
      f1: fragenFortschritt({ fragenId: 'f1', letzterVersuch: '2026-05-01T10:00:00Z' }),
      f2: fragenFortschritt({ fragenId: 'f2', letzterVersuch: '2026-05-05T10:00:00Z' }),
    }
    const { result } = renderHook(() => useThemenKomputationen(baseInputs({
      alleFragen: fragen,
      fortschritte,
    })))
    expect(result.current.letzteUebungProThema.size).toBe(2)
  })
})

describe('useThemenKomputationen — themenSektionen', () => {
  it('teilt in aktuelle/faecherSortiert/weitere auf', () => {
    const fragen: Frage[] = [
      mockFrage({ id: 'f1', fach: 'M', thema: 'A' }),
      mockFrage({ id: 'f2', fach: 'M', thema: 'B' }),
      mockFrage({ id: 'f3', fach: 'M', thema: 'C' }),
    ]
    const getStatus = vi.fn((_fach: string, thema: string) => {
      if (thema === 'A') return 'aktiv' as const
      if (thema === 'B') return 'abgeschlossen' as const
      return 'nicht_freigeschaltet' as const
    })
    const { result } = renderHook(() => useThemenKomputationen(baseInputs({
      alleFragen: fragen,
      freischaltungen: [{ fach: 'M', thema: 'A', status: 'aktiv', aktiviertAm: '', aktiviertVon: '', typ: 'manuell' }] as ThemenKomputationenInputs['freischaltungen'],
      alleThemenAnzeigen: true, // damit weitere durchkommen
      getStatus,
    })))
    expect(result.current.themenSektionen.aktuelle).toHaveLength(1)
    expect(result.current.themenSektionen.aktuelle[0].thema).toBe('A')
    expect(result.current.themenSektionen.faecherSortiert).toHaveLength(1)
    expect(result.current.themenSektionen.weitere).toHaveLength(1)
  })

  it('sortierung "zuletztGeuebt" sortiert nach letzteUebungProThema absteigend', () => {
    const fragen: Frage[] = [
      mockFrage({ id: 'f1', fach: 'M', thema: 'Alt' }),
      mockFrage({ id: 'f2', fach: 'M', thema: 'Neu' }),
    ]
    const fortschritte: Record<string, FragenFortschritt> = {
      f1: fragenFortschritt({ fragenId: 'f1', letzterVersuch: '2026-05-01T10:00:00Z' }),
      f2: fragenFortschritt({ fragenId: 'f2', letzterVersuch: '2026-05-05T10:00:00Z' }),
    }
    // freischaltungen erforderlich, sonst sektioniert getStatus-Resultat als 'abgeschlossen'
    const { result } = renderHook(() => useThemenKomputationen(baseInputs({
      alleFragen: fragen,
      fortschritte,
      sortierung: 'zuletztGeuebt',
      freischaltungen: [{ fach: 'M', thema: 'Alt', status: 'aktiv', aktiviertAm: '', aktiviertVon: '', typ: 'manuell' }] as ThemenKomputationenInputs['freischaltungen'],
      getStatus: vi.fn(() => 'aktiv' as const),
    })))
    expect(result.current.themenSektionen.aktuelle[0].thema).toBe('Neu')
    expect(result.current.themenSektionen.aktuelle[1].thema).toBe('Alt')
  })
})

describe('useThemenKomputationen — themaDetail', () => {
  it('aktivesThema null → null', () => {
    const { result } = renderHook(() => useThemenKomputationen(baseInputs()))
    expect(result.current.themaDetail).toBeNull()
  })

  it('findet Thema in sichtbareThemenListe', () => {
    const fragen: Frage[] = [mockFrage({ fach: 'M', thema: 'Algebra' })]
    const { result } = renderHook(() => useThemenKomputationen(baseInputs({
      alleFragen: fragen,
      aktivesThema: 'Algebra',
    })))
    expect(result.current.themaDetail?.thema).toBe('Algebra')
  })

  it('nicht gefundenes Thema → null', () => {
    const { result } = renderHook(() => useThemenKomputationen(baseInputs({
      aktivesThema: 'Existiert-nicht',
    })))
    expect(result.current.themaDetail).toBeNull()
  })
})

describe('useThemenKomputationen — gefilterteFragen', () => {
  it('themaDetail null → leer', () => {
    const { result } = renderHook(() => useThemenKomputationen(baseInputs()))
    expect(result.current.gefilterteFragen).toEqual([])
  })

  it('alle 3 Filter aktiv reduzieren Liste', () => {
    const fragen: Frage[] = [
      mockFrage({ id: 'f1', fach: 'M', thema: 'A', schwierigkeit: 1, typ: 'mc' }),
      mockFrage({ id: 'f2', fach: 'M', thema: 'A', schwierigkeit: 2, typ: 'mc' }),
      mockFrage({ id: 'f3', fach: 'M', thema: 'A', schwierigkeit: 1, typ: 'freitext' }),
    ]
    const { result } = renderHook(() => useThemenKomputationen(baseInputs({
      alleFragen: fragen,
      aktivesThema: 'A',
      schwierigkeitFilter: new Set([1]),
      typFilter: new Set(['mc']),
    })))
    expect(result.current.gefilterteFragen).toHaveLength(1)
    expect(result.current.gefilterteFragen[0].id).toBe('f1')
  })
})

describe('useThemenKomputationen — empfehlungen', () => {
  it('user null → leer', () => {
    const { result } = renderHook(() => useThemenKomputationen(baseInputs({
      alleFragen: [mockFrage()],
      user: null,
    })))
    expect(result.current.empfehlungen).toEqual([])
  })

  it('alleFragen leer → leer', () => {
    const { result } = renderHook(() => useThemenKomputationen(baseInputs({
      user: { email: 'test@x', name: 'Test User', vorname: 'Test', nachname: 'User', rolle: 'lernend', loginMethode: 'code' } as ThemenKomputationenInputs['user'],
    })))
    expect(result.current.empfehlungen).toEqual([])
  })
})
