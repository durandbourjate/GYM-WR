import { describe, it, expect } from 'vitest'
import { INDEX_BLACKLIST, stripSensibleFelder, machtMatch } from '../hooks/useGlobalSuche.shared'

describe('useGlobalSuche.shared', () => {
  it('INDEX_BLACKLIST enthält alle sensiblen Lösungs-Felder', () => {
    expect(INDEX_BLACKLIST).toContain('musterlosung')
    expect(INDEX_BLACKLIST).toContain('korrekt')
    expect(INDEX_BLACKLIST).toContain('korrekteAntworten')
    expect(INDEX_BLACKLIST).toContain('bewertungsraster')
    expect(INDEX_BLACKLIST).toContain('toleranz')
    expect(INDEX_BLACKLIST).toContain('hinweis')
  })

  it('stripSensibleFelder entfernt Blacklist-Felder', () => {
    const input = { frage: 'Was ist X?', musterlosung: 'SOLUTION', korrekt: true, thema: 'BWL' }
    const out = stripSensibleFelder(input) as Record<string, unknown>
    expect(out.frage).toBe('Was ist X?')
    expect(out.thema).toBe('BWL')
    expect(out.musterlosung).toBeUndefined()
    expect(out.korrekt).toBeUndefined()
  })

  it('machtMatch ist case-insensitive und findet Teilstring', () => {
    expect(machtMatch('konj', 'Konjunkturzyklus', undefined)).toBe(true)
    expect(machtMatch('KONJ', 'konjunktur')).toBe(true)
    expect(machtMatch('xyz', 'konjunktur')).toBe(false)
  })

  it('machtMatch ignoriert leeren Suchstring', () => {
    expect(machtMatch('', 'abc')).toBe(false)
    expect(machtMatch('  ', 'abc')).toBe(false)
  })
})
