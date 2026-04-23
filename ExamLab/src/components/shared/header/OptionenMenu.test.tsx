import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { OptionenMenu } from './OptionenMenu'

describe('OptionenMenu', () => {
  const baseProps = {
    benutzerName: 'Y. Durand',
    onHilfe: vi.fn(),
    onFeedback: vi.fn(),
    onAbmelden: vi.fn(),
    onThemeToggle: vi.fn(),
    theme: 'light' as const,
  }

  it('öffnet bei Klick auf Trigger und zeigt Benutzer', () => {
    render(<OptionenMenu rolle="lp" {...baseProps} />)
    fireEvent.click(screen.getByRole('button', { name: /menü/i }))
    expect(screen.getByText('Y. Durand')).toBeInTheDocument()
    expect(screen.getByText('LP')).toBeInTheDocument()
  })

  it('LP: zeigt Einstellungen, SuS: zeigt es nicht', () => {
    const onEinstellungen = vi.fn()
    const { rerender } = render(<OptionenMenu rolle="lp" {...baseProps} onEinstellungen={onEinstellungen} />)
    fireEvent.click(screen.getByRole('button', { name: /menü/i }))
    expect(screen.getByText('Einstellungen')).toBeInTheDocument()

    rerender(<OptionenMenu rolle="sus" {...baseProps} onEinstellungen={onEinstellungen} />)
    expect(screen.queryByText('Einstellungen')).not.toBeInTheDocument()
  })

  it('zeigt "Problem melden" für beide Rollen (einheitliche Benennung)', () => {
    const { rerender } = render(<OptionenMenu rolle="lp" {...baseProps} />)
    fireEvent.click(screen.getByRole('button', { name: /menü/i }))
    expect(screen.getByText('Problem melden')).toBeInTheDocument()

    rerender(<OptionenMenu rolle="sus" {...baseProps} />)
    expect(screen.getByText('Problem melden')).toBeInTheDocument()
  })

  it('Abmelden-Klick ruft onAbmelden', () => {
    render(<OptionenMenu rolle="lp" {...baseProps} />)
    fireEvent.click(screen.getByRole('button', { name: /menü/i }))
    fireEvent.click(screen.getByText('Abmelden'))
    expect(baseProps.onAbmelden).toHaveBeenCalled()
  })

  it('schliesst bei Outside-Click', () => {
    render(<div><OptionenMenu rolle="lp" {...baseProps} /><div data-testid="outside">x</div></div>)
    fireEvent.click(screen.getByRole('button', { name: /menü/i }))
    expect(screen.getByRole('menu')).toBeInTheDocument()
    fireEvent.mouseDown(screen.getByTestId('outside'))
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })
})
