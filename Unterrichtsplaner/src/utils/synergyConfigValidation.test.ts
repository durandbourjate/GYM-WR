import { describe, it, expect } from 'vitest'
import { validateSynergyConfig } from './synergyConfigValidation'

describe('validateSynergyConfig', () => {
  it('akzeptiert eine gueltige URL + E-Mail (leeres Fehler-Objekt)', () => {
    expect(validateSynergyConfig('https://script.google.com/macros/s/abc/exec', 'lp@gymhofwil.ch')).toEqual({})
  })
  it('meldet leere URL', () => {
    expect(validateSynergyConfig('', 'lp@gymhofwil.ch').urlError).toBeDefined()
  })
  it('meldet URL ohne https://', () => {
    expect(validateSynergyConfig('http://x.test', 'lp@gymhofwil.ch').urlError).toBeDefined()
  })
  it('meldet nicht-parsebare URL', () => {
    expect(validateSynergyConfig('https://', 'lp@gymhofwil.ch').urlError).toBeDefined()
  })
  it('meldet leere E-Mail', () => {
    expect(validateSynergyConfig('https://x.test', '').emailError).toBeDefined()
  })
  it('meldet E-Mail ohne @', () => {
    expect(validateSynergyConfig('https://x.test', 'invalid').emailError).toBeDefined()
  })
  it('toleriert umgebenden Whitespace', () => {
    expect(validateSynergyConfig('  https://x.test  ', '  lp@gymhofwil.ch  ')).toEqual({})
  })
})
