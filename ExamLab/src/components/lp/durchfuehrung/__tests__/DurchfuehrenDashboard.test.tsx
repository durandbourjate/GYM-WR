import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import DurchfuehrenDashboardSource from '../DurchfuehrenDashboard.tsx?raw'

// =============================================================================
// G.f.2 Rendering-Tests: Mocks müssen VOR allen Komponenten-Imports stehen
// =============================================================================

// --- pending Promises für ladeMonitoring + ladeNachrichten + ladePruefung
// Skeleton-Tests prüfen den ladeStatus='laden'-Pfad — Promises bleiben absichtlich pending. ---

vi.mock('../../../../services/apiService', () => ({
  apiService: {
    istKonfiguriert: () => true,
    ladeMonitoring: vi.fn(() => new Promise(() => { /* bleibt pending */ })),
    ladePruefung: vi.fn(() => new Promise(() => { /* bleibt pending */ })),
    ladeAbgaben: vi.fn(() => new Promise(() => { /* bleibt pending */ })),
    ladeNachrichten: vi.fn(() => Promise.resolve([])),
    ladeEinzelConfig: vi.fn(() => new Promise(() => { /* bleibt pending */ })),
  },
}))

vi.mock('../../../../services/preWarmApi', () => ({
  preWarmKorrektur: vi.fn(() => Promise.resolve()),
}))

vi.mock('../../../../store/authStore', () => ({
  useAuthStore: (selector: (s: { user: { email: string; name: string } | null; istDemoModus: boolean }) => unknown) =>
    selector({ user: { email: 'lp@gymhofwil.ch', name: 'Test LP' }, istDemoModus: false }),
}))

// Schwere Sub-Komponenten mocken — wir testen nur den Skeleton-Pfad
vi.mock('../VorbereitungPhase', () => ({
  default: () => <div data-testid="vorbereitung-phase-mock">VorbereitungPhase</div>,
}))
vi.mock('../LobbyPhase', () => ({
  default: () => <div data-testid="lobby-phase-mock">LobbyPhase</div>,
}))
vi.mock('../AktivPhase', () => ({
  default: () => <div data-testid="aktiv-phase-mock">AktivPhase</div>,
}))
vi.mock('../BeendetPhase', () => ({
  default: () => <div data-testid="beendet-phase-mock">BeendetPhase</div>,
}))
vi.mock('../../../../components/lp/korrektur/KorrekturDashboard', () => ({
  default: () => <div data-testid="korrektur-dashboard-mock">KorrekturDashboard</div>,
}))
vi.mock('../../../../components/settings/EinstellungenPanel', () => ({
  default: () => <div data-testid="einstellungen-panel-mock">EinstellungenPanel</div>,
}))
vi.mock('../../../../components/lp/fragenbank/FragenBrowser', () => ({
  default: () => <div data-testid="fragen-browser-mock">FragenBrowser</div>,
}))
vi.mock('../../../../components/lp/HilfeSeite', () => ({
  default: () => <div data-testid="hilfe-seite-mock">HilfeSeite</div>,
}))

// LPAppHeaderContainer: rendert ein <header>-Element
vi.mock('../../LPAppHeaderContainer', () => ({
  LPAppHeaderContainer: ({ untertitel }: { untertitel?: string }) => (
    <header data-testid="lp-app-header">{untertitel}</header>
  ),
}))

// Theme-Store (von LPAppHeaderContainer ggf. transitiv gebraucht — als Fallback)
vi.mock('../../../../store/themeStore', () => ({
  useThemeStore: (selector: (s: { mode: string; toggleMode: () => void }) => unknown) =>
    selector({ mode: 'light', toggleMode: vi.fn() }),
}))

// matchMedia-Mock (TabBar / Header könnten das brauchen)
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

// Lazy-import damit vi.mock-Hoisting vor Modul-Init greift
async function ladeDurchfuehrenDashboard() {
  const Modul = await import('../DurchfuehrenDashboard')
  return Modul.default
}

// =============================================================================
// Bestehende Source-Code-Scan-Tests (unverändert)
// =============================================================================

