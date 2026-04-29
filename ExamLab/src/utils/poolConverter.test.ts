import { describe, expect, it } from 'vitest'
import { konvertierePoolFrage } from './poolConverter'
import type {
  PoolFrageDragDropBild, PoolFrageBuchungssatz, PoolFrageTKonto,
  PoolFrageKontenbestimmung, PoolFrageBilanz,
  PoolMeta, PoolTopic,
} from '../types/pool'

const POOL_META: PoolMeta = { id: 'pm', fach: 'BWL', title: 'Test', lernziele: [] }
const TOPICS: Record<string, PoolTopic> = {
  default: { label: 'Test', short: 'T', lernziele: [] },
}

describe('Pool-Konverter — DragDrop-Bild Multi-Label (Bundle J)', () => {
  it('alle Pool-Labels mit zone-Match landen in zone.korrekteLabels', () => {
    const poolFrage: PoolFrageDragDropBild = {
      id: 'q1',
      topic: 'default',
      type: 'dragdrop_bild',
      tax: 'K2',
      diff: 1,
      q: 'Test',
      img: { src: 'test.svg' },
      zones: [{ id: 'z1', x: 0, y: 0, w: 50, h: 50 }],
      labels: [
        { id: 'l1', text: '4P', zone: 'z1' },
        { id: 'l2', text: 'Marketing-Mix', zone: 'z1' },
        { id: 'l3', text: 'Distraktor' },
      ],
    }
    const out = konvertierePoolFrage(poolFrage, POOL_META, TOPICS)
    expect(out.typ).toBe('dragdrop_bild')
    if (out.typ !== 'dragdrop_bild') throw new Error('expected dragdrop_bild')
    expect(out.zielzonen[0].korrekteLabels).toEqual(['4P', 'Marketing-Mix'])
    expect(out.labels).toHaveLength(3)
    expect(out.labels[0].id).toBe('l1')
    expect(out.labels[2].text).toBe('Distraktor')
  })
})

// ──────────────────────────────────────────────────────────────────────
// FiBu Pool→Storage Mapping (Bundle L.b — Pool-Format != Storage-Format)
// ──────────────────────────────────────────────────────────────────────

