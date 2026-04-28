import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { DragDropBildEditor } from '@shared/index'
import { EditorProvider } from '@shared/editor/EditorContext'
import type { EditorConfig, EditorServices } from '@shared/editor/types'
import type { DragDropBildZielzone } from '@shared/types/fragen'

const baseConfig: EditorConfig = {
  benutzer: { email: 'test@gymhofwil.ch', fachschaft: 'WR' },
  verfuegbareGefaesse: ['SF'],
  verfuegbareSemester: ['S1'],
  zeigeFiBuTypen: false,
  lpListe: [],
  features: {
    kiAssistent: false,
    anhangUpload: false,
    bewertungsraster: false,
    sharing: false,
    poolSync: false,
    performance: false,
  },
}

const baseServices: EditorServices = {
  istKIVerfuegbar: () => false,
  istUploadVerfuegbar: () => false,
}

const baseZielzonen: DragDropBildZielzone[] = [
  {
    id: 'z1',
    form: 'rechteck',
    punkte: [
      { x: 10, y: 10 },
      { x: 30, y: 10 },
      { x: 30, y: 30 },
      { x: 10, y: 30 },
    ],
    korrektesLabel: 'Aktiva',
  },
  {
    id: 'z2',
    form: 'rechteck',
    punkte: [
      { x: 50, y: 50 },
      { x: 70, y: 50 },
      { x: 70, y: 70 },
      { x: 50, y: 70 },
    ],
    korrektesLabel: 'Passiva',
  },
]

function renderEditor(opts: {
  zielzonen?: DragDropBildZielzone[]
  labels?: string[]
  setLabels?: (v: string[] | ((prev: string[]) => string[])) => void
}) {
  return render(
    <EditorProvider config={baseConfig} services={baseServices}>
      <DragDropBildEditor
        bildUrl="https://example.com/bild.png"
        setBildUrl={vi.fn()}
        zielzonen={opts.zielzonen ?? baseZielzonen}
        setZielzonen={vi.fn()}
        labels={opts.labels ?? []}
        setLabels={opts.setLabels ?? vi.fn()}
      />
    </EditorProvider>,
  )
}

describe('DragDropBildEditor — Pool-Dedupe (Task 9.1)', () => {
  it('Eingabe "Aktiva, Aktiva, Passiva" → setLabels wird mit ["Aktiva","Passiva"] aufgerufen + Warnung sichtbar', () => {
    const setLabels = vi.fn()
    renderEditor({ setLabels })

    const input = screen.getByPlaceholderText(/Label 1, Label 2/) as HTMLInputElement
    fireEvent.change(input, { target: { value: 'Aktiva, Aktiva, Passiva' } })

    expect(setLabels).toHaveBeenCalledWith(['Aktiva', 'Passiva'])
    expect(screen.getByText(/Doppelte Einträge im Pool wurden entfernt/)).toBeInTheDocument()
  })

  it('Eingabe "A, B, C" → setLabels mit ["A","B","C"] + KEINE Warnung', () => {
    const setLabels = vi.fn()
    renderEditor({ setLabels })

    const input = screen.getByPlaceholderText(/Label 1, Label 2/) as HTMLInputElement
    fireEvent.change(input, { target: { value: 'A, B, C' } })

    expect(setLabels).toHaveBeenCalledWith(['A', 'B', 'C'])
    expect(screen.queryByText(/Doppelte Einträge im Pool wurden entfernt/)).not.toBeInTheDocument()
  })
})

describe('DragDropBildEditor — Pool-Warn Auto-Dismiss nach 3s', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('Pool-Warnung verschwindet nach 3000ms', () => {
    const setLabels = vi.fn()
    renderEditor({ setLabels })

    const input = screen.getByPlaceholderText(/Label 1, Label 2/) as HTMLInputElement
    fireEvent.change(input, { target: { value: 'X, X' } })

    expect(screen.getByText(/Doppelte Einträge im Pool wurden entfernt/)).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(3000)
    })

    expect(screen.queryByText(/Doppelte Einträge im Pool wurden entfernt/)).not.toBeInTheDocument()
  })
})

describe('DragDropBildEditor — Doppellabel-Detection (Task 9.1)', () => {
  it('2 Zonen mit identischem korrektesLabel → Inline-Warnung sichtbar', () => {
    const zonenMitDoppelLabel: DragDropBildZielzone[] = [
      { ...baseZielzonen[0], korrektesLabel: 'Aktiva' },
      { ...baseZielzonen[1], korrektesLabel: 'Aktiva' },
    ]
    renderEditor({ zielzonen: zonenMitDoppelLabel })

    expect(screen.getByText(/Zonen mit identischem Label/i)).toBeInTheDocument()
    expect(screen.getByText(/„Aktiva"/)).toBeInTheDocument()
  })

  it('2 Zonen mit verschiedenen Labels → KEINE Warnung', () => {
    renderEditor({ zielzonen: baseZielzonen })

    expect(screen.queryByText(/Zonen mit identischem Label/i)).not.toBeInTheDocument()
  })

  it('Leeres korrektesLabel zählt nicht als Duplikat', () => {
    const zonen: DragDropBildZielzone[] = [
      { ...baseZielzonen[0], korrektesLabel: '' },
      { ...baseZielzonen[1], korrektesLabel: '' },
    ]
    renderEditor({ zielzonen: zonen })

    expect(screen.queryByText(/Zonen mit identischem Label/i)).not.toBeInTheDocument()
  })
})
