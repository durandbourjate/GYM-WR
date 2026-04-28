import { describe, expect, it } from 'vitest'
import { stabilId } from './stabilId'

describe('stabilId', () => {
  it('liefert deterministische ID für gleichen Input', () => {
    const a = stabilId('frage-1', 'Aktiva', 0)
    const b = stabilId('frage-1', 'Aktiva', 0)
    expect(a).toBe(b)
    expect(a).toHaveLength(8)
  })

  it('unterschiedliche Indizes liefern unterschiedliche IDs', () => {
    const a = stabilId('frage-1', 'Aktiva', 0)
    const b = stabilId('frage-1', 'Aktiva', 1)
    expect(a).not.toBe(b)
  })

  it('unterschiedliche Texte liefern unterschiedliche IDs', () => {
    const a = stabilId('frage-1', 'Aktiva', 0)
    const b = stabilId('frage-1', 'Passiva', 0)
    expect(a).not.toBe(b)
  })

  it('unterschiedliche Frage-IDs liefern unterschiedliche IDs', () => {
    const a = stabilId('frage-1', 'Aktiva', 0)
    const b = stabilId('frage-2', 'Aktiva', 0)
    expect(a).not.toBe(b)
  })

  it('Output ist nur a-z2-7 (base32, lowercase)', () => {
    const id = stabilId('frage-1', 'Test 123', 0)
    expect(id).toMatch(/^[a-z2-7]{8}$/)
  })
})
