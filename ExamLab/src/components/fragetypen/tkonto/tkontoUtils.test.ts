// ExamLab/src/components/fragetypen/tkonto/tkontoUtils.test.ts
import { describe, it, expect } from 'vitest'
import { zuAntwort, vonAntwort, leereKontoEingabe, matcheEintraege } from './tkontoUtils'
import type { KontoEingabe, TKontoAntwort, SusEintrag } from './tkontoUtils'
import type { TKontoFrage as TKontoFrageType } from '../../../types/fragen-storage'

function frageKontoStub(overrides: Partial<TKontoFrageType['konten'][0]> = {}): TKontoFrageType['konten'][0] {
  const base = {
    id: 'k1',
    kontonummer: '1000',
    anfangsbestandVorgegeben: false,
    eintraege: [],
    saldo: { betrag: 0, seite: 'soll' as const },
  } as TKontoFrageType['konten'][0]  // konkreter Type-Cast (typed Stub)
  return { ...base, ...overrides }
}

function susKontoStub(overrides: Partial<TKontoAntwort['konten'][0]> = {}): TKontoAntwort['konten'][0] {
  const base = {
    id: 'k1',
    eintraegeLinks: [],
    eintraegeRechts: [],
  } as TKontoAntwort['konten'][0]
  return { ...base, ...overrides }
}

describe('zuAntwort', () => {
  function konto(overrides: Partial<KontoEingabe> = {}): KontoEingabe {
    return { ...leereKontoEingabe('k1'), ...overrides }
  }

  it('parsed leere Beträge als 0', () => {
    const k = konto({ eintraegeLinks: [{ id: 'z1', gegenkonto: 'X', betrag: '', gfNr: '' }] })
    const a = zuAntwort([k])
    expect(a.konten[0].eintraegeLinks[0].betrag).toBe(0)
  })

  it('parsed Decimal-Beträge als float', () => {
    const k = konto({ eintraegeLinks: [{ id: 'z1', gegenkonto: 'X', betrag: '3.50', gfNr: '' }] })
    const a = zuAntwort([k])
    expect(a.konten[0].eintraegeLinks[0].betrag).toBe(3.5)
  })

  it('parsed gfNr als optionales Int', () => {
    const k1 = konto({ eintraegeLinks: [{ id: 'z1', gegenkonto: 'X', betrag: '0', gfNr: '5' }] })
    const k2 = konto({ id: 'k2', eintraegeLinks: [{ id: 'z1', gegenkonto: 'X', betrag: '0', gfNr: '' }] })
    expect(zuAntwort([k1]).konten[0].eintraegeLinks[0].gfNr).toBe(5)
    expect(zuAntwort([k2]).konten[0].eintraegeLinks[0].gfNr).toBeUndefined()
  })

  it('emittiert saldo nur wenn links oder rechts gesetzt', () => {
    const k1 = konto()  // beide saldo leer
    const k2 = konto({ id: 'k2', saldoLinks: '100' })
    const k3 = konto({ id: 'k3', saldoRechts: '50' })
    expect(zuAntwort([k1]).konten[0].saldo).toBeUndefined()
    expect(zuAntwort([k2]).konten[0].saldo).toEqual({ betragLinks: 100, betragRechts: 0 })
    expect(zuAntwort([k3]).konten[0].saldo).toEqual({ betragLinks: 0, betragRechts: 50 })
  })

  it('strippt leere Beschriftungs-Felder zu undefined', () => {
    const k = konto()
    const a = zuAntwort([k])
    expect(a.konten[0].beschriftungLinks).toBeUndefined()
    expect(a.konten[0].beschriftungRechts).toBeUndefined()
    expect(a.konten[0].kontenkategorie).toBeUndefined()
  })
})

