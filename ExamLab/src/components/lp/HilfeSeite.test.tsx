import { describe, it, expect, vi } from 'vitest'
import { render, screen, within, fireEvent } from '@testing-library/react'
import HilfeSeite from './HilfeSeite'

// useFocusTrap-Hook braucht DOM-Setup, hier nicht relevant
vi.mock('../../hooks/useFocusTrap.ts', () => ({ useFocusTrap: () => {} }))

// ResizableSidebar wrappt Inhalt - für Tests transparent
vi.mock('@shared/ui/ResizableSidebar', () => ({
  ResizableSidebar: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

describe('HilfeSeite', () => {
  // Nav-Container wird im Refactor mit data-testid="hilfe-nav" markiert
  // → robust gegen Schliessen-Button + zukünftige Header-Buttons
  const navButtons = (): HTMLElement[] =>
    within(screen.getByTestId('hilfe-nav')).getAllByRole('button')

  it('rendert Tab-Buttons in Workflow-Order aus Tab-Registry', () => {
    render(<HilfeSeite onSchliessen={() => {}} />)
    const labels = navButtons().map(b => b.textContent?.trim() ?? '')
    expect(labels).toEqual([
      'Erste Schritte',
      'Fragen & Fragensammlung',
      'Prüfung erstellen',
      'Durchführung',
      'Korrektur & Feedback',
      'Üben',
      'KI-Assistent',
      'Bloom-Taxonomie',
      'Zusammenarbeit',
      'FAQ',
    ])
  })

  it('Default-Tab beim Mount ist "Erste Schritte" (aria-pressed=true)', () => {
    render(<HilfeSeite onSchliessen={() => {}} />)
    const aktivButton = screen.getByRole('button', { name: 'Erste Schritte' })
    expect(aktivButton).toHaveAttribute('aria-pressed', 'true')
  })

  it('Klick auf Tab-Button wechselt aria-pressed-State', () => {
    render(<HilfeSeite onSchliessen={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: 'Prüfung erstellen' }))
    expect(screen.getByRole('button', { name: 'Prüfung erstellen' }))
      .toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Erste Schritte' }))
      .toHaveAttribute('aria-pressed', 'false')
  })
})
