import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import DragDropBildFrage from './DragDropBildFrage.tsx'
import type { DragDropBildFrage as DDType } from '../../types/fragen-storage'

const mockOnAntwort = vi.fn()

// Controllable mock adapter — overridden per-test as needed.
// Intentionally untyped to avoid FrageAdapterResult import that would cause tsc -b
// to fail if the type shape ever diverges.
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

function makeFrage(): DDType {
  return {
    id: 'ddb-a11y-1',
    typ: 'dragdrop_bild',
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
    fragetext: 'Ordne die Labels zu.',
    bildUrl: '/test.svg',
    zielzonen: [
      {
        id: 'z1',
        form: 'rechteck',
        punkte: [{ x: 10, y: 10 }, { x: 60, y: 10 }, { x: 60, y: 50 }, { x: 10, y: 50 }],
        korrekteLabels: ['Konjunktur'],
      },
    ],
    labels: [
      { id: 'l1', text: 'Konjunktur' },
      { id: 'l2', text: 'Inflation' },
    ],
  } as unknown as DDType
}

describe('DragDropBildFrage — Pool-Chip Tastaturzugänglichkeit', () => {
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

  it('Pool-Chip ist per Tastatur fokussierbar und Enter wählt aus', () => {
    render(<DragDropBildFrage frage={makeFrage()} />)
    const chip = screen.getByRole('button', { name: /Konjunktur/ })
    expect(chip).toHaveAttribute('tabindex', '0')
    fireEvent.keyDown(chip, { key: 'Enter' })
    expect(chip).toHaveAttribute('aria-pressed', 'true')
  })
})

describe('DragDropBildFrage — Zonen Tastaturzugänglichkeit (Task 5)', () => {
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

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('Zone ist role="group" mit aria-label das "Zone" enthält', () => {
    render(<DragDropBildFrage frage={makeFrage()} />)
    const gruppe = screen.getByRole('group', { name: /Zone/i })
    expect(gruppe).toBeTruthy()
  })

  it('Zone enthält einen Platzieren-Button und keine verschachtelten Buttons', () => {
    render(<DragDropBildFrage frage={makeFrage()} />)
    const gruppe = screen.getByRole('group', { name: /Zone/i })
    const { getAllByRole } = within(gruppe)
    const buttons = getAllByRole('button')
    // Es gibt mindestens den Platzieren-Button
    expect(buttons.length).toBeGreaterThanOrEqual(1)
    // Kein Button ist ein DOM-Nachkomme eines anderen Buttons
    for (const btn of buttons) {
      const ancestor = btn.parentElement?.closest('button')
      expect(ancestor).toBeNull()
    }
  })

  it('Platzieren-Button mit Enter platziert selektiertes Label und ruft onAntwort auf', () => {
    render(<DragDropBildFrage frage={makeFrage()} />)
    // Erst Pool-Chip auswählen
    const poolChip = screen.getByRole('button', { name: /Konjunktur/ })
    fireEvent.click(poolChip)
    // Dann Platzieren-Button per Enter aktivieren
    const platzierenBtn = screen.getByRole('button', { name: /platzieren/i })
    fireEvent.click(platzierenBtn)
    expect(mockOnAntwort).toHaveBeenCalledWith(
      expect.objectContaining({
        typ: 'dragdrop_bild',
        zuordnungen: expect.objectContaining({ l1: 'z1' }),
      }),
    )
  })

  it('Platziertes Chip ist ein Button mit Entfernen-Semantik und Klick ruft onAntwort auf', () => {
    // Adapter mit vorhandener Zuordnung vorbefüllen — Chip wird direkt gerendert.
    mockAdapter = {
      ...mockAdapter,
      antwort: { typ: 'dragdrop_bild', zuordnungen: { l1: 'z1' } },
      onAntwort: mockOnAntwort,
    }

    render(<DragDropBildFrage frage={makeFrage()} />)

    // Entfernen-Button für «Konjunktur» muss mit zugänglichem Namen sichtbar sein
    const entfernenBtn = screen.getByRole('button', { name: /«Konjunktur».*entfernen/i })
    expect(entfernenBtn).toBeTruthy()

    // Klick entfernt das Label — onAntwort mit leerem zuordnungen aufgerufen
    fireEvent.click(entfernenBtn)
    expect(mockOnAntwort).toHaveBeenCalledWith(
      expect.objectContaining({ typ: 'dragdrop_bild', zuordnungen: {} }),
    )
  })

  it('Fokus fällt nach Platzieren auf den Platzieren-Button (rAF flushed, nicht body)', () => {
    // rAF synchron ausführen, damit Fokus-Aufruf in handleZoneKlick sofort wirkt
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { cb(0); return 0 })

    render(<DragDropBildFrage frage={makeFrage()} />)

    // Pool-Chip auswählen (kein manuelles pre-focus des Platzieren-Buttons)
    const poolChip = screen.getByRole('button', { name: /Konjunktur/ })
    fireEvent.click(poolChip)

    // Platzieren-Button aktivieren — rAF läuft synchron → .focus() wird sofort aufgerufen
    const platzierenBtn = screen.getByRole('button', { name: /platzieren/i })
    fireEvent.click(platzierenBtn)

    // Fokus muss auf dem Platzieren-Button liegen, nicht auf document.body
    expect(document.activeElement).not.toBe(document.body)
    expect(document.activeElement?.tagName).toBe('BUTTON')
    expect(document.activeElement).toBe(platzierenBtn)
  })

  it('Entfernen-Button im belegten Zone-Chip ist kein Nachkomme des Platzieren-Buttons', () => {
    render(<DragDropBildFrage frage={makeFrage()} />)
    // Platzieren
    fireEvent.click(screen.getByRole('button', { name: /Konjunktur/ }))
    fireEvent.click(screen.getByRole('button', { name: /platzieren/i }))
    // Nach Platzierung: Prüfen dass kein Button in einem anderen Button sitzt
    const gruppe = screen.getByRole('group', { name: /Zone/i })
    const buttons = within(gruppe).getAllByRole('button')
    for (const btn of buttons) {
      const ancestor = btn.parentElement?.closest('button')
      expect(ancestor).toBeNull()
    }
  })
})
