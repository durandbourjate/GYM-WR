import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useLPConfigFiltering, type UseLPConfigFilteringInputs } from './useLPConfigFiltering'
import type { PruefungsConfig } from '../types/pruefung'

const baseConfig = (overrides: Partial<PruefungsConfig> = {}): PruefungsConfig => ({
  id: 'c1',
  titel: 'Test Prüfung',
  klasse: '4a',
  gefaess: 'GF',
  semester: 'S3',
  fachbereiche: ['Mathe'],
  datum: '2026-01-15',
  typ: 'summativ',
  modus: 'pruefung',
  dauerMinuten: 60,
  zeitModus: 'countdown',
  gesamtpunkte: 30,
  erlaubteKlasse: '',
  abschnitte: [],
  zufallsreihenfolgeFragen: false,
  zufallsreihenfolgeOptionen: false,
  ruecknavigation: true,
  zeitanzeigeTyp: 'countdown',
  freigeschaltet: false,
  autoSaveIntervallSekunden: 15,
  heartbeatIntervallSekunden: 5,
  sebErforderlich: false,
  teilnehmer: [],
  zeitverlaengerungen: {},
  sebAusnahmen: [],
  erstelltVon: 'lp@test',
  korrektur: { aktiviert: false, modus: 'batch' },
  feedback: { zeitpunkt: 'manuell', format: 'in-app-und-pdf', detailgrad: 'vollstaendig' },
  ...overrides,
})

const baseInputs = (overrides: Partial<UseLPConfigFilteringInputs> = {}): UseLPConfigFilteringInputs => ({
  configs: [],
  suchtext: '',
  filterFach: [],
  filterTyp: null,
  filterGefaess: null,
  sortierung: 'datum',
  filterStatus: 'aktiv',
  testdatenSichtbar: true, // Default für bestehende Tests: keine Test-Filter-Wirkung
  ...overrides,
})

