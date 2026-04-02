import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../adapters/appsScriptAdapter', () => ({
  fragenAdapter: {
    ladeFragen: vi.fn(),
    ladeThemen: vi.fn(),
  },
  gruppenAdapter: {
    ladeGruppen: vi.fn(),
    ladeMitglieder: vi.fn(),
  },
}))

import { useUebungsStore } from '../store/uebungsStore'
import { fragenAdapter } from '../adapters/appsScriptAdapter'
import type { Frage } from '../types/fragen'

const testFragen: Frage[] = [
  { id: 'f1', fach: 'Mathe', thema: 'Add', typ: 'mc', schwierigkeit: 1, frage: 'Q1', optionen: ['A', 'B'], korrekt: 'A', uebung: true, pruefungstauglich: false },
  { id: 'f2', fach: 'Mathe', thema: 'Add', typ: 'mc', schwierigkeit: 1, frage: 'Q2', optionen: ['X', 'Y'], korrekt: 'Y', uebung: true, pruefungstauglich: false },
  { id: 'f3', fach: 'Mathe', thema: 'Add', typ: 'mc', schwierigkeit: 1, frage: 'Q3', optionen: ['1', '2'], korrekt: '2', uebung: true, pruefungstauglich: false },
]

describe('uebungsStore', () => {
  beforeEach(() => {
    useUebungsStore.setState({
      session: null,
      ladeStatus: 'idle',
      feedbackSichtbar: false,
      letzteAntwortKorrekt: null,
    })
    vi.clearAllMocks()
  })

  it('startet Session und laedt Fragen', async () => {
    vi.mocked(fragenAdapter.ladeFragen).mockResolvedValue(testFragen)

    await useUebungsStore.getState().starteSession('g1', 'test@mail.com', 'Mathe', 'Add')

    const state = useUebungsStore.getState()
    expect(state.session).not.toBeNull()
    expect(state.session!.fragen.length).toBe(3)
    expect(state.session!.aktuelleFrageIndex).toBe(0)
  })

  it('beantwortet Frage und zeigt Feedback', () => {
    useUebungsStore.setState({
      session: {
        id: 's1', gruppeId: 'g1', email: 'test@mail.com',
        fach: 'Mathe', thema: 'Add', fragen: testFragen,
        antworten: {}, ergebnisse: {}, aktuelleFrageIndex: 0,
        gestartet: new Date().toISOString(),
      },
      ladeStatus: 'fertig',
    })

    useUebungsStore.getState().beantworte({ typ: 'mc', gewaehlt: 'A' })

    const state = useUebungsStore.getState()
    expect(state.session!.antworten['f1']).toBeDefined()
    expect(state.session!.ergebnisse['f1']).toBe(true)
    expect(state.feedbackSichtbar).toBe(true)
    expect(state.letzteAntwortKorrekt).toBe(true)
  })

  it('geht zur naechsten Frage weiter', () => {
    useUebungsStore.setState({
      session: {
        id: 's1', gruppeId: 'g1', email: 'test@mail.com',
        fach: 'Mathe', thema: 'Add', fragen: testFragen,
        antworten: { f1: { typ: 'mc', gewaehlt: 'A' } },
        ergebnisse: { f1: true }, aktuelleFrageIndex: 0,
        gestartet: new Date().toISOString(),
      },
      feedbackSichtbar: true,
    })

    useUebungsStore.getState().naechsteFrage()

    const state = useUebungsStore.getState()
    expect(state.session!.aktuelleFrageIndex).toBe(1)
    expect(state.feedbackSichtbar).toBe(false)
  })

  it('erkennt Session-Ende', () => {
    useUebungsStore.setState({
      session: {
        id: 's1', gruppeId: 'g1', email: 'test@mail.com',
        fach: 'Mathe', thema: 'Add', fragen: testFragen,
        antworten: { f1: { typ: 'mc', gewaehlt: 'A' }, f2: { typ: 'mc', gewaehlt: 'Y' }, f3: { typ: 'mc', gewaehlt: '2' } },
        ergebnisse: { f1: true, f2: true, f3: true }, aktuelleFrageIndex: 2,
        gestartet: new Date().toISOString(),
      },
      feedbackSichtbar: true,
    })

    const istFertig = useUebungsStore.getState().istSessionFertig()
    expect(istFertig).toBe(true)
  })

  it('berechnet Ergebnis', () => {
    useUebungsStore.setState({
      session: {
        id: 's1', gruppeId: 'g1', email: 'test@mail.com',
        fach: 'Mathe', thema: 'Add', fragen: testFragen,
        antworten: { f1: { typ: 'mc', gewaehlt: 'A' }, f2: { typ: 'mc', gewaehlt: 'X' }, f3: { typ: 'mc', gewaehlt: '2' } },
        ergebnisse: { f1: true, f2: false, f3: true }, aktuelleFrageIndex: 2,
        gestartet: new Date().toISOString(),
      },
    })

    const ergebnis = useUebungsStore.getState().berechneErgebnis()
    expect(ergebnis.richtig).toBe(2)
    expect(ergebnis.falsch).toBe(1)
    expect(ergebnis.quote).toBeCloseTo(66.67, 0)
  })
})
