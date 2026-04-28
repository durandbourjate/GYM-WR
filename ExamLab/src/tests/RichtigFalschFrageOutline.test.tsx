import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import RichtigFalschFrage from '../components/fragetypen/RichtigFalschFrage.tsx'
import type { RichtigFalschFrage as RFType } from '../types/fragen.ts'
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
  id: 'rf-1',
  typ: 'richtigfalsch',
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
  fragetext: 'Welche Aussagen sind richtig?',
  aussagen: [
    { id: 'x1', text: 'Aussage 1', korrekt: true },
    { id: 'x2', text: 'Aussage 2', korrekt: false },
  ],
} as RFType

describe('RichtigFalschFrage Violett-Outline', () => {
  beforeEach(() => mockAdapter.mockReset())

  it('Violett-Outline auf leerer Eingabe vor Antwort prüfen', () => {
    mockAdapter.mockReturnValue(defaultAdapter())
    render(<RichtigFalschFrage frage={frage} />)
    const area = screen.getByTestId('richtigfalsch-input-area')
    expect(area.className).toContain('border-violet-400')
  })

  it('Violett verschwindet nach Antwort prüfen (feedbackSichtbar=true)', () => {
    mockAdapter.mockReturnValue(defaultAdapter({ feedbackSichtbar: true, istGeprueft: true, disabled: true }))
    render(<RichtigFalschFrage frage={frage} />)
    const area = screen.getByTestId('richtigfalsch-input-area')
    expect(area.className).not.toContain('border-violet-400')
  })

  it('Violett verschwindet wenn alle Aussagen bewertet', () => {
    const antwort: Antwort = { typ: 'richtigfalsch', bewertungen: { x1: true, x2: false } }
    mockAdapter.mockReturnValue(defaultAdapter({ antwort }))
    render(<RichtigFalschFrage frage={frage} />)
    const area = screen.getByTestId('richtigfalsch-input-area')
    expect(area.className).not.toContain('border-violet-400')
  })

  it('Violett bleibt wenn nur ein Teil bewertet', () => {
    const antwort: Antwort = { typ: 'richtigfalsch', bewertungen: { x1: true } }
    mockAdapter.mockReturnValue(defaultAdapter({ antwort }))
    render(<RichtigFalschFrage frage={frage} />)
    const area = screen.getByTestId('richtigfalsch-input-area')
    expect(area.className).toContain('border-violet-400')
  })
})
