import { describe, it, expect } from 'vitest'
import { TYPO } from './typografie'

describe('TYPO-Konstanten', () => {
  it('hat genau 5 Tier: display / h1 / h2 / body / caption', () => {
    expect(Object.keys(TYPO).sort()).toEqual(['body', 'caption', 'display', 'h1', 'h2'])
  })

  it('Snapshot-Schutz gegen versehentliche Änderungen', () => {
    expect(TYPO).toEqual({
      display: 'text-2xl font-bold',
      h1:      'text-xl font-bold',
      h2:      'text-lg font-semibold',
      body:    'text-sm',
      caption: 'text-xs font-medium',
    })
  })

  it('alle Werte sind Strings (Tailwind-Klassen)', () => {
    for (const v of Object.values(TYPO)) {
      expect(typeof v).toBe('string')
      expect(v.length).toBeGreaterThan(0)
    }
  })
})
