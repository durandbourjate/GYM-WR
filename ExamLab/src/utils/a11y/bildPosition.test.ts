import { describe, it, expect } from 'vitest'
import { boundingBox, zentroid, positionsPhrase } from './bildPosition.ts'

describe('boundingBox', () => {
  it('returns all zeros for empty array', () => {
    expect(boundingBox([])).toEqual({ x: 0, y: 0, breite: 0, hoehe: 0 })
  })

  it('single point has zero width and height', () => {
    expect(boundingBox([{ x: 30, y: 40 }])).toEqual({ x: 30, y: 40, breite: 0, hoehe: 0 })
  })

  it('computes bounding box for a rectangle polygon', () => {
    const punkte = [
      { x: 10, y: 20 },
      { x: 60, y: 20 },
      { x: 60, y: 70 },
      { x: 10, y: 70 },
    ]
    expect(boundingBox(punkte)).toEqual({ x: 10, y: 20, breite: 50, hoehe: 50 })
  })

  it('computes bounding box for a triangle polygon', () => {
    const punkte = [
      { x: 5, y: 10 },
      { x: 80, y: 15 },
      { x: 40, y: 90 },
    ]
    expect(boundingBox(punkte)).toEqual({ x: 5, y: 10, breite: 75, hoehe: 80 })
  })

  it('handles negative and non-integer coordinates', () => {
    const punkte = [{ x: 2.5, y: 3.5 }, { x: 97.5, y: 96.5 }]
    const bb = boundingBox(punkte)
    expect(bb.x).toBeCloseTo(2.5)
    expect(bb.y).toBeCloseTo(3.5)
    expect(bb.breite).toBeCloseTo(95)
    expect(bb.hoehe).toBeCloseTo(93)
  })
})

describe('zentroid', () => {
  it('returns center of image for empty array', () => {
    expect(zentroid([])).toEqual({ x: 50, y: 50 })
  })

  it('returns the single point for a 1-point array', () => {
    expect(zentroid([{ x: 30, y: 70 }])).toEqual({ x: 30, y: 70 })
  })

  it('computes average for a rectangle (centroid at center)', () => {
    const punkte = [
      { x: 10, y: 10 },
      { x: 90, y: 10 },
      { x: 90, y: 90 },
      { x: 10, y: 90 },
    ]
    const c = zentroid(punkte)
    expect(c.x).toBeCloseTo(50)
    expect(c.y).toBeCloseTo(50)
  })

  it('computes centroid for a triangle', () => {
    const punkte = [
      { x: 0, y: 0 },
      { x: 60, y: 0 },
      { x: 30, y: 90 },
    ]
    const c = zentroid(punkte)
    expect(c.x).toBeCloseTo(30)
    expect(c.y).toBeCloseTo(30)
  })
})

describe('positionsPhrase', () => {
  it('top-left corner', () => {
    expect(positionsPhrase({ x: 10, y: 10 })).toBe('oben links')
  })

  it('top-center edge (y < 33.33, x in middle band)', () => {
    expect(positionsPhrase({ x: 50, y: 10 })).toBe('oben')
  })

  it('top-right corner', () => {
    expect(positionsPhrase({ x: 90, y: 10 })).toBe('oben rechts')
  })

  it('middle-left edge (y in middle band, x < 33.33)', () => {
    expect(positionsPhrase({ x: 10, y: 50 })).toBe('links')
  })

  it('dead center returns just "Mitte"', () => {
    expect(positionsPhrase({ x: 50, y: 50 })).toBe('Mitte')
  })

  it('middle-right edge (y in middle band, x > 66.66)', () => {
    expect(positionsPhrase({ x: 80, y: 50 })).toBe('rechts')
  })

  it('bottom-left corner', () => {
    expect(positionsPhrase({ x: 10, y: 90 })).toBe('unten links')
  })

  it('bottom-center edge (y > 66.66, x in middle band)', () => {
    expect(positionsPhrase({ x: 50, y: 90 })).toBe('unten')
  })

  it('bottom-right corner', () => {
    expect(positionsPhrase({ x: 90, y: 90 })).toBe('unten rechts')
  })

  it('exact boundary at 33.33 is treated as Mitte (not oben/links)', () => {
    // y=33.33 is NOT < 33.33, so it should be 'Mitte'
    expect(positionsPhrase({ x: 33.33, y: 33.33 })).toBe('Mitte')
  })

  it('just below 33.33 is oben/links', () => {
    expect(positionsPhrase({ x: 33.32, y: 33.32 })).toBe('oben links')
  })

  it('just below 66.66 is still Mitte', () => {
    expect(positionsPhrase({ x: 66.65, y: 66.65 })).toBe('Mitte')
  })

  it('at 66.66 is unten rechts', () => {
    expect(positionsPhrase({ x: 66.66, y: 66.66 })).toBe('unten rechts')
  })
})
