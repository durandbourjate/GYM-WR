import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

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
