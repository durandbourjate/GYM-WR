import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import HotspotFrage from './HotspotFrage.tsx'
import type { HotspotFrage as HotspotFrageType } from '../../types/fragen-storage'
import { zentroid } from '../../utils/a11y/bildPosition.ts'

const mockOnAntwort = vi.fn()

// Intentionally untyped to avoid FrageAdapterResult import (tsc -b compat).
let mockAdapter = {
  antwort: null as unknown,
  onAntwort: mockOnAntwort,
  speichereZwischenstand: null,
  onPruefen: null,
  onSelbstbewerten: null,
  disabled: false,
  hatZwischenstand: false,
  istGeprueft: false,
  feedbackSichtbar: false,
  korrekt: null,
  markiertAlsUnsicher: false,
  toggleUnsicher: vi.fn(),
  speichertPruefung: false,
  pruefFehler: null,
  letzteMusterloesung: null,
}

vi.mock('../../hooks/useFrageAdapter.ts', () => ({
  useFrageAdapter: () => mockAdapter,
}))

// Mock image resolvers (they call out to module logic we don't need in tests)
vi.mock('@shared/utils/mediaQuelleResolver', () => ({
  ermittleBildQuelle: () => ({ typ: 'url', url: '/test.svg' }),
}))
vi.mock('@shared/utils/mediaQuelleUrl', () => ({
  mediaQuelleZuImgSrc: (_q: unknown, _fn: unknown) => '/test.svg',
}))

function makeFrage(): HotspotFrageType {
  return {
    id: 'hs-a11y-1',
    typ: 'hotspot',
    version: 1,
    erstelltAm: '2026-06-01',
    geaendertAm: '2026-06-01',
    fachbereich: 'VWL',
    fach: 'SF WR',
    thema: 'Konjunktur',
    semester: [],
    gefaesse: [],
    bloom: 'K2',
    tags: [],
    punkte: 2,
    musterlosung: '',
    bewertungsraster: [],
    verwendungen: [],
    fragetext: 'Klicke auf den Konjunkturhochpunkt.',
    mehrfachauswahl: false,
    bild: { typ: 'url', url: '/test.svg' },
    bereiche: [
      {
        id: 'b1',
        form: 'polygon',
        // Top-left quadrant polygon — centroid should be at ~20,20 → 'oben links'
        punkte: [
          { x: 10, y: 10 },
          { x: 30, y: 10 },
          { x: 30, y: 30 },
          { x: 10, y: 30 },
        ],
        label: 'Konjunkturhochpunkt',
        punktzahl: 1,
      },
      {
        id: 'b2',
        form: 'polygon',
        // Bottom-right quadrant polygon — centroid should be at ~80,80 → 'unten rechts'
        punkte: [
          { x: 70, y: 70 },
          { x: 90, y: 70 },
          { x: 90, y: 90 },
          { x: 70, y: 90 },
        ],
        label: 'Konjunkturtief',
        punktzahl: 0,
      },
    ],
  } as unknown as HotspotFrageType
}

