import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useLPFavoriten } from './useLPFavoriten'
import type { PruefungsConfig } from '../types/pruefung'
import type { Favorit } from '../store/favoritenStore'

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

describe('useLPFavoriten', () => {
  it('keine Favoriten → leere Result-Felder', () => {
    const { result } = renderHook(() => useLPFavoriten([], []))
    expect(result.current.favoritenConfigIds.size).toBe(0)
    expect(result.current.favoritenConfigs).toEqual([])
    expect(result.current.favoritenPruefungen).toEqual([])
    expect(result.current.favoritenUebungen).toEqual([])
  })

  it('favoritenConfigIds filtert nur typ=pruefung|uebung', () => {
    const favoriten: Favorit[] = [
      { typ: 'pruefung', ziel: 'p1', label: 'P1', sortierung: 0 },
      { typ: 'ort', ziel: '/dashboard', label: 'D', sortierung: 1 },
      { typ: 'uebung', ziel: 'u1', label: 'U1', sortierung: 2 },
      { typ: 'frage', ziel: 'f1', label: 'F1', sortierung: 3 },
    ]
    const { result } = renderHook(() => useLPFavoriten([], favoriten))
    expect([...result.current.favoritenConfigIds]).toEqual(['p1', 'u1'])
  })

  it('favoritenConfigs sortiert nach datum desc, filtert auf existierende configs', () => {
    const configs = [
      baseConfig({ id: 'p1', datum: '2026-01-01' }),
      baseConfig({ id: 'p2', datum: '2026-03-01' }),
      baseConfig({ id: 'p3', datum: '2026-02-01' }),
    ]
    const favoriten: Favorit[] = [
      { typ: 'pruefung', ziel: 'p1', label: '', sortierung: 0 },
      { typ: 'pruefung', ziel: 'p2', label: '', sortierung: 1 },
      { typ: 'pruefung', ziel: 'pX', label: '', sortierung: 2 }, // nicht-existent
    ]
    const { result } = renderHook(() => useLPFavoriten(configs, favoriten))
    expect(result.current.favoritenConfigs.map(c => c.id)).toEqual(['p2', 'p1'])
  })

  it('favoritenPruefungen / favoritenUebungen trennt nach typ === formativ', () => {
    const configs = [
      baseConfig({ id: 'p1', typ: 'summativ' }),
      baseConfig({ id: 'u1', typ: 'formativ' }),
    ]
    const favoriten: Favorit[] = [
      { typ: 'pruefung', ziel: 'p1', label: '', sortierung: 0 },
      { typ: 'uebung', ziel: 'u1', label: '', sortierung: 1 },
    ]
    const { result } = renderHook(() => useLPFavoriten(configs, favoriten))
    expect(result.current.favoritenPruefungen.map(c => c.id)).toEqual(['p1'])
    expect(result.current.favoritenUebungen.map(c => c.id)).toEqual(['u1'])
  })

  it('favoritenConfigIds verändert sich bei favoriten-Update', () => {
    const configs = [baseConfig({ id: 'p1' })]
    const { result, rerender } = renderHook(
      ({ favoriten }) => useLPFavoriten(configs, favoriten),
      { initialProps: { favoriten: [] as Favorit[] } }
    )
    expect(result.current.favoritenConfigIds.size).toBe(0)
    rerender({ favoriten: [{ typ: 'pruefung', ziel: 'p1', label: '', sortierung: 0 }] })
    expect([...result.current.favoritenConfigIds]).toEqual(['p1'])
  })

  it('Edge: nicht-existente Favoriten-IDs werden aus favoritenConfigs entfernt', () => {
    const configs = [baseConfig({ id: 'p1' })]
    const favoriten: Favorit[] = [
      { typ: 'pruefung', ziel: 'pX', label: 'gelöscht', sortierung: 0 },
    ]
    const { result } = renderHook(() => useLPFavoriten(configs, favoriten))
    expect(result.current.favoritenConfigs).toEqual([])
  })
})
