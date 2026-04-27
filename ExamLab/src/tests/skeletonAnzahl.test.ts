import { describe, it, expect, beforeEach } from 'vitest'
import { leseGespeicherteAnzahl, schreibeGespeicherteAnzahl } from '../utils/skeletonAnzahl'

describe('leseGespeicherteAnzahl', () => {
  beforeEach(() => localStorage.clear())

  it('liefert Fallback wenn Key nicht existiert', () => {
    expect(leseGespeicherteAnzahl('foo', 6)).toBe(6)
  })

  it('liefert gespeicherten Wert', () => {
    localStorage.setItem('foo', '10')
    expect(leseGespeicherteAnzahl('foo', 6)).toBe(10)
  })

  it('clamped an Max (Default 12)', () => {
    localStorage.setItem('foo', '99')
    expect(leseGespeicherteAnzahl('foo', 6)).toBe(12)
  })

  it('clamped an Min 0', () => {
    localStorage.setItem('foo', '-5')
    expect(leseGespeicherteAnzahl('foo', 6)).toBe(0)
  })

  it('garbled value -> Fallback', () => {
    localStorage.setItem('foo', 'abc')
    expect(leseGespeicherteAnzahl('foo', 6)).toBe(6)
  })

  it('Custom Max wird respektiert', () => {
    localStorage.setItem('foo', '99')
    expect(leseGespeicherteAnzahl('foo', 6, 20)).toBe(20)
  })
})

describe('schreibeGespeicherteAnzahl', () => {
  beforeEach(() => localStorage.clear())

  it('schreibt Wert als String', () => {
    schreibeGespeicherteAnzahl('foo', 8)
    expect(localStorage.getItem('foo')).toBe('8')
  })

  it('schluckt Errors silent (z.B. Quota)', () => {
    expect(() => schreibeGespeicherteAnzahl('foo', 8)).not.toThrow()
  })
})
