import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import DragDropBildFrage from '../components/fragetypen/DragDropBildFrage.tsx'
import type { DragDropBildFrage as DDType } from '../types/fragen.ts'
import type { Antwort } from '../types/antworten.ts'

const frage = {
  id: 'dd1',
  typ: 'dragdrop_bild',
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
  fragetext: 'Ordne die Labels den Zonen zu.',
  bildUrl: '/bilanz.svg',
  labels: [
    { id: 'l-a', text: 'Aktiva' },
    { id: 'l-p', text: 'Passiva' },
    { id: 'l-e', text: 'Ertrag' },
  ],
  zielzonen: [
    {
      id: 'z-links',
      form: 'rechteck',
      punkte: [{x:10,y:10},{x:40,y:10},{x:40,y:40},{x:10,y:40}],
      korrekteLabels: ['Aktiva'],
      erklaerung: 'Linke Bilanzseite = Mittelverwendung.',
    },
    {
      id: 'z-rechts',
      form: 'rechteck',
      punkte: [{x:60,y:10},{x:90,y:10},{x:90,y:40},{x:60,y:40}],
      korrekteLabels: ['Passiva'],
      erklaerung: 'Rechte Bilanzseite = Mittelherkunft.',
    },
  ],
} as unknown as DDType

describe('DragDropBildFrage modus=loesung', () => {
  it('alle Labels korrekt platziert → alle Zonen grün', () => {
    const antwort: Antwort = {
      typ: 'dragdrop_bild',
      zuordnungen: { 'l-a': 'z-links', 'l-p': 'z-rechts' },
    }
    const { container } = render(<DragDropBildFrage frage={frage} antwort={antwort} modus="loesung" />)
    const grüneLabels = container.querySelectorAll('.border-green-600')
    expect(grüneLabels.length).toBeGreaterThanOrEqual(2)
  })

  it('falsch platziertes Label → Zone rot mit korrektem Label sichtbar', () => {
    const antwort: Antwort = {
      typ: 'dragdrop_bild',
      zuordnungen: { 'l-p': 'z-links', 'l-a': 'z-rechts' }, // vertauscht
    }
    const { container } = render(<DragDropBildFrage frage={frage} antwort={antwort} modus="loesung" />)
    expect(container.querySelector('.border-red-600')).toBeTruthy()
    // Korrekte Antworten sichtbar
    expect(screen.getAllByText('Aktiva').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Passiva').length).toBeGreaterThanOrEqual(1)
  })

  it('Zone leer → falsch-Variante mit Placeholder', () => {
    const antwort: Antwort = {
      typ: 'dragdrop_bild',
      zuordnungen: { 'l-a': 'z-links' }, // z-rechts leer
    }
    render(<DragDropBildFrage frage={frage} antwort={antwort} modus="loesung" />)
    expect(screen.getByText(/leer/i)).toBeInTheDocument()
    expect(screen.getAllByText('Passiva').length).toBeGreaterThanOrEqual(1)
  })

  it('Distraktor-Label in Zone → Zone falsch, korrektes Label sichtbar', () => {
    const antwort: Antwort = {
      typ: 'dragdrop_bild',
      zuordnungen: { 'l-e': 'z-links', 'l-p': 'z-rechts' }, // Distraktor in z-links
    }
    const { container } = render(<DragDropBildFrage frage={frage} antwort={antwort} modus="loesung" />)
    expect(container.querySelector('.border-red-600')).toBeTruthy()
    expect(screen.getByText('Ertrag')).toBeInTheDocument()
  })

  it('rendert Erklärungen pro Zone', () => {
    const antwort: Antwort = {
      typ: 'dragdrop_bild',
      zuordnungen: { 'l-a': 'z-links', 'l-p': 'z-rechts' },
    }
    render(<DragDropBildFrage frage={frage} antwort={antwort} modus="loesung" />)
    expect(screen.getByText(/Linke Bilanzseite/)).toBeInTheDocument()
    expect(screen.getByText(/Rechte Bilanzseite/)).toBeInTheDocument()
  })

  it('ohne antwort: alle Zonen falsch mit korrekten Labels', () => {
    const { container } = render(<DragDropBildFrage frage={frage} modus="loesung" />)
    expect(screen.getAllByText('Aktiva').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Passiva').length).toBeGreaterThanOrEqual(1)
    expect(container.querySelectorAll('.border-red-600').length).toBeGreaterThanOrEqual(2)
  })

  it('keine draggable-Elemente im Lösungsmodus', () => {
    const antwort: Antwort = {
      typ: 'dragdrop_bild',
      zuordnungen: { 'l-a': 'z-links', 'l-p': 'z-rechts' },
    }
    const { container } = render(<DragDropBildFrage frage={frage} antwort={antwort} modus="loesung" />)
    expect(container.querySelector('[draggable="true"]')).toBeNull()
  })
})
