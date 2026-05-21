import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

// --- Mocks (müssen VOR dem Komponenten-Import stehen) -----------------------

// ueben/authStore: SuS eingeloggt
vi.mock('../../../store/ueben/authStore', () => ({
  useUebenAuthStore: () => ({ user: { name: 'Test SuS', email: 'sus@test.ch' } }),
}))

// ueben/gruppenStore: aktive Gruppe (ID nötig für ladeLernziele-useEffect)
vi.mock('../../../store/ueben/gruppenStore', () => ({
  useUebenGruppenStore: () => ({ aktiveGruppe: { id: 'g1', name: 'Testgruppe' } }),
}))

// ueben/uebungsStore: keine laufende Session, mit starteLernzielSession-Mock
const starteLernzielSessionMock = vi.fn().mockResolvedValue(undefined)
vi.mock('../../../store/ueben/uebungsStore', () => ({
  useUebenUebungsStore: {
    setState: vi.fn(),
    getState: () => ({ starteLernzielSession: starteLernzielSessionMock }),
  },
}))

// fortschrittStore: 1 Lernziel → LernzieleAkkordeon zeigt "Alle Lernziele"
const ladeLernzieleMock = vi.fn()
vi.mock('../../../store/ueben/fortschrittStore', () => ({
  useUebenFortschrittStore: () => ({
    lernziele: [
      {
        id: 'lz1',
        fach: 'BWL',
        thema: 'Grundlagen',
        text: 'Test-Lernziel',
        bloom: 'K2',
        aktiv: true,
      },
    ],
    fortschritte: {},
    ladeLernziele: ladeLernzieleMock,
  }),
}))

// useSuSNavigation: stub-Callbacks
const openUebungMock = vi.fn()
vi.mock('../../../hooks/ueben/useSuSNavigation', () => ({
  useSuSNavigation: () => ({
    openDashboard: vi.fn(),
    back: vi.fn(),
    openUebung: openUebungMock,
  }),
}))

// SuSAppHeaderContainer: stub — der eigentliche Container hängt an vielen Stores.
// Wir ersetzen ihn durch eine Minimal-Implementierung, die onHilfe und onLernziele
// als testbare Buttons nach aussen trägt, damit AppShell korrekt verdrahtet werden kann.
vi.mock('../../sus/SuSAppHeaderContainer', () => ({
  SuSAppHeaderContainer: ({ onHilfe, onLernziele }: { onHilfe?: () => void; onLernziele?: () => void }) => (
    <header>
      <span>ExamLab</span>
      {onHilfe && (
        <button type="button" aria-label="Hilfe" onClick={onHilfe}>
          Hilfe
        </button>
      )}
      {onLernziele && (
        <button type="button" aria-label="Lernziele" onClick={onLernziele}>
          Lernziele
        </button>
      )}
    </header>
  ),
}))

// LernzieleAkkordeon: Stub — rendert die testbare Überschrift + einen Üben-Button
// der onLernzielUeben mit einem Test-Lernziel aufruft
const TEST_LERNZIEL = {
  id: 'lz1',
  fach: 'BWL',
  thema: 'Grundlagen',
  text: 'Test-Lernziel',
  bloom: 'K2',
  aktiv: true,
}
vi.mock('../LernzieleAkkordeon', () => ({
  default: ({
    onSchliessen,
    onLernzielUeben,
  }: {
    lernziele: unknown[]
    fortschritte: unknown
    onSchliessen: () => void
    onThemaUeben: (t: string) => void
    onLernzielUeben?: (lz: typeof TEST_LERNZIEL) => void
  }) => (
    <div>
      <h2>Alle Lernziele</h2>
      <button type="button" aria-label="Schliessen" onClick={onSchliessen}>X</button>
      {onLernzielUeben && (
        <button
          type="button"
          aria-label="Lernziel üben"
          onClick={() => onLernzielUeben(TEST_LERNZIEL)}
        >
          Üben
        </button>
      )}
    </div>
  ),
}))

