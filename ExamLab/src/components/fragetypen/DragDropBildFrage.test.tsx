import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import DragDropBildFrage from './DragDropBildFrage.tsx'
import type { DragDropBildFrage as DDType } from '../../types/fragen-storage'

vi.mock('../../hooks/useFrageAdapter.ts', () => ({
  useFrageAdapter: () => ({
    antwort: null,
    onAntwort: vi.fn(),
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
  }),
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
  it('Pool-Chip ist per Tastatur fokussierbar und Enter wählt aus', () => {
    render(<DragDropBildFrage frage={makeFrage()} />)
    const chip = screen.getByRole('button', { name: /Konjunktur/ })
    expect(chip).toHaveAttribute('tabindex', '0')
    fireEvent.keyDown(chip, { key: 'Enter' })
    expect(chip).toHaveAttribute('aria-pressed', 'true')
  })
})
