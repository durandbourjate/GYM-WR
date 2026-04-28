import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

/**
 * Bundle H Phase 11 (S157, 2026-04-28): Schülercode-Login UI ausgeblendet.
 * Diese Tests verifizieren, dass die Code-Eingabe-UI im Pruefungs-LoginScreen
 * NICHT mehr im DOM erscheint (Demo-Modus + Google-Login bleiben sichtbar).
 *
 * Die Store-Methode `anmeldenMitCode` bleibt erhalten — siehe
 * `authStoreLoginPrefetch.test.ts:242` für die Direkt-Tests der Methode.
 */

// Mock authService BEVOR LoginScreen importiert wird (CLIENT_ID kontrollieren)
vi.mock('../services/authService', () => ({
  CLIENT_ID: 'fake-client-id-for-test',
  initializeGoogleAuth: vi.fn(),
  renderGoogleButton: vi.fn(),
}))

vi.mock('../store/authStore', () => ({
  useAuthStore: (selector: (s: {
    user: null
    anmelden: () => void
    demoStarten: () => void
    fehler: null
    setFehler: () => void
    ladeStatus: 'idle'
  }) => unknown) =>
    selector({
      user: null,
      anmelden: vi.fn(),
      demoStarten: vi.fn(),
      fehler: null,
      setFehler: vi.fn(),
      ladeStatus: 'idle',
    }),
}))

vi.mock('../store/schulConfigStore', () => ({
  useSchulConfig: () => ({
    config: {
      schulName: 'Gymnasium Hofwil',
      schulKuerzel: 'GH',
      susDomain: 'stud.gymhofwil.ch',
      lpDomain: 'gymhofwil.ch',
    },
  }),
}))

vi.mock('../store/themeStore', () => ({
  useThemeStore: (selector: (s: { mode: 'light'; toggleMode: () => void }) => unknown) =>
    selector({ mode: 'light', toggleMode: vi.fn() }),
}))

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

async function ladeKomponente() {
  const Modul = await import('../components/LoginScreen')
  return Modul.default
}

describe('LoginScreen — Schülercode-UI ausgeblendet (Bundle H Phase 11)', () => {
  it('rendert KEINE 4-stellige Schüler-ID-Eingabe (placeholder "1234")', async () => {
    const LoginScreen = await ladeKomponente()
    render(
      <MemoryRouter>
        <LoginScreen />
      </MemoryRouter>,
    )
    expect(screen.queryByPlaceholderText('1234')).not.toBeInTheDocument()
  })

  it('rendert KEINEN Hinweis "4-stellig"', async () => {
    const LoginScreen = await ladeKomponente()
    render(
      <MemoryRouter>
        <LoginScreen />
      </MemoryRouter>,
    )
    expect(screen.queryByText(/4-stellig/i)).not.toBeInTheDocument()
  })

  it('rendert KEINEN "Schüler-ID"-Begriff', async () => {
    const LoginScreen = await ladeKomponente()
    render(
      <MemoryRouter>
        <LoginScreen />
      </MemoryRouter>,
    )
    expect(screen.queryByText(/Schüler-ID/i)).not.toBeInTheDocument()
  })

  it('rendert KEINEN "Anmeldung mit Schüler-ID"-Toggle-Button', async () => {
    const LoginScreen = await ladeKomponente()
    render(
      <MemoryRouter>
        <LoginScreen />
      </MemoryRouter>,
    )
    expect(screen.queryByText(/Anmeldung mit Schüler-ID/i)).not.toBeInTheDocument()
  })

  it('Demo-Buttons sind weiterhin sichtbar (Als Schüler/in + Als Lehrperson)', async () => {
    const LoginScreen = await ladeKomponente()
    render(
      <MemoryRouter>
        <LoginScreen />
      </MemoryRouter>,
    )
    expect(screen.getByText(/Als Schüler/i)).toBeInTheDocument()
    expect(screen.getByText(/Als Lehrperson/i)).toBeInTheDocument()
  })
})
