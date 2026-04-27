import { describe, it, expect, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import LPUebungenSkeleton from '../components/lp/skeletons/LPUebungenSkeleton'

describe('LPUebungenSkeleton', () => {
  beforeEach(() => localStorage.clear())

  it('rendert 4 Cards als Default', () => {
    const { container } = render(<LPUebungenSkeleton />)
    expect(container.querySelectorAll('[data-testid="lp-ueb-skeleton"]').length).toBe(4)
  })

  it('rendert gespeicherte Anzahl 5', () => {
    localStorage.setItem('examlab-lp-letzte-formative-anzahl', '5')
    const { container } = render(<LPUebungenSkeleton />)
    expect(container.querySelectorAll('[data-testid="lp-ueb-skeleton"]').length).toBe(5)
  })
})
