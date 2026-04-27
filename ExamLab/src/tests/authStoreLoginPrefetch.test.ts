import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mocks für die Module die der authStore (in)direkt nutzt — vor dem Import der Stores
const ladeMock = vi.fn(async () => {})
const resetMock = vi.fn(async () => {})

vi.mock('../store/fragenbankStore', () => ({
  useFragenbankStore: {
    getState: () => ({ lade: ladeMock, reset: resetMock }),
  },
}))

const klassenlistenLadeMock = vi.fn(async () => {})
const klassenlistenResetMock = vi.fn(async () => {})
const gruppenLadeMock = vi.fn(async () => {})
const gruppenResetMock = vi.fn(async () => {})

vi.mock('../store/klassenlistenStore', () => ({
  useKlassenlistenStore: {
    getState: () => ({ lade: klassenlistenLadeMock, reset: klassenlistenResetMock }),
  },
}))

vi.mock('../store/ueben/gruppenStore', () => ({
  useUebenGruppenStore: {
    getState: () => ({ ladeGruppen: gruppenLadeMock, reset: gruppenResetMock }),
  },
}))

// LP-API mocken — ladeUndCacheLPs() ruft ladeLehrpersonen() auf.
// Mock-Liste enthält test-LP damit rolleAusDomain 'lp' zurückgibt.
vi.mock('../services/lpApi', () => ({
  ladeLehrpersonen: vi.fn(async () => [
    {
      email: 'lp@gymhofwil.ch',
      name: 'Test LP',
      kuerzel: 'TLP',
      fachschaft: 'WR',
      fachschaften: ['WR'],
      rolle: 'lp',
    },
  ]),
}))

// Mocks für autoSave/retryQueue — werden vom internen resetPruefungState im
// LP-beendet-Pfad aufgerufen. Closure-Variablen erlauben pro Test ein
// hängendes Promise (siehe Race-Test unten).
const clearIndexedDBMock = vi.fn(async () => {})
const clearQueueMock = vi.fn(async () => {})
vi.mock('../services/autoSave', () => ({
  clearIndexedDB: (...args: unknown[]) => clearIndexedDBMock(...args as []),
}))
vi.mock('../services/retryQueue', () => ({
  clearQueue: (...args: unknown[]) => clearQueueMock(...args as []),
}))

// pruefungStore-State per Closure steuerbar — Default 'kein Cleanup-Pfad'.
const pruefungStateMock = { zuruecksetzen: vi.fn(), abgegeben: false, beendetUm: null as string | null }
vi.mock('../store/pruefungStore', () => ({
  usePruefungStore: {
    getState: () => pruefungStateMock,
  },
}))

vi.mock('../store/favoritenStore', () => ({
  useFavoritenStore: {
    getState: () => ({ favoriten: [] }),
    setState: vi.fn(),
  },
}))

// Browser-Navigation in jsdom blocken
Object.defineProperty(window, 'location', {
  configurable: true,
  writable: true,
  value: { href: '', assign: vi.fn() },
})

import { useAuthStore } from '../store/authStore'

const credential = {
  email: 'lp@gymhofwil.ch',
  name: 'Test LP',
  given_name: 'Test',
  family_name: 'LP',
  picture: '',
}

