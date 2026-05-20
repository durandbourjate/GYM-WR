import { describe, it, expect, beforeEach } from 'vitest'
import { useSynergyConfigStore, istSynergyKonfiguriert } from './synergyConfigStore'

describe('synergyConfigStore', () => {
  beforeEach(() => {
    useSynergyConfigStore.setState({ appsScriptUrl: '', lpEmail: '' })
  })

  it('startet mit leeren Feldern', () => {
    const s = useSynergyConfigStore.getState()
    expect(s.appsScriptUrl).toBe('')
    expect(s.lpEmail).toBe('')
  })

  it('setConfig setzt ein einzelnes Feld, ohne das andere zu loeschen', () => {
    useSynergyConfigStore.getState().setConfig({ appsScriptUrl: 'https://x.test' })
    expect(useSynergyConfigStore.getState().appsScriptUrl).toBe('https://x.test')
    expect(useSynergyConfigStore.getState().lpEmail).toBe('')
    useSynergyConfigStore.getState().setConfig({ lpEmail: 'a@b.ch' })
    expect(useSynergyConfigStore.getState().appsScriptUrl).toBe('https://x.test')
    expect(useSynergyConfigStore.getState().lpEmail).toBe('a@b.ch')
  })
})

describe('istSynergyKonfiguriert', () => {
  it('false wenn beide Felder leer sind', () => {
    expect(istSynergyKonfiguriert({ appsScriptUrl: '', lpEmail: '' })).toBe(false)
  })
  it('false wenn nur ein Feld gesetzt ist', () => {
    expect(istSynergyKonfiguriert({ appsScriptUrl: 'https://x.test', lpEmail: '' })).toBe(false)
    expect(istSynergyKonfiguriert({ appsScriptUrl: '', lpEmail: 'a@b.ch' })).toBe(false)
  })
  it('false bei reinen Whitespace-Werten', () => {
    expect(istSynergyKonfiguriert({ appsScriptUrl: '   ', lpEmail: '   ' })).toBe(false)
  })
  it('true wenn beide Felder gesetzt sind', () => {
    expect(istSynergyKonfiguriert({ appsScriptUrl: 'https://x.test', lpEmail: 'a@b.ch' })).toBe(true)
  })
})