describe('DurchfuehrenDashboard — Polling-Logik', () => {
  it('Hebel A: Lobby-Phase soll 5s-Polling ausloesen (nicht 15s)', () => {
    const hasLobbyPolling = /\(phase\s*===\s*['"]aktiv['"]\s*\|\|\s*phase\s*===\s*['"]lobby['"]\)/.test(
      DurchfuehrenDashboardSource
    )
    expect(
      hasLobbyPolling,
      'Polling-Konstante fuer Lobby fehlt: phase === "aktiv" || phase === "lobby" nicht gefunden'
    ).toBeTruthy()
  })
})

describe('DurchfuehrenDashboard — Pre-Warm-Trigger Hebel C', () => {
  const code = DurchfuehrenDashboardSource

  it('importiert preWarmKorrektur', () => {
    expect(code).toMatch(/import\s*\{[^}]*preWarmKorrektur[^}]*\}\s*from\s*['"][^'"]*preWarmApi['"]/)
  })

  it('Trigger 1 — Tab-Wechsel via wechsleTab', () => {
    expect(code).toMatch(/G\.d\.1 Trigger Tab-Wechsel/)
    const idx = code.indexOf('G.d.1 Trigger Tab-Wechsel')
    expect(code.substring(idx, idx + 500)).toMatch(/preWarmKorrektur/)
  })

  it('Trigger 2 — Phase-Wechsel zu beendet im Phase-useEffect', () => {
    expect(code).toMatch(/G\.d\.1 Trigger Phase-beendet/)
    const idx = code.indexOf('G.d.1 Trigger Phase-beendet')
    const block = code.substring(idx, idx + 500)
    expect(block).toMatch(/preWarmKorrektur/)
    expect(block).toMatch(/beendet/)
  })

  it('Trigger 3 — Direct-Mount-Edge-Case bei beendet-URL', () => {
    expect(code).toMatch(/G\.d\.1 Trigger Direct-Mount/)
    const idx = code.indexOf('G.d.1 Trigger Direct-Mount')
    expect(code.substring(idx, idx + 500)).toMatch(/preWarmKorrektur/)
  })
})

// =============================================================================
// G.f.2 Skeleton-Pattern — Rendering-Tests
// =============================================================================

describe('G.f.2 Skeleton-Pattern', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    // window.location.search zurücksetzen (kein ?tab)
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { ...window.location, search: '', href: 'http://localhost/' },
    })
  })

  it('rendert LPAppHeaderContainer auch während ladeStatus === "laden"', async () => {
    // ladeMonitoring bleibt pending → ladeStatus bleibt 'laden'
    const DurchfuehrenDashboard = await ladeDurchfuehrenDashboard()
    const { container } = render(
      <MemoryRouter>
        <DurchfuehrenDashboard pruefungId="test-pruefung-id" />
      </MemoryRouter>,
    )
    // Header muss sofort sichtbar sein, noch bevor die API-Calls auflösen
    expect(container.querySelector('[data-testid="lp-app-header"]')).toBeTruthy()
  })

  it('rendert DurchfuehrenVorbereitungSkeleton wenn activeTab="vorbereitung" + laden', async () => {
    // Kein ?tab in URL → activeTab default 'vorbereitung'
    // ladeMonitoring bleibt pending → ladeStatus bleibt 'laden'
    const DurchfuehrenDashboard = await ladeDurchfuehrenDashboard()
    const { container } = render(
      <MemoryRouter>
        <DurchfuehrenDashboard pruefungId="test-pruefung-id" />
      </MemoryRouter>,
    )
    await waitFor(() => {
      expect(container.querySelector('[data-testid="vorbereitung-settings-card"]')).toBeTruthy()
    })
  })

  it('rendert DurchfuehrenSusReihenSkeleton wenn activeTab="auswertung" + laden', async () => {
    // ?tab=auswertung → activeTab = 'auswertung'
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { ...window.location, search: '?tab=auswertung', href: 'http://localhost/?tab=auswertung' },
    })
    // ladeMonitoring bleibt pending → ladeStatus bleibt 'laden'
    const DurchfuehrenDashboard = await ladeDurchfuehrenDashboard()
    const { container } = render(
      <MemoryRouter>
        <DurchfuehrenDashboard pruefungId="test-pruefung-id" />
      </MemoryRouter>,
    )
    await waitFor(() => {
      expect(container.querySelector('[data-testid="sus-reihe-skeleton"]')).toBeTruthy()
    })
  })

  it('schreibt examlab-lp-letzte-sus-anzahl-{pruefungId} nach erfolgreichem Lade', async () => {
    // ladeMonitoring resolved mit 3 SuS → localStorage-Persist erwartet
    const { apiService: mockApi } = await import('../../../../services/apiService')
    ;(mockApi.ladeMonitoring as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      pruefungTitel: 'Test-Prüfung',
      schueler: [
        { email: 'a@test.ch', name: 'SuS A', status: 'nicht-gestartet' },
        { email: 'b@test.ch', name: 'SuS B', status: 'nicht-gestartet' },
        { email: 'c@test.ch', name: 'SuS C', status: 'nicht-gestartet' },
      ],
      gesamtSus: 3,
    })
    const DurchfuehrenDashboard = await ladeDurchfuehrenDashboard()
    render(
      <MemoryRouter>
        <DurchfuehrenDashboard pruefungId="test-pruefung-id" />
      </MemoryRouter>,
    )
    await waitFor(() => {
      expect(localStorage.getItem('examlab-lp-letzte-sus-anzahl-test-pruefung-id')).toBe('3')
    })
  })
})
