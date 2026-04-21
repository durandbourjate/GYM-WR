import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AntwortZeile } from '@shared/ui/AntwortZeile'

describe('AntwortZeile', () => {
  it('rendert ja-Marker als grünes ✓', () => {
    const { container } = render(<AntwortZeile marker="ja" variant="korrekt" label="Option A" />)
    expect(screen.getByText('✓')).toBeInTheDocument()
    expect(container.querySelector('.marker-ja')).toBeInTheDocument()
  })
  it('rendert nein-Marker als rotes ✗', () => {
    render(<AntwortZeile marker="nein" variant="falsch" label="Option A" />)
    expect(screen.getByText('✗')).toBeInTheDocument()
  })
  it('leer-Marker rendert keinen Marker-Text aber nimmt Platz ein', () => {
    const { container } = render(<AntwortZeile marker="leer" variant="neutral" label="L" />)
    expect(screen.queryByText('✓')).not.toBeInTheDocument()
    expect(screen.queryByText('✗')).not.toBeInTheDocument()
    expect(container.querySelector('.marker-leer')).toBeInTheDocument()
  })
  it('zeigt KI-Erklärung wenn vorhanden', () => {
    render(<AntwortZeile marker="ja" variant="korrekt" label="L" erklaerung="Weil X" />)
    expect(screen.getByText(/Weil X/)).toBeInTheDocument()
  })
  it('rendert Zusatz-Slot (z.B. korrekte Alternative)', () => {
    render(<AntwortZeile marker="nein" variant="falsch" label="L" zusatz={<span>→ Korrekt: Y</span>} />)
    expect(screen.getByText(/Korrekt: Y/)).toBeInTheDocument()
  })
})
