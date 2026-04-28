import { render, screen, within } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
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
    korrektesLabel: 'Label Alpha',
  },
  {
    id: 'z2',
    form: 'polygon',
    punkte: [
      { x: 50, y: 50 },
      { x: 70, y: 50 },
      { x: 60, y: 70 },
    ],
    korrektesLabel: 'Label Beta',
  },
]

const baseLabels = ['Label Alpha', 'Label Beta']

function renderEditor(feldStatusZielzonen?: 'pflicht-leer' | 'empfohlen-leer' | 'ok') {
  return render(
    <EditorProvider config={baseConfig} services={baseServices}>
      <DragDropBildEditor
        bildUrl="https://example.com/bild.png"
        setBildUrl={vi.fn()}
        zielzonen={baseZielzonen}
        setZielzonen={vi.fn()}
        labels={baseLabels}
        setLabels={vi.fn()}
        feldStatusZielzonen={feldStatusZielzonen}
      />
    </EditorProvider>,
  )
}

describe('DragDropBildEditor — Form-Indicator + Punkte-Count entfernt', () => {
  it('Zielzonen-Liste enthält keinen Form-Indicator-Span (□/⬡) per Eintrag', () => {
    renderEditor()
    const section = screen.getByTestId('dnd-zielzonen-section')
    expect(within(section).queryByText('□')).not.toBeInTheDocument()
    expect(within(section).queryByText('⬡')).not.toBeInTheDocument()
  })

  it('Zielzonen-Liste enthält keine Punkte-Count-Anzeige (□ 4 / ⬡ 3)', () => {
    renderEditor()
    const section = screen.getByTestId('dnd-zielzonen-section')
    expect(within(section).queryByText(/□\s*4/)).not.toBeInTheDocument()
    expect(within(section).queryByText(/⬡\s*3/)).not.toBeInTheDocument()
  })
})

describe('DragDropBildEditor — Pflichtfeld-Outline', () => {
  it('feldStatusZielzonen=pflicht-leer → Container hat violett-Border', () => {
    renderEditor('pflicht-leer')
    const section = screen.getByTestId('dnd-zielzonen-section')
    expect(section.className).toContain('border-violet-400')
    expect(section.className).toContain('ring-violet-300')
  })

  it('feldStatusZielzonen=ok → Container hat neutralen Border (kein Violett)', () => {
    renderEditor('ok')
    const section = screen.getByTestId('dnd-zielzonen-section')
    expect(section.className).toContain('border-slate-200')
    expect(section.className).not.toContain('border-violet-400')
  })

  it('feldStatusZielzonen=undefined → Container hat neutralen Border (kein Violett)', () => {
    renderEditor(undefined)
    const section = screen.getByTestId('dnd-zielzonen-section')
    expect(section.className).toContain('border-slate-200')
    expect(section.className).not.toContain('border-violet-400')
  })
})
