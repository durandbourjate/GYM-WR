import { describe, it, expect, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import LPCardsSkeleton from '../components/lp/skeletons/LPCardsSkeleton'

describe('LPCardsSkeleton', () => {
  beforeEach(() => localStorage.clear())

  it('rendert 6 Cards als Default ohne localStorage', () => {
    const { container } = render(<LPCardsSkeleton />)
    const cards = container.querySelectorAll('[data-testid="lp-card-skeleton"]')
    expect(cards.length).toBe(6)
  })

  it('rendert gespeicherte Anzahl 8', () => {
    localStorage.setItem('examlab-lp-letzte-summative-anzahl', '8')
    const { container } = render(<LPCardsSkeleton />)
    expect(container.querySelectorAll('[data-testid="lp-card-skeleton"]').length).toBe(8)
  })

  it('clamped Anzahl 99 auf 12 (Max)', () => {
    localStorage.setItem('examlab-lp-letzte-summative-anzahl', '99')
    const { container } = render(<LPCardsSkeleton />)
    expect(container.querySelectorAll('[data-testid="lp-card-skeleton"]').length).toBe(12)
  })

  it('hat animate-pulse-Klasse', () => {
    const { container } = render(<LPCardsSkeleton />)
    expect(container.querySelector('.animate-pulse')).toBeTruthy()
  })
})
