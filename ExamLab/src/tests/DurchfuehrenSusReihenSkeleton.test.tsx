import { describe, it, expect, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import DurchfuehrenSusReihenSkeleton from '../components/lp/skeletons/DurchfuehrenSusReihenSkeleton'

describe('DurchfuehrenSusReihenSkeleton', () => {
  beforeEach(() => localStorage.clear())

  it('rendert 8 Reihen als Default ohne localStorage', () => {
    const { container } = render(<DurchfuehrenSusReihenSkeleton pruefungId="abc" />)
    expect(container.querySelectorAll('[data-testid="sus-reihe-skeleton"]').length).toBe(8)
  })

  it('rendert gespeicherte Anzahl 22 für pruefungId="abc"', () => {
    localStorage.setItem('examlab-lp-letzte-sus-anzahl-abc', '22')
    const { container } = render(<DurchfuehrenSusReihenSkeleton pruefungId="abc" />)
    expect(container.querySelectorAll('[data-testid="sus-reihe-skeleton"]').length).toBe(22)
  })

  it('clamped Anzahl 100 auf 60 (Cap)', () => {
    localStorage.setItem('examlab-lp-letzte-sus-anzahl-abc', '100')
    const { container } = render(<DurchfuehrenSusReihenSkeleton pruefungId="abc" />)
    expect(container.querySelectorAll('[data-testid="sus-reihe-skeleton"]').length).toBe(60)
  })

  it('hebt Anzahl 2 auf Min 5 (visuelle Konsistenz)', () => {
    localStorage.setItem('examlab-lp-letzte-sus-anzahl-abc', '2')
    const { container } = render(<DurchfuehrenSusReihenSkeleton pruefungId="abc" />)
    expect(container.querySelectorAll('[data-testid="sus-reihe-skeleton"]').length).toBe(5)
  })

  it('rendert 8 Reihen und liest kein localStorage wenn pruefungId=null', () => {
    localStorage.setItem('examlab-lp-letzte-sus-anzahl-abc', '22')
    const { container } = render(<DurchfuehrenSusReihenSkeleton pruefungId={null} />)
    expect(container.querySelectorAll('[data-testid="sus-reihe-skeleton"]').length).toBe(8)
  })

  it('hat animate-pulse Elemente', () => {
    const { container } = render(<DurchfuehrenSusReihenSkeleton pruefungId="abc" />)
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0)
  })
})
