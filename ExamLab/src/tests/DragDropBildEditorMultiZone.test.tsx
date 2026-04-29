import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DragDropBildEditor } from '@shared/index'
import { EditorProvider } from '@shared/editor/EditorContext'
import type { EditorConfig, EditorServices } from '@shared/editor/types'
import type { DragDropBildZielzone, DragDropBildLabel } from '@shared/types/fragen-core'

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

function renderEditor(opts: {
  zielzonen?: DragDropBildZielzone[]
  setZielzonen?: any
  labels?: DragDropBildLabel[]
  setLabels?: any
}) {
  return render(
    <EditorProvider config={baseConfig} services={baseServices}>
      <DragDropBildEditor
        bildUrl="https://example.com/bild.png"
        setBildUrl={vi.fn()}
        zielzonen={opts.zielzonen ?? []}
        setZielzonen={opts.setZielzonen ?? vi.fn()}
        labels={opts.labels ?? []}
        setLabels={opts.setLabels ?? vi.fn()}
      />
    </EditorProvider>,
  )
}

describe('DragDropBildEditor — Bundle J Multi-Zone', () => {
  it('Chip-Input pro Zone: Enter fügt Synonym zu korrekteLabels hinzu', () => {
    const setZielzonen = vi.fn()
    const zielzonen: DragDropBildZielzone[] = [
      { id: 'z1', form: 'rechteck', punkte: [{x:0,y:0},{x:50,y:0},{x:50,y:50},{x:0,y:50}], korrekteLabels: [] },
    ]
    renderEditor({ zielzonen, setZielzonen })
    const input = screen.getByTestId('zone-z1-chip-input') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'Marketing-Mix' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(setZielzonen).toHaveBeenCalled()
    const updater = setZielzonen.mock.calls.at(-1)?.[0]
    const result = typeof updater === 'function' ? updater(zielzonen) : updater
    expect(result[0].korrekteLabels).toEqual(['Marketing-Mix'])
  })

  it('Pool-Chip-Input erlaubt Duplikate (Multi-Zone-Tokens)', () => {
    let labels: DragDropBildLabel[] = []
    const setLabels = vi.fn((u) => { labels = typeof u === 'function' ? u(labels) : u })
    const { rerender } = renderEditor({ labels, setLabels })

    const input = screen.getByTestId('pool-chip-input') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'Aktiva' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    rerender(
      <EditorProvider config={baseConfig} services={baseServices}>
        <DragDropBildEditor
          bildUrl="https://example.com/bild.png"
          setBildUrl={vi.fn()}
          zielzonen={[]}
          setZielzonen={vi.fn()}
          labels={labels}
          setLabels={setLabels}
        />
      </EditorProvider>,
    )
    fireEvent.change(screen.getByTestId('pool-chip-input'), { target: { value: 'Aktiva' } })
    fireEvent.keyDown(screen.getByTestId('pool-chip-input'), { key: 'Enter' })

    expect(labels).toHaveLength(2)
    expect(labels[0].text).toBe('Aktiva')
    expect(labels[1].text).toBe('Aktiva')
    expect(labels[0].id).not.toBe(labels[1].id)
  })

  it('Konsistenz-Hinweis: Zone akzeptiert Text, Pool hat 0', () => {
    const zielzonen: DragDropBildZielzone[] = [
      { id: 'z1', form: 'rechteck', punkte: [{x:0,y:0},{x:50,y:0},{x:50,y:50},{x:0,y:50}], korrekteLabels: ['Soll'] },
    ]
    const labels: DragDropBildLabel[] = [{ id: 'a', text: 'Aktiva' }]
    renderEditor({ zielzonen, labels })
    const hinweis = screen.getByTestId('dnd-konsistenz')
    expect(hinweis.textContent).toMatch(/Zone 1 akzeptiert 'Soll'/)
  })
})
