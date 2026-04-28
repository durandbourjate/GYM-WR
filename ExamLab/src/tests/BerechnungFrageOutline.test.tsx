import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import BerechnungFrage from '../components/fragetypen/BerechnungFrage.tsx'
import type { BerechnungFrage as BType } from '../types/fragen.ts'
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
  id: 'be-1',
  typ: 'berechnung',
  version: 1,
  erstelltAm: '2026-04-28',
  geaendertAm: '2026-04-28',
  fachbereich: 'BWL',
  fach: 'SF WR',
  thema: 'Test',
  semester: [],
  gefaesse: [],
  bloom: 'K3',
  tags: [],
  punkte: 2,
  musterlosung: '',
  bewertungsraster: [],
  verwendungen: [],
  fragetext: 'Berechne X.',
  ergebnisse: [
    { id: 'e0', label: 'X', korrekt: 100, toleranz: 0, einheit: 'CHF' },
    { id: 'e1', label: 'Y', korrekt: 200, toleranz: 0, einheit: 'CHF' },
  ],
  rechenwegErforderlich: false,
} as BType

describe('BerechnungFrage Violett-Outline', () => {
  beforeEach(() => mockAdapter.mockReset())

  it('Violett-Outline auf leerer Eingabe vor Antwort prüfen', () => {
    mockAdapter.mockReturnValue(defaultAdapter())
    render(<BerechnungFrage frage={frage} />)
    const area = screen.getByTestId('berechnung-input-area')
    expect(area.className).toContain('border-violet-400')
  })

  it('Violett verschwindet nach Antwort prüfen (feedbackSichtbar=true)', () => {
    mockAdapter.mockReturnValue(defaultAdapter({ feedbackSichtbar: true, istGeprueft: true, disabled: true }))
    render(<BerechnungFrage frage={frage} />)
    const area = screen.getByTestId('berechnung-input-area')
    expect(area.className).not.toContain('border-violet-400')
  })

  it('Violett verschwindet wenn alle Ergebnisse gefüllt', () => {
    const antwort: Antwort = { typ: 'berechnung', ergebnisse: { e0: '100', e1: '200' } }
    mockAdapter.mockReturnValue(defaultAdapter({ antwort }))
    render(<BerechnungFrage frage={frage} />)
    const area = screen.getByTestId('berechnung-input-area')
    expect(area.className).not.toContain('border-violet-400')
  })
})
