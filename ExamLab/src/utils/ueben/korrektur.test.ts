import { describe, it, expect } from 'vitest'
import { pruefeAntwort } from './korrektur'

describe('pruefeAntwort — defensive gegen bereinigte Pool-Daten', () => {
  it('mc ohne optionen[] crasht nicht', () => {
    expect(() => pruefeAntwort({ id:'f', typ:'mc' } as any, { typ:'mc', gewaehlteOptionen:['x'] } as any))
      .not.toThrow()
  })
  it('mc ohne optionen[] liefert false', () => {
    expect(pruefeAntwort({ id:'f', typ:'mc' } as any, { typ:'mc', gewaehlteOptionen:['x'] } as any)).toBe(false)
  })
  it('richtigfalsch ohne aussagen[] crasht nicht', () => {
    expect(() => pruefeAntwort({ id:'f', typ:'richtigfalsch' } as any, { typ:'richtigfalsch', bewertungen:{} } as any))
      .not.toThrow()
  })
  it('lueckentext ohne luecken[].korrekteAntworten crasht nicht', () => {
    const f: any = { id:'f', typ:'lueckentext', luecken:[{id:'l1'}] }
    const a: any = { typ:'lueckentext', eintraege:{l1:'x'} }
    expect(() => pruefeAntwort(f, a)).not.toThrow()
    expect(pruefeAntwort(f, a)).toBe(false)
  })
  it('sortierung ohne elemente[] crasht nicht', () => {
    const f: any = { id:'f', typ:'sortierung' }
    const a: any = { typ:'sortierung', reihenfolge:['x'] }
    expect(() => pruefeAntwort(f, a)).not.toThrow()
  })
  it('zuordnung ohne paare[] crasht nicht', () => {
    expect(() => pruefeAntwort({ id:'f', typ:'zuordnung' } as any, { typ:'zuordnung', zuordnungen:{} } as any))
      .not.toThrow()
  })
})

describe('pruefeAntwort — hotspot Treffer-Logik (Polygon-Format)', () => {
  // Helper: Rechteck als 4-Punkt-Polygon
  const rechteck = (x: number, y: number, b: number, h: number) => [
    { x, y }, { x: x + b, y }, { x: x + b, y: y + h }, { x, y: y + h },
  ]
  // Helper: Kreis als 12-Punkt-Polygon-Approximation (Migrations-kompatibel)
  const kreis = (cx: number, cy: number, r: number) => {
    const pts: { x: number; y: number }[] = []
    for (let i = 0; i < 12; i++) {
      const t = (2 * Math.PI * i) / 12
      pts.push({ x: cx + r * Math.cos(t), y: cy + r * Math.sin(t) })
    }
    return pts
  }

  const rechteckFrage: any = {
    id: 'f', typ: 'hotspot',
    bereiche: [{
      id: 'r1', form: 'rechteck', punkte: rechteck(20, 20, 30, 30),
      label: 'Bereich', punktzahl: 1,
    }],
  }
  const kreisFrage: any = {
    id: 'f', typ: 'hotspot',
    bereiche: [{
      id: 'k1', form: 'polygon', punkte: kreis(50, 50, 10),
      label: 'Bereich', punktzahl: 1,
    }],
  }

  it('rechteck: Klick innerhalb = korrekt', () => {
    expect(pruefeAntwort(rechteckFrage, { typ: 'hotspot', klicks: [{x: 30, y: 30}] } as any)).toBe(true)
  })
  it('rechteck: Klick ausserhalb = falsch', () => {
    expect(pruefeAntwort(rechteckFrage, { typ: 'hotspot', klicks: [{x: 60, y: 60}] } as any)).toBe(false)
  })
  it('rechteck: Klick klar drinnen nahe Rand = korrekt', () => {
    // Ray-Casting ist auf Kanten undefined; deshalb nicht auf exaktem Rand testen
    expect(pruefeAntwort(rechteckFrage, { typ: 'hotspot', klicks: [{x: 21, y: 21}] } as any)).toBe(true)
    expect(pruefeAntwort(rechteckFrage, { typ: 'hotspot', klicks: [{x: 49, y: 49}] } as any)).toBe(true)
  })
  it('polygon (Kreis): Klick im Radius = korrekt', () => {
    expect(pruefeAntwort(kreisFrage, { typ: 'hotspot', klicks: [{x: 55, y: 55}] } as any)).toBe(true)
  })
  it('polygon (Kreis): Klick ausserhalb Radius = falsch', () => {
    expect(pruefeAntwort(kreisFrage, { typ: 'hotspot', klicks: [{x: 70, y: 70}] } as any)).toBe(false)
  })
  it('kein Klick = falsch', () => {
    expect(pruefeAntwort(rechteckFrage, { typ: 'hotspot', klicks: [] } as any)).toBe(false)
  })
  it('kein Bereich = falsch', () => {
    expect(pruefeAntwort({ id:'f', typ:'hotspot', bereiche: [] } as any, { typ: 'hotspot', klicks: [{x:10,y:10}] } as any)).toBe(false)
  })

  it('Pool-Import mit 4 Hotspots (nur einer mit punktzahl=1): Klick auf den korrekten = true', () => {
    const poolFrage: any = {
      id: 'f', typ: 'hotspot',
      bereiche: [
        { id: 'a', form: 'polygon', punkte: kreis(25, 30, 8), punktzahl: 0, label: 'A' },
        { id: 'b', form: 'polygon', punkte: kreis(69.3, 75, 8), punktzahl: 1, label: 'B' },
        { id: 'c', form: 'polygon', punkte: kreis(46.1, 52.6, 8), punktzahl: 0, label: 'C' },
        { id: 'd', form: 'polygon', punkte: kreis(69.3, 30.5, 8), punktzahl: 0, label: 'D' },
      ],
    }
    expect(pruefeAntwort(poolFrage, { typ: 'hotspot', klicks: [{x: 69, y: 74}] } as any)).toBe(true)
  })

  it('Pool-Import: Klick auf falschen Hotspot = false', () => {
    const poolFrage: any = {
      id: 'f', typ: 'hotspot',
      bereiche: [
        { id: 'a', form: 'polygon', punkte: kreis(25, 30, 8), punktzahl: 0, label: 'A' },
        { id: 'b', form: 'polygon', punkte: kreis(69.3, 75, 8), punktzahl: 1, label: 'B' },
      ],
    }
    expect(pruefeAntwort(poolFrage, { typ: 'hotspot', klicks: [{x: 25, y: 30}] } as any)).toBe(false)
  })

  it('Pool-Import: Klick auf korrekten + falschen = false', () => {
    const poolFrage: any = {
      id: 'f', typ: 'hotspot',
      bereiche: [
        { id: 'a', form: 'polygon', punkte: kreis(25, 30, 8), punktzahl: 0, label: 'A' },
        { id: 'b', form: 'polygon', punkte: kreis(69.3, 75, 8), punktzahl: 1, label: 'B' },
      ],
    }
    expect(pruefeAntwort(poolFrage, { typ: 'hotspot', klicks: [{x: 25, y: 30}, {x: 69, y: 74}] } as any)).toBe(false)
  })
})
