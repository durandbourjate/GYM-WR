import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { IconAbc, IconAB, IconAn, IconTKonto } from './CustomIcons'

describe('CustomIcons', () => {
  it('IconAbc rendert SVG mit viewBox 0 0 24 24 und strokeWidth=2', () => {
    const { container } = render(<IconAbc />)
    const svg = container.querySelector('svg')
    expect(svg).toBeTruthy()
    expect(svg?.getAttribute('viewBox')).toBe('0 0 24 24')
    expect(svg?.getAttribute('stroke-width')).toBe('2')
    expect(svg?.querySelector('text')?.textContent).toBe('abc')
  })

  it('IconAB rendert "a" und "b" Text-Elemente', () => {
    const { container } = render(<IconAB />)
    const texts = container.querySelectorAll('text')
    expect(Array.from(texts).map(t => t.textContent)).toEqual(['a', 'b'])
  })

  it('IconAn rendert "an" zentriert', () => {
    const { container } = render(<IconAn />)
    expect(container.querySelector('text')?.textContent).toBe('an')
  })

  it('IconTKonto rendert rect + zwei lines (Layout-Geometrie)', () => {
    const { container } = render(<IconTKonto />)
    expect(container.querySelector('rect')).toBeTruthy()
    expect(container.querySelectorAll('line').length).toBe(2)
  })

  it('alle CustomIcons reichen SVGProps durch (z.B. className)', () => {
    const { container } = render(<IconAbc className="custom-class" />)
    expect(container.querySelector('svg')?.getAttribute('class')).toBe('custom-class')
  })
})
