import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import BildbeschriftungFrage from '../components/fragetypen/BildbeschriftungFrage.tsx'
import type { BildbeschriftungFrage as BBType } from '../types/fragen.ts'
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
  id: 'bb-1',
  typ: 'bildbeschriftung',
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
  beschriftungen: [
    { id: 'm0', position: { x: 10, y: 10 }, korrekt: ['Dach'] },
    { id: 'm1', position: { x: 50, y: 50 }, korrekt: ['Wand'] },
  ],
} as BBType

describe('BildbeschriftungFrage Violett-Outline', () => {
  beforeEach(() => mockAdapter.mockReset())

  it('Violett-Outline auf leerer Eingabe vor Antwort prüfen', () => {
    mockAdapter.mockReturnValue(defaultAdapter())
    render(<BildbeschriftungFrage frage={frage} />)
    const area = screen.getByTestId('bildbeschriftung-input-area')
    expect(area.className).toContain('border-violet-400')
  })

  it('Violett verschwindet nach Antwort prüfen (feedbackSichtbar=true)', () => {
    mockAdapter.mockReturnValue(defaultAdapter({ feedbackSichtbar: true, istGeprueft: true, disabled: true }))
    render(<BildbeschriftungFrage frage={frage} />)
    const area = screen.getByTestId('bildbeschriftung-input-area')
    expect(area.className).not.toContain('border-violet-400')
  })

  it('Violett verschwindet wenn alle Marker beschriftet', () => {
    const antwort: Antwort = { typ: 'bildbeschriftung', eintraege: { m0: 'Dach', m1: 'Wand' } }
    mockAdapter.mockReturnValue(defaultAdapter({ antwort }))
    render(<BildbeschriftungFrage frage={frage} />)
    const area = screen.getByTestId('bildbeschriftung-input-area')
    expect(area.className).not.toContain('border-violet-400')
  })
})
