import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import BuchungssatzFrage from '../components/fragetypen/BuchungssatzFrage.tsx'
import type { BuchungssatzFrage as BSType } from '../types/fragen.ts'
import type { Antwort } from '../types/antworten.ts'

const frage = {
  id: 'bs1',
  typ: 'buchungssatz',
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
  musterlosung: '',
  bewertungsraster: [],
  verwendungen: [],
  geschaeftsfall: 'Barverkauf CHF 500',
  kontenauswahl: { modus: 'voll' },
  buchungen: [
    { id: 'b1', sollKonto: '1000', habenKonto: '3000', betrag: 500, erklaerung: 'Bar in Soll, Erlöse in Haben.' },
  ],
} as BSType

const frage2 = {
  ...frage,
  id: 'bs2',
  buchungen: [
    { id: 'b1', sollKonto: '1000', habenKonto: '3000', betrag: 500, erklaerung: 'Bar in Soll.' },
    { id: 'b2', sollKonto: '1020', habenKonto: '1000', betrag: 200, erklaerung: 'Bank-Umbuchung.' },
  ],
} as BSType

describe('BuchungssatzFrage modus=loesung', () => {
  it('alle Buchungen korrekt → grüne Rahmen', () => {
    const antwort: Antwort = {
      typ: 'buchungssatz',
      buchungen: [{ id: 'b1', sollKonto: '1000', habenKonto: '3000', betrag: 500 }],
    }
    const { container } = render(<BuchungssatzFrage frage={frage} antwort={antwort} modus="loesung" />)
    expect(container.querySelectorAll('.border-green-600').length).toBeGreaterThanOrEqual(1)
    expect(container.querySelector('.border-red-600')).toBeNull()
  })

  it('Soll-Konto falsch → roter Rahmen + korrektes Konto sichtbar', () => {
    const antwort: Antwort = {
      typ: 'buchungssatz',
      buchungen: [{ id: 'b1', sollKonto: '1020', habenKonto: '3000', betrag: 500 }],
    }
    const { container } = render(<BuchungssatzFrage frage={frage} antwort={antwort} modus="loesung" />)
    expect(container.querySelector('.border-red-600')).toBeTruthy()
    expect(screen.getByText(/1000/)).toBeInTheDocument()
  })

  it('Betrag falsch → roter Rahmen + korrekter Betrag sichtbar', () => {
    const antwort: Antwort = {
      typ: 'buchungssatz',
      buchungen: [{ id: 'b1', sollKonto: '1000', habenKonto: '3000', betrag: 400 }],
    }
    const { container } = render(<BuchungssatzFrage frage={frage} antwort={antwort} modus="loesung" />)
    expect(container.querySelector('.border-red-600')).toBeTruthy()
    // Korrekter Betrag 500.00 (formatiert) sichtbar, SuS-Betrag 400.00
    expect(screen.getByText('500.00')).toBeInTheDocument()
    expect(screen.getByText('400.00')).toBeInTheDocument()
  })

  it('leere Buchung → Rote Rahmen + alle korrekten Werte sichtbar', () => {
    const { container } = render(<BuchungssatzFrage frage={frage} modus="loesung" />)
    expect(container.querySelector('.border-red-600')).toBeTruthy()
    expect(screen.getByText(/1000/)).toBeInTheDocument()
    expect(screen.getByText(/3000/)).toBeInTheDocument()
  })

  it('rendert Erklärungen pro Buchung', () => {
    render(<BuchungssatzFrage frage={frage} modus="loesung" />)
    expect(screen.getByText(/Bar in Soll, Erlöse in Haben/)).toBeInTheDocument()
  })

  it('mehrere Buchungen: pro Zeile eigenständige Bewertung', () => {
    const antwort: Antwort = {
      typ: 'buchungssatz',
      buchungen: [
        { id: 'b1', sollKonto: '1000', habenKonto: '3000', betrag: 500 }, // korrekt
        { id: 'b2', sollKonto: '1020', habenKonto: '1000', betrag: 999 }, // Betrag falsch
      ],
    }
    const { container } = render(<BuchungssatzFrage frage={frage2} antwort={antwort} modus="loesung" />)
    expect(container.querySelectorAll('.border-green-600').length).toBeGreaterThanOrEqual(1)
    expect(container.querySelectorAll('.border-red-600').length).toBeGreaterThanOrEqual(1)
  })

  it('keine interaktiven Inputs/Buttons im Lösungsmodus', () => {
    const antwort: Antwort = {
      typ: 'buchungssatz',
      buchungen: [{ id: 'b1', sollKonto: '1000', habenKonto: '3000', betrag: 500 }],
    }
    render(<BuchungssatzFrage frage={frage} antwort={antwort} modus="loesung" />)
    expect(document.querySelector('input')).toBeNull()
    expect(document.querySelector('select')).toBeNull()
    expect(document.querySelector('button')).toBeNull()
  })
})
