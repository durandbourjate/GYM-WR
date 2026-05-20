import { describe, it, expect } from 'vitest'
import { generateColorVariants } from './categories'

describe('generateColorVariants', () => {
  it('leitet bg/fg/border aus reinem Schwarz ab', () => {
    expect(generateColorVariants('#000000')).toEqual({
      bg: '#e6e6e6',
      fg: '#000000',
      border: '#4c4c4c',
    })
  })

  it('berechnet Varianten fuer eine mittlere Farbe (#3b82f6)', () => {
    expect(generateColorVariants('#3b82f6')).toEqual({
      bg: '#ecf3ff',
      fg: '#234e94',
      border: '#75a7f8',
    })
  })

  it('clampt bg-Kanaele bei einem 255-Kanal (#ff0000) auf gueltigen Hex', () => {
    const v = generateColorVariants('#ff0000')
    expect(v.bg).toBe('#ffe6e6')
    expect(v.bg).toMatch(/^#[0-9a-f]{6}$/)
  })

  it('erzeugt fuer reines Weiss gueltigen 7-Zeichen-Hex', () => {
    const v = generateColorVariants('#ffffff')
    expect(v.bg).toBe('#ffffff')
    expect(v.bg).toMatch(/^#[0-9a-f]{6}$/)
    expect(v.fg).toMatch(/^#[0-9a-f]{6}$/)
    expect(v.border).toMatch(/^#[0-9a-f]{6}$/)
  })
})
