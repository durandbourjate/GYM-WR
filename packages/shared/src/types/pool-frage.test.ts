import { describe, it, expect, expectTypeOf } from 'vitest'
import type {
  PoolFrage, PoolFrageMC, PoolFrageMulti, PoolFrageTF, PoolFrageFill,
  PoolFrageBuchungssatz, PoolFrageBilanz, PoolFrageGruppe, PoolFrageTyp,
} from './pool-frage'

describe('PoolFrage Discriminated Union', () => {
  it('PoolFrageMC ist Sub-Type von PoolFrage', () => {
    const mc: PoolFrageMC = {
      id: 't1', topic: 'demo', diff: 1, tax: 'K1', q: 'Frage',
      type: 'mc', options: [{ v: 'a', t: 'A' }], correct: 'a',
    }
    const p: PoolFrage = mc
    expect(p.type).toBe('mc')
  })

  it('discriminator narrowt korrekt im Switch', () => {
    const f: PoolFrage = {
      id: 't', topic: 'demo', diff: 1, tax: 'K1', q: 'q',
      type: 'multi', options: [{ v: 'a', t: 'A' }], correct: ['a'],
    }
    if (f.type === 'multi') {
      // TS sollte hier korrekt PoolFrageMulti narrowen — `correct` ist string[]
      expectTypeOf(f.correct).toEqualTypeOf<string[] | undefined>()
    }
  })

  it('TF.correct ist boolean', () => {
    const tf: PoolFrageTF = {
      id: 't', topic: 'demo', diff: 1, tax: 'K1', q: 'q',
      type: 'tf', correct: true,
    }
    expectTypeOf(tf.correct).toEqualTypeOf<boolean | undefined>()
  })

  it('Fill hat blanks statt correct', () => {
    const f: PoolFrageFill = {
      id: 't', topic: 'demo', diff: 1, tax: 'K1', q: 'q',
      type: 'fill', blanks: [{ answer: 'x' }],
    }
    expect(f.blanks).toHaveLength(1)
  })

  it('Buchungssatz akzeptiert BuchungssatzZeile-Array in correct', () => {
    const f: PoolFrageBuchungssatz = {
      id: 't', topic: 'demo', diff: 1, tax: 'K1', q: 'Bezahle Miete',
      type: 'buchungssatz',
      correct: [{ id: 'b1', sollKonto: '6000', habenKonto: '1020', betrag: 1000 }],
      konten: ['1020', '6000'],
    }
    expect(f.correct).toHaveLength(1)
    expect(f.correct?.[0].sollKonto).toBe('6000')
  })

  it('Bilanz akzeptiert kontenMitSaldi und correct als Loesung', () => {
    const f: PoolFrageBilanz = {
      id: 't', topic: 'demo', diff: 1, tax: 'K1', q: 'Erstelle Bilanz',
      type: 'bilanz',
      modus: 'bilanz',
      kontenMitSaldi: [{ kontonummer: '1020', name: 'Bank', saldo: 5000 }],
      correct: { bilanz: { aktiva: [], passiva: [] } },
    }
    expect(f.kontenMitSaldi).toHaveLength(1)
  })

  it('Gruppe akzeptiert teilaufgaben mit Index-Signatur', () => {
    const f: PoolFrageGruppe = {
      id: 't', topic: 'demo', diff: 1, tax: 'K1', q: 'Stamm',
      type: 'gruppe',
      context: 'Kontext',
      teil: [{ type: 'mc', q: 'a', options: [{ v: 'a', t: 'A' }] }],
    }
    expect(f.teil).toHaveLength(1)
  })

  it('PoolFrageTyp deckt alle 20 Sub-Type-Discriminator-Werte ab', () => {
    const alle: PoolFrageTyp[] = [
      'mc', 'multi', 'tf', 'fill', 'calc', 'sort', 'open', 'sortierung',
      'formel', 'hotspot', 'bildbeschriftung', 'dragdrop_bild', 'code', 'zeichnen',
      'buchungssatz', 'tkonto', 'kontenbestimmung', 'bilanz', 'gruppe', 'pdf',
    ]
    expect(alle).toHaveLength(20)
  })

  it('Discriminator-Switch ist exhaustive (compile-time)', () => {
    // Dieser Switch muss tsc-kompilieren ohne `default`-Fallback,
    // weil die Union vollständig abgedeckt ist.
    function pruefeAlleTypen(f: PoolFrage): string {
      switch (f.type) {
        case 'mc': return 'mc'
        case 'multi': return 'multi'
        case 'tf': return 'tf'
        case 'fill': return 'fill'
        case 'calc': return 'calc'
        case 'sort': return 'sort'
        case 'open': return 'open'
        case 'sortierung': return 'sortierung'
        case 'formel': return 'formel'
        case 'hotspot': return 'hotspot'
        case 'bildbeschriftung': return 'bildbeschriftung'
        case 'dragdrop_bild': return 'dragdrop_bild'
        case 'code': return 'code'
        case 'zeichnen': return 'zeichnen'
        case 'buchungssatz': return 'buchungssatz'
        case 'tkonto': return 'tkonto'
        case 'kontenbestimmung': return 'kontenbestimmung'
        case 'bilanz': return 'bilanz'
        case 'gruppe': return 'gruppe'
        case 'pdf': return 'pdf'
      }
    }
    const f: PoolFrage = {
      id: 't', topic: 'demo', diff: 1, tax: 'K1', q: 'q', type: 'mc',
    }
    expect(pruefeAlleTypen(f)).toBe('mc')
  })
})
