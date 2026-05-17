import { describe, it, expect } from 'vitest'
import { generiereSnippet } from './sucheVolltextHelpers'

describe('generiereSnippet', () => {
  it('zentriert um Match-Stelle mit Kontext', () => {
    const t = 'Lorem ipsum dolor sit amet, welcher der folgenden Bilanz-Posten zählt zum Anlagevermögen, consectetur'
    const snippet = generiereSnippet(t, 'Bilanz', 30)
    expect(snippet).toMatch(/Bilanz/)
    expect(snippet.length).toBeLessThan(t.length)
  })
  it('Match am Anfang — kein "…"-Prefix', () => {
    expect(generiereSnippet('Bilanz ist wichtig', 'Bilanz', 30)).toMatch(/^Bilanz/)
  })
  it('Match am Ende — kein "…"-Suffix', () => {
    expect(generiereSnippet('Wichtig ist Bilanz', 'Bilanz', 30)).toMatch(/Bilanz$/)
  })
  it('kein Match → kompletten String trunkiert', () => {
    expect(generiereSnippet('abc def ghi', 'xyz', 5)).toBe('abc def ghi'.slice(0, 5 * 2 + 3))
  })
  it('leerer Text → leerer Snippet', () => {
    expect(generiereSnippet('', 'q', 5)).toBe('')
  })
})