describe('Bundle G.c — authStore Login-Pre-Fetch + Logout-Cleanup', () => {
  beforeEach(() => {
    ladeMock.mockClear()
    resetMock.mockClear()
    clearIndexedDBMock.mockClear()
    clearIndexedDBMock.mockImplementation(async () => {})
    clearQueueMock.mockClear()
    clearQueueMock.mockImplementation(async () => {})
    pruefungStateMock.abgegeben = false
    pruefungStateMock.beendetUm = null
    sessionStorage.clear()
    klassenlistenLadeMock.mockClear()
    klassenlistenResetMock.mockClear()
    gruppenLadeMock.mockClear()
    gruppenResetMock.mockClear()
    // Auth-Store vor jedem Test in den initialen Zustand zurücksetzen
    useAuthStore.setState({ user: null, istDemoModus: false, ladeStatus: 'idle', fehler: null })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('anmelden() triggert fragenbankStore.lade mit user.email', async () => {
    await useAuthStore.getState().anmelden(credential)
    expect(ladeMock).toHaveBeenCalledTimes(1)
    expect(ladeMock).toHaveBeenCalledWith('lp@gymhofwil.ch')
  })

  it('anmelden() wartet NICHT auf Pre-Fetch — kehrt zurück bevor lade() resolved', async () => {
    let releaseLade: (() => void) | undefined
    ladeMock.mockImplementationOnce(
      () => new Promise<void>((resolve) => { releaseLade = resolve }),
    )

    const anmeldenPromise = useAuthStore.getState().anmelden(credential)
    // anmelden ist async — wartet auf ladeUndCacheLPs (mock returnt sofort), aber NICHT auf lade()
    await anmeldenPromise
    // anmelden ist zurück, lade() läuft noch
    expect(ladeMock).toHaveBeenCalledTimes(1)
    expect(useAuthStore.getState().user?.email).toBe('lp@gymhofwil.ch')

    // Aufräumen
    releaseLade?.()
  })

  it('anmelden() wirft NICHT wenn lade() rejected (fail-silent)', async () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    ladeMock.mockRejectedValueOnce(new Error('Backend down'))

    await expect(useAuthStore.getState().anmelden(credential)).resolves.toBeUndefined()
    // Pre-Fetch ist fire-and-forget — der Reject-Handler läuft async; einmal ticken
    await new Promise<void>((r) => setTimeout(r, 0))
    expect(consoleSpy).toHaveBeenCalled()

    consoleSpy.mockRestore()
  })

  it('abmelden() awaitet fragenbankStore.reset (Privacy-Garantie vor Hard-Nav)', async () => {
    useAuthStore.setState({
      user: { email: 'lp@gymhofwil.ch', name: 'Test', vorname: 'T', nachname: 'L', rolle: 'lp' },
      istDemoModus: false,
      ladeStatus: 'fertig',
      fehler: null,
    })
    await useAuthStore.getState().abmelden()
    expect(resetMock).toHaveBeenCalledTimes(1)
  })

  it('abmelden() wartet auf reset() bevor User-State gelöscht wird', async () => {
    let releaseReset: (() => void) | undefined
    resetMock.mockImplementationOnce(() => new Promise<void>((resolve) => { releaseReset = resolve }))
    useAuthStore.setState({
      user: { email: 'lp@gymhofwil.ch', name: 'Test', vorname: 'T', nachname: 'L', rolle: 'lp' },
      istDemoModus: false,
      ladeStatus: 'fertig',
      fehler: null,
    })

    const abmeldenPromise = useAuthStore.getState().abmelden()
    // Während reset() noch läuft, ist user noch gesetzt (kein voreiliger State-Reset)
    await new Promise<void>((r) => setTimeout(r, 0))
    expect(useAuthStore.getState().user?.email).toBe('lp@gymhofwil.ch')

    releaseReset?.()
    await abmeldenPromise
    // Nach reset()-Commit: User leer
    expect(useAuthStore.getState().user).toBeNull()
    expect(resetMock).toHaveBeenCalledTimes(1)
  })

  it('abmelden() wartet auf clearIndexedDB bei LP-beendet-Pfad (S150)', async () => {
    // resetPruefungState (intern) ruft clearIndexedDB nur wenn beendetUm truthy.
    pruefungStateMock.beendetUm = new Date().toISOString()
    let releaseClearIDB: (() => void) | undefined
    clearIndexedDBMock.mockImplementationOnce(() => new Promise<void>((resolve) => { releaseClearIDB = resolve }))
    clearQueueMock.mockResolvedValue(undefined)

    useAuthStore.setState({
      user: { email: 'lp@gymhofwil.ch', name: 'Test', vorname: 'T', nachname: 'L', rolle: 'lp' },
      istDemoModus: false,
      ladeStatus: 'fertig',
      fehler: null,
    })

    const abmeldenPromise = useAuthStore.getState().abmelden()
    // Während clearIndexedDB hängt, darf User-State noch nicht gelöscht sein
    // (Hard-Nav muss warten — sonst würde Page-Unload die IDB-Tx abbrechen).
    await new Promise<void>((r) => setTimeout(r, 0))
    expect(useAuthStore.getState().user?.email).toBe('lp@gymhofwil.ch')
    expect(clearIndexedDBMock).toHaveBeenCalledTimes(1)

    releaseClearIDB?.()
    await abmeldenPromise
    expect(useAuthStore.getState().user).toBeNull()
  })

  it('anmelden() (LP) feuert Pre-Fetch für Fragenbank + Klassenlisten + Gruppen', async () => {
    await useAuthStore.getState().anmelden(credential)
    expect(ladeMock).toHaveBeenCalledWith('lp@gymhofwil.ch')
    expect(klassenlistenLadeMock).toHaveBeenCalledWith('lp@gymhofwil.ch')
    expect(gruppenLadeMock).toHaveBeenCalledWith('lp@gymhofwil.ch')
  })

  it('anmelden() Pre-Fetch-Fehler werden silent geschluckt (kein Throw)', async () => {
    klassenlistenLadeMock.mockRejectedValueOnce(new Error('Backend down'))
    gruppenLadeMock.mockRejectedValueOnce(new Error('Backend down'))
    await expect(useAuthStore.getState().anmelden(credential)).resolves.toBeUndefined()
    await new Promise<void>((r) => setTimeout(r, 0)) // einmal ticken für Reject-Handler
  })

  it('abmelden() awaitet Promise.all der 3 reset()-Aufrufe vor window.location.href', async () => {
    let resolveK: (() => void) | undefined
    let resolveG: (() => void) | undefined
    klassenlistenResetMock.mockImplementationOnce(() => new Promise<void>((r) => { resolveK = r }))
    gruppenResetMock.mockImplementationOnce(() => new Promise<void>((r) => { resolveG = r }))

    let abgeschlossen = false
    const p = useAuthStore.getState().abmelden().then(() => { abgeschlossen = true })

    // Tick — abmelden darf NOCH NICHT durch sein, weil Promise.all hängt
    await new Promise<void>((r) => setTimeout(r, 0))
    expect(abgeschlossen).toBe(false)

    resolveK?.()
    resolveG?.()
    await p
    expect(abgeschlossen).toBe(true)
    expect(klassenlistenResetMock).toHaveBeenCalledTimes(1)
    expect(gruppenResetMock).toHaveBeenCalledTimes(1)
    expect(resetMock).toHaveBeenCalledTimes(1) // Fragenbank-reset auch
  })

  it('anmeldenMitCode() (SuS) feuert nur Gruppen-Pre-Fetch (NICHT Klassenlisten, NICHT Fragenbank)', async () => {
    await useAuthStore.getState().anmeldenMitCode('S123', 'Test SuS', 'sus@stud.gymhofwil.ch', 'tok')
    expect(gruppenLadeMock).toHaveBeenCalledWith('sus@stud.gymhofwil.ch')
    expect(klassenlistenLadeMock).not.toHaveBeenCalled()
    expect(ladeMock).not.toHaveBeenCalled()
  })

  it('anmelden() (SuS via Google-Login) feuert nur Gruppen, NICHT Fragenbank/Klassenlisten (LP-only)', async () => {
    // SuS-Email-Domain → rolleAusDomain returnt 'sus' bevor LP-Liste geprüft wird.
    // Ohne Rollen-Guard würde Backend 403 für ladeKlassenlisten/ladeFragenbank schicken
    // (silent-fail catch + Console-Warning bei jedem SuS-Google-Login).
    const susCredential = {
      email: 'student@stud.gymhofwil.ch',
      name: 'Test SuS',
      given_name: 'Test',
      family_name: 'SuS',
      picture: '',
    }
    await useAuthStore.getState().anmelden(susCredential)
    expect(gruppenLadeMock).toHaveBeenCalledWith('student@stud.gymhofwil.ch')
    expect(klassenlistenLadeMock).not.toHaveBeenCalled()
    expect(ladeMock).not.toHaveBeenCalled() // Fragenbank
  })
})
