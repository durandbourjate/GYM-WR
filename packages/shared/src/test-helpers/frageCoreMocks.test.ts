import { describe, it, expect } from 'vitest'
import { mockCoreFrage } from './frageCoreMocks'
import type { Frage } from '../types/fragen-core'

const ALLE_TYPEN: Array<Frage['typ']> = [
  'mc', 'freitext', 'zuordnung', 'lueckentext', 'visualisierung',
  'richtigfalsch', 'berechnung', 'buchungssatz', 'tkonto', 'kontenbestimmung',
  'bilanzstruktur', 'aufgabengruppe', 'pdf', 'sortierung', 'hotspot',
  'bildbeschriftung', 'audio', 'dragdrop_bild', 'code', 'formel',
]

describe('mockCoreFrage', () => {
  it('liefert für jeden der 20 Sub-Types eine vollständig typisierte Frage', () => {
    for (const typ of ALLE_TYPEN) {
      const frage = mockCoreFrage(typ)
      expect(frage.typ).toBe(typ)
      expect(typeof frage.id).toBe('string')
      expect(frage.id.length).toBeGreaterThan(0)
      expect(typeof frage.version).toBe('number')
      expect(typeof frage.fachbereich).toBe('string')
      expect(typeof frage.fach).toBe('string')
      expect(typeof frage.thema).toBe('string')
      expect(Array.isArray(frage.tags)).toBe(true)
      expect(Array.isArray(frage.semester)).toBe(true)
      expect(Array.isArray(frage.gefaesse)).toBe(true)
      expect(Array.isArray(frage.bewertungsraster)).toBe(true)
      expect(Array.isArray(frage.verwendungen)).toBe(true)
      expect(typeof frage.bloom).toBe('string')
      expect(typeof frage.punkte).toBe('number')
    }
  })

  it('Defaults sind deterministisch (kein Date.now-Drift)', () => {
    const a = mockCoreFrage('mc')
    const b = mockCoreFrage('mc')
    expect(a.erstelltAm).toBe(b.erstelltAm)
    expect(a.geaendertAm).toBe(b.geaendertAm)
  })

  it('overrides überschreiben Defaults', () => {
    const f = mockCoreFrage('mc', { fragetext: 'Custom', punkte: 5 })
    expect(f.fragetext).toBe('Custom')
    expect(f.punkte).toBe(5)
  })

  it('overrides ergänzen Sub-Type-spezifische Felder', () => {
    const mc = mockCoreFrage('mc', { optionen: [{ id: 'a', text: 'A', korrekt: true }] })
    expect(mc.optionen).toHaveLength(1)
    expect(mc.optionen[0].text).toBe('A')
  })

  it('mc default hat optionen: []', () => {
    expect(mockCoreFrage('mc').optionen).toEqual([])
  })

  it('richtigfalsch default hat aussagen: []', () => {
    expect(mockCoreFrage('richtigfalsch').aussagen).toEqual([])
  })

  it('lueckentext default hat luecken: [] und lueckentextModus: freitext', () => {
    const f = mockCoreFrage('lueckentext')
    expect(f.luecken).toEqual([])
    expect(f.lueckentextModus).toBe('freitext')
  })

  it('hotspot default hat bild + bereiche: []', () => {
    const f = mockCoreFrage('hotspot')
    expect(f.bild).toBeTruthy()
    expect(f.bereiche).toEqual([])
  })

  it('dragdrop_bild default hat zielzonen + labels: []', () => {
    const f = mockCoreFrage('dragdrop_bild')
    expect(f.zielzonen).toEqual([])
    expect(f.labels).toEqual([])
  })

  it('TypeScript: return-type ist narrowed auf den passenden Sub-Type', () => {
    const mc = mockCoreFrage('mc')
    const optionen: typeof mc.optionen = mc.optionen
    expect(Array.isArray(optionen)).toBe(true)
  })

  it('Arrays sind eigene Instanzen pro Aufruf (kein shared-reference-Bug)', () => {
    const a = mockCoreFrage('mc')
    const b = mockCoreFrage('mc')
    expect(a.tags).not.toBe(b.tags)
    expect(a.semester).not.toBe(b.semester)
    expect(a.bewertungsraster).not.toBe(b.bewertungsraster)
  })
})
