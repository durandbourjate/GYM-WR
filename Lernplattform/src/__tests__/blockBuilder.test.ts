import { describe, it, expect } from 'vitest'
import { erstelleBlock } from '../utils/blockBuilder'
import type { Frage } from '../types/fragen'

function macheFrage(id: string, thema: string, overrides?: Partial<Frage>): Frage {
  return {
    id, fach: 'Mathe', thema, frage: `Frage ${id}`,
    typ: 'mc', schwierigkeit: 1, uebung: true, pruefungstauglich: false,
    optionen: ['A', 'B'], korrekt: 'A',
    ...overrides,
  }
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
})
