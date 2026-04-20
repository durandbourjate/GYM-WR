import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useUebenUebungsStore } from '../store/ueben/uebungsStore'
import type { Frage } from '../types/ueben/fragen'

vi.mock('../adapters/ueben/appsScriptAdapter', () => ({
  uebenFragenAdapter: {
    ladeFragen: vi.fn(),
  },
}))
vi.mock('../services/uebenLoesungsApi', () => ({
  ladeLoesungenApi: vi.fn(),
}))
vi.mock('../store/ueben/authStore', () => ({
  useUebenAuthStore: {
    getState: () => ({ user: { email: 'sus@stud.test', sessionToken: 'tok' } }),
  },
}))

import { uebenFragenAdapter } from '../adapters/ueben/appsScriptAdapter'
import { ladeLoesungenApi } from '../services/uebenLoesungsApi'

const mcFrage: Frage = {
  id: 'f1',
  typ: 'mc',
  version: 1,
  erstelltAm: '',
  geaendertAm: '',
  fachbereich: 'VWL',
  fach: 'VWL',
  thema: 'Test',
  unterthema: '',
  bloom: 'K1',
  semester: ['S1'],
  gefaesse: ['SF'],
  tags: [],
  punkte: 1,
  zeitbedarf: 1,
  verwendungen: [],
  quelle: 'manuell',
  autor: { email: 'x', name: 'x' },
  fragetext: 'Welche Antwort ist richtig?',
  optionen: [
    { id: 'a', text: 'A' },
    { id: 'b', text: 'B' },
  ],
  mehrfachauswahl: false,
} as unknown as Frage

describe('uebungsStore Lösungs-Preload', () => {
  beforeEach(() => {
    vi.mocked(uebenFragenAdapter.ladeFragen).mockReset()
    vi.mocked(ladeLoesungenApi).mockReset()
    useUebenUebungsStore.setState({
      session: null,
      ladeStatus: 'idle',
      feedbackSichtbar: false,
      letzteAntwortKorrekt: null,
      speichertPruefung: false,
      pruefFehler: null,
      letzteMusterloesung: null,
      loesungenPreloaded: {},
      historie: [],
    })
  })

  it('merged Lösungs-Slice in Frage und markiert als preloaded', async () => {
    vi.mocked(uebenFragenAdapter.ladeFragen).mockResolvedValue([mcFrage])
    vi.mocked(ladeLoesungenApi).mockResolvedValue({
      f1: { optionen: [{ id: 'a', korrekt: true }], musterlosung: 'A ist korrekt.' },
    })

    await useUebenUebungsStore.getState().starteSession('g1', 'sus@stud.test', 'VWL', 'Test')

    const state = useUebenUebungsStore.getState()
    expect(state.ladeStatus).toBe('fertig')
    const session = state.session!
    const frage = session.fragen.find(f => f.id === 'f1') as Frage & { optionen: Array<{id:string; korrekt?:boolean}>; musterlosung?: string }
    expect(frage.optionen.find(o => o.id === 'a')?.korrekt).toBe(true)
    expect(frage.musterlosung).toBe('A ist korrekt.')
    expect(state.loesungenPreloaded.f1).toBe(true)
  })

  it('bei Preload-Fehler startet Session, markiert Fragen NICHT als preloaded', async () => {
    vi.mocked(uebenFragenAdapter.ladeFragen).mockResolvedValue([mcFrage])
    vi.mocked(ladeLoesungenApi).mockRejectedValue(new Error('Rate limit'))

    await useUebenUebungsStore.getState().starteSession('g1', 'sus@stud.test', 'VWL', 'Test')

    const state = useUebenUebungsStore.getState()
    expect(state.ladeStatus).toBe('fertig')
    expect(state.session?.fragen.length).toBe(1)
    expect(state.loesungenPreloaded.f1).toBeFalsy()
  })

  it('bei Partial-Response: nur gelieferte Fragen sind preloaded', async () => {
    const mcFrage2: Frage = { ...mcFrage, id: 'f2' } as Frage
    vi.mocked(uebenFragenAdapter.ladeFragen).mockResolvedValue([mcFrage, mcFrage2])
    vi.mocked(ladeLoesungenApi).mockResolvedValue({
      f1: { optionen: [{ id: 'a', korrekt: true }] },
      // f2 fehlt
    })

    await useUebenUebungsStore.getState().starteSession('g1', 'sus@stud.test', 'VWL', 'Test')

    const state = useUebenUebungsStore.getState()
    expect(state.loesungenPreloaded.f1).toBe(true)
    expect(state.loesungenPreloaded.f2).toBe(false)
  })

  it('beantworteById: preloaded=true → clientseitige Korrektur, Ergebnis im Store', async () => {
    vi.mocked(uebenFragenAdapter.ladeFragen).mockResolvedValue([mcFrage])
    vi.mocked(ladeLoesungenApi).mockResolvedValue({
      f1: { optionen: [{ id: 'a', korrekt: true }] },
    })

    await useUebenUebungsStore.getState().starteSession('g1', 'sus@stud.test', 'VWL', 'Test')
    useUebenUebungsStore.getState().beantworteById('f1', { typ: 'mc', gewaehlt: ['a'] } as never)

    const state = useUebenUebungsStore.getState()
    expect(state.session?.ergebnisse.f1).toBe(true)
    expect(state.feedbackSichtbar).toBe(true)
    expect(state.letzteAntwortKorrekt).toBe(true)
    expect(state.speichertPruefung).toBe(false) // kein Server-Call
  })

  it('beantworteById: preloaded=false → Fallback auf pruefeAntwortJetzt (setzt speichertPruefung)', async () => {
    vi.mocked(uebenFragenAdapter.ladeFragen).mockResolvedValue([mcFrage])
    vi.mocked(ladeLoesungenApi).mockRejectedValue(new Error('Rate limit'))

    await useUebenUebungsStore.getState().starteSession('g1', 'sus@stud.test', 'VWL', 'Test')
    expect(useUebenUebungsStore.getState().loesungenPreloaded.f1).toBeFalsy()

    useUebenUebungsStore.getState().beantworteById('f1', { typ: 'mc', gewaehlt: ['a'] } as never)

    const state = useUebenUebungsStore.getState()
    expect(state.session?.zwischenstande?.f1).toBeDefined()
    expect(state.speichertPruefung).toBe(true)
  })
})
