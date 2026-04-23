import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

// --- Store-Mocks (MÜSSEN vor dem Import der Komponente stehen) ---
vi.mock('../../store/authStore', () => ({
  useAuthStore: (selector: any) => selector({ abmelden: vi.fn(), user: { name: 'Test SuS' } }),
}))
vi.mock('../../store/themeStore', () => ({
  useThemeStore: (selector: any) => selector({ mode: 'light', toggleMode: vi.fn() }),
}))
vi.mock('../../store/fragenbankStore', () => ({
  useFragenbankStore: (selector: any) => selector({ summaries: [] }),
}))

import { SuSAppHeaderContainer } from './SuSAppHeaderContainer'

function mockMatchMedia() {
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
}

describe('SuSAppHeaderContainer', () => {
  beforeEach(() => {
    mockMatchMedia()
  })

  it('rendert AppHeader mit SuS-Rolle (Smoke)', () => {
    render(
      <MemoryRouter>
        <SuSAppHeaderContainer onHilfe={vi.fn()} />
      </MemoryRouter>,
    )
    expect(screen.getByText('ExamLab')).toBeInTheDocument()
    expect(screen.getByRole('searchbox')).toBeInTheDocument()
  })
})
