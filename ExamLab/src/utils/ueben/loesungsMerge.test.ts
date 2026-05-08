import { describe, it, expect } from 'vitest'
import { mergeLoesungInFrage, mergeLoesungen } from './loesungsMerge'
import type { Frage } from '../../types/ueben/fragen'
import type { LoesungsSlice, LoesungsMap } from '../../types/ueben/loesung'

// Minimal-Frage als Cast — analog Bundle T-Test-Patterns. Doppelter Cast
// (Record → unknown → Frage) umgeht Discriminated-Union-Constraints, damit
// Tests Felder beliebig kombinieren können (z.B. elemente UND paare auf
// derselben Frage zur Branch-Coverage).
function mkFrage(partial: Record<string, unknown>): Frage {
  return partial as unknown as Frage
}

describe('mergeLoesungInFrage', () => {
  it('Test 1: ohne Slice → Original-Frage byte-identisch', () => {
    const f = mkFrage({ id: '1', typ: 'mc', frage: 'Q', fachbereich: 'BWL' })
    expect(mergeLoesungInFrage(f, undefined)).toBe(f)
  })

  it('Test 2: Top-Level-Felder werden gesetzt', () => {
    const f = mkFrage({ id: '1', typ: 'mc', frage: 'Q', fachbereich: 'BWL' })
    const slice: LoesungsSlice = {
      musterlosung: 'M', bewertungsraster: 'B', korrekteFormel: 'F',
      korrekt: true, buchungen: ['x'] as never, korrektBuchung: { soll: 's' } as never,
      sollEintraege: [1] as never, habenEintraege: [2] as never, loesung: 'L',
    } as LoesungsSlice
    const out = mergeLoesungInFrage(f, slice) as unknown as Record<string, unknown>
    expect(out.musterlosung).toBe('M')
    expect(out.bewertungsraster).toBe('B')
    expect(out.korrekteFormel).toBe('F')
    expect(out.korrekt).toBe(true)
    expect(out.buchungen).toEqual(['x'])
    expect(out.korrektBuchung).toEqual({ soll: 's' })
    expect(out.sollEintraege).toEqual([1])
    expect(out.habenEintraege).toEqual([2])
    expect(out.loesung).toBe('L')
  })

  it('Test 3: Reihenfolgen-Felder elemente und paare ÜBERSCHREIBEN Original', () => {
    const f = mkFrage({
      id: '1', typ: 'sortierung', frage: 'Q', fachbereich: 'BWL',
      elemente: [{ id: 'a', text: 'Mix' }] as never,
      paare: [{ id: 'p1', links: 'L', rechts: 'R' }] as never,
    })
    const slice: LoesungsSlice = {
      elemente: [{ id: 'a', text: 'Echt' }] as never,
      paare: [{ id: 'p1', links: 'EchtL', rechts: 'EchtR' }] as never,
    } as LoesungsSlice
    const out = mergeLoesungInFrage(f, slice) as unknown as Record<string, unknown>
    expect(out.elemente).toEqual([{ id: 'a', text: 'Echt' }])
    expect(out.paare).toEqual([{ id: 'p1', links: 'EchtL', rechts: 'EchtR' }])
  })

  it('Test 4: Listen-Merge per id (optionen — repräsentativ)', () => {
    const f = mkFrage({
      id: '1', typ: 'mc', frage: 'Q', fachbereich: 'BWL',
      optionen: [{ id: 'o1', text: 'A' }, { id: 'o2', text: 'B' }] as never,
    })
    const slice: LoesungsSlice = {
      optionen: [{ id: 'o1', korrekt: true }, { id: 'o2', korrekt: false }] as never,
    } as LoesungsSlice
    const out = mergeLoesungInFrage(f, slice) as unknown as Record<string, unknown>
    expect(out.optionen).toEqual([
      { id: 'o1', text: 'A', korrekt: true },
      { id: 'o2', text: 'B', korrekt: false },
    ])
  })

  it('Test 5: Listen-Merge funktioniert für alle 11 weiteren Listen-Felder', () => {
    const listenFelder = [
      'aussagen', 'luecken', 'ergebnisse', 'konten',
      'bilanzEintraege', 'aufgaben', 'labels',
      'beschriftungen', 'zielzonen', 'bereiche', 'hotspots',
    ] as const
    for (const feld of listenFelder) {
      const f = mkFrage({
        id: '1', typ: 'mc', frage: 'Q', fachbereich: 'BWL',
        [feld]: [{ id: 'x', a: 1 }],
      } as Partial<Frage> & { id: string; typ: Frage['typ']; frage: string; fachbereich: string })
      const slice = { [feld]: [{ id: 'x', b: 2 }] } as unknown as LoesungsSlice
      const out = mergeLoesungInFrage(f, slice) as unknown as Record<string, unknown>
      expect((out[feld] as { id: string; a?: number; b?: number }[])[0]).toEqual({ id: 'x', a: 1, b: 2 })
    }
  })

  it('Test 6: mergeById — Item ohne id-Property bleibt unverändert', () => {
    const f = mkFrage({
      id: '1', typ: 'mc', frage: 'Q', fachbereich: 'BWL',
      optionen: [{ text: 'NoId' } as never, { id: 'o1', text: 'WithId' }] as never,
    })
    const slice: LoesungsSlice = {
      optionen: [{ id: 'o1', korrekt: true }] as never,
    } as LoesungsSlice
    const out = mergeLoesungInFrage(f, slice) as unknown as Record<string, unknown>
    expect(out.optionen).toEqual([
      { text: 'NoId' },
      { id: 'o1', text: 'WithId', korrekt: true },
    ])
  })

  it('Test 7: mergeById — null-Item in Liste bleibt unverändert', () => {
    const f = mkFrage({
      id: '1', typ: 'mc', frage: 'Q', fachbereich: 'BWL',
      optionen: [null as never, { id: 'o1', text: 'A' }] as never,
    })
    const slice: LoesungsSlice = {
      optionen: [{ id: 'o1', korrekt: true }] as never,
    } as LoesungsSlice
    const out = mergeLoesungInFrage(f, slice) as unknown as Record<string, unknown>
    expect((out.optionen as unknown[])[0]).toBe(null)
    expect((out.optionen as unknown[])[1]).toEqual({ id: 'o1', text: 'A', korrekt: true })
  })

  it('Test 8: mergeById — Patch ohne id wird ignoriert (nicht in patchMap)', () => {
    const f = mkFrage({
      id: '1', typ: 'mc', frage: 'Q', fachbereich: 'BWL',
      optionen: [{ id: 'o1', text: 'A' }] as never,
    })
    const slice: LoesungsSlice = {
      optionen: [{ korrekt: true } as never, { id: 'o1', korrekt: false }] as never,
    } as LoesungsSlice
    const out = mergeLoesungInFrage(f, slice) as unknown as Record<string, unknown>
    expect(out.optionen).toEqual([{ id: 'o1', text: 'A', korrekt: false }])
  })

  it('Test 9: Original-Frage wird NICHT mutiert (Immutability)', () => {
    const original = mkFrage({
      id: '1', typ: 'mc', frage: 'Q', fachbereich: 'BWL',
      optionen: [{ id: 'o1', text: 'A' }] as never,
    })
    const snapshot = JSON.parse(JSON.stringify(original))
    const slice: LoesungsSlice = {
      musterlosung: 'M',
      optionen: [{ id: 'o1', korrekt: true }] as never,
    } as LoesungsSlice
    mergeLoesungInFrage(original, slice)
    expect(original).toEqual(snapshot)
  })
})

