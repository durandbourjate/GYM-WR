import { describe, it, expect, afterEach, vi } from 'vitest'
import { aktuellesSchuljahrStartjahr, aktuellesSchuljahrEndjahr } from './schuljahr'

afterEach(() => { vi.useRealTimers() })

describe('aktuellesSchuljahrStartjahr', () => {
  it('leitet das Startjahr aus einem Datum ab — ab Juli zaehlt das neue Schuljahr', () => {
    // Vor Juli: noch das alte Schuljahr → Start im Vorjahr
    expect(aktuellesSchuljahrStartjahr(new Date('2026-06-30T12:00:00'))).toBe(2025)
    // Ab Juli: neues Schuljahr → Start im aktuellen Jahr
    expect(aktuellesSchuljahrStartjahr(new Date('2026-07-01T12:00:00'))).toBe(2026)
    // Nach dem Jahreswechsel, mitten im Schuljahr
    expect(aktuellesSchuljahrStartjahr(new Date('2027-01-15T12:00:00'))).toBe(2026)
  })

  it('nutzt ohne Argument das aktuelle Datum', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-15T12:00:00'))
    expect(aktuellesSchuljahrStartjahr()).toBe(2026)
  })
})

describe('aktuellesSchuljahrEndjahr', () => {
  it('ist immer das Startjahr + 1', () => {
    expect(aktuellesSchuljahrEndjahr(new Date('2026-06-30T12:00:00'))).toBe(2026)
    expect(aktuellesSchuljahrEndjahr(new Date('2026-07-01T12:00:00'))).toBe(2027)
  })
})
