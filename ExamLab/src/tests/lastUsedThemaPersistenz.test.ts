import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('../adapters/ueben/appsScriptAdapter', () => ({
  uebenFragenAdapter: {
    ladeFragen: vi.fn().mockResolvedValue([
      { id: 'f1', fach: 'BWL', thema: 'Unternehmensformen', frage: 'Test', typ: 'mc', schwierigkeit: 1, fragetext: 'Test', optionen: [{ id: 'a', text: 'A', korrekt: true }], mehrfachauswahl: false },
      { id: 'f2', fach: 'BWL', thema: 'Unternehmensformen', frage: 'Test 2', typ: 'mc', schwierigkeit: 1, fragetext: 'Test 2', optionen: [{ id: 'a', text: 'A', korrekt: true }], mehrfachauswahl: false },
    ]),
  },
}))

vi.mock('../services/uebenLoesungsApi', () => ({
  ladeLoesungenApi: vi.fn().mockResolvedValue({}),
}))

vi.mock('../store/ueben/authStore', () => ({
  useUebenAuthStore: {
    getState: () => ({ user: { email: 'test@test.ch', sessionToken: null } }),
  },
}))

vi.mock('../store/ueben/fortschrittStore', () => ({
  useUebenFortschrittStore: {
    getState: () => ({
      fortschritte: {},
      antwortVerarbeiten: vi.fn(),
    }),
  },
}))

import { useUebenUebungsStore } from '../store/ueben/uebungsStore'

describe('lastUsedThema-Persistenz', () => {
  beforeEach(() => {
    localStorage.clear()
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

  it('schreibt lastUsedThema nach erfolgreichem starteSession', async () => {
    await useUebenUebungsStore.getState().starteSession(
      'gruppe1', 'test@test.ch', 'BWL', 'Unternehmensformen'
    )

    expect(localStorage.getItem('examlab.lastUsedThema.gruppe1.BWL'))
      .toBe('Unternehmensformen')
  })

  it('schreibt nicht bei modus=mix', async () => {
    await useUebenUebungsStore.getState().starteSession(
      'gruppe1', 'test@test.ch', 'BWL', 'Mix-Session', undefined, 'mix'
    )

    // Bei mix: kein lastUsedThema schreiben
    expect(localStorage.getItem('examlab.lastUsedThema.gruppe1.BWL')).toBeNull()
  })
})
