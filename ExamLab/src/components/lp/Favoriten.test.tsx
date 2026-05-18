import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import type { Favorit } from '../../types/favorit'

/**
 * Tests für Favoriten-Sektion Klick-Verhalten (Cluster E.5 Hotfix #4).
 *
 * 6 typ-Varianten:
 * - 'ort' → Link to fav.ziel
 * - 'pruefung' → Link to /pruefung?id=<ziel>
 * - 'uebung' → Link to /uebung?id=<ziel>
 * - 'frage' → Link to /fragensammlung/<ziel>
 * - 'einstellungen-tab' → <button> öffnet EinstellungenPanel via setZeigEinstellungen
 * - 'hilfe-tab' → <button> öffnet HilfeSeite via toggleHilfe + setInitialHilfeKategorie
 */

// Module-level state for configurable mocks
let mockFavoriten: Favorit[] = []
let mockLadeStatus: 'idle' | 'laeuft' | 'fertig' | 'fehler' = 'fertig'

const { setZeigEinstellungenMock, toggleHilfeMock } = vi.hoisted(() => ({
  setZeigEinstellungenMock: vi.fn(),
  toggleHilfeMock: vi.fn(),
}))

vi.mock('../../services/apiService', () => ({
  apiService: {
    istKonfiguriert: () => true,
    ladeAlleConfigs: vi.fn(() => Promise.resolve([])),
  },
}))

vi.mock('../../store/authStore', () => ({
  useAuthStore: (selector: (s: { user: { email: string; vorname?: string } | null; istDemoModus: boolean }) => unknown) =>
    selector({ user: { email: 'lp@gymhofwil.ch', vorname: 'Test' }, istDemoModus: false }),
}))

vi.mock('../../store/favoritenStore', () => ({
  useFavoritenStore: Object.assign(
    (selector: (s: { favoriten: Favorit[]; ladeStatus: typeof mockLadeStatus }) => unknown) =>
      selector({ favoriten: mockFavoriten, ladeStatus: mockLadeStatus }),
    { getState: () => ({ ladeAusBackend: vi.fn().mockResolvedValue(undefined) }) },
  ),
}))

vi.mock('../../store/stammdatenStore', () => ({
  useStammdatenStore: Object.assign(
    (selector: (s: { lpProfil: null }) => unknown) => selector({ lpProfil: null }),
    {
      getState: () => ({
        lpProfil: { email: 'lp@gymhofwil.ch', kursIds: [], fachschaftIds: [], gefaesse: [] },
        ladeLPProfil: vi.fn(() => Promise.resolve()),
      }),
    },
  ),
}))

vi.mock('../../store/configsListStore', () => ({
  useConfigsListStore: Object.assign(
    (selector: (s: Record<string, unknown>) => unknown) => selector({}),
    { getState: () => ({ setConfigs: vi.fn() }) },
  ),
}))

vi.mock('../../store/lpUIStore', () => ({
  useLPNavigationStore: Object.assign(
    (selector: (s: Record<string, unknown>) => unknown) => selector({
      zeigHilfe: false,
      zeigEinstellungen: false,
      einstellungenTab: null,
      toggleHilfe: toggleHilfeMock,
      toggleEinstellungen: vi.fn(),
      setZeigEinstellungen: setZeigEinstellungenMock,
    }),
    { getState: () => ({ einstellungenTab: null }) },
  ),
}))

vi.mock('../../hooks/useTestdatenSichtbar', () => ({
  useTestdatenSichtbar: () => true,
}))

vi.mock('../../utils/testdaten/filter', () => ({
  istTestdaten: () => false,
  filtereTestdatenWennDeaktiviert: (configs: unknown[]) => configs,
}))

beforeAll(() => {
  window.matchMedia = vi.fn().mockImplementation((q: string) => ({
    matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn(),
    media: q, onchange: null, addListener: vi.fn(), removeListener: vi.fn(), dispatchEvent: vi.fn(),
  }))
})

beforeEach(() => {
  mockFavoriten = []
  mockLadeStatus = 'fertig'
  setZeigEinstellungenMock.mockClear()
  toggleHilfeMock.mockClear()
})

async function ladeKomponente() {
  const Modul = await import('./Favoriten')
  return Modul.default
}

