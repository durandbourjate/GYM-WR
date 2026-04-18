import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { createElement } from 'react'
import { useGlobalZurueck, TOP_LEVEL_ROUTES } from './useGlobalZurueck'

// Auth-Store mocken — mutableRolle erlaubt pro-Test-Überschreibung
let mockRolle: 'lp' | 'sus' = 'lp'
vi.mock('../store/authStore', () => ({
  useAuthStore: (sel: (s: { user: { rolle: 'lp' | 'sus' } | null }) => unknown) =>
    sel({ user: { rolle: mockRolle } }),
}))

// navigate-Spy (muss vor dem ersten Import gesetzt sein, wird pro Test neu gesetzt)
const navigateSpy = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => navigateSpy,
  }
})

/** Wrapper-Factory für renderHook mit MemoryRouter */
function wrapper(initialPath: string, locationKey?: string) {
  return ({ children }: { children: React.ReactNode }) =>
    createElement(
      MemoryRouter,
      {
        initialEntries: [{ pathname: initialPath, key: locationKey ?? 'abc123' }],
        initialIndex: 0,
      },
      children,
    )
}

describe('useGlobalZurueck — canGoBack', () => {
  beforeEach(() => {
    navigateSpy.mockClear()
    mockRolle = 'lp'
  })

  it('canGoBack=false auf /favoriten (Top-Level LP)', () => {
    const { result } = renderHook(() => useGlobalZurueck(), { wrapper: wrapper('/favoriten') })
    expect(result.current.canGoBack).toBe(false)
  })

  it('canGoBack=false auf /sus/ueben (Top-Level SuS)', () => {
    const { result } = renderHook(() => useGlobalZurueck(), { wrapper: wrapper('/sus/ueben') })
    expect(result.current.canGoBack).toBe(false)
  })

  it('canGoBack=false auf /pruefung (Top-Level)', () => {
    const { result } = renderHook(() => useGlobalZurueck(), { wrapper: wrapper('/pruefung') })
    expect(result.current.canGoBack).toBe(false)
  })

  it('canGoBack=false auf /uebung (Top-Level)', () => {
    const { result } = renderHook(() => useGlobalZurueck(), { wrapper: wrapper('/uebung') })
    expect(result.current.canGoBack).toBe(false)
  })

  it('canGoBack=true auf /pruefung/abc-123 (Parametrisiert)', () => {
    const { result } = renderHook(() => useGlobalZurueck(), { wrapper: wrapper('/pruefung/abc-123') })
    expect(result.current.canGoBack).toBe(true)
  })

  it('canGoBack=true auf /sus/ueben/einrichtung-pruefung (Parametrisiert SuS)', () => {
    const { result } = renderHook(
      () => useGlobalZurueck(),
      { wrapper: wrapper('/sus/ueben/einrichtung-pruefung') },
    )
    expect(result.current.canGoBack).toBe(true)
  })

  it('canGoBack=true auf /uebung/kurs/sf-wr-29c', () => {
    const { result } = renderHook(() => useGlobalZurueck(), { wrapper: wrapper('/uebung/kurs/sf-wr-29c') })
    expect(result.current.canGoBack).toBe(true)
  })

  it('canGoBack=true auf /sus/korrektur/pruefung-42', () => {
    const { result } = renderHook(() => useGlobalZurueck(), { wrapper: wrapper('/sus/korrektur/pruefung-42') })
    expect(result.current.canGoBack).toBe(true)
  })

  it('canGoBack=true auf /einstellungen/farben', () => {
    const { result } = renderHook(() => useGlobalZurueck(), { wrapper: wrapper('/einstellungen/farben') })
    expect(result.current.canGoBack).toBe(true)
  })
})

describe('useGlobalZurueck — goBack()', () => {
  beforeEach(() => {
    navigateSpy.mockClear()
    mockRolle = 'lp'
  })

  it('ruft navigate(-1) wenn location.key !== "default"', () => {
    const { result } = renderHook(() => useGlobalZurueck(), {
      wrapper: wrapper('/pruefung/abc-123', 'abc123'),
    })
    result.current.goBack()
    expect(navigateSpy).toHaveBeenCalledWith(-1)
  })

  it('ruft navigate("/favoriten", { replace: true }) wenn LP + default-key', () => {
    // Auth-Mock liefert rolle='lp' (Modul-Level-Mock)
    const { result } = renderHook(() => useGlobalZurueck(), {
      wrapper: wrapper('/pruefung/abc-123', 'default'),
    })
    result.current.goBack()
    expect(navigateSpy).toHaveBeenCalledWith('/favoriten', { replace: true })
  })
})

describe('useGlobalZurueck — SuS default-key', () => {
  beforeEach(() => {
    navigateSpy.mockClear()
    mockRolle = 'sus'
  })

  afterEach(() => {
    mockRolle = 'lp'
  })

  it('ruft navigate("/sus/ueben", { replace: true }) wenn SuS + default-key', () => {
    const { result } = renderHook(() => useGlobalZurueck(), {
      wrapper: wrapper('/sus/ueben/einrichtung-pruefung', 'default'),
    })
    result.current.goBack()
    expect(navigateSpy).toHaveBeenCalledWith('/sus/ueben', { replace: true })
  })
})

describe('TOP_LEVEL_ROUTES Konstante', () => {
  it('enthält alle LP-Top-Level-Routen', () => {
    const lpRoutes = ['/favoriten', '/pruefung', '/pruefung/tracker', '/pruefung/monitoring',
      '/uebung', '/uebung/durchfuehren', '/uebung/analyse', '/fragensammlung', '/einstellungen']
    for (const route of lpRoutes) {
      expect(TOP_LEVEL_ROUTES.has(route)).toBe(true)
    }
  })

  it('enthält alle SuS-Top-Level-Routen', () => {
    const susRoutes = ['/sus', '/sus/ueben', '/sus/pruefen', '/sus/admin', '/sus/gruppen',
      '/sus/ueben/fortschritt', '/sus/ueben/ergebnisse', '/sus/ueben/ergebnis', '/sus/pruefen/ergebnisse']
    for (const route of susRoutes) {
      expect(TOP_LEVEL_ROUTES.has(route)).toBe(true)
    }
  })

  it('enthält KEINE parametrisierten Routen', () => {
    expect(TOP_LEVEL_ROUTES.has('/pruefung/abc-123')).toBe(false)
    expect(TOP_LEVEL_ROUTES.has('/uebung/kurs/sf-wr-29c')).toBe(false)
    expect(TOP_LEVEL_ROUTES.has('/sus/ueben/einrichtung-pruefung')).toBe(false)
  })
})
