import { describe, it, expect } from 'vitest'
import { gruppiereLernziele } from './lernzieleGruppierung'
import type { Lernziel } from '@shared/types/fragen-core'

function lz(p: Partial<Lernziel>): Lernziel {
  return { id: 'x', fach: 'BWL', thema: 'T', text: 'txt', bloom: 'K2', ...p }
}

describe('gruppiereLernziele', () => {
  it('leere Eingabe → leeres Objekt', () => {
    expect(gruppiereLernziele([])).toEqual({})
  })

  it('Lernziel ohne unterthema landet in meta', () => {
    const g = gruppiereLernziele([lz({ id: 'a', fach: 'BWL', thema: 'Konjunktur' })])
    expect(g['BWL']['Konjunktur'].meta.map(l => l.id)).toEqual(['a'])
    expect(g['BWL']['Konjunktur'].unterthemen).toEqual({})
  })

  it('Lernziel mit unterthema landet unter unterthemen', () => {
    const g = gruppiereLernziele([lz({ id: 'b', thema: 'Konjunktur', unterthema: 'BIP' })])
    expect(g['BWL']['Konjunktur'].unterthemen['BIP'].map(l => l.id)).toEqual(['b'])
    expect(g['BWL']['Konjunktur'].meta).toEqual([])
  })

  it('fehlendes fach/thema → Fallback Andere/Allgemein', () => {
    const g = gruppiereLernziele([lz({ id: 'c', fach: '', thema: '' })])
    expect(g['Andere']['Allgemein'].meta.map(l => l.id)).toEqual(['c'])
  })

  it('mehrere Lernziele über Fächer/Themen/Unterthemen', () => {
    const g = gruppiereLernziele([
      lz({ id: '1', fach: 'BWL', thema: 'T1', unterthema: 'U1' }),
      lz({ id: '2', fach: 'BWL', thema: 'T1', unterthema: 'U1' }),
      lz({ id: '3', fach: 'BWL', thema: 'T1' }),
      lz({ id: '4', fach: 'VWL', thema: 'T2' }),
    ])
    expect(g['BWL']['T1'].unterthemen['U1'].map(l => l.id)).toEqual(['1', '2'])
    expect(g['BWL']['T1'].meta.map(l => l.id)).toEqual(['3'])
    expect(g['VWL']['T2'].meta.map(l => l.id)).toEqual(['4'])
  })
})
