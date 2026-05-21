import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useUebenUebungsStore } from './uebungsStore'
import type { Lernziel } from '@gymhofwil/shared'
import type { Frage } from '../../types/ueben/fragen'

// --- Modul-Mocks (müssen vor dem ersten import aus den gemockten Modulen stehen) ---

vi.mock('../../adapters/ueben/appsScriptAdapter', () => ({
  uebenFragenAdapter: {
    ladeFragen: vi.fn(),
  },
}))

vi.mock('./gruppenStore', () => ({
  useUebenGruppenStore: {
    getState: vi.fn(),
  },
}))

vi.mock('./authStore', () => ({
  useUebenAuthStore: {
    getState: vi.fn(),
  },
}))

vi.mock('./themenSichtbarkeitStore', () => ({
  useThemenSichtbarkeitStore: {
    getState: vi.fn(),
  },
}))

// --- Imports nach den Mocks ---

import { uebenFragenAdapter } from '../../adapters/ueben/appsScriptAdapter'
import { useUebenGruppenStore } from './gruppenStore'
import { useUebenAuthStore } from './authStore'
import { useThemenSichtbarkeitStore } from './themenSichtbarkeitStore'

// --- Test-Hilfsdaten ---

/** Erzeugt eine minimale Frage mit gegebener ID. */
function baueFrage(id: string): Frage {
  return {
    id,
    typ: 'mc',
    fragetext: `Frage ${id}`,
    fach: 'VWL',
    thema: 'Konjunktur',
  } as unknown as Frage
}

const ALLE_FRAGEN: Frage[] = ['f1', 'f2', 'f3', 'f4', 'f5'].map(baueFrage)

const LERNZIEL_KONJUNKTUR: Lernziel = {
  id: 'lz-1',
  fach: 'VWL',
  thema: 'Konjunktur',
  text: 'Konjunkturphasen benennen',
  bloom: 'K1',
  fragenIds: ['f2', 'f4'],
}

