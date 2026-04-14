import { describe, it, expect } from 'vitest'
import { berechneMasteryMitRecency } from '../utils/ueben/mastery'

function tageVorher(tage: number): string {
  return new Date(Date.now() - tage * 24 * 60 * 60 * 1000).toISOString()
}

describe('berechneMasteryMitRecency', () => {
  it('keine Änderung bei frischem Versuch (<30 Tage)', () => {
    const result = berechneMasteryMitRecency('gemeistert', tageVorher(5))
    expect(result.mastery).toBe('gemeistert')
    expect(result.istVerblasst).toBe(false)
  })

  it('keine Änderung bei "neu" (egal wie alt)', () => {
    const result = berechneMasteryMitRecency('neu', tageVorher(100))
    expect(result.mastery).toBe('neu')
    expect(result.istVerblasst).toBe(false)
  })

  it('keine Änderung ohne letzterVersuch', () => {
    const result = berechneMasteryMitRecency('gefestigt', undefined)
    expect(result.mastery).toBe('gefestigt')
    expect(result.istVerblasst).toBe(false)
  })

  it('1 Stufe runter nach 30 Tagen: gemeistert → gefestigt', () => {
    const result = berechneMasteryMitRecency('gemeistert', tageVorher(45))
    expect(result.mastery).toBe('gefestigt')
    expect(result.istVerblasst).toBe(true)
  })

  it('1 Stufe runter nach 30 Tagen: gefestigt → ueben', () => {
    const result = berechneMasteryMitRecency('gefestigt', tageVorher(50))
    expect(result.mastery).toBe('ueben')
    expect(result.istVerblasst).toBe(true)
  })

  it('ueben bleibt ueben (nicht auf neu fallen)', () => {
    const result = berechneMasteryMitRecency('ueben', tageVorher(60))
    expect(result.mastery).toBe('ueben')
    expect(result.istVerblasst).toBe(true)
  })

  it('zurück auf ueben nach 90 Tagen (auch gemeistert)', () => {
    const result = berechneMasteryMitRecency('gemeistert', tageVorher(100))
    expect(result.mastery).toBe('ueben')
    expect(result.istVerblasst).toBe(true)
  })

  it('Grenzwert 29 Tage: keine Änderung', () => {
    const result = berechneMasteryMitRecency('gemeistert', tageVorher(29))
    expect(result.mastery).toBe('gemeistert')
    expect(result.istVerblasst).toBe(false)
  })

  it('Grenzwert 30 Tage: Verblassen', () => {
    const result = berechneMasteryMitRecency('gemeistert', tageVorher(30))
    expect(result.mastery).toBe('gefestigt')
    expect(result.istVerblasst).toBe(true)
  })

  it('Grenzwert 90 Tage: zurück auf ueben', () => {
    const result = berechneMasteryMitRecency('gefestigt', tageVorher(90))
    expect(result.mastery).toBe('ueben')
    expect(result.istVerblasst).toBe(true)
  })
})
