import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import FragenListeSkeleton from '../components/lp/skeletons/FragenListeSkeleton'

describe('FragenListeSkeleton', () => {
  it('rendert 8 Karten-Skeletons', () => {
    const { container } = render(<FragenListeSkeleton />)
    const karten = container.querySelectorAll('[data-testid="fragen-liste-skeleton-karte"]')
    expect(karten.length).toBe(8)
  })

  it('hat animate-pulse Elemente', () => {
    const { container } = render(<FragenListeSkeleton />)
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0)
  })
})
