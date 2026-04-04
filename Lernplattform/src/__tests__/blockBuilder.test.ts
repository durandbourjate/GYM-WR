import { describe, it, expect } from 'vitest'
import { erstelleBlock } from '../utils/blockBuilder'
import type { Frage } from '../types/fragen'

const BASIS = {
  version: 1, erstelltAm: '', geaendertAm: '',
  fachbereich: 'VWL' as const, fach: 'Mathe', semester: [] as string[], gefaesse: [] as string[],
  bloom: 'K2' as const, tags: [] as string[], punkte: 1, musterlosung: '',
  bewertungsraster: [], verwendungen: [],
  schwierigkeit: 1,
}

function macheFrage(id: string, thema: string, overrides?: Partial<Frage>): Frage {
  return {
    ...BASIS, id, thema, typ: 'mc', fragetext: `Frage ${id}`,
    optionen: [
      { id: '1', text: 'A', korrekt: true },
      { id: '2', text: 'B', korrekt: false },
    ],
    mehrfachauswahl: false, zufallsreihenfolge: false,
    ...overrides,
  } as Frage
}

describe('erstelleBlock', () => {
  it('erstellt Block mit max 10 Fragen', () => {
    const fragen = Array.from({ length: 20 }, (_, i) => macheFrage(`f${i}`, 'Addition'))
    const block = erstelleBlock(fragen, 'Addition')
    expect(block.length).toBeLessThanOrEqual(10)
    expect(block.length).toBeGreaterThan(0)
  })

  it('schrumpft Block wenn weniger als 10 Fragen vorhanden', () => {
    const fragen = [macheFrage('f1', 'Addition'), macheFrage('f2', 'Addition')]
    const block = erstelleBlock(fragen, 'Addition')
    expect(block.length).toBe(2)
  })

  it('gibt leeres Array bei 0 Fragen', () => {
    const block = erstelleBlock([], 'Addition')
    expect(block.length).toBe(0)
  })

  it('filtert nach Thema', () => {
    const fragen = [
      macheFrage('f1', 'Addition'),
      macheFrage('f2', 'Subtraktion'),
      macheFrage('f3', 'Addition'),
    ]
    const block = erstelleBlock(fragen, 'Addition')
    expect(block.every(f => f.thema === 'Addition')).toBe(true)
  })

  it('mischt die Reihenfolge mit verschiedenen Seeds', () => {
    const fragen = Array.from({ length: 15 }, (_, i) => macheFrage(`f${i}`, 'Addition'))
    const block1 = erstelleBlock(fragen, 'Addition', 'seed1')
    const block2 = erstelleBlock(fragen, 'Addition', 'seed2')
    const ids1 = block1.map(f => f.id).join(',')
    const ids2 = block2.map(f => f.id).join(',')
    expect(ids1 !== ids2 || block1.length <= 2).toBe(true)
  })

  it('priorisiert ueben-Fragen vor neuen', () => {
    const fragen = [
      macheFrage('f1', 'Add'), // wird neu
      macheFrage('f2', 'Add'), // wird ueben
      macheFrage('f3', 'Add'), // wird gefestigt
    ]
    const mastery = { f1: 'neu' as const, f2: 'ueben' as const, f3: 'gefestigt' as const }
    const block = erstelleBlock(fragen, 'Add', { mastery, seed: 'test' })

    // ueben (f2) sollte vor neu (f1) kommen, gefestigt (f3) zuletzt
    const indexF2 = block.findIndex(f => f.id === 'f2')
    const indexF1 = block.findIndex(f => f.id === 'f1')
    const indexF3 = block.findIndex(f => f.id === 'f3')
    expect(indexF2).toBeLessThan(indexF1)
    expect(indexF1).toBeLessThan(indexF3)
  })

  it('gemeisterte Fragen kommen zuletzt', () => {
    const fragen = [
      macheFrage('f1', 'Add'),
      macheFrage('f2', 'Add'),
      macheFrage('f3', 'Add'),
    ]
    const mastery = { f1: 'gemeistert' as const, f2: 'neu' as const, f3: 'ueben' as const }
    const block = erstelleBlock(fragen, 'Add', { mastery, seed: 'test' })

    const indexF1 = block.findIndex(f => f.id === 'f1')
    expect(indexF1).toBe(block.length - 1)
  })
})
