import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import RichtigFalschFrage from './RichtigFalschFrage.tsx'
import type { RichtigFalschFrage as RFFrageType } from '../../types/fragen.ts'

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
  }),
}))

function makeFrage(overrides: Partial<RFFrageType> = {}): RFFrageType {
  return {
    id: 'rf-test-1',
    typ: 'richtigfalsch',
    fachbereich: 'VWL',
    thema: 'Test',
    bloom: 'K2',
    schwierigkeit: 'mittel',
    punkte: 1,
    fragetext: 'Stellensuchende und Arbeitslose bezeichnen dieselbe Personengruppe.',
    aussagen: [
      { id: 'a1', text: 'Stellensuchende und Arbeitslose bezeichnen dieselbe Personengruppe.', korrekt: false },
    ],
    ...overrides,
  } as RFFrageType
}

describe('RichtigFalschFrage', () => {
  it('unterdrückt separate Fragetext-Box bei Einzel-Aussage die = Fragetext ist', () => {
    render(<RichtigFalschFrage frage={makeFrage()} />)
    const matches = screen.getAllByText(/Stellensuchende und Arbeitslose/)
    expect(matches.length).toBe(1)
  })

  it('zeigt Fragetext-Box wenn mehrere Aussagen existieren', () => {
    const frage = makeFrage({
      fragetext: 'Welche Aussagen zum Arbeitsmarkt sind richtig?',
      aussagen: [
        { id: 'a1', text: 'Aussage eins', korrekt: true },
        { id: 'a2', text: 'Aussage zwei', korrekt: false },
      ],
    })
    render(<RichtigFalschFrage frage={frage} />)
    expect(screen.getAllByText(/Welche Aussagen zum Arbeitsmarkt/).length).toBe(1)
    expect(screen.getByText(/Aussage eins/)).toBeDefined()
    expect(screen.getByText(/Aussage zwei/)).toBeDefined()
  })

  it('zeigt Fragetext-Box wenn Einzel-Aussage anderen Text hat als Fragetext', () => {
    const frage = makeFrage({
      fragetext: 'Trifft diese Behauptung zu?',
      aussagen: [
        { id: 'a1', text: 'Der Lohn wird nach Produktivität bestimmt.', korrekt: true },
      ],
    })
    render(<RichtigFalschFrage frage={frage} />)
    expect(screen.getByText(/Trifft diese Behauptung/)).toBeDefined()
    expect(screen.getByText(/Der Lohn wird nach Produktivität/)).toBeDefined()
  })
})
