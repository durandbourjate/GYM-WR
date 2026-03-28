import { describe, it, expect } from 'vitest'
import { istAutoKorrigierbar, autoKorrigiere } from './autoKorrektur'
import type { Frage, MCFrage, RichtigFalschFrage } from '../types/fragen'
import type { Antwort } from '../types/antworten'

describe('istAutoKorrigierbar', () => {
  it.each([
    'mc', 'richtigfalsch', 'lueckentext', 'zuordnung', 'berechnung',
    'buchungssatz', 'tkonto', 'kontenbestimmung', 'bilanzstruktur',
  ])('gibt true für %s', (typ) => {
    expect(istAutoKorrigierbar(typ)).toBe(true)
  })

  it.each(['freitext', 'pdf', 'visualisierung', 'aufgabengruppe'])('gibt false für %s', (typ) => {
    expect(istAutoKorrigierbar(typ)).toBe(false)
  })
})

// Minimale Frage-Factory für MC
function makeMCFrage(optionen: { id: string; text: string; korrekt: boolean }[], mehrfach = false): MCFrage {
  return {
    id: 'mc-1',
    typ: 'mc',
    version: 1,
    erstelltAm: '2026-01-01',
    geaendertAm: '2026-01-01',
    fachbereich: 'VWL',
    fach: 'Wirtschaft & Recht',
    thema: 'Test',
    semester: ['S3'],
    gefaesse: ['SF'],
    bloom: 'K1',
    tags: [],
    punkte: 2,
    musterlosung: '',
    bewertungsraster: [],
    verwendungen: [],
    fragetext: 'Welche?',
    optionen,
    mehrfachauswahl: mehrfach,
    zufallsreihenfolge: false,
  }
}

describe('autoKorrigiere', () => {
  it('gibt null bei nicht-auto-korrigierbarem Typ', () => {
    const frage = { id: 'f1', typ: 'freitext', punkte: 3 } as Frage
    expect(autoKorrigiere(frage, undefined)).toBeNull()
  })

  it('gibt 0 Punkte bei fehlender Antwort', () => {
    const frage = makeMCFrage([{ id: 'o1', text: 'A', korrekt: true }])
    const result = autoKorrigiere(frage, undefined)
    expect(result).not.toBeNull()
    expect(result!.erreichtePunkte).toBe(0)
    expect(result!.maxPunkte).toBe(2)
  })

  it('korrigiert MC Einfachauswahl korrekt', () => {
    const frage = makeMCFrage([
      { id: 'o1', text: 'A', korrekt: true },
      { id: 'o2', text: 'B', korrekt: false },
    ])
    const antwort: Antwort = { typ: 'mc', gewaehlteOptionen: ['o1'] }
    const result = autoKorrigiere(frage, antwort)
    expect(result).not.toBeNull()
    expect(result!.erreichtePunkte).toBe(2)
  })

  it('korrigiert MC Einfachauswahl falsch', () => {
    const frage = makeMCFrage([
      { id: 'o1', text: 'A', korrekt: true },
      { id: 'o2', text: 'B', korrekt: false },
    ])
    const antwort: Antwort = { typ: 'mc', gewaehlteOptionen: ['o2'] }
    const result = autoKorrigiere(frage, antwort)
    expect(result).not.toBeNull()
    expect(result!.erreichtePunkte).toBe(0)
  })

  it('gibt null bei Typ-Mismatch', () => {
    const frage = makeMCFrage([{ id: 'o1', text: 'A', korrekt: true }])
    const antwort = { typ: 'freitext', text: 'Hallo' } as unknown as Antwort
    const result = autoKorrigiere(frage, antwort)
    expect(result).toBeNull()
  })

  it('korrigiert MC Mehrfachauswahl teilweise korrekt', () => {
    const frage = makeMCFrage([
      { id: 'o1', text: 'A', korrekt: true },
      { id: 'o2', text: 'B', korrekt: true },
      { id: 'o3', text: 'C', korrekt: false },
    ], true)
    const antwort: Antwort = { typ: 'mc', gewaehlteOptionen: ['o1', 'o3'] }
    const result = autoKorrigiere(frage, antwort)
    expect(result).not.toBeNull()
    // o1 korrekt (+1/3 * 2), o3 falsch (-1/3 * 2) → ~ 0 (minimum 0)
    expect(result!.erreichtePunkte).toBeGreaterThanOrEqual(0)
    expect(result!.erreichtePunkte).toBeLessThanOrEqual(2)
  })

  it('korrigiert MC Mehrfachauswahl alle korrekt', () => {
    const frage = makeMCFrage([
      { id: 'o1', text: 'A', korrekt: true },
      { id: 'o2', text: 'B', korrekt: true },
      { id: 'o3', text: 'C', korrekt: false },
    ], true)
    const antwort: Antwort = { typ: 'mc', gewaehlteOptionen: ['o1', 'o2'] }
    const result = autoKorrigiere(frage, antwort)
    expect(result).not.toBeNull()
    expect(result!.erreichtePunkte).toBe(2)
  })

  it('gibt 0 bei leerem gewaehlteOptionen-Array', () => {
    const frage = makeMCFrage([
      { id: 'o1', text: 'A', korrekt: true },
    ])
    const antwort: Antwort = { typ: 'mc', gewaehlteOptionen: [] }
    const result = autoKorrigiere(frage, antwort)
    expect(result).not.toBeNull()
    expect(result!.erreichtePunkte).toBe(0)
  })

  it('korrigiert RichtigFalsch', () => {
    const frage = {
      id: 'rf-1',
      typ: 'richtigfalsch',
      version: 1,
      erstelltAm: '2026-01-01',
      geaendertAm: '2026-01-01',
      fachbereich: 'VWL',
    fach: 'Wirtschaft & Recht',
      thema: 'Test',
      semester: ['S3'],
      gefaesse: ['SF'],
      bloom: 'K1',
      tags: [],
      punkte: 3,
      musterlosung: '',
      bewertungsraster: [],
      verwendungen: [],
      fragetext: 'Richtig oder Falsch?',
      aussagen: [
        { id: 'a1', text: 'Die SNB druckt Geld', korrekt: true },
        { id: 'a2', text: 'Die Sonne ist kalt', korrekt: false },
        { id: 'a3', text: 'Wasser ist nass', korrekt: true },
      ],
    } as RichtigFalschFrage

    const antwort: Antwort = {
      typ: 'richtigfalsch',
      bewertungen: { a1: true, a2: false, a3: true },
    }
    const result = autoKorrigiere(frage, antwort)
    expect(result).not.toBeNull()
    expect(result!.erreichtePunkte).toBe(3) // Alle korrekt
  })
})
