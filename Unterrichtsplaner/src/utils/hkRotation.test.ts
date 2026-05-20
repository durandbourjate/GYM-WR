import { describe, it, expect } from 'vitest'
import { getHKGroup, getHKSchedule } from './hkRotation'
import { WEEKS } from '../data/weeks'

describe('getHKGroup', () => {
  it('gibt den Override-Wert zurueck, wenn vorhanden', () => {
    expect(getHKGroup('33', 11, 'A', { '33-11': 'B' })).toBe('B')
  })
  it('liefert startGroup bei unbekannter Woche', () => {
    expect(getHKGroup('99', 11, 'A')).toBe('A')
    expect(getHKGroup('99', 11, 'B')).toBe('B')
  })
  it('alterniert A/B ueber aufeinanderfolgende Unterrichtswochen (Spalte 11)', () => {
    // gekoppelt an weeks.ts: Spalte 11 hat in w33-w35 je eine type-1-Lektion
    expect(getHKGroup('33', 11, 'A')).toBe('A')
    expect(getHKGroup('34', 11, 'A')).toBe('B')
    expect(getHKGroup('35', 11, 'A')).toBe('A')
  })
  it('kehrt das Muster mit startGroup B um', () => {
    expect(getHKGroup('33', 11, 'B')).toBe('B')
    expect(getHKGroup('34', 11, 'B')).toBe('A')
  })
})

describe('getHKSchedule', () => {
  it('liefert einen Eintrag pro Woche in WEEK_ORDER', () => {
    expect(getHKSchedule(11, 'A')).toHaveLength(WEEKS.length)
  })
  it('markiert Overrides mit isOverride und uebernimmt den Wert', () => {
    const schedule = getHKSchedule(11, 'A', { '33-11': 'B' })
    const w33 = schedule.find(e => e.week === '33')!
    expect(w33.isOverride).toBe(true)
    expect(w33.group).toBe('B')
    expect(schedule.find(e => e.week === '34')!.isOverride).toBe(false)
  })
})
