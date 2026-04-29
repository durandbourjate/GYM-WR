import { render, screen, within } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { BildbeschriftungEditor } from '@shared/index'
import { EditorProvider } from '@shared/editor/EditorContext'
import type { EditorConfig, EditorServices } from '@shared/editor/types'
import type { BildbeschriftungLabel } from '@shared/types/fragen-core'

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

const beschriftungenMitAntwort: BildbeschriftungLabel[] = [
  {
    id: 'b1',
    position: { x: 30, y: 40 },
    korrekt: ['Mitochondrium'],
  },
]

const beschriftungenLeer: BildbeschriftungLabel[] = [
  {
    id: 'b1',
    position: { x: 30, y: 40 },
    korrekt: [],
  },
]

const beschriftungenWhitespace: BildbeschriftungLabel[] = [
  {
    id: 'b1',
    position: { x: 30, y: 40 },
    korrekt: ['', '   '],
  },
]

function renderEditor(opts: {
  beschriftungen: BildbeschriftungLabel[]
  feldStatusBeschriftungen?: 'pflicht-leer' | 'empfohlen-leer' | 'ok'
}) {
  return render(
    <EditorProvider config={baseConfig} services={baseServices}>
      <BildbeschriftungEditor
        bildUrl="https://example.com/bild.png"
        setBildUrl={vi.fn()}
        beschriftungen={opts.beschriftungen}
        setBeschriftungen={vi.fn()}
        feldStatusBeschriftungen={opts.feldStatusBeschriftungen}
      />
    </EditorProvider>,
  )
}

describe('BildbeschriftungEditor — x/y-Number-Inputs entfernt', () => {
  it('rendert keine <input type="number"> mehr (Position nur via Drag)', () => {
    renderEditor({ beschriftungen: beschriftungenMitAntwort })
    expect(screen.queryAllByRole('spinbutton')).toHaveLength(0)
  })
})

describe('BildbeschriftungEditor — Section-Header-Hinweis', () => {
  it('zeigt den Hinweis "Marker: per Drag platzieren · Antworten kommagetrennt eingeben" über der Marker-Liste', () => {
    renderEditor({ beschriftungen: beschriftungenMitAntwort })
    expect(screen.getByText(/per Drag platzieren/i)).toBeInTheDocument()
  })
})

describe('BildbeschriftungEditor — Pflichtfeld-Outline', () => {
  it('Marker mit korrekt: [] → Antwort-Input hat border-violet-400', () => {
    renderEditor({ beschriftungen: beschriftungenLeer })
    const wrapper = screen.getByTestId('marker-b1-antworten')
    const input = within(wrapper).getByRole('textbox')
    expect(input.className).toContain('border-violet-400')
  })

  it('Marker mit korrekt: ["", "   "] (nur Whitespace) → Antwort-Input hat border-violet-400', () => {
    renderEditor({ beschriftungen: beschriftungenWhitespace })
    const wrapper = screen.getByTestId('marker-b1-antworten')
    const input = within(wrapper).getByRole('textbox')
    expect(input.className).toContain('border-violet-400')
  })

  it('Marker mit korrekt: ["Mitochondrium"] → Antwort-Input hat NICHT border-violet-400', () => {
    renderEditor({ beschriftungen: beschriftungenMitAntwort })
    const wrapper = screen.getByTestId('marker-b1-antworten')
    const input = within(wrapper).getByRole('textbox')
    expect(input.className).not.toContain('border-violet-400')
    expect(input.className).toContain('border-slate-300')
  })

  it('feldStatusBeschriftungen=pflicht-leer → Section-Container hat border-violet-400', () => {
    renderEditor({ beschriftungen: beschriftungenMitAntwort, feldStatusBeschriftungen: 'pflicht-leer' })
    const section = screen.getByTestId('bildbeschriftung-marker-section')
    expect(section.className).toContain('border-violet-400')
    expect(section.className).toContain('ring-violet-300')
  })

  it('feldStatusBeschriftungen=ok → Section-Container hat neutralen Border', () => {
    renderEditor({ beschriftungen: beschriftungenMitAntwort, feldStatusBeschriftungen: 'ok' })
    const section = screen.getByTestId('bildbeschriftung-marker-section')
    expect(section.className).toContain('border-slate-200')
    expect(section.className).not.toContain('border-violet-400')
  })

  it('feldStatusBeschriftungen=undefined → Section-Container hat neutralen Border', () => {
    renderEditor({ beschriftungen: beschriftungenMitAntwort })
    const section = screen.getByTestId('bildbeschriftung-marker-section')
    expect(section.className).toContain('border-slate-200')
    expect(section.className).not.toContain('border-violet-400')
  })
})
