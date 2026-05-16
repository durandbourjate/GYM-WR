import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ZuordnungFrage from '../components/fragetypen/ZuordnungFrage.tsx'
import type { ZuordnungFrage as ZuordnungFrageType } from '../types/fragen-storage'
import type { Antwort } from '../types/antworten.ts'

const frage = {
  id: 'zf1',
  typ: 'zuordnung',
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
  punkte: 3,
  musterlosung: '',
  bewertungsraster: [],
  verwendungen: [],
  fragetext: 'Ordne zu',
  zufallsreihenfolge: false,
  paare: [
    { links: 'Bilanz', rechts: 'Passiva', erklaerung: 'Bilanz-Gleichung: A = P' },
    { links: 'Erfolgsrechnung', rechts: 'Aufwand', erklaerung: 'ER zeigt Ertrag/Aufwand' },
    { links: 'Anlagevermoegen', rechts: 'Aktiva', erklaerung: 'Lang nutzbar → Aktiva' },
  ],
} as ZuordnungFrageType

function zeileFuer(text: string) {
  return screen.getByText(text).closest('[data-testid="zuordnung-zeile"]')
}

describe('ZuordnungFrage modus=loesung', () => {
  it('alle korrekt → alle Zeilen grün', () => {
    const antwort: Antwort = {
      typ: 'zuordnung',
      zuordnungen: { Bilanz: 'Passiva', Erfolgsrechnung: 'Aufwand', Anlagevermoegen: 'Aktiva' },
    }
    render(<ZuordnungFrage frage={frage} antwort={antwort} modus="loesung" />)
    expect(zeileFuer('Bilanz')?.className).toMatch(/border-green/)
    expect(zeileFuer('Erfolgsrechnung')?.className).toMatch(/border-green/)
    expect(zeileFuer('Anlagevermoegen')?.className).toMatch(/border-green/)
  })

  it('falsche Zuordnung → rote Zeile + korrekte Antwort sichtbar', () => {
    const antwort: Antwort = {
      typ: 'zuordnung',
      zuordnungen: { Bilanz: 'Aktiva', Erfolgsrechnung: 'Aufwand', Anlagevermoegen: 'Aktiva' },
    }
    render(<ZuordnungFrage frage={frage} antwort={antwort} modus="loesung" />)
    const zeile = zeileFuer('Bilanz')
    expect(zeile?.className).toMatch(/border-red/)
    // SuS-Antwort: Aktiva, Korrekt: Passiva
    expect(zeile?.textContent).toContain('Passiva')
    expect(zeile?.textContent).toContain('Aktiva')
  })

  it('nicht zugeordnet → rote Zeile als verpasst, korrekte Antwort sichtbar', () => {
    const antwort: Antwort = {
      typ: 'zuordnung',
      zuordnungen: { Erfolgsrechnung: 'Aufwand' },
    }
    render(<ZuordnungFrage frage={frage} antwort={antwort} modus="loesung" />)
    const zeile = zeileFuer('Bilanz')
    expect(zeile?.className).toMatch(/border-red/)
    expect(zeile?.textContent).toContain('Passiva')
  })

  it('rendert Erklärungen pro Paar', () => {
    const antwort: Antwort = {
      typ: 'zuordnung',
      zuordnungen: { Bilanz: 'Passiva', Erfolgsrechnung: 'Aufwand', Anlagevermoegen: 'Aktiva' },
    }
    render(<ZuordnungFrage frage={frage} antwort={antwort} modus="loesung" />)
    expect(screen.getByText(/Bilanz-Gleichung/)).toBeInTheDocument()
    expect(screen.getByText(/ER zeigt Ertrag/)).toBeInTheDocument()
    expect(screen.getByText(/Lang nutzbar/)).toBeInTheDocument()
  })

  it('ohne antwort: alle Zeilen rot (alle verpasst), keine Select-Elemente', () => {
    render(<ZuordnungFrage frage={frage} modus="loesung" />)
    expect(zeileFuer('Bilanz')?.className).toMatch(/border-red/)
    expect(zeileFuer('Erfolgsrechnung')?.className).toMatch(/border-red/)
    // Keine interaktiven Selects im Lösungsmodus
    expect(document.querySelector('select')).toBeNull()
  })
})
