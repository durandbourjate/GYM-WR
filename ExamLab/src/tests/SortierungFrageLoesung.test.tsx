import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import SortierungFrage from '../components/fragetypen/SortierungFrage.tsx'
import type { SortierungFrage as SType } from '../types/fragen.ts'
import type { Antwort } from '../types/antworten.ts'

const frage = {
  id: 's1',
  typ: 'sortierung',
  version: 1,
  erstelltAm: '2026-04-21',
  geaendertAm: '2026-04-21',
  fachbereich: 'VWL',
  fach: 'SF WR',
  thema: 'Test',
  semester: [],
  gefaesse: [],
  bloom: 'K2',
  tags: [],
  punkte: 3,
  musterlosung: 'Konjunkturzyklus: Aufschwung → Boom → Abschwung → Rezession',
  bewertungsraster: [],
  verwendungen: [],
  fragetext: 'Ordne die Konjunkturphasen in ihrer natürlichen Reihenfolge.',
  teilpunkte: true,
  elemente: ['Aufschwung', 'Boom', 'Abschwung', 'Rezession'],
} as SType

describe('SortierungFrage modus=loesung', () => {
  it('alle Positionen korrekt → alle Zeilen grün', () => {
    const antwort: Antwort = {
      typ: 'sortierung',
      reihenfolge: ['Aufschwung', 'Boom', 'Abschwung', 'Rezession'],
    }
    const { container } = render(<SortierungFrage frage={frage} antwort={antwort} modus="loesung" />)
    const grüne = container.querySelectorAll('.border-green-600')
    expect(grüne.length).toBeGreaterThanOrEqual(4)
  })

  it('ein Element falsch → rote Zeile + korrekte Position sichtbar', () => {
    const antwort: Antwort = {
      typ: 'sortierung',
      reihenfolge: ['Boom', 'Aufschwung', 'Abschwung', 'Rezession'],
    }
    const { container } = render(<SortierungFrage frage={frage} antwort={antwort} modus="loesung" />)
    expect(container.querySelectorAll('.border-red-600').length).toBeGreaterThanOrEqual(2)
  })

  it('zeigt deine-Position und korrekte-Position pro Element', () => {
    const antwort: Antwort = {
      typ: 'sortierung',
      reihenfolge: ['Boom', 'Aufschwung', 'Abschwung', 'Rezession'],
    }
    render(<SortierungFrage frage={frage} antwort={antwort} modus="loesung" />)
    // Deine Position: 1 für 'Boom' (falsch, korrekt wäre 2)
    const boomZeile = screen.getByText('Boom').closest('[data-sort-zeile]')
    expect(boomZeile?.textContent).toMatch(/1/)
    expect(boomZeile?.textContent).toMatch(/2/) // korrekte Position
  })

  it('ohne antwort: zeigt korrekte Reihenfolge rot (verpasst)', () => {
    const { container } = render(<SortierungFrage frage={frage} modus="loesung" />)
    expect(screen.getByText('Aufschwung')).toBeInTheDocument()
    expect(container.querySelectorAll('[data-sort-zeile]').length).toBe(4)
  })

  it('keine draggable-Elemente oder Buttons im Lösungsmodus', () => {
    const antwort: Antwort = {
      typ: 'sortierung',
      reihenfolge: ['Aufschwung', 'Boom', 'Abschwung', 'Rezession'],
    }
    const { container } = render(<SortierungFrage frage={frage} antwort={antwort} modus="loesung" />)
    expect(container.querySelector('[draggable="true"]')).toBeNull()
    expect(document.querySelector('button')).toBeNull()
  })

  it('rendert Musterlösung', () => {
    const antwort: Antwort = {
      typ: 'sortierung',
      reihenfolge: ['Aufschwung', 'Boom', 'Abschwung', 'Rezession'],
    }
    render(<SortierungFrage frage={frage} antwort={antwort} modus="loesung" />)
    expect(screen.getByText(/Konjunkturzyklus/)).toBeInTheDocument()
  })
})
