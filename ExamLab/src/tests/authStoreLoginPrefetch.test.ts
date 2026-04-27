import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mocks für die Module die der authStore (in)direkt nutzt — vor dem Import der Stores
const ladeMock = vi.fn(async () => {})
const resetMock = vi.fn(async () => {})

vi.mock('../store/fragenbankStore', () => ({
  useFragenbankStore: {
    getState: () => ({ lade: ladeMock, reset: resetMock }),
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
})
