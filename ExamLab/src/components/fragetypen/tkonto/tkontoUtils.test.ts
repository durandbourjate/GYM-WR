// ExamLab/src/components/fragetypen/tkonto/tkontoUtils.test.ts
import { describe, it, expect } from 'vitest'
import { zuAntwort, leereKontoEingabe } from './tkontoUtils'
import type { KontoEingabe } from './tkontoUtils'

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
