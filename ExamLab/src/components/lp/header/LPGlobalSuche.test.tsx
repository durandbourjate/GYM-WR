import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

// ────────────────────────────────────────────────────────────────
// Mutable state for fragensammlungStore mock — tests control this
// ────────────────────────────────────────────────────────────────
const mockFragensammlungState = {
  fragen: [] as unknown[],
  status: 'summary_fertig' as string,
  ladeAlleDetails: vi.fn(),
}

vi.mock('../../../store/fragensammlungStore', () => ({
  useFragensammlungStore: (selector: (s: typeof mockFragensammlungState) => unknown) =>
    selector(mockFragensammlungState),
}))

// ────────────────────────────────────────────────────────────────
// Mutable state for authStore mock
// ────────────────────────────────────────────────────────────────
const mockAuthState = {
  user: { email: 'lp@test.ch' } as { email: string } | null,
}

vi.mock('../../../store/authStore', () => ({
  useAuthStore: (selector: (s: typeof mockAuthState) => unknown) =>
    selector(mockAuthState),
}))

// ────────────────────────────────────────────────────────────────
// sucheEngine mock — controllable via spy
// ────────────────────────────────────────────────────────────────
const LEERES_ERGEBNIS_MOCK = { treffer: [], proQuelleGesamt: {} }
// Track calls to fuehreSucheAus: [query, index, opts]
const sucheAusCalls: Array<[string, Record<string, unknown>, ({ volltext?: boolean } | undefined)?]> = []
function fuehreSucheAusMockImpl(
  q: string,
  idx: Record<string, unknown>,
  opts?: { volltext?: boolean },
) {
  sucheAusCalls.push([q, idx, opts])
  return LEERES_ERGEBNIS_MOCK
}

vi.mock('../../../utils/sucheEngine', () => ({
  fuehreSucheAus: (
    q: string,
    idx: Record<string, unknown>,
    opts?: { volltext?: boolean },
  ) => fuehreSucheAusMockImpl(q, idx, opts),
  normalizeForSuche: (s: string) => s,
  LEERES_ERGEBNIS: { treffer: [], proQuelleGesamt: {} },
}))

vi.mock('../../../hooks/useSucheIndex', () => ({
  useSucheIndex: () => ({
    einstellungenTabs: [],
    hilfeTabs: [],
    kurse: [],
    schueler: [],
    pruefungen: [],
    uebungen: [],
    fragen: [],
  }),
}))

import { LPGlobalSuche } from './LPGlobalSuche'

beforeAll(() => {
  window.matchMedia = vi.fn().mockImplementation((q: string) => ({
    matches: false,
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
  // Reset to default state before each test
  mockFragensammlungState.fragen = []
  mockFragensammlungState.status = 'summary_fertig'
  mockFragensammlungState.ladeAlleDetails = vi.fn()
  mockAuthState.user = { email: 'lp@test.ch' }
  sucheAusCalls.length = 0
})

function renderSuche() {
  return render(
    <MemoryRouter>
      <LPGlobalSuche />
    </MemoryRouter>,
  )
}

describe('LPGlobalSuche — Volltext-Toggle', () => {
  it('Toggle hat initial aria-pressed=false und keine violet-Klassen', () => {
    renderSuche()
    const btn = screen.getByRole('button', { name: /volltext/i })
    expect(btn).toHaveAttribute('aria-pressed', 'false')
    expect(btn.className).toContain('bg-slate-100')
    expect(btn.className).not.toContain('bg-violet-100')
  })

  it('Klick auf Toggle setzt aria-pressed=true und violet-Styling', () => {
    renderSuche()
    const btn = screen.getByRole('button', { name: /volltext/i })
    fireEvent.click(btn)
    expect(btn).toHaveAttribute('aria-pressed', 'true')
    expect(btn.className).toContain('bg-violet-100')
    expect(btn.className).not.toContain('bg-slate-100')
  })

  it('Toggle ist unabhängig vom Suchfeld — gegenseitig kein Reset', () => {
    renderSuche()
    const btn = screen.getByRole('button', { name: /volltext/i })
    const input = screen.getByRole('searchbox')

    // Toggle aktivieren
    fireEvent.click(btn)
    expect(btn).toHaveAttribute('aria-pressed', 'true')

    // Eingabe im Suchfeld soll Toggle nicht zurücksetzen
    fireEvent.change(input, { target: { value: 'test' } })
    expect(btn).toHaveAttribute('aria-pressed', 'true')

    // Toggle zurücksetzen soll Query nicht leeren
    fireEvent.click(btn)
    expect(btn).toHaveAttribute('aria-pressed', 'false')
    expect(input).toHaveValue('test')
  })
})

describe('LPGlobalSuche — Volltext Lazy-Load', () => {
  it('Volltext aktivieren + noch nicht geladen triggert ladeAlleDetails', async () => {
    // Default state: fragen=[], status='summary_fertig' → noch nicht geladen, nicht ladend
    renderSuche()

    const btn = screen.getByRole('button', { name: /volltext/i })
    await act(async () => {
      fireEvent.click(btn)
    })

    expect(mockFragensammlungState.ladeAlleDetails).toHaveBeenCalledWith('lp@test.ch')
  })

  it('Volltext aktivieren + bereits geladen (fragen.length > 0) triggert keinen zusätzlichen Call', async () => {
    // Override: Fragen bereits geladen
    mockFragensammlungState.fragen = [{ id: 'f1' }]
    mockFragensammlungState.status = 'fertig'

    renderSuche()

    const btn = screen.getByRole('button', { name: /volltext/i })
    await act(async () => {
      fireEvent.click(btn)
    })

    expect(mockFragensammlungState.ladeAlleDetails).not.toHaveBeenCalled()
  })

  it('fuehreSucheAus erhält opts.volltext: true wenn Toggle aktiv und bereit', async () => {
    // Override: Volltext-Daten vorhanden
    mockFragensammlungState.fragen = [{ id: 'f1', fragetext: 'Aktionsplan' }]
    mockFragensammlungState.status = 'fertig'

    renderSuche()

    const btn = screen.getByRole('button', { name: /volltext/i })
    const input = screen.getByRole('searchbox')

    await act(async () => {
      fireEvent.click(btn)
      fireEvent.change(input, { target: { value: 'aktionsplan' } })
      // Wait for debounce (DEBOUNCE_MS = 300ms via vi fake timers not set,
      // but useMemo fires synchronously on re-render)
    })

    // Find a call where opts.volltext === true
    const volltextCall = sucheAusCalls.find(([, , opts]) => opts?.volltext === true)
    expect(volltextCall).toBeDefined()

    const indexArg = volltextCall![1]
    expect((indexArg as { fragenVoll?: unknown[] }).fragenVoll).toBeDefined()
    expect((indexArg as { fragenVoll?: unknown[] }).fragenVoll).toHaveLength(1)
  })
})
