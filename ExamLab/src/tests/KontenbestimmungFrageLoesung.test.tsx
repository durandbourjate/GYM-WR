import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import KontenbestimmungFrage from '../components/fragetypen/KontenbestimmungFrage.tsx'
import type { KontenbestimmungFrage as KBType } from '../types/fragen.ts'
import type { Antwort } from '../types/antworten.ts'

const frage = {
  id: 'kb1',
  typ: 'kontenbestimmung',
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
  punkte: 2,
  musterlosung: '',
  bewertungsraster: [],
  verwendungen: [],
  aufgabentext: 'Bestimme Konten.',
  modus: 'konto_bestimmen',
  kontenauswahl: { modus: 'voll' },
  aufgaben: [
    {
      id: 'a1',
      text: 'Barverkauf',
      erwarteteAntworten: [{ kontonummer: '1000', seite: 'soll' }, { kontonummer: '3000', seite: 'haben' }],
      erklaerung: 'Bar-Konto im Soll, Verkaufserloese im Haben.',
    },
    {
      id: 'a2',
      text: 'Warenkauf auf Rechnung',
      erwarteteAntworten: [{ kontonummer: '4000', seite: 'soll' }, { kontonummer: '2000', seite: 'haben' }],
      erklaerung: 'Warenaufwand im Soll, Lieferantenverbindlichkeiten im Haben.',
    },
  ],
} as KBType

describe('KontenbestimmungFrage modus=loesung', () => {
  it('alle Konten korrekt → Aufgaben grün', () => {
    const antwort: Antwort = {
      typ: 'kontenbestimmung',
      aufgaben: {
        a1: { antworten: [{ kontonummer: '1000', seite: 'soll' }, { kontonummer: '3000', seite: 'haben' }] },
        a2: { antworten: [{ kontonummer: '4000', seite: 'soll' }, { kontonummer: '2000', seite: 'haben' }] },
      },
    }
    const { container } = render(<KontenbestimmungFrage frage={frage} antwort={antwort} modus="loesung" />)
    const grüne = container.querySelectorAll('[data-aufgabe-status="korrekt"]')
    expect(grüne.length).toBe(2)
  })

  it('eine Aufgabe falsch → rote Aufgabe + korrekter Wert sichtbar', () => {
    const antwort: Antwort = {
      typ: 'kontenbestimmung',
      aufgaben: {
        a1: { antworten: [{ kontonummer: '1100', seite: 'soll' }, { kontonummer: '3000', seite: 'haben' }] }, // 1000 falsch
        a2: { antworten: [{ kontonummer: '4000', seite: 'soll' }, { kontonummer: '2000', seite: 'haben' }] },
      },
    }
    const { container } = render(<KontenbestimmungFrage frage={frage} antwort={antwort} modus="loesung" />)
    expect(container.querySelector('[data-aufgabe-status="falsch"]')).toBeTruthy()
    expect(screen.getByText(/1000/)).toBeInTheDocument() // korrektes Konto sichtbar
  })

  it('leere Antwort pro Zeile → rot mit Placeholder', () => {
    const antwort: Antwort = {
      typ: 'kontenbestimmung',
      aufgaben: {
        a1: { antworten: [{}, { kontonummer: '3000', seite: 'haben' }] }, // leer
        a2: { antworten: [{ kontonummer: '4000', seite: 'soll' }, { kontonummer: '2000', seite: 'haben' }] },
      },
    }
    const { container } = render(<KontenbestimmungFrage frage={frage} antwort={antwort} modus="loesung" />)
    expect(container.querySelector('[data-aufgabe-status="falsch"]')).toBeTruthy()
    expect(screen.getByText(/leer/i)).toBeInTheDocument()
  })

  it('rendert Erklärungen pro Aufgabe', () => {
    render(<KontenbestimmungFrage frage={frage} modus="loesung" />)
    expect(screen.getByText(/Bar-Konto im Soll/)).toBeInTheDocument()
    expect(screen.getByText(/Warenaufwand im Soll/)).toBeInTheDocument()
  })

  it('ohne antwort: alle Aufgaben rot', () => {
    const { container } = render(<KontenbestimmungFrage frage={frage} modus="loesung" />)
    const rote = container.querySelectorAll('[data-aufgabe-status="falsch"]')
    expect(rote.length).toBe(2)
  })

  it('keine interaktiven Selects/Buttons im Lösungsmodus', () => {
    const antwort: Antwort = {
      typ: 'kontenbestimmung',
      aufgaben: {
        a1: { antworten: [{ kontonummer: '1000', seite: 'soll' }, { kontonummer: '3000', seite: 'haben' }] },
        a2: { antworten: [{ kontonummer: '4000', seite: 'soll' }, { kontonummer: '2000', seite: 'haben' }] },
      },
    }
    render(<KontenbestimmungFrage frage={frage} antwort={antwort} modus="loesung" />)
    expect(document.querySelector('select')).toBeNull()
    expect(document.querySelector('button')).toBeNull()
  })
})
