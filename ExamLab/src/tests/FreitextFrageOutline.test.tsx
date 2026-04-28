import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import FreitextFrage from '../components/fragetypen/FreitextFrage.tsx'
import type { FreitextFrage as FTType } from '../types/fragen.ts'
import type { Antwort } from '../types/antworten.ts'
import type { FrageAdapterResult } from '../hooks/useFrageAdapter.ts'

const mockAdapter = vi.fn<() => FrageAdapterResult>()

vi.mock('../hooks/useFrageAdapter.ts', () => ({
  useFrageAdapter: () => mockAdapter(),
}))

vi.mock('../store/pruefungStore.ts', () => ({
  usePruefungStore: () => ({ rechtschreibpruefung: true, rechtschreibSprache: 'de' }),
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
  id: 'ft-1',
  typ: 'freitext',
  version: 1,
  erstelltAm: '2026-04-28',
  geaendertAm: '2026-04-28',
  fachbereich: 'Recht',
  fach: 'SF WR',
  thema: 'Test',
  semester: [],
  gefaesse: [],
  bloom: 'K3',
  tags: [],
  punkte: 3,
  musterlosung: '',
  bewertungsraster: [],
  verwendungen: [],
  fragetext: 'Was ist X?',
  laenge: 'mittel',
} as FTType

describe('FreitextFrage Violett-Outline', () => {
  beforeEach(() => mockAdapter.mockReset())

  it('Violett-Outline auf leerer Eingabe vor Antwort prüfen', () => {
    mockAdapter.mockReturnValue(defaultAdapter())
    render(<FreitextFrage frage={frage} />)
    const area = screen.getByTestId('freitext-input-area')
    expect(area.className).toContain('border-violet-400')
  })

  it('Violett verschwindet nach Antwort prüfen (feedbackSichtbar=true)', () => {
    const antwort: Antwort = { typ: 'freitext', text: '<p>Antwort</p>' }
    mockAdapter.mockReturnValue(defaultAdapter({ antwort, feedbackSichtbar: true, istGeprueft: true, disabled: true }))
    render(<FreitextFrage frage={frage} />)
    const area = screen.getByTestId('freitext-input-area')
    expect(area.className).not.toContain('border-violet-400')
  })

  it('Violett verschwindet wenn Antwort vorhanden', () => {
    const antwort: Antwort = { typ: 'freitext', text: '<p>Hallo</p>' }
    mockAdapter.mockReturnValue(defaultAdapter({ antwort }))
    render(<FreitextFrage frage={frage} />)
    const area = screen.getByTestId('freitext-input-area')
    expect(area.className).not.toContain('border-violet-400')
  })
})
