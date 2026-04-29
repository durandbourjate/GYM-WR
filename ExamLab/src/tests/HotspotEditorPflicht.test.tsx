import { render, screen, within } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { HotspotEditor } from '@shared/index'
import { EditorProvider } from '@shared/editor/EditorContext'
import type { EditorConfig, EditorServices } from '@shared/editor/types'
import type { HotspotBereich } from '@shared/types/fragen-core'

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

const baseBereiche: HotspotBereich[] = [
  {
    id: 'b1',
    form: 'rechteck',
    punkte: [
      { x: 10, y: 10 },
      { x: 30, y: 10 },
      { x: 30, y: 30 },
      { x: 10, y: 30 },
    ],
    label: 'Bereich Alpha',
    punktzahl: 1,
  },
  {
    id: 'b2',
    form: 'polygon',
    punkte: [
      { x: 50, y: 50 },
      { x: 70, y: 50 },
      { x: 60, y: 70 },
    ],
    label: 'Bereich Beta',
    punktzahl: 1,
  },
]

function renderEditor(feldStatusBereiche?: 'pflicht-leer' | 'empfohlen-leer' | 'ok') {
  return render(
    <EditorProvider config={baseConfig} services={baseServices}>
      <HotspotEditor
        bildUrl="https://example.com/bild.png"
        setBildUrl={vi.fn()}
        bereiche={baseBereiche}
        setBereiche={vi.fn()}
        mehrfachauswahl={false}
        setMehrfachauswahl={vi.fn()}
        feldStatusBereiche={feldStatusBereiche}
      />
    </EditorProvider>,
  )
}

describe('HotspotEditor — Form-Indicator + Punkte-Count entfernt', () => {
  it('Bereichs-Liste enthält keinen Form-Indicator-Span (□/⬡) per Eintrag', () => {
    renderEditor()
    const section = screen.getByTestId('hotspot-bereiche-section')
    // Innerhalb der Bereichs-Section dürfen die Form-Indicator-Spans NICHT existieren.
    // Die Toolbar mit "□ Rechteck" / "⬡ Polygon"-Buttons liegt ausserhalb der Section.
    expect(within(section).queryByText('□')).not.toBeInTheDocument()
    expect(within(section).queryByText('⬡')).not.toBeInTheDocument()
  })

  it('Bereichs-Liste enthält keine Punkte-Count-Anzeige (□ 4 / ⬡ 3)', () => {
    renderEditor()
    const section = screen.getByTestId('hotspot-bereiche-section')
    // Suche nach dem typischen Indicator-Pattern "□ 4" oder "⬡ 3"
    expect(within(section).queryByText(/□\s*4/)).not.toBeInTheDocument()
    expect(within(section).queryByText(/⬡\s*3/)).not.toBeInTheDocument()
  })
})

describe('HotspotEditor — Pflichtfeld-Outline', () => {
  it('feldStatusBereiche=pflicht-leer → Container hat violett-Border', () => {
    renderEditor('pflicht-leer')
    const section = screen.getByTestId('hotspot-bereiche-section')
    expect(section.className).toContain('border-violet-400')
    expect(section.className).toContain('ring-violet-300')
  })

  it('feldStatusBereiche=ok → Container hat neutralen Border (kein Violett)', () => {
    renderEditor('ok')
    const section = screen.getByTestId('hotspot-bereiche-section')
    expect(section.className).toContain('border-slate-200')
    expect(section.className).not.toContain('border-violet-400')
  })

  it('feldStatusBereiche=undefined → Container hat neutralen Border (kein Violett)', () => {
    renderEditor(undefined)
    const section = screen.getByTestId('hotspot-bereiche-section')
    expect(section.className).toContain('border-slate-200')
    expect(section.className).not.toContain('border-violet-400')
  })
})