describe('Favoriten-Sektion — typ-Varianten Klick-Verhalten (Cluster E.5)', { timeout: 15000 }, () => {
  it("typ='ort' rendert <Link to={ziel}>", async () => {
    mockFavoriten = [{ typ: 'ort', ziel: '/fragensammlung', label: 'Fragensammlung', sortierung: 0 }]
    const Favoriten = await ladeKomponente()
    render(<MemoryRouter><Favoriten /></MemoryRouter>)
    await waitFor(() => {
      const link = screen.getByRole('link', { name: /Fragensammlung/i })
      expect(link.getAttribute('href')).toBe('/fragensammlung')
    })
  })

  it("typ='pruefung' rendert <Link to=/pruefung?id={ziel}>", async () => {
    mockFavoriten = [{ typ: 'pruefung', ziel: 'abc123', label: 'Mathe-Test', sortierung: 0 }]
    const Favoriten = await ladeKomponente()
    render(<MemoryRouter><Favoriten /></MemoryRouter>)
    await waitFor(() => {
      const link = screen.getByRole('link', { name: /Mathe-Test/i })
      expect(link.getAttribute('href')).toBe('/pruefung?id=abc123')
    })
  })

  it("typ='uebung' rendert <Link to=/uebung?id={ziel}>", async () => {
    mockFavoriten = [{ typ: 'uebung', ziel: 'xyz789', label: 'Aufgaben', sortierung: 0 }]
    const Favoriten = await ladeKomponente()
    render(<MemoryRouter><Favoriten /></MemoryRouter>)
    await waitFor(() => {
      const link = screen.getByRole('link', { name: /Aufgaben/i })
      expect(link.getAttribute('href')).toBe('/uebung?id=xyz789')
    })
  })

  it("typ='frage' rendert <Link to=/fragensammlung/{ziel}>", async () => {
    mockFavoriten = [{ typ: 'frage', ziel: 'frage-42', label: 'Buchung BWA', sortierung: 0 }]
    const Favoriten = await ladeKomponente()
    render(<MemoryRouter><Favoriten /></MemoryRouter>)
    await waitFor(() => {
      const link = screen.getByRole('link', { name: /Buchung BWA/i })
      expect(link.getAttribute('href')).toBe('/fragensammlung/frage-42')
    })
  })

  it("typ='einstellungen-tab' rendert <button> und ruft setZeigEinstellungen mit gemapptem Tab", async () => {
    mockFavoriten = [{ typ: 'einstellungen-tab', ziel: 'tags', label: 'Tags', icon: 'Tag', sortierung: 0 }]
    const Favoriten = await ladeKomponente()
    render(<MemoryRouter><Favoriten /></MemoryRouter>)
    await waitFor(() => {
      const btn = screen.getByRole('button', { name: /Tags/i })
      expect(btn.tagName).toBe('BUTTON')
      fireEvent.click(btn)
    })
    expect(setZeigEinstellungenMock).toHaveBeenCalledWith(true, 'tags')
  })

  it("typ='einstellungen-tab' mit ziel='ki-kalibrierung' wird 1:1 durchgereicht (Drift entfallen)", async () => {
    mockFavoriten = [{ typ: 'einstellungen-tab', ziel: 'ki-kalibrierung', label: 'KI-Kalibrierung', sortierung: 0 }]
    const Favoriten = await ladeKomponente()
    render(<MemoryRouter><Favoriten /></MemoryRouter>)
    await waitFor(() => {
      fireEvent.click(screen.getByRole('button', { name: /KI-Kalibrierung/i }))
    })
    expect(setZeigEinstellungenMock).toHaveBeenCalledWith(true, 'ki-kalibrierung')
  })

  it("typ='hilfe-tab' rendert <button> und ruft toggleHilfe", async () => {
    mockFavoriten = [{ typ: 'hilfe-tab', ziel: 'einstieg', label: 'Erste Schritte', sortierung: 0 }]
    const Favoriten = await ladeKomponente()
    render(<MemoryRouter><Favoriten /></MemoryRouter>)
    await waitFor(() => {
      const btn = screen.getByRole('button', { name: /Erste Schritte/i })
      expect(btn.tagName).toBe('BUTTON')
      fireEvent.click(btn)
    })
    expect(toggleHilfeMock).toHaveBeenCalled()
  })
})

describe('Favoriten-Sektion — Loading-/Empty-State', { timeout: 15000 }, () => {
  it("zeigt 3 Skeleton-Karten wenn ladeStatus='laeuft'", async () => {
    mockLadeStatus = 'laeuft'
    mockFavoriten = []
    const Favoriten = await ladeKomponente()
    const { container } = render(<MemoryRouter><Favoriten /></MemoryRouter>)
    await waitFor(() => {
      const skeletons = container.querySelectorAll('.animate-pulse')
      expect(skeletons.length).toBe(3)
    })
  })

  it("zeigt leerText wenn ladeStatus='fertig' und favoriten leer", async () => {
    mockLadeStatus = 'fertig'
    mockFavoriten = []
    const Favoriten = await ladeKomponente()
    render(<MemoryRouter><Favoriten /></MemoryRouter>)
    await waitFor(() => {
      expect(screen.getByText(/Noch keine Favoriten gesetzt/i)).toBeInTheDocument()
    })
  })
})
