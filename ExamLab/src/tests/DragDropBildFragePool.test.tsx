import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import DragDropBildFrage from '../components/fragetypen/DragDropBildFrage.tsx'
import { FrageModeProvider } from '../context/FrageModeContext.tsx'
import type { DragDropBildFrage as DDType } from '../types/fragen.ts'

const baseFrage = {
  id: 'dd-pool',
  typ: 'dragdrop_bild',
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
  punkte: 2,
  musterlosung: '',
  bewertungsraster: [],
  verwendungen: [],
  fragetext: 'Ordne die Labels zu.',
  bildUrl: '/bilanz.svg',
  zielzonen: [
    {
      id: 'z-links',
      form: 'rechteck',
      punkte: [{ x: 10, y: 10 }, { x: 40, y: 10 }, { x: 40, y: 40 }, { x: 10, y: 40 }],
      korrektesLabel: 'Aktiva',
    },
    {
      id: 'z-rechts',
      form: 'rechteck',
      punkte: [{ x: 60, y: 10 }, { x: 90, y: 10 }, { x: 90, y: 40 }, { x: 60, y: 40 }],
      korrektesLabel: 'Passiva',
    },
  ],
} as Omit<DDType, 'labels'>

describe('DragDropBildFrage SuS-Pool-Dedupe (Task 9.2)', () => {
  it('Doppelte Labels (case-sensitive, getrimmt) werden im Pool nur einmal angezeigt', () => {
    const frage = { ...baseFrage, labels: ['Aktiva', ' Aktiva ', 'Passiva'] } as DDType
    render(<FrageModeProvider mode="pruefung"><DragDropBildFrage frage={frage} /></FrageModeProvider>)

    // Pool-Buttons (verfuegbareLabels) — nur 1× "Aktiva" (nicht 2×)
    const aktivaTreffer = screen.getAllByText(/^Aktiva$/)
    expect(aktivaTreffer).toHaveLength(1)

    const passivaTreffer = screen.getAllByText(/^Passiva$/)
    expect(passivaTreffer).toHaveLength(1)
  })

  it('Leere/whitespace-only Labels werden gefiltert', () => {
    const frage = { ...baseFrage, labels: ['Aktiva', '', '   ', 'Passiva'] } as DDType
    render(<FrageModeProvider mode="pruefung"><DragDropBildFrage frage={frage} /></FrageModeProvider>)

    expect(screen.getAllByText(/^Aktiva$/)).toHaveLength(1)
    expect(screen.getAllByText(/^Passiva$/)).toHaveLength(1)
  })

  it('Case-sensitive: "Aktiva" und "aktiva" sind unterschiedlich', () => {
    const frage = { ...baseFrage, labels: ['Aktiva', 'aktiva'] } as DDType
    render(<FrageModeProvider mode="pruefung"><DragDropBildFrage frage={frage} /></FrageModeProvider>)

    expect(screen.getAllByText(/^Aktiva$/)).toHaveLength(1)
    expect(screen.getAllByText(/^aktiva$/)).toHaveLength(1)
  })
})
