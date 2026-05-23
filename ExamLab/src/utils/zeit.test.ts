import { describe, it, expect } from 'vitest'
import { toIsoDateInput } from './zeit'

describe('toIsoDateInput', () => {
  it('ISO-Date YYYY-MM-DD bleibt unverändert (Browser-input.value-Format)', () => {
    expect(toIsoDateInput('2026-05-23')).toBe('2026-05-23')
  })

  it('ISO-with-time (T12:00 UTC ist TZ-stabil) wird auf reines Date reduziert', () => {
    // 12:00 UTC ist in allen Zeitzonen rund um Europa derselbe Kalendertag.
    expect(toIsoDateInput('2026-05-23T12:00:00.000Z')).toBe('2026-05-23')
  })

  it('Date-Objekt wird in lokale ISO-Date konvertiert', () => {
    // Konstruktor mit YYYY-MM-DDTHH:MM:SS (ohne Z) → lokale Zeit
    const d = new Date('2026-05-23T12:00:00')
    expect(toIsoDateInput(d)).toBe('2026-05-23')
  })

  it('deutsches dd.mm.yyyy wird zu ISO umgeformt', () => {
    expect(toIsoDateInput('23.05.2026')).toBe('2026-05-23')
  })

  it('leerer String → leer (Browser zeigt Placeholder)', () => {
    expect(toIsoDateInput('')).toBe('')
  })

  it('undefined → leer', () => {
    expect(toIsoDateInput(undefined)).toBe('')
  })

  it('null → leer', () => {
    expect(toIsoDateInput(null)).toBe('')
  })

  it('Müll-String → leer (Browser-Fallback, keine Crash)', () => {
    expect(toIsoDateInput('nicht-ein-datum')).toBe('')
  })

  it('Apps-Script-Date-toString-Output wird gehandhabt', () => {
    // Was kommt zurück wenn Apps-Script ein Date in JSON.stringify packt
    // ohne explizite Konvertierung — Browser-Default ist ISO-with-time.
    // Wenn jemand toString() statt JSON benutzt, sieht es so aus:
    expect(toIsoDateInput('Sat May 23 2026 12:00:00 GMT+0200')).toBe('2026-05-23')
  })
})
