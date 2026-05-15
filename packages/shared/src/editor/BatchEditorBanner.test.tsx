/**
 * Cluster D Phase 3a — Tests für BatchEditorBanner.
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import BatchEditorBanner from './BatchEditorBanner'

describe('BatchEditorBanner', () => {
  it('rendert count + sichtbar-Diff wenn sichtbareCount < count', () => {
    render(<BatchEditorBanner count={47} sichtbareCount={12} />)
    expect(screen.getByText(/Batch-Bearbeitung von 47 Fragen/)).toBeTruthy()
    expect(screen.getByText(/nur 12 im aktuellen Filter sichtbar/)).toBeTruthy()
  })

  it('zeigt keinen sichtbar-Hinweis wenn count === sichtbareCount', () => {
    render(<BatchEditorBanner count={5} sichtbareCount={5} />)
    expect(screen.getByText(/Batch-Bearbeitung von 5 Fragen/)).toBeTruthy()
    expect(screen.queryByText(/sichtbar/i)).toBeNull()
  })

  it('rendert den Hinweis-Text auf nicht-batch-änderbare Felder', () => {
    render(<BatchEditorBanner count={3} sichtbareCount={3} />)
    // Banner enthält Hinweis auf "violetten Rand" (Erklärung welche Felder editierbar sind)
    expect(screen.getByText(/violetten Rand/i)).toBeTruthy()
  })
})
