import { describe, it, expect } from 'vitest'
import { pruefeAntwort } from '../utils/korrektur'
import type { Frage } from '../types/fragen'

const baseFrage: Omit<Frage, 'typ' | 'optionen' | 'korrekt' | 'aussagen' | 'luecken' | 'toleranz' | 'einheit' | 'kategorien' | 'elemente' | 'reihenfolge' | 'paare'> = {
  id: 'f1',
  fach: 'Mathe',
  thema: 'Grundlagen',
  frage: 'Test',
  schwierigkeit: 1,
  uebung: true,
  pruefungstauglich: false,
}

describe('pruefeAntwort', () => {
  it('MC: korrekte Antwort', () => {
    const frage: Frage = { ...baseFrage, typ: 'mc', optionen: ['A', 'B', 'C'], korrekt: 'B' }
    expect(pruefeAntwort(frage, { typ: 'mc', gewaehlt: 'B' })).toBe(true)
  })

  it('MC: falsche Antwort', () => {
    const frage: Frage = { ...baseFrage, typ: 'mc', optionen: ['A', 'B', 'C'], korrekt: 'B' }
    expect(pruefeAntwort(frage, { typ: 'mc', gewaehlt: 'A' })).toBe(false)
  })

  it('Multi: alle korrekt', () => {
    const frage: Frage = { ...baseFrage, typ: 'multi', optionen: ['A', 'B', 'C'], korrekt: ['A', 'C'] }
    expect(pruefeAntwort(frage, { typ: 'multi', gewaehlt: ['C', 'A'] })).toBe(true)
  })

  it('Multi: nicht alle gewaehlt', () => {
    const frage: Frage = { ...baseFrage, typ: 'multi', optionen: ['A', 'B', 'C'], korrekt: ['A', 'C'] }
    expect(pruefeAntwort(frage, { typ: 'multi', gewaehlt: ['A'] })).toBe(false)
  })

  it('TF: alle richtig', () => {
    const frage: Frage = { ...baseFrage, typ: 'tf', aussagen: [{ text: 'Stimmt', korrekt: true }, { text: 'Falsch', korrekt: false }] }
    expect(pruefeAntwort(frage, { typ: 'tf', bewertungen: { '0': true, '1': false } })).toBe(true)
  })

  it('Fill: korrekte Luecken (case-insensitive)', () => {
    const frage: Frage = { ...baseFrage, typ: 'fill', luecken: [{ id: 'l1', korrekt: 'Angebot' }] }
    expect(pruefeAntwort(frage, { typ: 'fill', eintraege: { l1: 'angebot' } })).toBe(true)
  })

  it('Calc: innerhalb Toleranz', () => {
    const frage: Frage = { ...baseFrage, typ: 'calc', korrekt: '42.5', toleranz: 0.5 }
    expect(pruefeAntwort(frage, { typ: 'calc', wert: '42.3' })).toBe(true)
  })

  it('Calc: ausserhalb Toleranz', () => {
    const frage: Frage = { ...baseFrage, typ: 'calc', korrekt: '42.5', toleranz: 0.1 }
    expect(pruefeAntwort(frage, { typ: 'calc', wert: '43.0' })).toBe(false)
  })

  it('Sort: alle korrekt zugeordnet', () => {
    const frage: Frage = {
      ...baseFrage, typ: 'sort',
      kategorien: ['A', 'B'],
      elemente: [{ text: 'x', kategorie: 'A' }, { text: 'y', kategorie: 'B' }],
    }
    expect(pruefeAntwort(frage, { typ: 'sort', zuordnungen: { x: 'A', y: 'B' } })).toBe(true)
  })

  it('Sortierung: korrekte Reihenfolge', () => {
    const frage: Frage = { ...baseFrage, typ: 'sortierung', reihenfolge: ['A', 'B', 'C'] }
    expect(pruefeAntwort(frage, { typ: 'sortierung', reihenfolge: ['A', 'B', 'C'] })).toBe(true)
  })

  it('Sortierung: falsche Reihenfolge', () => {
    const frage: Frage = { ...baseFrage, typ: 'sortierung', reihenfolge: ['A', 'B', 'C'] }
    expect(pruefeAntwort(frage, { typ: 'sortierung', reihenfolge: ['C', 'A', 'B'] })).toBe(false)
  })

  it('Zuordnung: alle Paare korrekt', () => {
    const frage: Frage = { ...baseFrage, typ: 'zuordnung', paare: [{ links: 'a', rechts: '1' }, { links: 'b', rechts: '2' }] }
    expect(pruefeAntwort(frage, { typ: 'zuordnung', paare: { a: '1', b: '2' } })).toBe(true)
  })
})
