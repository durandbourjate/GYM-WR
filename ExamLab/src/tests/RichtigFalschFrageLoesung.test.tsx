import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import RichtigFalschFrage from '../components/fragetypen/RichtigFalschFrage.tsx'
import type { RichtigFalschFrage as RFType } from '../types/fragen.ts'
import type { Antwort } from '../types/antworten.ts'

const frage = {
  id: 'f1',
  typ: 'richtigfalsch',
  version: 1,
  erstelltAm: '2026-04-21',
  geaendertAm: '2026-04-21',
  fachbereich: 'Recht',
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
  fragetext: 'Welche Aussagen stimmen?',
  aussagen: [
    { id: 'a1', text: 'Die SNB ist eine Privatbank.', korrekt: false, erklaerung: 'Die SNB ist eine AG mit Sonderstatus.' },
    { id: 'a2', text: 'Die SNB steuert die Geldpolitik.', korrekt: true, erklaerung: 'Kernmandat der SNB.' },
    { id: 'a3', text: 'Die SNB ist im Ausland stationiert.', korrekt: false, erklaerung: 'Sitz in Bern und Zürich.' },
  ],
} as RFType

function zeileFuer(text: string) {
  return screen.getByText(text).closest('[data-testid="antwort-zeile"]')
}

describe('RichtigFalschFrage modus=loesung', () => {
  it('SuS-Urteil korrekt (richtig richtig) → grüne Zeile mit ✓', () => {
    const antwort: Antwort = { typ: 'richtigfalsch', bewertungen: { a2: true } }
    render(<RichtigFalschFrage frage={frage} antwort={antwort} modus="loesung" />)
    const zeile = zeileFuer('Die SNB steuert die Geldpolitik.')
    expect(zeile?.className).toMatch(/border-green/)
    expect(zeile?.textContent).toContain('\u2713')
  })

  it('SuS-Urteil korrekt (falsch falsch) → grüne Zeile mit ✗', () => {
    const antwort: Antwort = { typ: 'richtigfalsch', bewertungen: { a1: false } }
    render(<RichtigFalschFrage frage={frage} antwort={antwort} modus="loesung" />)
    const zeile = zeileFuer('Die SNB ist eine Privatbank.')
    expect(zeile?.className).toMatch(/border-green/)
    expect(zeile?.textContent).toContain('\u2717')
  })

  it('SuS-Urteil falsch (richtig falsch gesagt) → rote Zeile mit ✗', () => {
    const antwort: Antwort = { typ: 'richtigfalsch', bewertungen: { a2: false } }
    render(<RichtigFalschFrage frage={frage} antwort={antwort} modus="loesung" />)
    const zeile = zeileFuer('Die SNB steuert die Geldpolitik.')
    expect(zeile?.className).toMatch(/border-red/)
    expect(zeile?.textContent).toContain('\u2717')
    // Zusatz: korrekte Antwort war Richtig
    expect(zeile?.textContent).toMatch(/Richtig/)
  })

  it('SuS-Urteil falsch (falsch richtig gesagt) → rote Zeile mit ✓ + Zusatz', () => {
    const antwort: Antwort = { typ: 'richtigfalsch', bewertungen: { a1: true } }
    render(<RichtigFalschFrage frage={frage} antwort={antwort} modus="loesung" />)
    const zeile = zeileFuer('Die SNB ist eine Privatbank.')
    expect(zeile?.className).toMatch(/border-red/)
    expect(zeile?.textContent).toContain('\u2713')
    expect(zeile?.textContent).toMatch(/Falsch/)
  })

  it('unbewertete Aussage → leer-Marker, variant=falsch (verpasst)', () => {
    const antwort: Antwort = { typ: 'richtigfalsch', bewertungen: { a2: true } }
    render(<RichtigFalschFrage frage={frage} antwort={antwort} modus="loesung" />)
    const zeile = zeileFuer('Die SNB ist eine Privatbank.')
    expect(zeile?.querySelector('.marker-leer')).toBeTruthy()
    expect(zeile?.className).toMatch(/border-red/)
  })

  it('rendert KI-Erklärung aus aussage.erklaerung', () => {
    const antwort: Antwort = { typ: 'richtigfalsch', bewertungen: { a2: true } }
    render(<RichtigFalschFrage frage={frage} antwort={antwort} modus="loesung" />)
    expect(screen.getByText(/Kernmandat der SNB/)).toBeInTheDocument()
  })

  it('ohne antwort: alle Aussagen leer-Marker, korrekte in rot (verpasst)', () => {
    render(<RichtigFalschFrage frage={frage} modus="loesung" />)
    expect(zeileFuer('Die SNB steuert die Geldpolitik.')?.className).toMatch(/border-red/)
    expect(document.querySelector('.marker-ja')).toBeNull()
    expect(document.querySelector('.marker-nein')).toBeNull()
  })
})
