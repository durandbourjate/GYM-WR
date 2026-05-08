import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ZeitzuschlagInline } from './ZeitzuschlagInline'

describe('ZeitzuschlagInline', () => {
  const baseProps = {
    email: 'sus@test',
    basisEndeMs: 1_000_000_000,
    jetzt: 999_000_000,
    istAktiv: true,
  }

  it('kein-Zuschlag: rendert +5 Button', () => {
    const onAendern = vi.fn()
    render(<ZeitzuschlagInline {...baseProps} zuschlagMin={0} onAendern={onAendern} />)
    const btn = screen.getByRole('button', { name: '+5' })
    fireEvent.click(btn)
    expect(onAendern).toHaveBeenCalledWith('sus@test', 5)
  })

  it('Zuschlag gesetzt: Klick auf Hauptbutton öffnet Editor', () => {
    const onAendern = vi.fn()
    render(<ZeitzuschlagInline {...baseProps} zuschlagMin={10} onAendern={onAendern} />)
    const btn = screen.getByTitle(/\+10 Min\. Zeitzuschlag/)
    fireEvent.click(btn)
    expect(screen.getByDisplayValue(10)).toBeInTheDocument()
  })

  it('Editor: Enter speichert Wert', () => {
    const onAendern = vi.fn()
    render(<ZeitzuschlagInline {...baseProps} zuschlagMin={10} onAendern={onAendern} />)
    fireEvent.click(screen.getByTitle(/\+10 Min/))
    const input = screen.getByDisplayValue(10) as HTMLInputElement
    fireEvent.change(input, { target: { value: '20' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onAendern).toHaveBeenCalledWith('sus@test', 20)
  })

  it('Editor: Escape verwirft Eingabe ohne Save', () => {
    const onAendern = vi.fn()
    render(<ZeitzuschlagInline {...baseProps} zuschlagMin={10} onAendern={onAendern} />)
    fireEvent.click(screen.getByTitle(/\+10 Min/))
    const input = screen.getByDisplayValue(10) as HTMLInputElement
    fireEvent.change(input, { target: { value: '99' } })
    fireEvent.keyDown(input, { key: 'Escape' })
    expect(onAendern).not.toHaveBeenCalled()
  })

  it('Overtime: Countdown rendert mit Restzeit + Kicker-+5', () => {
    const onAendern = vi.fn()
    // jetzt > basisEndeMs, aber < basisEndeMs + zuschlag*60s → Overtime aktiv
    render(
      <ZeitzuschlagInline
        {...baseProps}
        jetzt={baseProps.basisEndeMs + 60_000}  // 1 Min nach Basis-Ende
        zuschlagMin={5}
        onAendern={onAendern}
      />,
    )
    // Restzeit ~ 4:00 (5 Min Zuschlag - 1 Min vergangen)
    expect(screen.getByText(/4:00/)).toBeInTheDocument()
    // Kicker-+5 vorhanden
    const plus5 = screen.getAllByRole('button').find(b => b.textContent === '+5')
    expect(plus5).toBeDefined()
    fireEvent.click(plus5!)
    expect(onAendern).toHaveBeenCalledWith('sus@test', 10)
  })
})
