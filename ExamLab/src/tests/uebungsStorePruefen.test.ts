import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useUebenUebungsStore } from '../store/ueben/uebungsStore'
import { useUebenAuthStore } from '../store/ueben/authStore'
import { useUebenFortschrittStore } from '../store/ueben/fortschrittStore'
import { uebenApiClient } from '../services/ueben/apiClient'
import type { UebungsSession } from '../types/ueben/uebung'
import type { Frage } from '../types/ueben/fragen'
import type { Antwort } from '../types/antworten'

function baseSession(overrides: Partial<UebungsSession> = {}): UebungsSession {
  const frage: Frage = {
    id: 'f1',
    typ: 'mc',
    fragetext: '?',
    fach: 'wr',
    thema: 'Test',
    optionen: [
      { id: 'o1', text: 'A' },
      { id: 'o2', text: 'B' },
    ],
  } as unknown as Frage
  const freitextFrage: Frage = {
    id: 'f2',
    typ: 'freitext',
    fragetext: 'Schreibe…',
    fach: 'wr',
    thema: 'Test',
  } as unknown as Frage
  return {
    id: 's-test',
    gruppeId: 'gruppe-1',
    email: 'sus@stud.gymhofwil.ch',
    fach: 'wr',
    thema: 'Test',
    fragen: [frage, freitextFrage],
    antworten: {},
    ergebnisse: {},
    aktuelleFrageIndex: 0,
    gestartet: new Date().toISOString(),
    unsicher: new Set(),
    uebersprungen: new Set(),
    score: 0,
    zwischenstande: {
      f1: { typ: 'mc', gewaehlteOptionen: ['o1'] } as Antwort,
      f2: { typ: 'freitext', text: 'Meine Antwort' } as Antwort,
    },
    ...overrides,
  }
}

describe('uebungsStore.pruefeAntwortJetzt (async, Server-seitig)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    useUebenUebungsStore.setState({
      session: null,
      feedbackSichtbar: false,
      letzteAntwortKorrekt: null,
      speichertPruefung: false,
      pruefFehler: null,
      letzteMusterloesung: null,
    })
    useUebenAuthStore.setState({
      user: {
        email: 'sus@stud.gymhofwil.ch',
        name: 'Test',
        rolle: 'lernend',
        sessionToken: 'token-abc',
        loginMethode: 'code',
      },
      istAngemeldet: true,
    } as Parameters<typeof useUebenAuthStore.setState>[0])
    // Fortschritt-Store: leere antwortVerarbeiten-Funktion um side-effects zu vermeiden
    vi.spyOn(useUebenFortschrittStore.getState(), 'antwortVerarbeiten').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('setzt speichertPruefung, übernimmt Resultat (auto-korrigierbar)', async () => {
    useUebenUebungsStore.setState({ session: baseSession() })
    vi.spyOn(uebenApiClient, 'post').mockResolvedValue({
      success: true,
      korrekt: true,
      musterlosung: 'A ist korrekt',
    } as unknown as null)

    await useUebenUebungsStore.getState().pruefeAntwortJetzt('f1')

    const state = useUebenUebungsStore.getState()
    expect(state.speichertPruefung).toBe(false)
    expect(state.pruefFehler).toBeNull()
    expect(state.letzteAntwortKorrekt).toBe(true)
    expect(state.letzteMusterloesung).toBe('A ist korrekt')
    expect(state.feedbackSichtbar).toBe(true)
    expect(state.session?.ergebnisse['f1']).toBe(true)
    expect(state.session?.antworten['f1']).toEqual({ typ: 'mc', gewaehlteOptionen: ['o1'] })
    expect(state.session?.score).toBe(1)
  })

  it('bei API-Error: setzt pruefFehler', async () => {
    useUebenUebungsStore.setState({ session: baseSession() })
    vi.spyOn(uebenApiClient, 'post').mockResolvedValue({
      success: false,
      error: 'Rate limit exceeded',
    } as unknown as null)

    await useUebenUebungsStore.getState().pruefeAntwortJetzt('f1')

    const state = useUebenUebungsStore.getState()
    expect(state.speichertPruefung).toBe(false)
    expect(state.pruefFehler).toBe('Rate limit exceeded')
    // session blieb unverändert (kein Ergebnis, kein Score)
    expect(state.session?.ergebnisse['f1']).toBeUndefined()
    expect(state.session?.score).toBe(0)
  })

  it('bei Selbstbewertung: setzt musterloesung, korrekt bleibt null, kein Score', async () => {
    useUebenUebungsStore.setState({ session: baseSession({ aktuelleFrageIndex: 1 }) })
    vi.spyOn(uebenApiClient, 'post').mockResolvedValue({
      success: true,
      selbstbewertung: true,
      musterlosung: 'Lang-Musterlösung…',
    } as unknown as null)

    await useUebenUebungsStore.getState().pruefeAntwortJetzt('f2')

    const state = useUebenUebungsStore.getState()
    expect(state.speichertPruefung).toBe(false)
    expect(state.pruefFehler).toBeNull()
    expect(state.letzteAntwortKorrekt).toBeNull()
    expect(state.letzteMusterloesung).toBe('Lang-Musterlösung…')
    // feedbackSichtbar = false, weil Selbstbewertung noch nicht erfolgte
    expect(state.feedbackSichtbar).toBe(false)
    // ergebnisse/score bleiben unverändert
    expect(state.session?.ergebnisse['f2']).toBeUndefined()
    expect(state.session?.score).toBe(0)
    // Antwort wird trotzdem übernommen (Zwischenstand → antworten)
    expect(state.session?.antworten['f2']).toEqual({ typ: 'freitext', text: 'Meine Antwort' })
  })

  it('speichertPruefung ist true während des Calls', async () => {
    useUebenUebungsStore.setState({ session: baseSession() })
    let resolvePost: ((v: unknown) => void) | null = null
    vi.spyOn(uebenApiClient, 'post').mockImplementation(() => new Promise<null>((resolve) => {
      // Der produktive Code speichertPruefung synchron VOR dem Aufruf an `post`.
      // Wir speichern den Resolver, damit der Test im Zwischenzustand prüfen kann.
      resolvePost = resolve as unknown as ((v: unknown) => void)
    }))

    const promise = useUebenUebungsStore.getState().pruefeAntwortJetzt('f1')
    // Der `set({speichertPruefung: true})` läuft synchron vor dem ersten await.
    expect(useUebenUebungsStore.getState().speichertPruefung).toBe(true)

    // Warten bis der Mock aufgerufen wurde (dynamic imports brauchen Micro-Tasks).
    while (!resolvePost) {
      await Promise.resolve()
    }
    ;(resolvePost as (v: unknown) => void)({ success: true, korrekt: false, musterlosung: 'B war richtig' })
    await promise
    expect(useUebenUebungsStore.getState().speichertPruefung).toBe(false)
  })
})
