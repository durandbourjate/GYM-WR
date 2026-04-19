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

describe('pruefeAntwort — hotspot form-abhaengige Treffer-Logik (S125 Fix)', () => {
  const rechteckFrage: any = {
    id: 'f', typ: 'hotspot',
    bereiche: [{
      id: 'r1', form: 'rechteck',
      koordinaten: { x: 20, y: 20, breite: 30, hoehe: 30 },
      label: 'Bereich', punkte: 1,
    }],
  }
  const kreisFrage: any = {
    id: 'f', typ: 'hotspot',
    bereiche: [{
      id: 'k1', form: 'kreis',
      koordinaten: { x: 50, y: 50, radius: 10 },
      label: 'Bereich', punkte: 1,
    }],
  }

  it('rechteck: Klick innerhalb = korrekt', () => {
    expect(pruefeAntwort(rechteckFrage, { typ: 'hotspot', klicks: [{x: 30, y: 30}] } as any)).toBe(true)
  })
  it('rechteck: Klick ausserhalb = falsch', () => {
    expect(pruefeAntwort(rechteckFrage, { typ: 'hotspot', klicks: [{x: 60, y: 60}] } as any)).toBe(false)
  })
  it('rechteck: Klick am Rand = korrekt (inklusive Grenzen)', () => {
    expect(pruefeAntwort(rechteckFrage, { typ: 'hotspot', klicks: [{x: 20, y: 20}] } as any)).toBe(true)
    expect(pruefeAntwort(rechteckFrage, { typ: 'hotspot', klicks: [{x: 50, y: 50}] } as any)).toBe(true)
  })
  it('kreis: Klick im Radius = korrekt', () => {
    expect(pruefeAntwort(kreisFrage, { typ: 'hotspot', klicks: [{x: 55, y: 55}] } as any)).toBe(true)
  })
  it('kreis: Klick ausserhalb Radius = falsch', () => {
    expect(pruefeAntwort(kreisFrage, { typ: 'hotspot', klicks: [{x: 70, y: 70}] } as any)).toBe(false)
  })
  it('kein Klick = falsch', () => {
    expect(pruefeAntwort(rechteckFrage, { typ: 'hotspot', klicks: [] } as any)).toBe(false)
  })
  it('kein Bereich = falsch', () => {
    expect(pruefeAntwort({ id:'f', typ:'hotspot', bereiche: [] } as any, { typ: 'hotspot', klicks: [{x:10,y:10}] } as any)).toBe(false)
  })

  it('Pool-Import mit 4 Hotspots (nur einer mit punkte=1): Klick auf den korrekten = true', () => {
    const poolFrage: any = {
      id: 'f', typ: 'hotspot',
      bereiche: [
        { id: 'a', form: 'kreis', koordinaten: {x: 25, y: 30, radius: 8}, punkte: 0, label: 'A' },
        { id: 'b', form: 'kreis', koordinaten: {x: 69.3, y: 75, radius: 8}, punkte: 1, label: 'B' },
        { id: 'c', form: 'kreis', koordinaten: {x: 46.1, y: 52.6, radius: 8}, punkte: 0, label: 'C' },
        { id: 'd', form: 'kreis', koordinaten: {x: 69.3, y: 30.5, radius: 8}, punkte: 0, label: 'D' },
      ],
    }
    expect(pruefeAntwort(poolFrage, { typ: 'hotspot', klicks: [{x: 69, y: 74}] } as any)).toBe(true)
  })

  it('Pool-Import: Klick auf falschen Hotspot = false', () => {
    const poolFrage: any = {
      id: 'f', typ: 'hotspot',
      bereiche: [
        { id: 'a', form: 'kreis', koordinaten: {x: 25, y: 30, radius: 8}, punkte: 0, label: 'A' },
        { id: 'b', form: 'kreis', koordinaten: {x: 69.3, y: 75, radius: 8}, punkte: 1, label: 'B' },
      ],
    }
    expect(pruefeAntwort(poolFrage, { typ: 'hotspot', klicks: [{x: 25, y: 30}] } as any)).toBe(false)
  })

  it('Pool-Import: Klick auf korrekten + falschen = false', () => {
    const poolFrage: any = {
      id: 'f', typ: 'hotspot',
      bereiche: [
        { id: 'a', form: 'kreis', koordinaten: {x: 25, y: 30, radius: 8}, punkte: 0, label: 'A' },
        { id: 'b', form: 'kreis', koordinaten: {x: 69.3, y: 75, radius: 8}, punkte: 1, label: 'B' },
      ],
    }
    expect(pruefeAntwort(poolFrage, { typ: 'hotspot', klicks: [{x: 25, y: 30}, {x: 69, y: 74}] } as any)).toBe(false)
  })
})
