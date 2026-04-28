import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import LueckentextFrage from '../components/fragetypen/LueckentextFrage.tsx'
import type { LueckentextFrage as LTType } from '../types/fragen.ts'
import type { Antwort } from '../types/antworten.ts'
import type { FrageAdapterResult } from '../hooks/useFrageAdapter.ts'

const mockAdapter = vi.fn<() => FrageAdapterResult>()

vi.mock('../hooks/useFrageAdapter.ts', () => ({
  useFrageAdapter: () => mockAdapter(),
}))

vi.mock('../store/pruefungStore.ts', () => ({
  usePruefungStore: () => null,
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
  id: 'lt-1',
  typ: 'lueckentext',
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
  textMitLuecken: 'Aktiva = {0} und Passiva = {1}.',
  luecken: [
    { id: 'l0', korrekteAntworten: ['Vermögen'], caseSensitive: false },
    { id: 'l1', korrekteAntworten: ['Schulden'], caseSensitive: false },
  ],
} as LTType

describe('LueckentextFrage Violett-Outline', () => {
  beforeEach(() => mockAdapter.mockReset())

  it('Violett-Outline auf leerer Eingabe vor Antwort prüfen', () => {
    mockAdapter.mockReturnValue(defaultAdapter())
    render(<LueckentextFrage frage={frage} />)
    const area = screen.getByTestId('lueckentext-input-area')
    expect(area.className).toContain('border-violet-400')
  })

  it('Violett verschwindet nach Antwort prüfen (feedbackSichtbar=true)', () => {
    mockAdapter.mockReturnValue(defaultAdapter({ feedbackSichtbar: true, istGeprueft: true, disabled: true }))
    render(<LueckentextFrage frage={frage} />)
    const area = screen.getByTestId('lueckentext-input-area')
    expect(area.className).not.toContain('border-violet-400')
  })

  it('Violett verschwindet wenn alle Lücken gefüllt', () => {
    const antwort: Antwort = { typ: 'lueckentext', eintraege: { l0: 'Vermögen', l1: 'Schulden' } }
    mockAdapter.mockReturnValue(defaultAdapter({ antwort }))
    render(<LueckentextFrage frage={frage} />)
    const area = screen.getByTestId('lueckentext-input-area')
    expect(area.className).not.toContain('border-violet-400')
  })
})
