import { describe, it, expect } from 'vitest'
import {
  migriereHotspotBereichAlt,
  migriereDragDropZielzoneAlt,
  istZoneWohlgeformt,
} from './migriereZone'

describe('migriereHotspotBereichAlt', () => {
  it('Rechteck: 4 Ecken als Polygon', () => {
    const alt = {
      id: 'b1',
      form: 'rechteck',
      koordinaten: { x: 10, y: 20, breite: 30, hoehe: 40 },
      label: 'Bereich 1',
      punkte: 2,
    }
    const neu = migriereHotspotBereichAlt(alt)
    expect(neu.form).toBe('rechteck')
    expect(neu.punkte).toEqual([
      { x: 10, y: 20 },
      { x: 40, y: 20 },
      { x: 40, y: 60 },
      { x: 10, y: 60 },
    ])
    expect(neu.punktzahl).toBe(2)
    expect(neu.label).toBe('Bereich 1')
    expect(neu.id).toBe('b1')
  })
  it('Kreis: 12 Punkte als Polygon', () => {
    const alt = {
      id: 'b2',
      form: 'kreis',
      koordinaten: { x: 50, y: 50, radius: 10 },
      label: 'Kreis 1',
      punkte: 1,
    }
    const neu = migriereHotspotBereichAlt(alt)
    expect(neu.form).toBe('polygon')
    expect(neu.punkte).toHaveLength(12)
    expect(neu.punkte[0].x).toBeCloseTo(60, 5)
    expect(neu.punkte[0].y).toBeCloseTo(50, 5)
    for (const pt of neu.punkte) {
      const d = Math.hypot(pt.x - 50, pt.y - 50)
      expect(d).toBeCloseTo(10, 5)
    }
  })
  it('Bereits migrierte Zone (punkte[] vorhanden) wird unverändert zurückgegeben', () => {
    const neu = {
      id: 'b3',
      form: 'polygon' as const,
      punkte: [{x:0,y:0},{x:10,y:0},{x:5,y:10}],
      label: 'Polygon 1',
      punktzahl: 1,
    }
    expect(migriereHotspotBereichAlt(neu)).toEqual(neu)
  })
  it('Degenerate: 2-Punkt-Array wird nicht als migriert erkannt (geht durch Alt-Pfad)', () => {
    const alt = {
      id: 'b4',
      form: 'rechteck',
      koordinaten: { x: 0, y: 0, breite: 10, hoehe: 10 },
      punkte: [{x:0,y:0},{x:1,y:1}] as any, // weniger als 3 → idempotenz-guard false
      label: 'X',
      punktzahl: 3,
    }
    const neu = migriereHotspotBereichAlt(alt)
    expect(neu.punkte).toHaveLength(4)    // wurde aus koordinaten neu gebaut
    expect(typeof neu.punktzahl).toBe('number')
    expect(neu.punktzahl).toBe(3)         // nicht das degenerate Array
  })
  it('Kreis ohne Koordinaten: Fallback-Zentrum + Fallback-Radius', () => {
    const alt = { id: 'b5', form: 'kreis', koordinaten: {}, label: 'Fallback' }
    const neu = migriereHotspotBereichAlt(alt)
    expect(neu.form).toBe('polygon')
    expect(neu.punkte).toHaveLength(12)
    // Fallback: Zentrum (50,50), Radius 5
    for (const pt of neu.punkte) {
      const d = Math.hypot(pt.x - 50, pt.y - 50)
      expect(d).toBeCloseTo(5, 5)
    }
    expect(neu.punktzahl).toBe(1) // Default
  })
})

describe('migriereDragDropZielzoneAlt', () => {
  it('Position-Wrapper: 4 Ecken als Polygon', () => {
    const alt = {
      id: 'z1',
      position: { x: 10, y: 20, breite: 30, hoehe: 40 },
      korrektesLabel: 'A',
    }
    const neu = migriereDragDropZielzoneAlt(alt)
    expect(neu.form).toBe('rechteck')
    expect(neu.punkte).toEqual([
      { x: 10, y: 20 },
      { x: 40, y: 20 },
      { x: 40, y: 60 },
      { x: 10, y: 60 },
    ])
    expect(neu.korrekteLabels).toEqual(['A'])
    expect(neu.id).toBe('z1')
  })
})

describe('istZoneWohlgeformt', () => {
  it('≥3 Punkte: true', () => {
    expect(istZoneWohlgeformt({ punkte: [{x:0,y:0},{x:1,y:0},{x:0,y:1}] })).toBe(true)
  })
  it('<3 Punkte: false', () => {
    expect(istZoneWohlgeformt({ punkte: [{x:0,y:0},{x:1,y:0}] })).toBe(false)
  })
  it('punkte fehlt: false', () => {
    expect(istZoneWohlgeformt({})).toBe(false)
  })
})