describe('useLPConfigFiltering', () => {
  describe('verfuegbareFachbereiche', () => {
    it('leere configs → []', () => {
      const { result } = renderHook(() => useLPConfigFiltering(baseInputs()))
      expect(result.current.verfuegbareFachbereiche).toEqual([])
    })

    it('mehrere fachbereiche pro config, alphabetisch sortiert + dedupliziert', () => {
      const configs = [
        baseConfig({ id: '1', fachbereiche: ['Z-Fach', 'A-Fach'] }),
        baseConfig({ id: '2', fachbereiche: ['M-Fach', 'A-Fach'] }),
      ]
      const { result } = renderHook(() => useLPConfigFiltering(baseInputs({ configs })))
      expect(result.current.verfuegbareFachbereiche).toEqual(['A-Fach', 'M-Fach', 'Z-Fach'])
    })
  })

  describe('verfuegbareGefaesse', () => {
    it('leere configs → []', () => {
      const { result } = renderHook(() => useLPConfigFiltering(baseInputs()))
      expect(result.current.verfuegbareGefaesse).toEqual([])
    })

    it('configs ohne gefaess werden ignoriert, alphabetisch sortiert', () => {
      const configs = [
        baseConfig({ id: '1', gefaess: 'EF' }),
        baseConfig({ id: '2', gefaess: '' }),
        baseConfig({ id: '3', gefaess: 'GF' }),
      ]
      const { result } = renderHook(() => useLPConfigFiltering(baseInputs({ configs })))
      expect(result.current.verfuegbareGefaesse).toEqual(['EF', 'GF'])
    })
  })

  describe('summativeConfigs / formativeConfigs', () => {
    it('trennt nach typ === "formativ"', () => {
      const configs = [
        baseConfig({ id: '1', typ: 'summativ' }),
        baseConfig({ id: '2', typ: 'formativ' }),
        baseConfig({ id: '3', typ: 'summativ' }),
      ]
      const { result } = renderHook(() => useLPConfigFiltering(baseInputs({ configs })))
      expect(result.current.summativeConfigs.map(c => c.id)).toEqual(['1', '3'])
      expect(result.current.formativeConfigs.map(c => c.id)).toEqual(['2'])
    })
  })

  describe('gefilterteConfigs (suchtext / fach / typ / gefaess / status / sortierung)', () => {
    const configs = [
      baseConfig({ id: 'a', titel: 'Mathe-Test', klasse: '4a', datum: '2026-01-01', fachbereiche: ['Mathe'], gefaess: 'GF', typ: 'summativ' }),
      baseConfig({ id: 'b', titel: 'Englisch-Quiz', klasse: '4b', datum: '2026-02-01', fachbereiche: ['Englisch'], gefaess: 'EF', typ: 'summativ' }),
      baseConfig({ id: 'c', titel: 'Archived', klasse: '4c', datum: '2025-12-01', fachbereiche: ['Mathe'], gefaess: 'GF', typ: 'summativ', beendetUm: '2025-12-15' }),
    ]

    it('suchtext matcht titel/klasse/id (case-insensitive)', () => {
      const { result } = renderHook(() => useLPConfigFiltering(baseInputs({ configs, suchtext: 'mathe' })))
      expect(result.current.gefilterteConfigs.map(c => c.id)).toEqual(['a'])
    })

    it('filterFach OR-Match', () => {
      const { result } = renderHook(() => useLPConfigFiltering(baseInputs({ configs, filterFach: ['Englisch'] })))
      expect(result.current.gefilterteConfigs.map(c => c.id)).toEqual(['b'])
    })

    it('filterStatus aktiv vs archiviert', () => {
      const { result: aktiv } = renderHook(() => useLPConfigFiltering(baseInputs({ configs, filterStatus: 'aktiv' })))
      expect(aktiv.current.gefilterteConfigs.map(c => c.id).sort()).toEqual(['a', 'b'])
      const { result: arch } = renderHook(() => useLPConfigFiltering(baseInputs({ configs, filterStatus: 'archiviert' })))
      expect(arch.current.gefilterteConfigs.map(c => c.id)).toEqual(['c'])
      const { result: alle } = renderHook(() => useLPConfigFiltering(baseInputs({ configs, filterStatus: 'alle' })))
      expect(alle.current.gefilterteConfigs.length).toBe(3)
    })

    it('sortierung datum: neueste zuerst', () => {
      const { result } = renderHook(() => useLPConfigFiltering(baseInputs({ configs, filterStatus: 'alle', sortierung: 'datum' })))
      expect(result.current.gefilterteConfigs.map(c => c.id)).toEqual(['b', 'a', 'c'])
    })

    it('sortierung titel: alphabetisch', () => {
      const { result } = renderHook(() => useLPConfigFiltering(baseInputs({ configs, filterStatus: 'alle', sortierung: 'titel' })))
      expect(result.current.gefilterteConfigs.map(c => c.titel)).toEqual(['Archived', 'Englisch-Quiz', 'Mathe-Test'])
    })
  })

  describe('gefilterteUebungen (formative)', () => {
    it('analog gefilterteConfigs aber auf formative', () => {
      const configs = [
        baseConfig({ id: '1', typ: 'summativ' }),
        baseConfig({ id: '2', typ: 'formativ', titel: 'Üb1' }),
        baseConfig({ id: '3', typ: 'formativ', titel: 'Üb2', beendetUm: '2025-12-01' }),
      ]
      const { result } = renderHook(() => useLPConfigFiltering(baseInputs({ configs, filterStatus: 'aktiv' })))
      expect(result.current.gefilterteUebungen.map(c => c.id)).toEqual(['2'])
    })
  })

  describe('letzteFuenf', () => {
    it('aktive Filter → []', () => {
      const configs = Array.from({ length: 10 }, (_, i) => baseConfig({ id: `${i}`, typ: 'summativ' }))
      const { result } = renderHook(() => useLPConfigFiltering(baseInputs({ configs, suchtext: 'x' })))
      expect(result.current.letzteFuenf).toEqual([])
    })

    it('≤5 summative → []', () => {
      const configs = Array.from({ length: 5 }, (_, i) => baseConfig({ id: `${i}`, typ: 'summativ' }))
      const { result } = renderHook(() => useLPConfigFiltering(baseInputs({ configs })))
      expect(result.current.letzteFuenf).toEqual([])
    })

    it('>5 summative → top-5 nach Datum desc', () => {
      const configs = Array.from({ length: 7 }, (_, i) =>
        baseConfig({ id: `${i}`, typ: 'summativ', datum: `2026-0${i + 1}-01` })
      )
      const { result } = renderHook(() => useLPConfigFiltering(baseInputs({ configs })))
      expect(result.current.letzteFuenf.map(c => c.id)).toEqual(['6', '5', '4', '3', '2'])
    })
  })

  describe('Testdaten-Filter (Cluster F.4)', () => {
    const echteConfig = baseConfig({ id: 'p1', klasse: '29c' })
    const testConfigViaId = baseConfig({ id: 'test-p1', klasse: '29c' })
    const testConfigViaKlasse = baseConfig({ id: 'p2', klasse: 'test-klasse-01' })

    it('testdatenSichtbar=false filtert Test-Configs via id-Prefix raus', () => {
      const { result } = renderHook(() => useLPConfigFiltering(baseInputs({
        configs: [echteConfig, testConfigViaId], testdatenSichtbar: false, filterStatus: 'alle',
      })))
      expect(result.current.gefilterteConfigs.map(c => c.id)).toEqual(['p1'])
    })

    it('testdatenSichtbar=false filtert Test-Configs via klasse raus', () => {
      const { result } = renderHook(() => useLPConfigFiltering(baseInputs({
        configs: [echteConfig, testConfigViaKlasse], testdatenSichtbar: false, filterStatus: 'alle',
      })))
      expect(result.current.gefilterteConfigs.map(c => c.id)).toEqual(['p1'])
    })

    it('testdatenSichtbar=true lässt Test-Configs durch', () => {
      const { result } = renderHook(() => useLPConfigFiltering(baseInputs({
        configs: [echteConfig, testConfigViaId, testConfigViaKlasse], testdatenSichtbar: true, filterStatus: 'alle',
      })))
      expect(result.current.gefilterteConfigs.map(c => c.id).sort()).toEqual(['p1', 'p2', 'test-p1'])
    })

    it('Filter propagiert zu letzteFuenf', () => {
      const { result } = renderHook(() => useLPConfigFiltering(baseInputs({
        configs: [echteConfig, testConfigViaId], testdatenSichtbar: false, filterStatus: 'alle',
      })))
      expect(result.current.letzteFuenf.every(c => !c.id.startsWith('test-'))).toBe(true)
    })
  })

  describe('hatAktiveFilter', () => {
    it('alle Standard → false', () => {
      const { result } = renderHook(() => useLPConfigFiltering(baseInputs()))
      expect(result.current.hatAktiveFilter).toBe(false)
    })

    it.each([
      ['suchtext', { suchtext: 'x' }],
      ['filterFach', { filterFach: ['Mathe'] }],
      ['filterTyp', { filterTyp: 'summativ' }],
      ['filterGefaess', { filterGefaess: 'GF' }],
      ['filterStatus alle', { filterStatus: 'alle' as const }],
    ])('jeder Filter einzeln aktiv → true (%s)', (_, override) => {
      const { result } = renderHook(() => useLPConfigFiltering(baseInputs(override)))
      expect(result.current.hatAktiveFilter).toBe(true)
    })
  })
})
