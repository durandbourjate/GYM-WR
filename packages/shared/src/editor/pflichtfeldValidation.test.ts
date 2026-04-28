import { describe, it, expect } from 'vitest'
import { validierePflichtfelder } from './pflichtfeldValidation'

describe('validierePflichtfelder — Defensiv-Verhalten', () => {
  it('liefert pflichtErfuellt=true für unbekannten typ (kein Save-Block)', () => {
    const r = validierePflichtfelder({ id: 'x', typ: 'mcc' as any, fragetext: 'q' } as any)
    expect(r.pflichtErfuellt).toBe(true)
    expect(r.empfohlenErfuellt).toBe(false) // konservativ
  })
  it('liefert ok bei null/undefined-Frage', () => {
    expect(validierePflichtfelder(null as any).pflichtErfuellt).toBe(true)
    expect(validierePflichtfelder(undefined as any).pflichtErfuellt).toBe(true)
  })
  it('crasht nicht bei null in Array-Feld (mc.optionen=null)', () => {
    const r = validierePflichtfelder({ id: 'x', typ: 'mc', fragetext: 'q', optionen: null } as any)
    expect(r).toBeDefined()
    expect(r.pflichtErfuellt).toBe(false) // ≥2 Optionen Pflicht
  })
  it('liefert immer ein gültiges ValidationResult', () => {
    const r = validierePflichtfelder({ id: 'x', typ: 'mc', fragetext: 'q' } as any)
    expect(typeof r.felderStatus).toBe('object')
    expect(Array.isArray(r.pflichtLeerFelder)).toBe(true)
    expect(Array.isArray(r.empfohlenLeerFelder)).toBe(true)
  })
  it('throws nie', () => {
    expect(() => validierePflichtfelder(undefined as any)).not.toThrow()
    expect(() => validierePflichtfelder({} as any)).not.toThrow()
  })
})

describe('validierePflichtfelder — mc', () => {
  const minimalGueltig = {
    id: 'm1',
    typ: 'mc',
    fragetext: 'q',
    optionen: [
      { id: 'o1', text: 'A', korrekt: true, erklaerung: 'e1' },
      { id: 'o2', text: 'B', korrekt: false, erklaerung: 'e2' },
    ],
  }
  it('alle erfüllt', () => {
    const r = validierePflichtfelder(minimalGueltig as any)
    expect(r.pflichtErfuellt).toBe(true)
    expect(r.empfohlenErfuellt).toBe(true)
  })
  it('pflicht-leer ohne Frage-Text', () => {
    const r = validierePflichtfelder({ ...minimalGueltig, fragetext: '' } as any)
    expect(r.pflichtErfuellt).toBe(false)
    expect(r.pflichtLeerFelder).toContain('Frage-Text')
  })
  it('pflicht-leer mit nur 1 Option', () => {
    const r = validierePflichtfelder({ ...minimalGueltig, optionen: [minimalGueltig.optionen[0]] } as any)
    expect(r.pflichtErfuellt).toBe(false)
  })
  it('pflicht-leer ohne korrekt-markierte Option', () => {
    const r = validierePflichtfelder({
      ...minimalGueltig,
      optionen: minimalGueltig.optionen.map((o) => ({ ...o, korrekt: false })),
    } as any)
    expect(r.pflichtErfuellt).toBe(false)
  })
  it('empfohlen-leer ohne Erklärungen', () => {
    const r = validierePflichtfelder({
      ...minimalGueltig,
      optionen: minimalGueltig.optionen.map((o) => ({ ...o, erklaerung: '' })),
    } as any)
    expect(r.pflichtErfuellt).toBe(true)
    expect(r.empfohlenErfuellt).toBe(false)
  })
})