describe('vonAntwort', () => {
  const frageDefs: TKontoFrageType['konten'] = [
    frageKontoStub({ id: 'k1', kontonummer: '1000' }),
    frageKontoStub({ id: 'k2', kontonummer: '2000' }),
  ]

  it('antwort=undefined → leere Konten', () => {
    const result = vonAntwort(undefined, frageDefs)
    expect(result).toHaveLength(2)
    expect(result[0].id).toBe('k1')
    expect(result[0].beschriftungLinks).toBe('')
    expect(result[0].eintraegeLinks).toHaveLength(1)
    expect(result[0].eintraegeLinks[0].gegenkonto).toBe('')
  })

  it('Round-Trip: vonAntwort(zuAntwort(x)) ≈ x modulo Eintrag-IDs + anfangsbestand-Felder', () => {
    const original = [
      leereKontoEingabe('k1'),
      { ...leereKontoEingabe('k2'), saldoLinks: '100', eintraegeLinks: [{ id: 'z1', gegenkonto: 'A', betrag: '50', gfNr: '3' }] },
    ]
    const result = vonAntwort(zuAntwort(original), frageDefs)
    expect(result[0].id).toBe('k1')
    expect(result[1].saldoLinks).toBe('100')
    expect(result[1].eintraegeLinks[0].gegenkonto).toBe('A')
    expect(result[1].eintraegeLinks[0].betrag).toBe('50')
    expect(result[1].eintraegeLinks[0].gfNr).toBe('3')
    // anfangsbestand-Drift dokumentiert (heute nicht persistiert)
    expect(result[0].anfangsbestandLinks).toBe('')
    expect(result[1].anfangsbestandLinks).toBe('')
  })

  it('Saldo-Werte als String restauriert', () => {
    const ant = zuAntwort([{ ...leereKontoEingabe('k1'), saldoLinks: '100', saldoRechts: '50' }])
    const result = vonAntwort(ant, [frageDefs[0]])
    expect(result[0].saldoLinks).toBe('100')
    expect(result[0].saldoRechts).toBe('50')
  })

  it('Konten matched per id, nicht Index', () => {
    const ant = zuAntwort([{ ...leereKontoEingabe('k2'), saldoLinks: '999' }])
    const result = vonAntwort(ant, frageDefs)
    expect(result[0].id).toBe('k1')
    expect(result[0].saldoLinks).toBe('')
    expect(result[1].id).toBe('k2')
    expect(result[1].saldoLinks).toBe('999')
  })

  it('leere Eintragslisten → [leereZeile()]', () => {
    const ant: TKontoAntwort = { typ: 'tkonto', konten: [susKontoStub({ id: 'k1' })] }
    const result = vonAntwort(ant, [frageDefs[0]])
    expect(result[0].eintraegeLinks).toHaveLength(1)
    expect(result[0].eintraegeLinks[0].gegenkonto).toBe('')
  })

  it('Legacy-Felder sollHaben/zunahmeAbnahme* werden gelesen wenn vorhanden, sonst empty', () => {
    const ant: TKontoAntwort = { typ: 'tkonto', konten: [susKontoStub({ id: 'k1', sollHaben: 'soll', zunahmeAbnahmeLinks: '+Zunahme' })] }
    const result = vonAntwort(ant, [frageDefs[0]])
    expect(result[0].sollHaben).toBe('soll')
    expect(result[0].zunahmeAbnahmeLinks).toBe('+Zunahme')
    expect(result[0].zunahmeAbnahme).toBe('')  // nicht in Antwort, fallback empty
  })
})

describe('matcheEintraege', () => {
  it('beide leer → []', () => {
    expect(matcheEintraege([], [])).toEqual([])
  })

  it('matched korrekt-Einträge Reihenfolge-unabhängig (greedy)', () => {
    const korrekt: SusEintrag[] = [{ gegenkonto: 'A', betrag: 100 }, { gegenkonto: 'B', betrag: 50 }]
    const sus: SusEintrag[] = [{ gegenkonto: 'B', betrag: 50 }, { gegenkonto: 'A', betrag: 100 }]
    const result = matcheEintraege(korrekt, sus)
    expect(result.every(s => s.art === 'korrekt')).toBe(true)
    expect(result).toHaveLength(2)
  })

  it('markiert fehlend wenn sus < korrekt', () => {
    const result = matcheEintraege([{ gegenkonto: 'A', betrag: 100 }], [])
    expect(result).toEqual([{ art: 'fehlend', gegenkonto: 'A', betrag: 100 }])
  })

  it('markiert falsch (überflüssig) wenn sus > korrekt', () => {
    const result = matcheEintraege([], [{ gegenkonto: 'X', betrag: 999 }])
    expect(result).toEqual([{ art: 'falsch', gegenkonto: 'X', betrag: 999, hinweis: 'Nicht erwartet' }])
  })

  it('toleriert Decimal-Diff < 0.01', () => {
    const result = matcheEintraege(
      [{ gegenkonto: 'A', betrag: 100.005 }],
      [{ gegenkonto: 'A', betrag: 100.01 }]
    )
    expect(result[0].art).toBe('korrekt')
  })

  it('NICHT toleriert Decimal-Diff ≥ 0.01', () => {
    // Werte mit klar ≥0.01 Differenz, IEEE-754-stabil (100 vs 100.02 → exakt 0.02)
    const result = matcheEintraege(
      [{ gegenkonto: 'A', betrag: 100 }],
      [{ gegenkonto: 'A', betrag: 100.02 }]
    )
    expect(result[0].art).toBe('fehlend')
    expect(result[1].art).toBe('falsch')
  })

  it('matched genau 1× pro korrekt-Eintrag (genutzt-Set bei Duplikaten)', () => {
    const result = matcheEintraege(
      [{ gegenkonto: 'A', betrag: 100 }],
      [{ gegenkonto: 'A', betrag: 100 }, { gegenkonto: 'A', betrag: 100 }]
    )
    expect(result.filter(s => s.art === 'korrekt')).toHaveLength(1)
    expect(result.filter(s => s.art === 'falsch')).toHaveLength(1)
  })
})
