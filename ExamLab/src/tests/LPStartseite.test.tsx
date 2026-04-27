import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

/**
 * Diese Tests verifizieren das Skeleton-Rendering-Verhalten von LPStartseite
 * (Bundle G.f). LPStartseite ist sehr breit verdrahtet (Stores, Hooks, Lazy
 * Imports). Wir mocken alle externen Abhängigkeiten so, dass:
 *  - Configs-Lade kontrolliert lädt oder fertig ist (apiService.ladeAlleConfigs)
 *  - Tracker-Lade kontrolliert lädt oder fertig ist (apiService.ladeTrackerDaten)
 *  - Stores feste Werte liefern (modus/listenTab/uebungsTab)
 *
 * Drei zentrale Pfade werden geprüft (entspricht den 3 Skeletons):
 *  1. Prüfungs-Tab + Configs lädt → LPCardsSkeleton
 *  2. Übungs-Tab (durchfuehren) + Configs lädt → LPUebungenSkeleton
 *  3. Tracker-Tab + Tracker lädt → LPTrackerSkeleton
 *  4. Tracker-Tab + Tracker fertig + keine Daten → "Keine Tracker-Daten verfügbar"
 *  5. Beide fertig + leere Listen → kein Skeleton mehr im DOM
 */

// --- apiService-Mock: Promises die wir kontrollieren ---
let configsLadenPromiseResolve: ((v: unknown) => void) | null = null
let trackerLadenPromiseResolve: ((v: unknown) => void) | null = null

vi.mock('../services/apiService', () => ({
  apiService: {
    istKonfiguriert: () => true,
    ladeAlleConfigs: vi.fn(() => new Promise((resolve) => { configsLadenPromiseResolve = resolve })),
    ladeTrackerDaten: vi.fn(() => new Promise((resolve) => { trackerLadenPromiseResolve = resolve })),
  },
}))

// --- Store-Mocks: feste minimal-Werte ---
let mockListenTab: 'pruefungen' | 'tracker' = 'pruefungen'
let mockModus: 'pruefung' | 'uebung' | 'fragensammlung' = 'pruefung'
let mockUebungsTab: 'uebungen' | 'durchfuehren' | 'analyse' = 'durchfuehren'

vi.mock('../store/authStore', () => ({
  useAuthStore: (selector: (s: { user: { email: string; name: string } | null; istDemoModus: boolean }) => unknown) =>
    selector({ user: { email: 'lp@gymhofwil.ch', name: 'Test LP' }, istDemoModus: false }),
}))

vi.mock('../store/lpUIStore', () => ({
  useLPNavigationStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      ansicht: 'dashboard',
      modus: mockModus,
      listenTab: mockListenTab,
      uebungsTab: mockUebungsTab,
      zeigHilfe: false,
      zeigEinstellungen: false,
      einstellungenTab: null,
      composerKey: 0,
      neuerComposerKey: vi.fn(),
      toggleHilfe: vi.fn(),
      toggleEinstellungen: vi.fn(),
      setZeigEinstellungen: vi.fn(),
    }),
}))

vi.mock('../store/ueben/gruppenStore', () => ({
  useUebenGruppenStore: (selector: (s: { gruppen: [] }) => unknown) =>
    selector({ gruppen: [] }),
}))

vi.mock('../store/fragenbankStore', () => ({
  useFragenbankStore: Object.assign(
    (selector: (s: { summaries: [] }) => unknown) => selector({ summaries: [] }),
    { getState: () => ({ lade: vi.fn() }) },
  ),
}))

vi.mock('../store/stammdatenStore', () => ({
  useStammdatenStore: Object.assign(
    (selector: (s: { lpProfil: null }) => unknown) => selector({ lpProfil: null }),
    {
      getState: () => ({
        ladeStammdaten: vi.fn(),
        ladeLPProfil: vi.fn(() => Promise.resolve()),
        lpProfil: null,
      }),
    },
  ),
}))

vi.mock('../store/favoritenStore', () => ({
  useFavoritenStore: Object.assign(
    (selector: (s: { favoriten: [] }) => unknown) => selector({ favoriten: [] }),
    { getState: () => ({ favoriten: [] }), setState: vi.fn() },
  ),
}))

vi.mock('../hooks/useLPRouteSync', () => ({
  useLPRouteSync: vi.fn(),
}))

vi.mock('../hooks/useLPNavigation', () => ({
  useLPNavigation: () => ({
    setModus: vi.fn(),
    zurueckZumDashboard: vi.fn(),
    navigiereZuComposer: vi.fn(),
  }),
}))

