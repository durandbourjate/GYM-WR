import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

// --- Store-Mocks (MÜSSEN vor dem Import der Komponente stehen) ---
vi.mock('../../store/authStore', () => ({
  useAuthStore: (selector: (s: { abmelden: () => void; user: { name: string } }) => unknown) =>
    selector({ abmelden: vi.fn(), user: { name: 'Test LP' } }),
}))

vi.mock('../../store/themeStore', () => ({
  useThemeStore: (selector: (s: { mode: string; toggleMode: () => void }) => unknown) =>
    selector({ mode: 'light', toggleMode: vi.fn() }),
}))

vi.mock('../../store/fragenbankStore', () => ({
  useFragenbankStore: (selector: (s: { summaries: [] }) => unknown) =>
    selector({ summaries: [] }),
}))

import { LPAppHeaderContainer } from './LPAppHeaderContainer'

// matchMedia-Mock (identisch zu AppHeader.test.tsx)
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

describe('LPAppHeaderContainer', () => {
  it('rendert AppHeader (Smoke-Test)', () => {
    render(
      <MemoryRouter>
        <LPAppHeaderContainer onHilfe={vi.fn()} onEinstellungen={vi.fn()} />
      </MemoryRouter>,
    )
    expect(screen.getByText('ExamLab')).toBeInTheDocument()
    expect(screen.getByRole('searchbox')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /menü/i })).toBeInTheDocument()
  })
})
