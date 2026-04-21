import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import LueckentextFrage from '../components/fragetypen/LueckentextFrage.tsx'
import type { LueckentextFrage as LTType } from '../types/fragen.ts'
import type { Antwort } from '../types/antworten.ts'

const frage = {
  id: 'lt1',
  typ: 'lueckentext',
  version: 1,
  erstelltAm: '2026-04-21',
  geaendertAm: '2026-04-21',
  fachbereich: 'VWL',
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
  fragetext: 'Fülle die Lücken.',
  textMitLuecken: 'Die SNB ist die {0} der Schweiz und steuert die {1}.',
  luecken: [
    {
      id: 'l0',
      korrekteAntworten: ['Zentralbank', 'Nationalbank'],
      caseSensitive: false,
      erklaerung: 'Die SNB ist die Zentralbank.',
    },
    {
      id: 'l1',
      korrekteAntworten: ['Geldpolitik'],
      caseSensitive: false,
      erklaerung: 'Kernmandat der SNB.',
    },
  ],
} as LTType

describe('LueckentextFrage modus=loesung', () => {
  it('beide Lücken korrekt → ZoneLabel korrekt-Variante', () => {
    const antwort: Antwort = {
      typ: 'lueckentext',
      eintraege: { l0: 'Zentralbank', l1: 'Geldpolitik' },
    }
    const { container } = render(<LueckentextFrage frage={frage} antwort={antwort} modus="loesung" />)
    // Beide SuS-Antworten in grünem ZoneLabel
    const grüneLabels = container.querySelectorAll('.border-green-600')
    expect(grüneLabels.length).toBeGreaterThanOrEqual(2)
    expect(screen.getByText('Zentralbank')).toBeInTheDocument()
    expect(screen.getByText('Geldpolitik')).toBeInTheDocument()
  })

  it('eine Lücke falsch → ZoneLabel falsch-Variante mit korrekter Antwort sichtbar', () => {
    const antwort: Antwort = {
      typ: 'lueckentext',
      eintraege: { l0: 'Privatbank', l1: 'Geldpolitik' },
    }
    const { container } = render(<LueckentextFrage frage={frage} antwort={antwort} modus="loesung" />)
    // SuS-Antwort "Privatbank" rot, korrekte "Zentralbank" grün sichtbar
    expect(screen.getByText('Privatbank')).toBeInTheDocument()
    expect(screen.getByText('Zentralbank')).toBeInTheDocument()
    expect(container.querySelector('.border-red-600')).toBeTruthy()
  })

  it('case-insensitive Match zählt als korrekt', () => {
    const antwort: Antwort = {
      typ: 'lueckentext',
      eintraege: { l0: 'zentralbank', l1: 'GELDPOLITIK' },
    }
    const { container } = render(<LueckentextFrage frage={frage} antwort={antwort} modus="loesung" />)
    // Beide Lücken korrekt trotz Gross-/Klein-Abweichung
    expect(container.querySelector('.border-red-600')).toBeNull()
    const grüneLabels = container.querySelectorAll('.border-green-600')
    expect(grüneLabels.length).toBeGreaterThanOrEqual(2)
  })

  it('leere Lücke → falsch-Variante mit Placeholder', () => {
    const antwort: Antwort = {
      typ: 'lueckentext',
      eintraege: { l0: '', l1: 'Geldpolitik' },
    }
    render(<LueckentextFrage frage={frage} antwort={antwort} modus="loesung" />)
    // Placeholder-Text sichtbar
    expect(screen.getByText(/leer/i)).toBeInTheDocument()
    // Korrekte Antwort sichtbar
    expect(screen.getByText('Zentralbank')).toBeInTheDocument()
  })

  it('rendert Erklärungen pro Lücke', () => {
    const antwort: Antwort = {
      typ: 'lueckentext',
      eintraege: { l0: 'Zentralbank', l1: 'Geldpolitik' },
    }
    render(<LueckentextFrage frage={frage} antwort={antwort} modus="loesung" />)
    expect(screen.getByText(/SNB ist die Zentralbank/)).toBeInTheDocument()
    expect(screen.getByText(/Kernmandat der SNB/)).toBeInTheDocument()
  })

  it('ohne antwort → beide Lücken falsch (verpasst) mit korrekter Antwort', () => {
    const { container } = render(<LueckentextFrage frage={frage} modus="loesung" />)
    expect(screen.getByText('Zentralbank')).toBeInTheDocument()
    expect(screen.getByText('Geldpolitik')).toBeInTheDocument()
    expect(container.querySelectorAll('.border-red-600').length).toBeGreaterThanOrEqual(2)
  })

  it('keine interaktiven Inputs oder Selects im Lösungsmodus', () => {
    const antwort: Antwort = {
      typ: 'lueckentext',
      eintraege: { l0: 'Zentralbank', l1: 'Geldpolitik' },
    }
    render(<LueckentextFrage frage={frage} antwort={antwort} modus="loesung" />)
    expect(document.querySelector('input')).toBeNull()
    expect(document.querySelector('select')).toBeNull()
  })
})
