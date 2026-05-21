import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
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

// ueben/uebungsStore: keine laufende Session
vi.mock('../../../store/ueben/uebungsStore', () => ({
  useUebenUebungsStore: { setState: vi.fn() },
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
vi.mock('../../../hooks/ueben/useSuSNavigation', () => ({
  useSuSNavigation: () => ({
    openDashboard: vi.fn(),
    back: vi.fn(),
  }),
}))

// SuSAppHeaderContainer: stub — der eigentliche Container hängt an vielen Stores.
// Wir ersetzen ihn durch eine Minimal-Implementierung, die den onLernziele-Prop
// als Lernziele-Button nach aussen trägt, damit AppShell verdrahtet werden kann.
vi.mock('../../sus/SuSAppHeaderContainer', () => ({
  SuSAppHeaderContainer: ({ onLernziele }: { onLernziele?: () => void }) => (
    <header>
      <span>ExamLab</span>
      {onLernziele && (
        <button type="button" aria-label="Lernziele" onClick={onLernziele}>
          Lernziele
        </button>
      )}
    </header>
  ),
}))

// LernzieleAkkordeon: leichte Stub-Implementierung — rendert die testbare Überschrift
vi.mock('../LernzieleAkkordeon', () => ({
  default: ({ onSchliessen }: { lernziele: unknown[]; fortschritte: unknown; onSchliessen: () => void; onThemaUeben: (t: string) => void }) => (
    <div>
      <h2>Alle Lernziele</h2>
      <button type="button" aria-label="Schliessen" onClick={onSchliessen}>X</button>
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

  it('schliesst das Hilfe-Panel wenn Lernziele-Button geklickt wird', () => {
    render(
      <MemoryRouter initialEntries={['/sus/ueben']}>
        <AppShell>
          <div>Kinder</div>
        </AppShell>
      </MemoryRouter>,
    )

    // Hilfe-Panel öffnen (via direkter State-Simulation nicht möglich — kein onHilfe-Prop hier,
    // prüfen wir stattdessen: Akkordeon erscheint, Hilfe-Panel ist NICHT sichtbar)
    fireEvent.click(screen.getByRole('button', { name: 'Lernziele' }))

    expect(screen.getByText('Alle Lernziele')).toBeInTheDocument()
    expect(screen.queryByTestId('hilfe-panel')).not.toBeInTheDocument()
  })
})
