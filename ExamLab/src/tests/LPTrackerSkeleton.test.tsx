import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import LPTrackerSkeleton from '../components/lp/skeletons/LPTrackerSkeleton'

describe('LPTrackerSkeleton', () => {
  it('rendert Zusammenfassungs-Box + 2 Akkordeon-Sektionen', () => {
    const { container } = render(<LPTrackerSkeleton />)
    expect(container.querySelectorAll('[data-testid="lp-tracker-section"]').length).toBe(2)
    expect(container.querySelector('[data-testid="lp-tracker-summary"]')).toBeTruthy()
  })

  it('hat animate-pulse Elemente', () => {
    const { container } = render(<LPTrackerSkeleton />)
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0)
  })
})
