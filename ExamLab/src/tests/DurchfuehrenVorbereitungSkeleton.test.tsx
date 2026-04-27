import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import DurchfuehrenVorbereitungSkeleton from '../components/lp/skeletons/DurchfuehrenVorbereitungSkeleton'

describe('DurchfuehrenVorbereitungSkeleton', () => {
  it('rendert 2 Settings-Karten und 1 Teilnehmer-Container', () => {
    const { container } = render(<DurchfuehrenVorbereitungSkeleton />)
    expect(container.querySelectorAll('[data-testid="vorbereitung-settings-card"]').length).toBe(2)
    expect(container.querySelector('[data-testid="vorbereitung-teilnehmer-container"]')).toBeTruthy()
  })

  it('hat animate-pulse Elemente', () => {
    const { container } = render(<DurchfuehrenVorbereitungSkeleton />)
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0)
  })
})
