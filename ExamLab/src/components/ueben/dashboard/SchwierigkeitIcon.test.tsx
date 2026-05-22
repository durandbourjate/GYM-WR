// ExamLab/src/components/ueben/dashboard/SchwierigkeitIcon.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SchwierigkeitIcon } from './SchwierigkeitIcon'

describe('SchwierigkeitIcon', () => {
  it('rendert SignalLow (aria-label "Einfach") für stufe 1', () => {
    render(<SchwierigkeitIcon stufe={1} />)
    const icon = screen.getByLabelText('Einfach')
    expect(icon).toBeInTheDocument()
  })

  it('rendert SignalMedium (aria-label "Mittel") für stufe 2', () => {
    render(<SchwierigkeitIcon stufe={2} />)
    const icon = screen.getByLabelText('Mittel')
    expect(icon).toBeInTheDocument()
  })

  it('rendert SignalHigh (aria-label "Schwer") für stufe 3', () => {
    render(<SchwierigkeitIcon stufe={3} />)
    const icon = screen.getByLabelText('Schwer')
    expect(icon).toBeInTheDocument()
  })

  it('fällt bei ungültigem stufe auf den Mittel-Icon zurück', () => {
    render(<SchwierigkeitIcon stufe={99} />)
    const icon = screen.getByLabelText('Mittel')
    expect(icon).toBeInTheDocument()
  })

  it('akzeptiert optionale className', () => {
    render(<SchwierigkeitIcon stufe={1} className="w-5 h-5" />)
    const icon = screen.getByLabelText('Einfach')
    expect(icon).toHaveClass('w-5', 'h-5')
  })
})
