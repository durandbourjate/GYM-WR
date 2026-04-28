import { describe, it, expect } from 'vitest'
import { istEingabeLeer } from './leereEingabenDetektor.ts'
import type { Frage } from '../../types/fragen.ts'
import type { Antwort } from '../../types/antworten.ts'

const baseFrage = {
  version: 1,
  erstelltAm: '2026-04-28',
  geaendertAm: '2026-04-28',
  fachbereich: 'BWL',
  fach: 'SF WR',
  thema: 'Test',
  semester: [],
  gefaesse: [],
  bloom: 'K2',
  tags: [],
  punkte: 1,
  musterlosung: '',
  bewertungsraster: [],
  verwendungen: [],
}

describe('istEingabeLeer', () => {
  describe('null/undefined antwort → leer', () => {
    it('null antwort liefert true', () => {
      const frage = { ...baseFrage, id: 'mc-1', typ: 'mc', fragetext: '?', optionen: [], mehrfachauswahl: false, zufallsreihenfolge: false } as unknown as Frage
      expect(istEingabeLeer(frage, null, 'gesamt')).toBe(true)
    })
    it('undefined antwort liefert true', () => {
      const frage = { ...baseFrage, id: 'mc-1', typ: 'mc', fragetext: '?', optionen: [], mehrfachauswahl: false, zufallsreihenfolge: false } as unknown as Frage
      expect(istEingabeLeer(frage, undefined, 'gesamt')).toBe(true)
    })
  })

  describe('mc', () => {
    const frage = { ...baseFrage, id: 'mc-1', typ: 'mc', fragetext: '?', optionen: [{ id: 'a', text: 'A', korrekt: true }, { id: 'b', text: 'B', korrekt: false }], mehrfachauswahl: false, zufallsreihenfolge: false } as unknown as Frage

    it('leer wenn keine Option markiert', () => {
      const a: Antwort = { typ: 'mc', gewaehlteOptionen: [] }
      expect(istEingabeLeer(frage, a, 'gesamt')).toBe(true)
    })
    it('nicht leer wenn ≥1 Option markiert', () => {
      const a: Antwort = { typ: 'mc', gewaehlteOptionen: ['a'] }
      expect(istEingabeLeer(frage, a, 'gesamt')).toBe(false)
    })
    it('mismatch zone → true (fail-safe)', () => {
      const a: Antwort = { typ: 'mc', gewaehlteOptionen: ['a'] }
      expect(istEingabeLeer(frage, a, { typ: 'lueckenIndex', idx: 0 })).toBe(true)
    })
  })

  describe('richtigfalsch', () => {
    const frage = { ...baseFrage, id: 'rf-1', typ: 'richtigfalsch', fragetext: '?', aussagen: [{ id: 'x1', text: 'A', korrekt: true }, { id: 'x2', text: 'B', korrekt: false }] } as unknown as Frage

    it('gesamt: leer wenn nicht alle Aussagen bewertet', () => {
      const a: Antwort = { typ: 'richtigfalsch', bewertungen: { x1: true } }
      expect(istEingabeLeer(frage, a, 'gesamt')).toBe(true)
    })
    it('gesamt: nicht leer wenn alle Aussagen bewertet', () => {
      const a: Antwort = { typ: 'richtigfalsch', bewertungen: { x1: true, x2: false } }
      expect(istEingabeLeer(frage, a, 'gesamt')).toBe(false)
    })
    it('aussageIndex: spezifische Aussage leer', () => {
      const a: Antwort = { typ: 'richtigfalsch', bewertungen: { x1: true } }
      expect(istEingabeLeer(frage, a, { typ: 'aussageIndex', idx: 0 })).toBe(false)
      expect(istEingabeLeer(frage, a, { typ: 'aussageIndex', idx: 1 })).toBe(true)
    })
    it('aussageIndex: out-of-range → true', () => {
      const a: Antwort = { typ: 'richtigfalsch', bewertungen: { x1: true, x2: false } }
      expect(istEingabeLeer(frage, a, { typ: 'aussageIndex', idx: 99 })).toBe(true)
    })
  })

  describe('lueckentext', () => {
    const frage = { ...baseFrage, id: 'lt-1', typ: 'lueckentext', fragetext: '?', textMitLuecken: '{0} und {1}', luecken: [{ id: 'l0', korrekteAntworten: ['Aktiva'], caseSensitive: false }, { id: 'l1', korrekteAntworten: ['Passiva'], caseSensitive: false }] } as unknown as Frage

    it('gesamt: leer wenn eine Lücke ungefüllt', () => {
      const a: Antwort = { typ: 'lueckentext', eintraege: { l0: 'Aktiva' } }
      expect(istEingabeLeer(frage, a, 'gesamt')).toBe(true)
    })
    it('gesamt: nicht leer wenn alle Lücken gefüllt', () => {
      const a: Antwort = { typ: 'lueckentext', eintraege: { l0: 'Aktiva', l1: 'Passiva' } }
      expect(istEingabeLeer(frage, a, 'gesamt')).toBe(false)
    })
    it('gesamt: whitespace-only zählt als leer', () => {
      const a: Antwort = { typ: 'lueckentext', eintraege: { l0: 'Aktiva', l1: '  ' } }
      expect(istEingabeLeer(frage, a, 'gesamt')).toBe(true)
    })
    it('lueckenIndex: spezifische Lücke', () => {
      const a: Antwort = { typ: 'lueckentext', eintraege: { l0: 'Aktiva' } }
      expect(istEingabeLeer(frage, a, { typ: 'lueckenIndex', idx: 0 })).toBe(false)
      expect(istEingabeLeer(frage, a, { typ: 'lueckenIndex', idx: 1 })).toBe(true)
    })
  })

  describe('zuordnung', () => {
    const frage = { ...baseFrage, id: 'zu-1', typ: 'zuordnung', fragetext: '?', paare: [{ links: 'A', rechts: 'X' }, { links: 'B', rechts: 'Y' }], zufallsreihenfolge: false } as unknown as Frage

    it('gesamt: leer wenn ein Paar nicht zugeordnet', () => {
      const a: Antwort = { typ: 'zuordnung', zuordnungen: { A: 'X' } }
      expect(istEingabeLeer(frage, a, 'gesamt')).toBe(true)
    })
    it('gesamt: nicht leer wenn alle Paare zugeordnet', () => {
      const a: Antwort = { typ: 'zuordnung', zuordnungen: { A: 'X', B: 'Y' } }
      expect(istEingabeLeer(frage, a, 'gesamt')).toBe(false)
    })
    it('paarIndex: spezifisches Paar', () => {
      const a: Antwort = { typ: 'zuordnung', zuordnungen: { A: 'X' } }
      expect(istEingabeLeer(frage, a, { typ: 'paarIndex', idx: 0 })).toBe(false)
      expect(istEingabeLeer(frage, a, { typ: 'paarIndex', idx: 1 })).toBe(true)
    })
  })

  describe('bildbeschriftung', () => {
    const frage = { ...baseFrage, id: 'bb-1', typ: 'bildbeschriftung', fragetext: '?', bildUrl: 'x.svg', beschriftungen: [{ id: 'm0', position: { x: 10, y: 10 }, korrekt: ['Dach'] }, { id: 'm1', position: { x: 50, y: 50 }, korrekt: ['Wand'] }] } as unknown as Frage

    it('gesamt: leer wenn ein Marker ungefüllt', () => {
      const a: Antwort = { typ: 'bildbeschriftung', eintraege: { m0: 'Dach' } }
      expect(istEingabeLeer(frage, a, 'gesamt')).toBe(true)
    })
    it('gesamt: nicht leer wenn alle Marker gefüllt', () => {
      const a: Antwort = { typ: 'bildbeschriftung', eintraege: { m0: 'Dach', m1: 'Wand' } }
      expect(istEingabeLeer(frage, a, 'gesamt')).toBe(false)
    })
    it('markerIndex: spezifischer Marker', () => {
      const a: Antwort = { typ: 'bildbeschriftung', eintraege: { m0: 'Dach' } }
      expect(istEingabeLeer(frage, a, { typ: 'markerIndex', idx: 0 })).toBe(false)
      expect(istEingabeLeer(frage, a, { typ: 'markerIndex', idx: 1 })).toBe(true)
    })
  })

  describe('dragdrop_bild', () => {
    const frage = { ...baseFrage, id: 'dd-1', typ: 'dragdrop_bild', fragetext: '?', bildUrl: 'x.svg', zielzonen: [], labels: ['A', 'B'] } as unknown as Frage

    it('gesamt: leer wenn keine Zuordnung', () => {
      const a: Antwort = { typ: 'dragdrop_bild', zuordnungen: {} }
      expect(istEingabeLeer(frage, a, 'gesamt')).toBe(true)
    })
    it('gesamt: nicht leer wenn ≥1 Zuordnung', () => {
      const a: Antwort = { typ: 'dragdrop_bild', zuordnungen: { A: 'z1' } }
      expect(istEingabeLeer(frage, a, 'gesamt')).toBe(false)
    })
  })

  describe('freitext', () => {
    const frage = { ...baseFrage, id: 'ft-1', typ: 'freitext', fragetext: '?', laenge: 'kurz' } as unknown as Frage

    it('leer wenn text leer', () => {
      const a: Antwort = { typ: 'freitext', text: '' }
      expect(istEingabeLeer(frage, a, 'gesamt')).toBe(true)
    })
    it('leer wenn text nur whitespace', () => {
      const a: Antwort = { typ: 'freitext', text: '   \n  ' }
      expect(istEingabeLeer(frage, a, 'gesamt')).toBe(true)
    })
    it('leer wenn nur Tiptap-Empty-Markup', () => {
      const a: Antwort = { typ: 'freitext', text: '<p></p>' }
      expect(istEingabeLeer(frage, a, 'gesamt')).toBe(true)
    })
    it('nicht leer mit Text', () => {
      const a: Antwort = { typ: 'freitext', text: 'Hallo' }
      expect(istEingabeLeer(frage, a, 'gesamt')).toBe(false)
    })
    it('nicht leer mit HTML-Wrapped Text', () => {
      const a: Antwort = { typ: 'freitext', text: '<p>Hallo</p>' }
      expect(istEingabeLeer(frage, a, 'gesamt')).toBe(false)
    })
  })

  describe('berechnung', () => {
    const frage = { ...baseFrage, id: 'be-1', typ: 'berechnung', fragetext: '?', ergebnisse: [{ id: 'e0', label: 'X', korrekt: 100, toleranz: 0 }, { id: 'e1', label: 'Y', korrekt: 200, toleranz: 0 }], rechenwegErforderlich: false } as unknown as Frage

    it('gesamt: leer wenn ein Ergebnis ungefüllt', () => {
      const a: Antwort = { typ: 'berechnung', ergebnisse: { e0: '100' } }
      expect(istEingabeLeer(frage, a, 'gesamt')).toBe(true)
    })
    it('gesamt: nicht leer wenn alle Ergebnisse gefüllt', () => {
      const a: Antwort = { typ: 'berechnung', ergebnisse: { e0: '100', e1: '200' } }
      expect(istEingabeLeer(frage, a, 'gesamt')).toBe(false)
    })
    it('ergebnisIndex: spezifisches Ergebnis', () => {
      const a: Antwort = { typ: 'berechnung', ergebnisse: { e0: '100' } }
      expect(istEingabeLeer(frage, a, { typ: 'ergebnisIndex', idx: 0 })).toBe(false)
      expect(istEingabeLeer(frage, a, { typ: 'ergebnisIndex', idx: 1 })).toBe(true)
    })
  })

  describe('andere Fragetypen (fail-safe)', () => {
    it('audio → true (kein Outline-Support)', () => {
      const frage = { ...baseFrage, id: 'au-1', typ: 'audio', fragetext: '?' } as unknown as Frage
      const a: Antwort = { typ: 'audio' }
      expect(istEingabeLeer(frage, a, 'gesamt')).toBe(true)
    })
  })
})