// matchMedia-Mock
beforeAll(() => {
  window.matchMedia = vi.fn().mockImplementation((q: string) => ({
    matches: q === '(min-width: 900px)' || q === '(min-width: 600px)',
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    media: q,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
})

beforeEach(() => {
  configsLadenPromiseResolve = null
  trackerLadenPromiseResolve = null
  mockListenTab = 'pruefungen'
  mockModus = 'pruefung'
  mockUebungsTab = 'durchfuehren'
  localStorage.clear()
  vi.clearAllMocks()
})

// Lazy-import damit Mocks vor Modul-Init wirken
async function ladeKomponente() {
  const Modul = await import('../components/lp/LPStartseite')
  return Modul.default
}

describe('LPStartseite Skeleton-Rendering', () => {
  it('zeigt LPCardsSkeleton bei Prüfungs-Tab + configsLadeStatus=laden', async () => {
    mockModus = 'pruefung'
    mockListenTab = 'pruefungen'
    const LPStartseite = await ladeKomponente()
    const { container } = render(
      <MemoryRouter>
        <LPStartseite />
      </MemoryRouter>,
    )
    // configsLadenPromiseResolve bleibt null → Promise hängt → Skeleton sichtbar
    await waitFor(() => {
      expect(container.querySelectorAll('[data-testid="lp-card-skeleton"]').length).toBeGreaterThan(0)
    })
  })

  it('zeigt LPUebungenSkeleton bei Übungs-Tab (durchfuehren) + configsLadeStatus=laden', async () => {
    mockModus = 'uebung'
    mockUebungsTab = 'durchfuehren'
    const LPStartseite = await ladeKomponente()
    const { container } = render(
      <MemoryRouter>
        <LPStartseite />
      </MemoryRouter>,
    )
    await waitFor(() => {
      expect(container.querySelectorAll('[data-testid="lp-ueb-skeleton"]').length).toBeGreaterThan(0)
    })
  })

  it('zeigt LPTrackerSkeleton bei Tracker-Tab + trackerLadeStatus=laden', async () => {
    mockModus = 'pruefung'
    mockListenTab = 'tracker'
    const LPStartseite = await ladeKomponente()
    const { container } = render(
      <MemoryRouter>
        <LPStartseite />
      </MemoryRouter>,
    )
    // Configs müssen 'fertig' sein damit Tab-Inhalt rendert; Tracker bleibt 'laden'
    // Configs auflösen — trackerLadenPromise bleibt offen
    await waitFor(() => {
      expect(configsLadenPromiseResolve).not.toBeNull()
    })
    configsLadenPromiseResolve?.([])
    await waitFor(() => {
      expect(container.querySelector('[data-testid="lp-tracker-summary"]')).toBeTruthy()
      expect(container.querySelectorAll('[data-testid="lp-tracker-section"]').length).toBe(2)
    })
  })

  it('zeigt "Keine Tracker-Daten verfügbar" bei Tracker-Tab + trackerLadeStatus=fertig + !trackerDaten', async () => {
    mockModus = 'pruefung'
    mockListenTab = 'tracker'
    const LPStartseite = await ladeKomponente()
    render(
      <MemoryRouter>
        <LPStartseite />
      </MemoryRouter>,
    )
    // Configs müssen erst resolvieren bevor Tracker geladen wird
    await waitFor(() => {
      expect(configsLadenPromiseResolve).not.toBeNull()
    })
    configsLadenPromiseResolve?.([])
    await waitFor(() => {
      expect(trackerLadenPromiseResolve).not.toBeNull()
    })
    trackerLadenPromiseResolve?.(null) // null = keine Tracker-Daten
    await waitFor(() => {
      expect(screen.getByText('Keine Tracker-Daten verfügbar.')).toBeInTheDocument()
    })
  })

  it('rendert kein Skeleton mehr nach configsLadeStatus=fertig (leere Liste)', async () => {
    mockModus = 'pruefung'
    mockListenTab = 'pruefungen'
    const LPStartseite = await ladeKomponente()
    const { container } = render(
      <MemoryRouter>
        <LPStartseite />
      </MemoryRouter>,
    )
    await waitFor(() => {
      expect(configsLadenPromiseResolve).not.toBeNull()
    })
    configsLadenPromiseResolve?.([])
    await waitFor(() => {
      expect(container.querySelectorAll('[data-testid="lp-card-skeleton"]').length).toBe(0)
    })
    // Empty-State sichtbar
    expect(screen.getByText('Noch keine Prüfungen')).toBeInTheDocument()
  })
})
