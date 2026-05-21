import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { AppHeader } from './AppHeader'

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

describe('AppHeader', () => {
  const baseProps = {
    rolle: 'lp' as const,
    benutzerName: 'Y. Durand',
    theme: 'light' as const,
    onThemeToggle: vi.fn(),
    onHilfe: vi.fn(),
    feedbackContext: { rolle: 'lp' as const, ort: '/test' },
    onAbmelden: vi.fn(),
    onEinstellungen: vi.fn(),
    kaskadeConfig: { l1Tabs: [], aktivL1: null },
    suchen: '',
    onSuchen: vi.fn(),
    sucheErgebnis: { gruppen: [], istLadend: false },
  }

  it('rendert Brand + Version', () => {
    render(
      <MemoryRouter>
        <AppHeader {...baseProps} />
      </MemoryRouter>,
    )
    expect(screen.getByText('ExamLab')).toBeInTheDocument()
  })

  it('hat searchbox und menu-trigger', () => {
    render(
      <MemoryRouter>
        <AppHeader {...baseProps} />
      </MemoryRouter>,
    )
    expect(screen.getByRole('searchbox')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /menü/i })).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Lernziele-Button (SuS-Pfad)
// ---------------------------------------------------------------------------
// Diese Tests prüfen den ECHTEN AppHeader — nicht den SuSAppHeaderContainer-Stub.
// Damit wird sichergestellt, dass das Rendering-Gate `props.onLernziele &&` korrekt
// funktioniert: mit Prop → Button vorhanden; ohne Prop (LP-Pfad) → kein Button.
// ---------------------------------------------------------------------------

describe('AppHeader — Lernziele-Button', () => {
  // Minimale gültige Props ohne onLernziele (LP-Standardpfad)
  const basePropsLp = {
    rolle: 'lp' as const,
    benutzerName: 'LP',
    theme: 'light' as const,
    onThemeToggle: vi.fn(),
    onHilfe: vi.fn(),
    feedbackContext: { rolle: 'lp' as const, ort: '/test' },
    onAbmelden: vi.fn(),
    kaskadeConfig: { l1Tabs: [], aktivL1: null },
  }

  it('zeigt einen Lernziele-Button wenn onLernziele gesetzt ist (SuS-Pfad)', () => {
    const onLernziele = vi.fn()
    render(
      <MemoryRouter>
        <AppHeader {...basePropsLp} rolle="sus" onLernziele={onLernziele} />
      </MemoryRouter>,
    )

    const btn = screen.getByRole('button', { name: 'Lernziele' })
    expect(btn).toBeInTheDocument()
  })

  it('ruft onLernziele auf bei Klick auf den Button', () => {
    const onLernziele = vi.fn()
    render(
      <MemoryRouter>
        <AppHeader {...basePropsLp} rolle="sus" onLernziele={onLernziele} />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Lernziele' }))
    expect(onLernziele).toHaveBeenCalledTimes(1)
  })

  it('zeigt KEINEN Lernziele-Button wenn onLernziele nicht gesetzt ist (LP-Pfad)', () => {
    // basePropsLp enthält kein onLernziele — das ist der LP-Standardfall.
    render(
      <MemoryRouter>
        <AppHeader {...basePropsLp} />
      </MemoryRouter>,
    )

    expect(screen.queryByRole('button', { name: 'Lernziele' })).not.toBeInTheDocument()
  })
})
