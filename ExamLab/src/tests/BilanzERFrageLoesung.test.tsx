import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import BilanzERFrage from '../components/fragetypen/BilanzERFrage.tsx'
import type { BilanzERFrage as BEType } from '../types/fragen-storage'
import type { Antwort } from '../types/antworten.ts'

const frageBilanz = {
  id: 'be1',
  typ: 'bilanzstruktur',
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
  tagIds: [],
  punkte: 3,
  musterlosung: 'Bilanz balanciert mit Bilanzsumme CHF 5000.',
  bewertungsraster: [],
  verwendungen: [],
  aufgabentext: 'Erstelle die Bilanz.',
  modus: 'bilanz',
  kontenMitSaldi: [
    { kontonummer: '1000', name: 'Kasse', saldo: 2000, erklaerung: 'Bar-Bestand.' },
    { kontonummer: '1020', name: 'Bank', saldo: 3000, erklaerung: 'Bankkonto.' },
    { kontonummer: '2000', name: 'Kreditoren', saldo: 1500 },
    { kontonummer: '2800', name: 'Eigenkapital', saldo: 3500 },
  ],
  loesung: {
    bilanz: {
      aktivSeite: {
        label: 'Aktiven',
        gruppen: [
          { label: 'Umlaufvermögen', konten: ['1000', '1020'] },
        ],
      },
      passivSeite: {
        label: 'Passiven',
        gruppen: [
          { label: 'Fremdkapital', konten: ['2000'] },
          { label: 'Eigenkapital', konten: ['2800'] },
        ],
      },
      bilanzsumme: 5000,
    },
  },
  bewertungsoptionen: {
    seitenbeschriftung: true,
    gruppenbildung: true,
    gruppenreihenfolge: false,
    kontenreihenfolge: false,
    betraegeKorrekt: true,
    zwischentotale: false,
    bilanzsummeOderGewinn: true,
    mehrstufigkeit: false,
  },
} as BEType

describe('BilanzERFrage modus=loesung', () => {
  it('korrekte Bilanzsumme → grüner Rahmen', () => {
    const antwort: Antwort = {
      typ: 'bilanzstruktur',
      bilanz: {
        linkeSeite: { label: 'Aktiva', gruppen: [] },
        rechteSeite: { label: 'Passiva', gruppen: [] },
        bilanzsummeLinks: 5000,
        bilanzsummeRechts: 5000,
      },
    }
    const { container } = render(<BilanzERFrage frage={frageBilanz} antwort={antwort} modus="loesung" />)
    expect(container.querySelector('.border-green-600')).toBeTruthy()
  })

  it('falsche Bilanzsumme → roter Rahmen', () => {
    const antwort: Antwort = {
      typ: 'bilanzstruktur',
      bilanz: {
        linkeSeite: { label: 'Aktiva', gruppen: [] },
        rechteSeite: { label: 'Passiva', gruppen: [] },
        bilanzsummeLinks: 9999,
      },
    }
    const { container } = render(<BilanzERFrage frage={frageBilanz} antwort={antwort} modus="loesung" />)
    expect(container.querySelector('.border-red-600')).toBeTruthy()
  })

  it('zeigt korrekte Bilanz-Struktur (Aktiva + Passiva) als Referenz', () => {
    render(<BilanzERFrage frage={frageBilanz} modus="loesung" />)
    // Gruppen-Labels
    expect(screen.getByText(/Umlaufvermögen/)).toBeInTheDocument()
    expect(screen.getByText(/Fremdkapital/)).toBeInTheDocument()
    // 'Eigenkapital' ist sowohl Gruppen-Label als auch Konto-Name (2800) → getAllByText
    expect(screen.getAllByText(/Eigenkapital/).length).toBeGreaterThanOrEqual(2)
  })

  it('zeigt Konten mit Saldi', () => {
    render(<BilanzERFrage frage={frageBilanz} modus="loesung" />)
    // Konten-Nummern sichtbar
    expect(screen.getAllByText(/1000/).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/2800/).length).toBeGreaterThanOrEqual(1)
  })

  it('rendert erklaerung pro KontoMitSaldo', () => {
    render(<BilanzERFrage frage={frageBilanz} modus="loesung" />)
    expect(screen.getByText(/Bar-Bestand/)).toBeInTheDocument()
    expect(screen.getByText(/Bankkonto/)).toBeInTheDocument()
  })

  it('rendert Bilanzsumme', () => {
    render(<BilanzERFrage frage={frageBilanz} modus="loesung" />)
    // 5000 erscheint als Bilanzsumme
    expect(screen.getAllByText(/5000/).length).toBeGreaterThanOrEqual(1)
  })

  it('ohne antwort → rot (Bilanzsumme fehlt)', () => {
    const { container } = render(<BilanzERFrage frage={frageBilanz} modus="loesung" />)
    expect(container.querySelector('.border-red-600')).toBeTruthy()
  })

  it('keine interaktiven Inputs/Buttons im Lösungsmodus', () => {
    render(<BilanzERFrage frage={frageBilanz} modus="loesung" />)
    expect(document.querySelector('input')).toBeNull()
    expect(document.querySelector('button')).toBeNull()
    expect(document.querySelector('select')).toBeNull()
  })

  it('rendert Musterlösung', () => {
    render(<BilanzERFrage frage={frageBilanz} modus="loesung" />)
    expect(screen.getByText(/Bilanz balanciert/)).toBeInTheDocument()
  })
})