describe('mergeLoesungen', () => {
  it('Test 10: leere LoesungsMap → preloaded[id] = false für alle', () => {
    const fragen = [
      mkFrage({ id: 'a', typ: 'mc', frage: 'A', fachbereich: 'BWL' }),
      mkFrage({ id: 'b', typ: 'mc', frage: 'B', fachbereich: 'BWL' }),
    ]
    const loesungen: LoesungsMap = {}
    const result = mergeLoesungen(fragen, loesungen)
    expect(result.preloaded).toEqual({ a: false, b: false })
    expect(result.fragen).toEqual(fragen)
  })

  it('Test 11: Frage mit teilaufgaben → TA-Slices gemerged + preloaded[ta.id] getrackt', () => {
    const fragen = [
      mkFrage({
        id: 'group1', typ: 'aufgabengruppe' as Frage['typ'], frage: 'G', fachbereich: 'BWL',
        teilaufgaben: [
          mkFrage({ id: 'ta1', typ: 'mc', frage: 'TA1', fachbereich: 'BWL' }),
          mkFrage({ id: 'ta2', typ: 'mc', frage: 'TA2', fachbereich: 'BWL' }),
        ],
      } as Partial<Frage> & { id: string; typ: Frage['typ']; frage: string; fachbereich: string }),
    ]
    const loesungen: LoesungsMap = {
      group1: { musterlosung: 'GroupMl' } as LoesungsSlice,
      ta1: { musterlosung: 'TA1Ml' } as LoesungsSlice,
      // ta2 absichtlich NICHT in der Map
    }
    const result = mergeLoesungen(fragen, loesungen)
    expect(result.preloaded).toEqual({ group1: true, ta1: true, ta2: false })
    const group = result.fragen[0] as Frage & { teilaufgaben: Frage[] }
    expect((group as unknown as Record<string, unknown>).musterlosung).toBe('GroupMl')
    expect((group.teilaufgaben[0] as unknown as Record<string, unknown>).musterlosung).toBe('TA1Ml')
    expect((group.teilaufgaben[1] as unknown as Record<string, unknown>).musterlosung).toBeUndefined()
  })

  it('Test 12: Mix — manche Fragen preloaded, andere nicht', () => {
    const fragen = [
      mkFrage({ id: 'a', typ: 'mc', frage: 'A', fachbereich: 'BWL' }),
      mkFrage({ id: 'b', typ: 'mc', frage: 'B', fachbereich: 'BWL' }),
    ]
    const loesungen: LoesungsMap = {
      a: { musterlosung: 'AMl' } as LoesungsSlice,
    }
    const result = mergeLoesungen(fragen, loesungen)
    expect(result.preloaded).toEqual({ a: true, b: false })
    expect((result.fragen[0] as unknown as Record<string, unknown>).musterlosung).toBe('AMl')
    expect((result.fragen[1] as unknown as Record<string, unknown>).musterlosung).toBeUndefined()
  })
})
