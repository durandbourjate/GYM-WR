import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import RichtigFalschFrage from '../components/fragetypen/RichtigFalschFrage.tsx'
import type { RichtigFalschFrage as RFType } from '../types/fragen-storage'
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

// Test-Tickets Bundle 10.05.2026: Outer-Container-Violet entfernt (war doppelter Rahmen).
// Tests prüfen jetzt die per-Aussage-Card-Border (granulare Pflichtfeld-Indikatoren).
describe('RichtigFalschFrage Violett-Outline (per Aussage)', () => {
  beforeEach(() => mockAdapter.mockReset())

  function aussageCards() {
    const area = screen.getByTestId('richtigfalsch-input-area')
    // Outer-Container hat keinen Violet-Border mehr
    expect(area.className).not.toContain('border-violet-400')
    return Array.from(area.querySelectorAll<HTMLDivElement>(':scope > div'))
  }

  it('Aussage-Cards violet auf leerer Eingabe vor Antwort', () => {
    mockAdapter.mockReturnValue(defaultAdapter())
    render(<RichtigFalschFrage frage={frage} />)
    const cards = aussageCards()
    expect(cards.length).toBe(2)
    cards.forEach(card => expect(card.className).toContain('border-violet-400'))
  })

  it('Aussage-Cards verlieren violet nach Antwort prüfen (disabled=true)', () => {
    mockAdapter.mockReturnValue(defaultAdapter({ feedbackSichtbar: true, istGeprueft: true, disabled: true }))
    render(<RichtigFalschFrage frage={frage} />)
    const cards = aussageCards()
    cards.forEach(card => expect(card.className).not.toContain('border-violet-400'))
  })

  it('Aussage-Cards verlieren violet wenn alle bewertet', () => {
    const antwort: Antwort = { typ: 'richtigfalsch', bewertungen: { x1: true, x2: false } }
    mockAdapter.mockReturnValue(defaultAdapter({ antwort }))
    render(<RichtigFalschFrage frage={frage} />)
    const cards = aussageCards()
    cards.forEach(card => expect(card.className).not.toContain('border-violet-400'))
  })

  it('Nur unbewertete Aussage-Cards bleiben violet', () => {
    const antwort: Antwort = { typ: 'richtigfalsch', bewertungen: { x1: true } }
    mockAdapter.mockReturnValue(defaultAdapter({ antwort }))
    render(<RichtigFalschFrage frage={frage} />)
    const cards = aussageCards()
    expect(cards[0].className).not.toContain('border-violet-400') // x1 bewertet
    expect(cards[1].className).toContain('border-violet-400')     // x2 leer
  })
})
