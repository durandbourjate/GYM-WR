import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import HotspotFrage from '../components/fragetypen/HotspotFrage.tsx'
import type { HotspotFrage as HSType } from '../types/fragen-storage'
import type { Antwort } from '../types/antworten.ts'

// Polygon 1: Quadrat 10-30 / 10-30
// Polygon 2: Quadrat 60-80 / 60-80
const frage = {
  id: 'hs1',
  typ: 'hotspot',
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
  tagIds: [],
  punkte: 2,
  musterlosung: '',
  bewertungsraster: [],
  verwendungen: [],
  fragetext: 'Klicke auf die richtigen Bereiche.',
  bild: { typ: 'app', appPfad: 'test.svg', mimeType: 'image/svg+xml' },
  mehrfachauswahl: true,
  bereiche: [
    {
      id: 'b1',
      form: 'rechteck',
      punkte: [{x:10,y:10},{x:30,y:10},{x:30,y:30},{x:10,y:30}],
      label: 'Bereich Alpha',
      punktzahl: 1,
      erklaerung: 'Alpha ist korrekt.',
    },
    {
      id: 'b2',
      form: 'rechteck',
      punkte: [{x:60,y:60},{x:80,y:60},{x:80,y:80},{x:60,y:80}],
      label: 'Bereich Beta',
      punktzahl: 1,
      erklaerung: 'Beta ist korrekt.',
    },
  ],
} as HSType

describe('HotspotFrage modus=loesung', () => {
  it('Klick in korrektem Bereich → grüner Marker', () => {
    const antwort: Antwort = {
      typ: 'hotspot',
      klicks: [{ x: 20, y: 20 }], // trifft b1
    }
    const { container } = render(<HotspotFrage frage={frage} antwort={antwort} modus="loesung" />)
    const grüneKlicks = container.querySelectorAll('[data-klick-status="korrekt"]')
    expect(grüneKlicks.length).toBe(1)
  })

  it('Klick daneben → roter Marker', () => {
    const antwort: Antwort = {
      typ: 'hotspot',
      klicks: [{ x: 50, y: 50 }], // daneben
    }
    const { container } = render(<HotspotFrage frage={frage} antwort={antwort} modus="loesung" />)
    const roteKlicks = container.querySelectorAll('[data-klick-status="falsch"]')
    expect(roteKlicks.length).toBe(1)
  })

  it('gemischte Klicks → korrekte grün, falsche rot', () => {
    const antwort: Antwort = {
      typ: 'hotspot',
      klicks: [
        { x: 20, y: 20 }, // trifft b1
        { x: 50, y: 50 }, // daneben
        { x: 70, y: 70 }, // trifft b2
      ],
    }
    const { container } = render(<HotspotFrage frage={frage} antwort={antwort} modus="loesung" />)
    expect(container.querySelectorAll('[data-klick-status="korrekt"]').length).toBe(2)
    expect(container.querySelectorAll('[data-klick-status="falsch"]').length).toBe(1)
  })

  it('rendert Bereich-Labels in der Liste', () => {
    render(<HotspotFrage frage={frage} modus="loesung" />)
    expect(screen.getByText('Bereich Alpha')).toBeInTheDocument()
    expect(screen.getByText('Bereich Beta')).toBeInTheDocument()
  })

  it('rendert Erklärungen pro Bereich', () => {
    render(<HotspotFrage frage={frage} modus="loesung" />)
    expect(screen.getByText(/Alpha ist korrekt/)).toBeInTheDocument()
    expect(screen.getByText(/Beta ist korrekt/)).toBeInTheDocument()
  })

  it('getroffener Bereich wird als korrekt markiert, nicht getroffener als verpasst', () => {
    const antwort: Antwort = {
      typ: 'hotspot',
      klicks: [{ x: 20, y: 20 }], // nur b1 getroffen
    }
    const { container } = render(<HotspotFrage frage={frage} antwort={antwort} modus="loesung" />)
    const b1Row = container.querySelector('[data-bereich-id="b1"]')
    const b2Row = container.querySelector('[data-bereich-id="b2"]')
    expect(b1Row?.getAttribute('data-status')).toBe('getroffen')
    expect(b2Row?.getAttribute('data-status')).toBe('verpasst')
  })

  it('ohne antwort: alle Bereiche verpasst, keine Klick-Marker', () => {
    const { container } = render(<HotspotFrage frage={frage} modus="loesung" />)
    expect(container.querySelectorAll('[data-klick-status]').length).toBe(0)
    expect(container.querySelector('[data-bereich-id="b1"]')?.getAttribute('data-status')).toBe('verpasst')
  })

  it('zeigt Polygone als SVG-Overlay', () => {
    const { container } = render(<HotspotFrage frage={frage} modus="loesung" />)
    const polygone = container.querySelectorAll('svg polygon')
    expect(polygone.length).toBe(2)
  })
})