describe('HotspotFrage — SR-Region-Overlays (Task 6)', () => {
  beforeEach(() => {
    mockOnAntwort.mockReset()
    mockAdapter = {
      antwort: null,
      onAntwort: mockOnAntwort,
      speichereZwischenstand: null,
      onPruefen: null,
      onSelbstbewerten: null,
      disabled: false,
      hatZwischenstand: false,
      istGeprueft: false,
      feedbackSichtbar: false,
      korrekt: null,
      markiertAlsUnsicher: false,
      toggleUnsicher: vi.fn(),
      speichertPruefung: false,
      pruefFehler: null,
      letzteMusterloesung: null,
    }
  })

  it('renders one button per bereich (2 bereiche → 2 region buttons)', () => {
    render(<HotspotFrage frage={makeFrage()} />)
    const regionButtons = screen.getAllByRole('button', { name: /Bereich \d+ von \d+/ })
    expect(regionButtons).toHaveLength(2)
  })

  it('region button accessible name includes ordinal + count + position word, NOT the bereich label', () => {
    render(<HotspotFrage frage={makeFrage()} />)

    const btn1 = screen.getByRole('button', { name: /Bereich 1 von 2/ })
    expect(btn1).toBeTruthy()
    // Must contain a position word
    expect(btn1.getAttribute('aria-label')).toMatch(/oben|links|rechts|unten|Mitte/)
    // Must NOT reveal the bereich label
    expect(btn1.getAttribute('aria-label')).not.toContain('Konjunkturhochpunkt')

    const btn2 = screen.getByRole('button', { name: /Bereich 2 von 2/ })
    expect(btn2).toBeTruthy()
    expect(btn2.getAttribute('aria-label')).not.toContain('Konjunkturtief')
  })

  it('region button has pointer-events:none and tabIndex 0', () => {
    render(<HotspotFrage frage={makeFrage()} />)
    const regionButtons = screen.getAllByRole('button', { name: /Bereich \d+ von \d+/ })
    for (const btn of regionButtons) {
      expect(btn.style.pointerEvents).toBe('none')
      expect(btn).toHaveAttribute('tabindex', '0')
    }
  })

  it('Enter on region button calls onAntwort with centroid coordinates', () => {
    render(<HotspotFrage frage={makeFrage()} />)
    const frage = makeFrage()
    const bereich1 = frage.bereiche[0]
    const expectedCentroid = zentroid(bereich1.punkte)

    const btn1 = screen.getByRole('button', { name: /Bereich 1 von 2/ })
    fireEvent.keyDown(btn1, { key: 'Enter' })

    expect(mockOnAntwort).toHaveBeenCalledTimes(1)
    expect(mockOnAntwort).toHaveBeenCalledWith(
      expect.objectContaining({
        typ: 'hotspot',
        klicks: expect.arrayContaining([
          expect.objectContaining({
            x: expect.closeTo(expectedCentroid.x, 5),
            y: expect.closeTo(expectedCentroid.y, 5),
          }),
        ]),
      }),
    )
  })

  it('Space on region button also calls onAntwort', () => {
    render(<HotspotFrage frage={makeFrage()} />)
    const btn1 = screen.getByRole('button', { name: /Bereich 1 von 2/ })
    fireEvent.keyDown(btn1, { key: ' ' })
    expect(mockOnAntwort).toHaveBeenCalledTimes(1)
  })

  it('Enter on region button in single-select mode replaces any existing click', () => {
    // Pre-existing answer at a different position
    mockAdapter = {
      ...mockAdapter,
      antwort: { typ: 'hotspot', klicks: [{ x: 55, y: 55 }] },
      onAntwort: mockOnAntwort,
    }
    render(<HotspotFrage frage={makeFrage()} />)
    const btn1 = screen.getByRole('button', { name: /Bereich 1 von 2/ })
    fireEvent.keyDown(btn1, { key: 'Enter' })

    const call = mockOnAntwort.mock.calls[0][0]
    // Single-select: should have exactly 1 click (the new centroid, replacing old)
    expect(call.klicks).toHaveLength(1)
  })

  it('Enter on region button in mehrfachauswahl mode appends to existing clicks', () => {
    const frageMulti = { ...makeFrage(), mehrfachauswahl: true }
    mockAdapter = {
      ...mockAdapter,
      antwort: { typ: 'hotspot', klicks: [{ x: 55, y: 55 }] },
      onAntwort: mockOnAntwort,
    }
    render(<HotspotFrage frage={frageMulti} />)
    const btn1 = screen.getByRole('button', { name: /Bereich 1 von 2/ })
    fireEvent.keyDown(btn1, { key: 'Enter' })

    const call = mockOnAntwort.mock.calls[0][0]
    // Mehrfachauswahl: existing click + new centroid = 2
    expect(call.klicks).toHaveLength(2)
  })

  it('region button is disabled when adapter is disabled', () => {
    mockAdapter = { ...mockAdapter, disabled: true }
    render(<HotspotFrage frage={makeFrage()} />)
    const regionButtons = screen.getAllByRole('button', { name: /Bereich \d+ von \d+/ })
    for (const btn of regionButtons) {
      expect(btn).toBeDisabled()
    }
  })

  it('disabled region button does not call onAntwort on Enter', () => {
    mockAdapter = { ...mockAdapter, disabled: true }
    render(<HotspotFrage frage={makeFrage()} />)
    const btn1 = screen.getAllByRole('button', { name: /Bereich \d+ von \d+/ })[0]
    fireEvent.keyDown(btn1, { key: 'Enter' })
    expect(mockOnAntwort).not.toHaveBeenCalled()
  })
})
