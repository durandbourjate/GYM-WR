import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import ZuordnungFrage from '../components/fragetypen/ZuordnungFrage.tsx'
import type { ZuordnungFrage as ZType } from '../types/fragen.ts'
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
  id: 'zu-1',
  typ: 'zuordnung',
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
  paare: [
    { links: 'A', rechts: 'X' },
    { links: 'B', rechts: 'Y' },
  ],
  zufallsreihenfolge: false,
} as ZType

describe('ZuordnungFrage Violett-Outline', () => {
  beforeEach(() => mockAdapter.mockReset())

  it('Violett-Outline auf leerer Eingabe vor Antwort prüfen', () => {
    mockAdapter.mockReturnValue(defaultAdapter())
    render(<ZuordnungFrage frage={frage} />)
    const area = screen.getByTestId('zuordnung-input-area')
    expect(area.className).toContain('border-violet-400')
  })

  it('Violett verschwindet nach Antwort prüfen (feedbackSichtbar=true)', () => {
    mockAdapter.mockReturnValue(defaultAdapter({ feedbackSichtbar: true, istGeprueft: true, disabled: true }))
    render(<ZuordnungFrage frage={frage} />)
    const area = screen.getByTestId('zuordnung-input-area')
    expect(area.className).not.toContain('border-violet-400')
  })

  it('Violett verschwindet wenn alle Paare zugeordnet', () => {
    const antwort: Antwort = { typ: 'zuordnung', zuordnungen: { A: 'X', B: 'Y' } }
    mockAdapter.mockReturnValue(defaultAdapter({ antwort }))
    render(<ZuordnungFrage frage={frage} />)
    const area = screen.getByTestId('zuordnung-input-area')
    expect(area.className).not.toContain('border-violet-400')
  })
})
