import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import BildbeschriftungFrage from '../components/fragetypen/BildbeschriftungFrage.tsx'
import type { BildbeschriftungFrage as BBType } from '../types/fragen.ts'
import type { Antwort } from '../types/antworten.ts'

const frage = {
  id: 'bb1',
  typ: 'bildbeschriftung',
  version: 1,
  erstelltAm: '2026-04-21',
  geaendertAm: '2026-04-21',
  fachbereich: 'BWL',
  fach: 'SF WR',
  thema: 'Test',
  semester: [],
  gefaesse: [],
  bloom: 'K2',
  tags: [],
  punkte: 2,
  musterlosung: '',
  bewertungsraster: [],
  verwendungen: [],
  fragetext: 'Beschrifte die Bilanzseiten.',
  bildUrl: '/bilanz.svg',
  beschriftungen: [
    { id: 'l1', position: { x: 25, y: 50 }, korrekt: ['Aktiva'], erklaerung: 'Links = Mittelverwendung.' },
    { id: 'l2', position: { x: 75, y: 50 }, korrekt: ['Passiva'], erklaerung: 'Rechts = Mittelherkunft.' },
  ],
} as BBType

describe('BildbeschriftungFrage modus=loesung', () => {
  it('korrekt beschriftet → ZoneLabel korrekt-Variante', () => {
    const antwort: Antwort = {
      typ: 'bildbeschriftung',
      eintraege: { l1: 'Aktiva', l2: 'Passiva' },
    }
    const { container } = render(<BildbeschriftungFrage frage={frage} antwort={antwort} modus="loesung" />)
    const grüneLabels = container.querySelectorAll('.border-green-600')
    expect(grüneLabels.length).toBeGreaterThanOrEqual(2)
    expect(screen.getByText('Aktiva')).toBeInTheDocument()
    expect(screen.getByText('Passiva')).toBeInTheDocument()
  })

  it('case-insensitive Match zählt als korrekt', () => {
    const antwort: Antwort = {
      typ: 'bildbeschriftung',
      eintraege: { l1: 'aktiva', l2: 'PASSIVA' },
    }
    const { container } = render(<BildbeschriftungFrage frage={frage} antwort={antwort} modus="loesung" />)
    expect(container.querySelector('.border-red-600')).toBeNull()
    expect(container.querySelectorAll('.border-green-600').length).toBeGreaterThanOrEqual(2)
  })

  it('falsch beschriftet → ZoneLabel falsch mit korrekter Antwort sichtbar', () => {
    const antwort: Antwort = {
      typ: 'bildbeschriftung',
      eintraege: { l1: 'Passiva', l2: 'Passiva' },
    }
    const { container } = render(<BildbeschriftungFrage frage={frage} antwort={antwort} modus="loesung" />)
    expect(container.querySelector('.border-red-600')).toBeTruthy()
    expect(screen.getByText('Aktiva')).toBeInTheDocument()
    expect(screen.getAllByText('Passiva').length).toBeGreaterThanOrEqual(2)
  })

  it('leeres Label → falsch-Variante mit Placeholder', () => {
    const antwort: Antwort = {
      typ: 'bildbeschriftung',
      eintraege: { l1: '', l2: 'Passiva' },
    }
    render(<BildbeschriftungFrage frage={frage} antwort={antwort} modus="loesung" />)
    expect(screen.getByText(/leer/i)).toBeInTheDocument()
    expect(screen.getByText('Aktiva')).toBeInTheDocument()
  })

  it('rendert Erklärungen pro Beschriftung', () => {
    const antwort: Antwort = {
      typ: 'bildbeschriftung',
      eintraege: { l1: 'Aktiva', l2: 'Passiva' },
    }
    render(<BildbeschriftungFrage frage={frage} antwort={antwort} modus="loesung" />)
    expect(screen.getByText(/Links = Mittelverwendung/)).toBeInTheDocument()
    expect(screen.getByText(/Rechts = Mittelherkunft/)).toBeInTheDocument()
  })

  it('ohne antwort: alle Labels falsch mit korrekter Antwort', () => {
    const { container } = render(<BildbeschriftungFrage frage={frage} modus="loesung" />)
    expect(screen.getByText('Aktiva')).toBeInTheDocument()
    expect(screen.getByText('Passiva')).toBeInTheDocument()
    expect(container.querySelectorAll('.border-red-600').length).toBeGreaterThanOrEqual(2)
  })

  it('keine interaktiven Inputs im Lösungsmodus', () => {
    const antwort: Antwort = {
      typ: 'bildbeschriftung',
      eintraege: { l1: 'Aktiva', l2: 'Passiva' },
    }
    render(<BildbeschriftungFrage frage={frage} antwort={antwort} modus="loesung" />)
    expect(document.querySelector('input')).toBeNull()
  })
})
