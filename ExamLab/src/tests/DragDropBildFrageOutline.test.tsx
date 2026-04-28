import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import DragDropBildFrage from '../components/fragetypen/DragDropBildFrage.tsx'
import type { DragDropBildFrage as DDType } from '../types/fragen.ts'
import type { Antwort } from '../types/antworten.ts'
import type { FrageAdapterResult } from '../hooks/useFrageAdapter.ts'

const mockAdapter = vi.fn<() => FrageAdapterResult>()

vi.mock('../hooks/useFrageAdapter.ts', () => ({
  useFrageAdapter: () => mockAdapter(),
}))

function defaultAdapter(overrides: Partial<FrageAdapterResult> = {}): FrageAdapterResult {
  return {
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
    ...overrides,
  }
}

const frage = {
  id: 'dd-1',
  typ: 'dragdrop_bild',
  version: 1,
  erstelltAm: '2026-04-28',
  geaendertAm: '2026-04-28',
  fachbereich: 'BWL',
  fach: 'SF WR',
  thema: 'Test',
  semester: [],
  gefaesse: [],
  bloom: 'K2',
  tags: [],
  punkte: 1,
  musterlosung: '',
  bewertungsraster: [],
  verwendungen: [],
  fragetext: '?',
  bildUrl: '/test.svg',
  zielzonen: [
    { id: 'z1', form: 'rechteck', punkte: [{ x: 0, y: 0 }, { x: 50, y: 0 }, { x: 50, y: 50 }, { x: 0, y: 50 }], korrektesLabel: 'A' },
  ],
  labels: ['A', 'B'],
} as DDType

describe('DragDropBildFrage Violett-Outline', () => {
  beforeEach(() => mockAdapter.mockReset())

  it('Violett-Outline auf leerer Eingabe vor Antwort prüfen', () => {
    mockAdapter.mockReturnValue(defaultAdapter())
    render(<DragDropBildFrage frage={frage} />)
    const area = screen.getByTestId('dragdrop_bild-input-area')
    expect(area.className).toContain('border-violet-400')
  })

  it('Violett verschwindet nach Antwort prüfen (feedbackSichtbar=true)', () => {
    mockAdapter.mockReturnValue(defaultAdapter({ feedbackSichtbar: true, istGeprueft: true, disabled: true }))
    render(<DragDropBildFrage frage={frage} />)
    const area = screen.getByTestId('dragdrop_bild-input-area')
    expect(area.className).not.toContain('border-violet-400')
  })

  it('Violett verschwindet wenn ≥1 Label platziert', () => {
    const antwort: Antwort = { typ: 'dragdrop_bild', zuordnungen: { A: 'z1' } }
    mockAdapter.mockReturnValue(defaultAdapter({ antwort }))
    render(<DragDropBildFrage frage={frage} />)
    const area = screen.getByTestId('dragdrop_bild-input-area')
    expect(area.className).not.toContain('border-violet-400')
  })
})
