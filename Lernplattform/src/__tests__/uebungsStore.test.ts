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

const BASIS = {
  version: 1, erstelltAm: '', geaendertAm: '',
  fachbereich: 'VWL' as const, fach: 'Mathe', semester: [] as string[], gefaesse: [] as string[],
  bloom: 'K2' as const, tags: [] as string[], punkte: 1, musterlosung: '',
  bewertungsraster: [], verwendungen: [],
  schwierigkeit: 1, thema: 'Add',
}

const testFragen: Frage[] = [
  {
    ...BASIS, id: 'f1', typ: 'mc', fragetext: 'Q1',
    optionen: [{ id: '1', text: 'A', korrekt: true }, { id: '2', text: 'B', korrekt: false }],
    mehrfachauswahl: false, zufallsreihenfolge: false,
  },
  {
    ...BASIS, id: 'f2', typ: 'mc', fragetext: 'Q2',
    optionen: [{ id: '1', text: 'X', korrekt: false }, { id: '2', text: 'Y', korrekt: true }],
    mehrfachauswahl: false, zufallsreihenfolge: false,
  },
  {
    ...BASIS, id: 'f3', typ: 'mc', fragetext: 'Q3',
    optionen: [{ id: '1', text: '1', korrekt: false }, { id: '2', text: '2', korrekt: true }],
    mehrfachauswahl: false, zufallsreihenfolge: false,
  },
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
        unsicher: new Set(), uebersprungen: new Set(), score: 0,
      },
      ladeStatus: 'fertig',
    })

    useUebungsStore.getState().beantworte({ typ: 'mc', gewaehlt: '1' })

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
        antworten: { f1: { typ: 'mc', gewaehlt: '1' } },
        ergebnisse: { f1: true }, aktuelleFrageIndex: 0,
        gestartet: new Date().toISOString(),
        unsicher: new Set(), uebersprungen: new Set(), score: 0,
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
        antworten: { f1: { typ: 'mc', gewaehlt: '1' }, f2: { typ: 'mc', gewaehlt: '2' }, f3: { typ: 'mc', gewaehlt: '2' } },
        ergebnisse: { f1: true, f2: true, f3: true }, aktuelleFrageIndex: 2,
        gestartet: new Date().toISOString(),
        unsicher: new Set(), uebersprungen: new Set(), score: 0,
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
        antworten: { f1: { typ: 'mc', gewaehlt: '1' }, f2: { typ: 'mc', gewaehlt: '1' }, f3: { typ: 'mc', gewaehlt: '2' } },
        ergebnisse: { f1: true, f2: false, f3: true }, aktuelleFrageIndex: 2,
        gestartet: new Date().toISOString(),
        unsicher: new Set(), uebersprungen: new Set(), score: 0,
      },
    })

    const ergebnis = useUebungsStore.getState().berechneErgebnis()
    expect(ergebnis.richtig).toBe(2)
    expect(ergebnis.falsch).toBe(1)
    expect(ergebnis.quote).toBeCloseTo(66.67, 0)
  })
})