// SuSHilfePanel: Stub
vi.mock('../SuSHilfePanel', () => ({
  default: ({ onSchliessen }: { onSchliessen: () => void }) => (
    <div data-testid="hilfe-panel">
      <button onClick={onSchliessen}>Schliessen</button>
    </div>
  ),
}))

import AppShell from './AppShell'

// ---------------------------------------------------------------------------

function mockMatchMedia() {
  window.matchMedia = vi.fn().mockImplementation((q: string) => ({
    matches: q === '(min-width: 900px)',
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    media: q,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
}

describe('AppShell — Lernziele-Button', () => {
  beforeEach(() => {
    mockMatchMedia()
    ladeLernzieleMock.mockReset()
    starteLernzielSessionMock.mockReset().mockResolvedValue(undefined)
    openUebungMock.mockReset()
  })

  it('zeigt einen Lernziele-Button im Header wenn SuS eingeloggt ist', () => {
    render(
      <MemoryRouter initialEntries={['/sus/ueben']}>
        <AppShell>
          <div data-testid="kinder-inhalt">Kinder</div>
        </AppShell>
      </MemoryRouter>,
    )

    const btn = screen.getByRole('button', { name: 'Lernziele' })
    expect(btn).toBeInTheDocument()
  })

  it('öffnet das LernzieleAkkordeon nach Klick auf den Lernziele-Button', () => {
    render(
      <MemoryRouter initialEntries={['/sus/ueben']}>
        <AppShell>
          <div>Kinder</div>
        </AppShell>
      </MemoryRouter>,
    )

    // Akkordeon ist zunächst nicht sichtbar
    expect(screen.queryByText('Alle Lernziele')).not.toBeInTheDocument()

    // Klick auf den Button
    fireEvent.click(screen.getByRole('button', { name: 'Lernziele' }))

    // Akkordeon erscheint
    expect(screen.getByText('Alle Lernziele')).toBeInTheDocument()
  })

  it('schliesst das Hilfe-Panel wenn Lernziele-Button geklickt wird (gegenseitiger Ausschluss)', () => {
    render(
      <MemoryRouter initialEntries={['/sus/ueben']}>
        <AppShell>
          <div>Kinder</div>
        </AppShell>
      </MemoryRouter>,
    )

    // Erst Hilfe-Panel öffnen, damit der gegenseitige Ausschluss prüfbar wird
    fireEvent.click(screen.getByRole('button', { name: 'Hilfe' }))
    expect(screen.getByTestId('hilfe-panel')).toBeInTheDocument()

    // Jetzt Lernziele öffnen — AppShell setzt hilfeOffen=false, lernzieleOffen=true
    fireEvent.click(screen.getByRole('button', { name: 'Lernziele' }))

    expect(screen.getByText('Alle Lernziele')).toBeInTheDocument()
    expect(screen.queryByTestId('hilfe-panel')).not.toBeInTheDocument()
  })

  it('onLernzielUeben: ruft starteLernzielSession auf und schliesst das Akkordeon', async () => {
    render(
      <MemoryRouter initialEntries={['/sus/ueben']}>
        <AppShell>
          <div>Kinder</div>
        </AppShell>
      </MemoryRouter>,
    )

    // Akkordeon öffnen
    fireEvent.click(screen.getByRole('button', { name: 'Lernziele' }))
    expect(screen.getByText('Alle Lernziele')).toBeInTheDocument()

    // Üben-Button im Stub klicken → ruft onLernzielUeben(TEST_LERNZIEL) auf
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Lernziel üben' }))
    })

    // (a) starteLernzielSession wurde mit dem Test-Lernziel aufgerufen
    expect(starteLernzielSessionMock).toHaveBeenCalledTimes(1)
    expect(starteLernzielSessionMock).toHaveBeenCalledWith(TEST_LERNZIEL)

    // (b) openUebung wurde mit dem thema des Lernziels aufgerufen
    expect(openUebungMock).toHaveBeenCalledWith(TEST_LERNZIEL.thema)

    // (c) Akkordeon wurde geschlossen (lernzieleOffen → false)
    expect(screen.queryByText('Alle Lernziele')).not.toBeInTheDocument()
  })
})
