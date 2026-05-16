import { describe, it, expect } from 'vitest'
import { fuehreSucheAus } from './sucheEngine'
import type { SucheIndex } from '../types/suche'

function syntheticIndex(): SucheIndex {
  const fragen = Array.from({ length: 1000 }, (_, i) => ({
    id: `frg-${i}`,
    typ: 'mc',
    fachbereich: 'WR' as const,
    thema: 'BWL',
    fragetext: `Frage ${i} zu Bilanz und Eigenkapital ${i % 10}`,
    bloom: 'K1' as const,
    punkte: 1,
    tags: ['BWL', `tag${i % 50}`],
    erstelltAm: '2026-05-12',
    hatAnhang: false,
    hatMaterial: false,
    fach: 'BWL',
  })) as unknown as SucheIndex['fragen']

  const pruefungen = Array.from({ length: 100 }, (_, i) => ({
    id: `p${i}`,
    titel: `Test ${i}`,
    typ: 'summativ',
    klasse: '29c',
    fach: 'BWL',
  })) as unknown as SucheIndex['pruefungen']

  const kurse = Array.from({ length: 50 }, (_, i) => ({
    id: `sf-wr-29${String.fromCharCode(97 + (i % 26))}`,
    name: `SF WR 29${String.fromCharCode(97 + (i % 26))}`,
    fach: 'BWL',
    fachschaft: 'WR',
    gefaess: 'SF',
    klassen: [`29${String.fromCharCode(97 + (i % 26))}`],
  })) as unknown as SucheIndex['kurse']

  return {
    einstellungenTabs: [],
    hilfeTabs: [],
    kurse,
    pruefungen,
    uebungen: [],
    fragen,
  }
}

describe('fuehreSucheAus performance', () => {
  it('1000 Fragen + 100 Pruefungen + 50 Kurse: < 100 ms (Bonus: < 50 ms)', () => {
    const index = syntheticIndex()
    const start = performance.now()
    const ergebnis = fuehreSucheAus('bilanz', index)
    const dauer = performance.now() - start
    expect(ergebnis.treffer.length).toBeGreaterThan(0)
    expect(dauer).toBeLessThan(100)
    if (dauer < 50) console.log(`Bonus-Ziel erreicht: ${dauer.toFixed(1)} ms`)
  })

  it('Empty Query bei grossem Index ist instant (< 5 ms)', () => {
    const index = syntheticIndex()
    const start = performance.now()
    fuehreSucheAus('', index)
    const dauer = performance.now() - start
    expect(dauer).toBeLessThan(5)
  })
})
