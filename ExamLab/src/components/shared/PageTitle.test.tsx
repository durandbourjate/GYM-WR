import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PageTitle } from './PageTitle'
import { TYPO } from '../../styles/typografie'

describe('PageTitle', () => {
  it('rendert ein Heading-Element (Level 1) mit der titel-Prop als Text', () => {
    render(<PageTitle titel="Einstellungen" />)
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toHaveTextContent('Einstellungen')
  })

  it('applies TYPO.display classes to the heading', () => {
    render(<PageTitle titel="Hilfe" />)
    const heading = screen.getByRole('heading', { level: 1 })
    for (const cls of TYPO.display.split(' ')) {
      expect(heading.className).toContain(cls)
    }
  })

  it('rendert mit Border-Bottom für visuellen Abschluss', () => {
    const { container } = render(<PageTitle titel="Test" />)
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.className).toMatch(/border-b/)
  })
})
