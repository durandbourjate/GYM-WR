import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import MCFrage from '../components/fragetypen/MCFrage.tsx'
import type { MCFrage as MCFrageType } from '../types/fragen-storage'
import type { Antwort } from '../types/antworten.ts'

// Test-Fixture: Nur die in MCFrage.tsx genutzten Felder werden gesetzt.
// Verbleibende FrageBase-Pflichtfelder sind für die Render-Logik irrelevant.
const frage = {
  id: 'f1',
  typ: 'mc',
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
  punkte: 1,
  musterlosung: '',
  bewertungsraster: [],
  verwendungen: [],
  mehrfachauswahl: true,
  zufallsreihenfolge: false,
  fragetext: 'Frage',
  optionen: [
    { id: 'a', text: 'Option A', korrekt: true, erklaerung: 'Weil A richtig' },
    { id: 'b', text: 'Option B', korrekt: false, erklaerung: 'B ist falsch, weil...' },
    { id: 'c', text: 'Option C', korrekt: true, erklaerung: 'C ist auch richtig' },
    { id: 'd', text: 'Option D', korrekt: false, erklaerung: 'D ist falsch' },
  ],
} as MCFrageType

function zeileFuer(label: string) {
  return screen.getByText(label).closest('[data-testid="antwort-zeile"]')
}

describe('MCFrage modus=loesung', () => {
  it('gewählt+korrekt zeigt grüne Zeile mit Check-Icon', () => {
    const antwort: Antwort = { typ: 'mc', gewaehlteOptionen: ['a'] }
    render(<MCFrage frage={frage} antwort={antwort} modus="loesung" />)
    const zeileA = zeileFuer('Option A')
    expect(zeileA?.className).toMatch(/border-green/)
    expect(zeileA?.querySelector('svg.lucide-check')).toBeTruthy()
  })

  it('gewählt+falsch zeigt rote Zeile mit Check-Icon (Marker immer grün bei Wahl)', () => {
    const antwort: Antwort = { typ: 'mc', gewaehlteOptionen: ['b'] }
    render(<MCFrage frage={frage} antwort={antwort} modus="loesung" />)
    const zeileB = zeileFuer('Option B')
    expect(zeileB?.className).toMatch(/border-red/)
    expect(zeileB?.querySelector('svg.lucide-check')).toBeTruthy()
  })

  it('nicht-gewählt+wäre-korrekt zeigt rote Zeile ohne Marker', () => {
    const antwort: Antwort = { typ: 'mc', gewaehlteOptionen: ['a'] }
    render(<MCFrage frage={frage} antwort={antwort} modus="loesung" />)
    const zeileC = zeileFuer('Option C')
    expect(zeileC?.className).toMatch(/border-red/)
    expect(zeileC?.querySelector('.marker-leer')).toBeTruthy()
    expect(zeileC?.querySelector('.marker-ja')).toBeFalsy()
    expect(zeileC?.querySelector('.marker-nein')).toBeFalsy()
  })

  it('nicht-gewählt+falsch zeigt neutrale Zeile', () => {
    const antwort: Antwort = { typ: 'mc', gewaehlteOptionen: ['a'] }
    render(<MCFrage frage={frage} antwort={antwort} modus="loesung" />)
    const zeileD = zeileFuer('Option D')
    expect(zeileD?.className).not.toMatch(/border-(red|green)-600/)
  })

  it('rendert KI-Erklärung wenn erklaerung vorhanden', () => {
    const antwort: Antwort = { typ: 'mc', gewaehlteOptionen: ['a'] }
    render(<MCFrage frage={frage} antwort={antwort} modus="loesung" />)
    expect(screen.getByText(/Weil A richtig/)).toBeInTheDocument()
    expect(screen.getByText(/B ist falsch/)).toBeInTheDocument()
  })

  it('ohne antwort rendert alle Optionen ohne Auswahl-Marker (nichts gewählt)', () => {
    render(<MCFrage frage={frage} modus="loesung" />)
    // Korrekte Antworten A und C sollen rot umrandet sein (verpasst), falsche neutral
    expect(zeileFuer('Option A')?.className).toMatch(/border-red/)
    expect(zeileFuer('Option C')?.className).toMatch(/border-red/)
    // Keine ja/nein-Marker
    expect(document.querySelector('.marker-ja')).toBeNull()
    expect(document.querySelector('.marker-nein')).toBeNull()
  })
})
