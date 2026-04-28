import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeAll } from 'vitest'

/**
 * Bundle H Phase 11 (S157, 2026-04-28): Schülercode-Login UI ausgeblendet.
 * Diese Tests verifizieren, dass die Code-Eingabe-UI im
 * Standalone-Üben-LoginScreen NICHT mehr im DOM erscheint
 * (Demo-Links + Google-Button bleiben sichtbar).
 *
 * Die Store-Methode `anmeldenMitCode` bleibt erhalten — Code für mögliche
 * Re-Aktivierung (siehe Reminder-Plan-Task 12, Trigger 2026-06-09).
 */

vi.mock('../services/ueben/authService', () => ({
  initializeLernenGoogleAuth: vi.fn(),
  renderLernenGoogleButton: vi.fn(),
}))

vi.mock('../store/ueben/authStore', () => ({
  useUebenAuthStore: () => ({
    anmeldenMitGoogle: vi.fn(),
    anmeldenMitCode: vi.fn(),
    ladeStatus: 'idle' as const,
    fehler: null,
  }),
}))

vi.mock('../hooks/ueben/useTheme', () => ({
  useUebenTheme: () => ({
    istDark: false,
    toggleTheme: vi.fn(),
  }),
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
  const Modul = await import('../components/ueben/LoginScreen')
  return Modul.default
}

describe('Standalone-Üben LoginScreen — Schülercode-UI ausgeblendet (Bundle H Phase 11)', () => {
  it('rendert KEIN Code-Eingabefeld (placeholder "Code eingeben")', async () => {
    const LoginScreen = await ladeKomponente()
    render(<LoginScreen />)
    expect(screen.queryByPlaceholderText(/Code eingeben/i)).not.toBeInTheDocument()
  })

  it('rendert KEINEN "Mit Code anmelden"-Toggle-Button', async () => {
    const LoginScreen = await ladeKomponente()
    render(<LoginScreen />)
    expect(screen.queryByText(/Mit Code anmelden/i)).not.toBeInTheDocument()
  })

  it('rendert KEINEN "Zurück zu Google-Login"-Button', async () => {
    const LoginScreen = await ladeKomponente()
    render(<LoginScreen />)
    expect(screen.queryByText(/Zurück zu Google-Login/i)).not.toBeInTheDocument()
  })

  it('Demo-Links sind weiterhin sichtbar (Als Kind + Als Elternteil)', async () => {
    const LoginScreen = await ladeKomponente()
    render(<LoginScreen />)
    expect(screen.getByText(/Als Kind/i)).toBeInTheDocument()
    expect(screen.getByText(/Als Elternteil/i)).toBeInTheDocument()
  })
})
