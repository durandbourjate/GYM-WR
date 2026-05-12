import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { highlight } from './highlight'
import type { HighlightStelle } from '../types/suche'

describe('highlight', () => {
  it('kein Highlight ohne Stellen', () => {
    const { container } = render(<>{highlight('Bilanz', undefined, 'titel')}</>)
    expect(container.querySelector('mark')).toBeNull()
    expect(container.textContent).toBe('Bilanz')
  })

  it('eine Stelle wraps in <mark>', () => {
    const stellen: HighlightStelle[] = [{ start: 0, end: 6, feld: 'titel' }]
    const { container } = render(<>{highlight('Bilanz Analyse', stellen, 'titel')}</>)
    const mark = container.querySelector('mark')
    expect(mark?.textContent).toBe('Bilanz')
    expect(container.textContent).toBe('Bilanz Analyse')
  })

  it('mehrere Stellen', () => {
    const stellen: HighlightStelle[] = [
      { start: 0, end: 3, feld: 'titel' },
      { start: 8, end: 11, feld: 'titel' },
    ]
    const { container } = render(<>{highlight('foo bar foo', stellen, 'titel')}</>)
    expect(container.querySelectorAll('mark')).toHaveLength(2)
  })

  it('filtert nach Feld', () => {
    const stellen: HighlightStelle[] = [
      { start: 0, end: 3, feld: 'titel' },
      { start: 5, end: 8, feld: 'subTitel' },
    ]
    const { container } = render(<>{highlight('Bilanz Analyse', stellen, 'titel')}</>)
    expect(container.querySelectorAll('mark')).toHaveLength(1)
  })

  it('XSS-Schutz: User-Input wird escaped (kein <script>-Tag)', () => {
    const stellen: HighlightStelle[] = [{ start: 0, end: 7, feld: 'titel' }]
    const { container } = render(<>{highlight('<script>alert(1)</script>', stellen, 'titel')}</>)
    expect(container.querySelector('script')).toBeNull()
    expect(container.textContent).toContain('<script>')
  })
})
