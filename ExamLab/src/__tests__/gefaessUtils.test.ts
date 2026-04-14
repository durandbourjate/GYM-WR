import { describe, it, expect } from 'vitest'
import { istGueltigesGefaess } from '../utils/gefaessUtils'
import { DEFAULT_SCHUL_CONFIG } from '../types/schulConfig'

describe('istGueltigesGefaess', () => {
  it('gibt true für SF (gültiges Gefäss)', () => {
    expect(istGueltigesGefaess('SF', DEFAULT_SCHUL_CONFIG)).toBe(true)
  })

  it('gibt true für FF (gültiges Gefäss)', () => {
    expect(istGueltigesGefaess('FF', DEFAULT_SCHUL_CONFIG)).toBe(true)
  })

  it('gibt false für XYZ (ungültiges Gefäss)', () => {
    expect(istGueltigesGefaess('XYZ', DEFAULT_SCHUL_CONFIG)).toBe(false)
  })

  it('gibt false für leeren String', () => {
    expect(istGueltigesGefaess('', DEFAULT_SCHUL_CONFIG)).toBe(false)
  })
})
