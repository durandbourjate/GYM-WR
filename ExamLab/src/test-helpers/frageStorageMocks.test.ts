import { describe, it, expect } from 'vitest'
import { mockFrage } from './frageStorageMocks'

describe('mockFrage (Storage)', () => {
  it('liefert Storage-Frage mit leerem tags-Array', () => {
    const f = mockFrage('mc')
    expect(f.typ).toBe('mc')
    expect(Array.isArray(f.tags)).toBe(true)
    expect(f.tags).toHaveLength(0)
  })

  it('hat kein _recht / poolVersion default', () => {
    const f = mockFrage('mc')
    expect(f._recht).toBeUndefined()
    expect(f.poolVersion).toBeUndefined()
  })

  it('overrides funktionieren', () => {
    const f = mockFrage('mc', { fragetext: 'Custom' })
    expect(f.fragetext).toBe('Custom')
  })

  it('return-type ist narrowed auf den passenden Sub-Type', () => {
    const mc = mockFrage('mc')
    const optionen: typeof mc.optionen = mc.optionen
    expect(Array.isArray(optionen)).toBe(true)
  })
})
