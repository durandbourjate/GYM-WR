import { describe, it, expect } from 'vitest'
import { pruefeAntwort } from '../utils/korrektur'
import type { Frage } from '../types/fragen'
const BASIS = {
  version: 1, erstelltAm: '', geaendertAm: '',
  fachbereich: 'VWL' as const, fach: 'Mathe', semester: [] as string[], gefaesse: [] as string[],
  bloom: 'K2' as const, tags: [] as string[], punkte: 1, musterlosung: '',
  bewertungsraster: [], verwendungen: [],
  thema: 'Grundlagen', schwierigkeit: 1,
}

describe('pruefeAntwort', () => {
  it('MC: korrekte Antwort', () => {
    const frage: Frage = {
      ...BASIS, id: 'f1', typ: 'mc', fragetext: 'Test',
      optionen: [
        { id: '1', text: 'A', korrekt: false },
        { id: '2', text: 'B', korrekt: true },
        { id: '3', text: 'C', korrekt: false },
      ],
      mehrfachauswahl: false, zufallsreihenfolge: false,
    }
    expect(pruefeAntwort(frage, { typ: 'mc', gewaehlt: '2' })).toBe(true)
  })

  it('MC: falsche Antwort', () => {
    const frage: Frage = {
      ...BASIS, id: 'f1', typ: 'mc', fragetext: 'Test',
      optionen: [
        { id: '1', text: 'A', korrekt: false },
        { id: '2', text: 'B', korrekt: true },
        { id: '3', text: 'C', korrekt: false },
      ],
      mehrfachauswahl: false, zufallsreihenfolge: false,
    }
    expect(pruefeAntwort(frage, { typ: 'mc', gewaehlt: '1' })).toBe(false)
  })

  it('Multi: alle korrekt', () => {
    const frage: Frage = {
      ...BASIS, id: 'f1', typ: 'mc', fragetext: 'Test',
      optionen: [
        { id: '1', text: 'A', korrekt: true },
        { id: '2', text: 'B', korrekt: false },
        { id: '3', text: 'C', korrekt: true },
      ],
      mehrfachauswahl: true, zufallsreihenfolge: false,
    }
    expect(pruefeAntwort(frage, { typ: 'multi', gewaehlt: ['3', '1'] })).toBe(true)
  })

  it('Multi: nicht alle gewaehlt', () => {
    const frage: Frage = {
      ...BASIS, id: 'f1', typ: 'mc', fragetext: 'Test',
      optionen: [
        { id: '1', text: 'A', korrekt: true },
        { id: '2', text: 'B', korrekt: false },
        { id: '3', text: 'C', korrekt: true },
      ],
      mehrfachauswahl: true, zufallsreihenfolge: false,
    }
    expect(pruefeAntwort(frage, { typ: 'multi', gewaehlt: ['1'] })).toBe(false)
  })

  it('TF: alle richtig', () => {
    const frage: Frage = {
      ...BASIS, id: 'f1', typ: 'richtigfalsch', fragetext: 'Test',
      aussagen: [
        { id: 'a1', text: 'Stimmt', korrekt: true },
        { id: 'a2', text: 'Falsch', korrekt: false },
      ],
    }
    expect(pruefeAntwort(frage, { typ: 'richtigfalsch', bewertungen: { a1: true, a2: false } })).toBe(true)
  })

  it('Fill: korrekte Luecken (case-insensitive)', () => {
    const frage: Frage = {
      ...BASIS, id: 'f1', typ: 'lueckentext', fragetext: 'Test',
      textMitLuecken: 'Das {{l1}} bestimmt den Preis.',
      luecken: [{ id: 'l1', korrekteAntworten: ['Angebot'], caseSensitive: false }],
    }
    expect(pruefeAntwort(frage, { typ: 'lueckentext', eintraege: { l1: 'angebot' } })).toBe(true)
  })

  it('Calc: innerhalb Toleranz', () => {
    const frage: Frage = {
      ...BASIS, id: 'f1', typ: 'berechnung', fragetext: 'Test',
      ergebnisse: [{ id: 'e1', label: 'Ergebnis', korrekt: 42.5, toleranz: 0.5 }],
      rechenwegErforderlich: false,
    }
    expect(pruefeAntwort(frage, { typ: 'berechnung', wert: '42.3' })).toBe(true)
  })

  it('Calc: ausserhalb Toleranz', () => {
    const frage: Frage = {
      ...BASIS, id: 'f1', typ: 'berechnung', fragetext: 'Test',
      ergebnisse: [{ id: 'e1', label: 'Ergebnis', korrekt: 42.5, toleranz: 0.1 }],
      rechenwegErforderlich: false,
    }
    expect(pruefeAntwort(frage, { typ: 'berechnung', wert: '43.0' })).toBe(false)
  })

  it('Sortierung: korrekte Reihenfolge', () => {
    const frage: Frage = {
      ...BASIS, id: 'f1', typ: 'sortierung', fragetext: 'Test',
      elemente: ['A', 'B', 'C'], teilpunkte: false,
    }
    expect(pruefeAntwort(frage, { typ: 'sortierung', reihenfolge: ['A', 'B', 'C'] })).toBe(true)
  })

  it('Sortierung: falsche Reihenfolge', () => {
    const frage: Frage = {
      ...BASIS, id: 'f1', typ: 'sortierung', fragetext: 'Test',
      elemente: ['A', 'B', 'C'], teilpunkte: false,
    }
    expect(pruefeAntwort(frage, { typ: 'sortierung', reihenfolge: ['C', 'A', 'B'] })).toBe(false)
  })

  it('Zuordnung: alle Paare korrekt', () => {
    const frage: Frage = {
      ...BASIS, id: 'f1', typ: 'zuordnung', fragetext: 'Test',
      paare: [{ links: 'a', rechts: '1' }, { links: 'b', rechts: '2' }],
      zufallsreihenfolge: false,
    }
    expect(pruefeAntwort(frage, { typ: 'zuordnung', paare: { a: '1', b: '2' } })).toBe(true)
  })
})
