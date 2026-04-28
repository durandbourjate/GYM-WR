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

describe('DragDropBildFrage SuS-Pool-Stacks (Bundle J)', () => {
  it('Doppelte Labels (case-sensitive, getrimmt) erscheinen als ein Stack mit Counter', () => {
    const frage = { ...baseFrage, labels: ['Aktiva', ' Aktiva ', 'Passiva'] } as unknown as DDType
    render(<FrageModeProvider mode="pruefung"><DragDropBildFrage frage={frage} /></FrageModeProvider>)

    // Bundle J: 'Aktiva' und ' Aktiva ' kollabieren via trim → 1 Stack mit ×2
    expect(screen.getByTestId('pool-stack-Aktiva')).toBeInTheDocument()
    expect(screen.getByTestId('pool-stack-Aktiva').textContent).toMatch(/Aktiva\s*×2/)
    expect(screen.getByTestId('pool-stack-Passiva')).toBeInTheDocument()
    // Stack mit anzahl=1 zeigt keinen ×-Counter
    expect(screen.getByTestId('pool-stack-Passiva').textContent).not.toMatch(/×/)
  })

  it('Leere/whitespace-only Labels werden gefiltert', () => {
    const frage = { ...baseFrage, labels: ['Aktiva', '', '   ', 'Passiva'] } as unknown as DDType
    render(<FrageModeProvider mode="pruefung"><DragDropBildFrage frage={frage} /></FrageModeProvider>)

    expect(screen.getByTestId('pool-stack-Aktiva')).toBeInTheDocument()
    expect(screen.getByTestId('pool-stack-Passiva')).toBeInTheDocument()
    expect(screen.queryByTestId('pool-stack-')).toBeNull()
  })

  it('Case-sensitive: "Aktiva" und "aktiva" sind unterschiedliche Stacks', () => {
    const frage = { ...baseFrage, labels: ['Aktiva', 'aktiva'] } as unknown as DDType
    render(<FrageModeProvider mode="pruefung"><DragDropBildFrage frage={frage} /></FrageModeProvider>)

    expect(screen.getByTestId('pool-stack-Aktiva')).toBeInTheDocument()
    expect(screen.getByTestId('pool-stack-aktiva')).toBeInTheDocument()
  })
})
