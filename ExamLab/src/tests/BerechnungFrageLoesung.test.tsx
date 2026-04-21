import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import BerechnungFrage from '../components/fragetypen/BerechnungFrage.tsx'
import type { BerechnungFrage as BType } from '../types/fragen.ts'
import type { Antwort } from '../types/antworten.ts'

const frage = {
  id: 'b1',
  typ: 'berechnung',
  version: 1,
  erstelltAm: '2026-04-21',
  geaendertAm: '2026-04-21',
  fachbereich: 'BWL',
  fach: 'SF WR',
  thema: 'Test',
  semester: [],
  gefaesse: [],
  bloom: 'K3',
  tags: [],
  punkte: 2,
  musterlosung: 'Umsatz - Aufwand = Gewinn',
  bewertungsraster: [],
  verwendungen: [],
  fragetext: 'Berechne Gewinn und Marge.',
  rechenwegErforderlich: false,
  ergebnisse: [
    { id: 'g', label: 'Gewinn', korrekt: 1000, toleranz: 0.01, einheit: 'CHF' },
    { id: 'm', label: 'Marge', korrekt: 10, toleranz: 0.1, einheit: '%' },
  ],
} as BType

describe('BerechnungFrage modus=loesung', () => {
  it('beide Ergebnisse korrekt → grüne Rahmen', () => {
    const antwort: Antwort = {
      typ: 'berechnung',
      ergebnisse: { g: '1000', m: '10' },
    }
    const { container } = render(<BerechnungFrage frage={frage} antwort={antwort} modus="loesung" />)
    const grüne = container.querySelectorAll('.border-green-600')
    expect(grüne.length).toBeGreaterThanOrEqual(2)
  })

  it('ein Ergebnis falsch → roter Rahmen + korrekter Wert sichtbar', () => {
    const antwort: Antwort = {
      typ: 'berechnung',
      ergebnisse: { g: '900', m: '10' },
    }
    const { container } = render(<BerechnungFrage frage={frage} antwort={antwort} modus="loesung" />)
    expect(container.querySelector('.border-red-600')).toBeTruthy()
    // Korrekter Wert 1000 sichtbar
    expect(screen.getByText(/1000/)).toBeInTheDocument()
  })

  it('Toleranz wird beachtet (innerhalb Toleranz = korrekt)', () => {
    const antwort: Antwort = {
      typ: 'berechnung',
      ergebnisse: { g: '1000.005', m: '10.05' }, // beide innerhalb Toleranz
    }
    const { container } = render(<BerechnungFrage frage={frage} antwort={antwort} modus="loesung" />)
    expect(container.querySelector('.border-red-600')).toBeNull()
  })

  it('leeres Ergebnis → falsch mit Placeholder', () => {
    const antwort: Antwort = {
      typ: 'berechnung',
      ergebnisse: { g: '1000' }, // m leer
    }
    const { container } = render(<BerechnungFrage frage={frage} antwort={antwort} modus="loesung" />)
    expect(container.querySelector('.border-red-600')).toBeTruthy()
    expect(screen.getByText(/leer/i)).toBeInTheDocument()
  })

  it('ohne antwort → beide rot mit korrekten Werten', () => {
    const { container } = render(<BerechnungFrage frage={frage} modus="loesung" />)
    expect(container.querySelectorAll('.border-red-600').length).toBeGreaterThanOrEqual(2)
    expect(screen.getByText(/1000/)).toBeInTheDocument()
    expect(screen.getByText(/\b10\b/)).toBeInTheDocument()
  })

  it('keine interaktiven Inputs', () => {
    const antwort: Antwort = {
      typ: 'berechnung',
      ergebnisse: { g: '1000', m: '10' },
    }
    render(<BerechnungFrage frage={frage} antwort={antwort} modus="loesung" />)
    expect(document.querySelector('input')).toBeNull()
    expect(document.querySelector('textarea')).toBeNull()
  })

  it('rendert Musterloesung', () => {
    const antwort: Antwort = {
      typ: 'berechnung',
      ergebnisse: { g: '1000', m: '10' },
    }
    render(<BerechnungFrage frage={frage} antwort={antwort} modus="loesung" />)
    expect(screen.getByText(/Umsatz - Aufwand = Gewinn/)).toBeInTheDocument()
  })
})
