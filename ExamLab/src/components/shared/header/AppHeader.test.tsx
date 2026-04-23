import { render, screen } from '@testing-library/react'
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