describe('Pool-Konverter — FiBu Mapping', () => {
  it('buchungssatz: Pool {soll, haben, betrag} → Storage {sollKonto, habenKonto, betrag}', () => {
    const poolFrage: PoolFrageBuchungssatz = {
      id: 'bs01', topic: 'default', type: 'buchungssatz', diff: 1, tax: 'K3',
      q: 'Barverkauf CHF 800',
      konten: [
        { nr: '1000', name: 'Kasse' },
        { nr: '3200', name: 'Warenertrag' },
      ],
      correct: [{ soll: '1000', haben: '3200', betrag: 800 }],
    }
    const out = konvertierePoolFrage(poolFrage, POOL_META, TOPICS)
    if (out.typ !== 'buchungssatz') throw new Error('expected buchungssatz')
    expect(out.buchungen).toHaveLength(1)
    expect(out.buchungen[0].sollKonto).toBe('1000')
    expect(out.buchungen[0].habenKonto).toBe('3200')
    expect(out.buchungen[0].betrag).toBe(800)
    expect(out.buchungen[0].id).toBeTruthy()
    expect(out.kontenauswahl.modus).toBe('eingeschraenkt')
    expect(out.kontenauswahl.konten).toEqual(['1000', '3200'])
  })

  it('tkonto: Pool {nr, name, ab, correctSoll/Haben/Saldo} → Storage TKontoDefinition', () => {
    const poolFrage: PoolFrageTKonto = {
      id: 'tk01', topic: 'default', type: 'tkonto', diff: 2, tax: 'K3',
      q: 'T-Konto Kasse',
      geschaeftsfaelle: ['Barverkauf 600', 'Barzahlung 400'],
      konten: [{
        nr: '1000', name: 'Kasse', ab: 2000,
        correctSoll: [{ gegen: '3200', betrag: 600, gf: 1 }],
        correctHaben: [{ gegen: '2000', betrag: 400, gf: 2 }],
        correctSaldo: { seite: 'soll', betrag: 2200 },
      }],
      gegenkonten: [
        { nr: '3200', name: 'Warenertrag' },
        { nr: '2000', name: 'Kreditoren' },
      ],
    }
    const out = konvertierePoolFrage(poolFrage, POOL_META, TOPICS)
    if (out.typ !== 'tkonto') throw new Error('expected tkonto')
    expect(out.geschaeftsfaelle).toHaveLength(2)
    expect(out.konten).toHaveLength(1)
    const k = out.konten[0]
    expect(k.kontonummer).toBe('1000')
    expect(k.anfangsbestand).toBe(2000)
    expect(k.anfangsbestandVorgegeben).toBe(true)
    expect(k.eintraege).toHaveLength(2)
    expect(k.eintraege[0].seite).toBe('soll')
    expect(k.eintraege[0].gegenkonto).toBe('3200')
    expect(k.eintraege[1].seite).toBe('haben')
    expect(k.eintraege[1].gegenkonto).toBe('2000')
    expect(k.saldo.seite).toBe('soll')
    expect(k.saldo.betrag).toBe(2200)
    expect(out.kontenauswahl.konten).toEqual(['3200', '2000'])
  })

  it('tkonto: ohne ab → anfangsbestandVorgegeben=false', () => {
    const poolFrage: PoolFrageTKonto = {
      id: 'tk02', topic: 'default', type: 'tkonto', diff: 1, tax: 'K2',
      q: 'T-Konto', geschaeftsfaelle: [],
      konten: [{ nr: '1000', name: 'Kasse' }],
    }
    const out = konvertierePoolFrage(poolFrage, POOL_META, TOPICS)
    if (out.typ !== 'tkonto') throw new Error('expected tkonto')
    expect(out.konten[0].anfangsbestandVorgegeben).toBe(false)
    expect(out.konten[0].anfangsbestand).toBeUndefined()
  })

  it('kontenbestimmung: Pool {konto, seite} → Storage {kontonummer, seite}', () => {
    const poolFrage: PoolFrageKontenbestimmung = {
      id: 'kb01', topic: 'default', type: 'kontenbestimmung', diff: 1, tax: 'K2',
      q: 'Bestimme Konten',
      konten: [
        { nr: '1000', name: 'Kasse', kategorie: 'aktiv' },
        { nr: '3200', name: 'Warenertrag', kategorie: 'ertrag' },
      ],
      aufgaben: [{
        text: 'Barverkauf 500',
        correct: [
          { konto: '1000', seite: 'soll' },
          { konto: '3200', seite: 'haben' },
        ],
      }],
    }
    const out = konvertierePoolFrage(poolFrage, POOL_META, TOPICS)
    if (out.typ !== 'kontenbestimmung') throw new Error('expected kontenbestimmung')
    expect(out.aufgaben).toHaveLength(1)
    const a = out.aufgaben[0]
    expect(a.text).toBe('Barverkauf 500')
    expect(a.erwarteteAntworten).toHaveLength(2)
    expect(a.erwarteteAntworten[0].kontonummer).toBe('1000')
    expect(a.erwarteteAntworten[0].seite).toBe('soll')
    expect(a.erwarteteAntworten[1].kontonummer).toBe('3200')
    expect(a.erwarteteAntworten[1].seite).toBe('haben')
    expect(out.kontenauswahl.konten).toEqual(['1000', '3200'])
  })

  it('bilanz: Pool {aktiven, passiven, bilanzsumme} → Storage BilanzERLoesung', () => {
    const poolFrage: PoolFrageBilanz = {
      id: 'bi01', topic: 'default', type: 'bilanz', diff: 2, tax: 'K3',
      q: 'Bilanz erstellen',
      modus: 'bilanz',
      kontenMitSaldi: [
        { nr: '1000', name: 'Kasse', saldo: 5000 },
        { nr: '2800', name: 'Eigenkapital', saldo: 5000 },
      ],
      correct: {
        aktiven: ['1000'],
        passiven: ['2800'],
        bilanzsumme: 5000,
      },
    }
    const out = konvertierePoolFrage(poolFrage, POOL_META, TOPICS)
    if (out.typ !== 'bilanzstruktur') throw new Error('expected bilanzstruktur')
    expect(out.kontenMitSaldi).toHaveLength(2)
    expect(out.kontenMitSaldi[0].kontonummer).toBe('1000')
    expect(out.kontenMitSaldi[0].name).toBe('Kasse')
    expect(out.kontenMitSaldi[0].saldo).toBe(5000)
    const bilanz = out.loesung.bilanz
    expect(bilanz?.bilanzsumme).toBe(5000)
    expect(bilanz?.aktivSeite.gruppen[0].konten).toEqual(['1000'])
    expect(bilanz?.passivSeite.gruppen[0].konten).toEqual(['2800'])
  })
})
