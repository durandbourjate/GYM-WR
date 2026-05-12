import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import TestBadge from './TestBadge'

describe('TestBadge', () => {
  it('rendert Pill mit Label „Test"', () => {
    render(<TestBadge />)
    const pill = screen.getByText('Test')
    expect(pill).toBeInTheDocument()
    expect(pill.tagName).toBe('SPAN')
  })

  it('appliziert Brand-Yellow-Farben mit dark-mode-Varianten', () => {
    render(<TestBadge />)
    const pill = screen.getByText('Test')
    expect(pill.className).toMatch(/bg-yellow-100/)
    expect(pill.className).toMatch(/dark:bg-yellow-900/)
    expect(pill.className).toMatch(/text-yellow-700/)
    expect(pill.className).toMatch(/dark:text-yellow-200/)
  })

  it('mergt zusätzliche className-Props', () => {
    render(<TestBadge className="ml-2" />)
    expect(screen.getByText('Test').className).toMatch(/ml-2/)
  })
})
