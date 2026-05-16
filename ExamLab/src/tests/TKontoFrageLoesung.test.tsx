import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import TKontoFrage from '../components/fragetypen/TKontoFrage.tsx'
import type { TKontoFrage as TKType } from '../types/fragen-storage'
import type { Antwort } from '../types/antworten.ts'

const frage = {
  id: 'tk1',
  typ: 'tkonto',
  version: 1,
  erstelltAm: '2026-04-21',
  geaendertAm: '2026-04-21',
  fachbereich: 'BWL',
  fach: 'SF WR',
  thema: 'Test',
  semester: [],
  gefaesse: [],
  bloom: 'K3',
  tags: [],
  tagIds: [],
  punkte: 2,
  musterlosung: 'Das Konto Kasse ist ein Aktivkonto.',
  bewertungsraster: [],
  verwendungen: [],
  aufgabentext: 'Fuehre das Konto Kasse.',
  konten: [
    {
      id: 'k1',
      kontonummer: '1000',
      anfangsbestand: 1000,
      anfangsbestandVorgegeben: true,
      eintraege: [
        { seite: 'soll', gegenkonto: '3000', betrag: 500 },
        { seite: 'haben', gegenkonto: '2000', betrag: 200 },
      ],
      saldo: { betrag: 1300, seite: 'haben' },
    },
  ],
  kontenauswahl: { modus: 'voll' },
  bewertungsoptionen: {
    beschriftungSollHaben: true,
    kontenkategorie: false,
    zunahmeAbnahme: false,
    buchungenKorrekt: true,
    saldoKorrekt: true,
  },
} as TKType

describe('TKontoFrage modus=loesung', () => {
  it('alle Eintraege korrekt → grüner Rahmen', () => {
    const antwort: Antwort = {
      typ: 'tkonto',
      konten: [{
        id: 'k1',
        eintraegeLinks: [{ gegenkonto: '3000', betrag: 500 }],
        eintraegeRechts: [{ gegenkonto: '2000', betrag: 200 }],
        saldo: { betragLinks: 1500, betragRechts: 1500 },
      }],
    }
    const { container } = render(<TKontoFrage frage={frage} antwort={antwort} modus="loesung" />)
    expect(container.querySelectorAll('.border-green-600').length).toBeGreaterThanOrEqual(1)
    expect(container.querySelector('.border-red-600')).toBeNull()
  })

  it('fehlender Soll-Eintrag → roter Rahmen + korrektes Gegenkonto sichtbar', () => {
    const antwort: Antwort = {
      typ: 'tkonto',
      konten: [{
        id: 'k1',
        eintraegeLinks: [], // 3000/500 fehlt
        eintraegeRechts: [{ gegenkonto: '2000', betrag: 200 }],
      }],
    }
    const { container } = render(<TKontoFrage frage={frage} antwort={antwort} modus="loesung" />)
    expect(container.querySelector('.border-red-600')).toBeTruthy()
    // Fehlendes Gegenkonto 3000 sichtbar
    expect(screen.getByText(/3000/)).toBeInTheDocument()
  })

  it('falscher Betrag → roter Rahmen', () => {
    const antwort: Antwort = {
      typ: 'tkonto',
      konten: [{
        id: 'k1',
        eintraegeLinks: [{ gegenkonto: '3000', betrag: 999 }], // Betrag falsch
        eintraegeRechts: [{ gegenkonto: '2000', betrag: 200 }],
      }],
    }
    const { container } = render(<TKontoFrage frage={frage} antwort={antwort} modus="loesung" />)
    expect(container.querySelector('.border-red-600')).toBeTruthy()
  })

  it('überflüssige SuS-Einträge → roter Rahmen + als falsch markiert', () => {
    const antwort: Antwort = {
      typ: 'tkonto',
      konten: [{
        id: 'k1',
        eintraegeLinks: [
          { gegenkonto: '3000', betrag: 500 }, // korrekt
          { gegenkonto: '9999', betrag: 42 },  // ueberfluessig
        ],
        eintraegeRechts: [{ gegenkonto: '2000', betrag: 200 }],
      }],
    }
    const { container } = render(<TKontoFrage frage={frage} antwort={antwort} modus="loesung" />)
    expect(container.querySelector('.border-red-600')).toBeTruthy()
    expect(screen.getByText(/9999/)).toBeInTheDocument()
  })

  it('ohne antwort → alle korrekten Eintraege rot als fehlend', () => {
    const { container } = render(<TKontoFrage frage={frage} modus="loesung" />)
    expect(container.querySelector('.border-red-600')).toBeTruthy()
    expect(screen.getByText(/3000/)).toBeInTheDocument()
    expect(screen.getByText(/2000/)).toBeInTheDocument()
  })

  it('rendert Musterlösung', () => {
    render(<TKontoFrage frage={frage} modus="loesung" />)
    expect(screen.getByText(/Kasse ist ein Aktivkonto/)).toBeInTheDocument()
  })

  it('keine interaktiven Inputs im Lösungsmodus', () => {
    const antwort: Antwort = {
      typ: 'tkonto',
      konten: [{
        id: 'k1',
        eintraegeLinks: [{ gegenkonto: '3000', betrag: 500 }],
        eintraegeRechts: [{ gegenkonto: '2000', betrag: 200 }],
      }],
    }
    render(<TKontoFrage frage={frage} antwort={antwort} modus="loesung" />)
    expect(document.querySelector('input')).toBeNull()
    expect(document.querySelector('select')).toBeNull()
    expect(document.querySelector('button')).toBeNull()
  })

  it('crasht nicht wenn konto.saldo undefined ist (Datendrift-Robustheit)', () => {
    const frageOhneSaldo = {
      ...frage,
      konten: [{ ...frage.konten[0], saldo: undefined }],
    } as unknown as TKType
    expect(() => {
      render(<TKontoFrage frage={frageOhneSaldo} modus="loesung" />)
    }).not.toThrow()
    // Erwarteter-Saldo-Block fehlt komplett wenn saldo undefined
    expect(screen.queryByText(/Erwarteter Saldo/)).toBeNull()
  })

  it('crasht nicht wenn eintraege[i].betrag undefined ist (Datendrift-Robustheit)', () => {
    const frageOhneBetrag = {
      ...frage,
      konten: [{
        ...frage.konten[0],
        eintraege: [
          { seite: 'soll', gegenkonto: '3000' },
          { seite: 'haben', gegenkonto: '2000' },
        ],
      }],
    } as unknown as TKType
    expect(() => {
      render(<TKontoFrage frage={frageOhneBetrag} modus="loesung" />)
    }).not.toThrow()
  })
})