describe('uebungsStore.starteLernzielSession', () => {
  beforeEach(() => {
    vi.restoreAllMocks()

    // Store auf Initialzustand zurücksetzen
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

    // Standard-Store-Mocks: Gruppe + User vorhanden
    vi.mocked(useUebenGruppenStore.getState).mockReturnValue({
      aktiveGruppe: { id: 'gruppe-1', name: 'SF WR 27a', adminEmail: 'lp@gymhofwil.ch' },
    } as ReturnType<typeof useUebenGruppenStore.getState>)

    vi.mocked(useUebenAuthStore.getState).mockReturnValue({
      user: {
        email: 'sus@stud.gymhofwil.ch',
        name: 'SuS Test',
        rolle: 'lernend',
        sessionToken: 'tok-xyz',
        loginMethode: 'code',
      },
      istAngemeldet: true,
    } as ReturnType<typeof useUebenAuthStore.getState>)

    vi.mocked(useThemenSichtbarkeitStore.getState).mockReturnValue({
      freischaltungen: [{ fach: 'VWL', thema: 'Konjunktur', status: 'aktiv' }],
      getStatus: vi.fn().mockReturnValue('aktiv'),
    } as unknown as ReturnType<typeof useThemenSichtbarkeitStore.getState>)

    // Adapter gibt alle 5 Fragen zurück
    vi.mocked(uebenFragenAdapter.ladeFragen).mockResolvedValue(ALLE_FRAGEN)
  })

  it('ruft starteSession nur mit den Fragen aus fragenIds auf (f2 + f4, nicht f1/f3/f5)', async () => {
    const starteSessionSpy = vi.spyOn(
      useUebenUebungsStore.getState(),
      'starteSession',
    ).mockResolvedValue(undefined)

    await useUebenUebungsStore.getState().starteLernzielSession(LERNZIEL_KONJUNKTUR)

    expect(starteSessionSpy).toHaveBeenCalledTimes(1)

    // fragenOverride prüfen: muss genau f2 und f4 enthalten (5. Argument)
    const [gruppeId, email, fach, thema, fragenOverride, modus] =
      starteSessionSpy.mock.calls[0]

    expect(gruppeId).toBe('gruppe-1')
    expect(email).toBe('sus@stud.gymhofwil.ch')
    expect(fach).toBe('VWL')
    expect(thema).toBe('Konjunktur')
    expect(modus).toBe('standard')

    expect(Array.isArray(fragenOverride)).toBe(true)
    const ids = (fragenOverride as Frage[]).map(f => f.id).sort()
    expect(ids).toEqual(['f2', 'f4'])
  })

  it('setzt freiwillig=true wenn Thema nicht freigeschaltet ist und Freischaltungen vorhanden sind', async () => {
    // Thema ist nicht freigeschaltet, aber Freischaltungen sind vorhanden (anderes Thema)
    vi.mocked(useThemenSichtbarkeitStore.getState).mockReturnValue({
      freischaltungen: [{ fach: 'BWL', thema: 'Marketing', status: 'aktiv' }],
      getStatus: vi.fn().mockReturnValue('nicht_freigeschaltet'),
    } as unknown as ReturnType<typeof useThemenSichtbarkeitStore.getState>)

    const starteSessionSpy = vi.spyOn(
      useUebenUebungsStore.getState(),
      'starteSession',
    ).mockResolvedValue(undefined)

    await useUebenUebungsStore.getState().starteLernzielSession(LERNZIEL_KONJUNKTUR)

    expect(starteSessionSpy).toHaveBeenCalledTimes(1)
    // 8. Argument = freiwillig
    const freiwillig = starteSessionSpy.mock.calls[0][7]
    expect(freiwillig).toBe(true)
  })

  it('setzt freiwillig=false wenn Thema freigeschaltet ist', async () => {
    // Standardmäßig ist getStatus = 'aktiv' (aus beforeEach)
    const starteSessionSpy = vi.spyOn(
      useUebenUebungsStore.getState(),
      'starteSession',
    ).mockResolvedValue(undefined)

    await useUebenUebungsStore.getState().starteLernzielSession(LERNZIEL_KONJUNKTUR)

    const freiwillig = starteSessionSpy.mock.calls[0][7]
    expect(freiwillig).toBe(false)
  })

  it('bricht sofort ab (kein starteSession-Call) wenn keine aktive Gruppe vorhanden', async () => {
    vi.mocked(useUebenGruppenStore.getState).mockReturnValue({
      aktiveGruppe: null,
    } as ReturnType<typeof useUebenGruppenStore.getState>)

    const starteSessionSpy = vi.spyOn(
      useUebenUebungsStore.getState(),
      'starteSession',
    ).mockResolvedValue(undefined)

    await useUebenUebungsStore.getState().starteLernzielSession(LERNZIEL_KONJUNKTUR)

    expect(starteSessionSpy).not.toHaveBeenCalled()
  })

  it('bricht sofort ab wenn kein eingeloggter User vorhanden', async () => {
    vi.mocked(useUebenAuthStore.getState).mockReturnValue({
      user: null,
      istAngemeldet: false,
    } as ReturnType<typeof useUebenAuthStore.getState>)

    const starteSessionSpy = vi.spyOn(
      useUebenUebungsStore.getState(),
      'starteSession',
    ).mockResolvedValue(undefined)

    await useUebenUebungsStore.getState().starteLernzielSession(LERNZIEL_KONJUNKTUR)

    expect(starteSessionSpy).not.toHaveBeenCalled()
  })

  it('bei Lernziel ohne fragenIds → leere fragenOverride-Liste', async () => {
    const lernzielOhneIds: Lernziel = {
      ...LERNZIEL_KONJUNKTUR,
      fragenIds: undefined,
    }

    const starteSessionSpy = vi.spyOn(
      useUebenUebungsStore.getState(),
      'starteSession',
    ).mockResolvedValue(undefined)

    await useUebenUebungsStore.getState().starteLernzielSession(lernzielOhneIds)

    expect(starteSessionSpy).toHaveBeenCalledTimes(1)
    const fragenOverride = starteSessionSpy.mock.calls[0][4] as Frage[]
    expect(fragenOverride).toEqual([])
  })
})
