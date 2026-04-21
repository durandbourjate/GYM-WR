import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ZoneLabel } from '@shared/ui/ZoneLabel'

describe('ZoneLabel', () => {
  it('korrekt: einzeilig mit susAntwort', () => {
    render(<ZoneLabel variant="korrekt" susAntwort="Eigenkapital" />)
    expect(screen.getByText('Eigenkapital')).toBeInTheDocument()
  })
  it('falsch: zweizeilig mit korrekter + SuS-Antwort', () => {
    render(<ZoneLabel variant="falsch" susAntwort="Aktiva" korrekteAntwort="Eigenkapital" />)
    expect(screen.getByText('Eigenkapital')).toBeInTheDocument()
    expect(screen.getByText('Aktiva')).toBeInTheDocument()
  })
  it('falsch + leer: zeigt placeholder statt leerer Antwort', () => {
    render(<ZoneLabel variant="falsch" korrekteAntwort="X" placeholder="leer gelassen" />)
    expect(screen.getByText('leer gelassen')).toBeInTheDocument()
    expect(screen.getByText('X')).toBeInTheDocument()
  })
  it('neutral: kein spezielles Styling', () => {
    const { container } = render(<ZoneLabel variant="neutral" susAntwort="Text" />)
    expect(container.querySelector('.border-green-600')).not.toBeInTheDocument()
    expect(container.querySelector('.border-red-600')).not.toBeInTheDocument()
  })
})
