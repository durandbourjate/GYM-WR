import { describe, it, expect } from 'vitest'
import { toSharedFrage, fromSharedFrage } from '../adapters/frageAdapter'
import type { Frage as LernFrage } from '../types/fragen'
import type { MCFrage, FreitextFrage, LueckentextFrage, RichtigFalschFrage, BerechnungFrage, SortierungFrage, VisualisierungFrage, BilanzERFrage, AufgabengruppeFrage } from '@shared/types/fragen'

// Hilfsfunktion: minimale LP-Frage
function lpFrage(overrides: Partial<LernFrage> & { typ: LernFrage['typ'] }): LernFrage {
  return {
    id: 'test-1',
    fach: 'VWL',
    thema: 'BIP',
    schwierigkeit: 2,
    frage: 'Was ist das BIP?',
    uebung: true,
    pruefungstauglich: false,
    ...overrides,
  } as LernFrage
}

describe('frageAdapter', () => {
  describe('toSharedFrage', () => {
    it('mappt MC-Frage korrekt', () => {
      const lf = lpFrage({
        typ: 'mc',
        optionen: ['Option A', 'Option B', 'Option C'],
        korrekt: 'Option A',
      })
      const sf = toSharedFrage(lf) as MCFrage

      expect(sf.typ).toBe('mc')
      expect(sf.fragetext).toBe('Was ist das BIP?')
      expect(sf.fachbereich).toBe('VWL')
      expect(sf.mehrfachauswahl).toBe(false)
      expect(sf.optionen).toHaveLength(3)
      expect(sf.optionen[0].text).toBe('Option A')
      expect(sf.optionen[0].korrekt).toBe(true)
      expect(sf.optionen[1].korrekt).toBe(false)
    })

    it('mappt multi → mc mit mehrfachauswahl', () => {
      const lf = lpFrage({
        typ: 'multi',
        optionen: ['A', 'B', 'C'],
        korrekt: ['A', 'C'],
      })
      const sf = toSharedFrage(lf) as MCFrage

      expect(sf.typ).toBe('mc')
      expect(sf.mehrfachauswahl).toBe(true)
      expect(sf.optionen.filter(o => o.korrekt)).toHaveLength(2)
    })

    it('mappt tf → richtigfalsch', () => {
      const lf = lpFrage({
        typ: 'tf',
        aussagen: [
          { text: 'Das BIP misst die Wirtschaftsleistung', korrekt: true },
          { text: 'Das BIP ist immer nominal', korrekt: false },
        ],
      })
      const sf = toSharedFrage(lf) as RichtigFalschFrage

      expect(sf.typ).toBe('richtigfalsch')
      expect(sf.aussagen).toHaveLength(2)
      expect(sf.aussagen[0].text).toBe('Das BIP misst die Wirtschaftsleistung')
      expect(sf.aussagen[0].korrekt).toBe(true)
    })

    it('mappt fill → lueckentext mit korrekteAntworten', () => {
      const lf = lpFrage({
        typ: 'fill',
        frage: 'Das {{1}} misst die Wirtschaftsleistung.',
        luecken: [{ id: '1', korrekt: 'BIP', optionen: ['BIP', 'BNE'] }],
      })
      const sf = toSharedFrage(lf) as LueckentextFrage

      expect(sf.typ).toBe('lueckentext')
      expect(sf.luecken[0].korrekteAntworten).toEqual(['BIP', 'BNE'])
    })

    it('mappt open → freitext', () => {
      const lf = lpFrage({
        typ: 'open',
        musterantwort: 'Beispielantwort',
      })
      const sf = toSharedFrage(lf) as FreitextFrage

      expect(sf.typ).toBe('freitext')
      expect(sf.musterlosung).toBe('Beispielantwort')
    })

    it('mappt calc → berechnung', () => {
      const lf = lpFrage({
        typ: 'calc',
        korrekt: [42] as number[],
        toleranz: 0.5,
        einheit: 'CHF',
      })
      const sf = toSharedFrage(lf) as BerechnungFrage

      expect(sf.typ).toBe('berechnung')
      expect(sf.ergebnisse[0].korrekt).toBe(42)
      expect(sf.ergebnisse[0].toleranz).toBe(0.5)
      expect(sf.ergebnisse[0].einheit).toBe('CHF')
    })

    it('mappt calc mit calcZeilen → berechnung mit mehreren Ergebnissen', () => {
      const lf = lpFrage({
        typ: 'calc',
        calcZeilen: [
          { label: 'Umsatz', answer: 1000, tolerance: 0, unit: 'CHF' },
          { label: 'Gewinn', answer: 200, tolerance: 5, unit: 'CHF' },
        ],
      })
      const sf = toSharedFrage(lf) as BerechnungFrage

      expect(sf.ergebnisse).toHaveLength(2)
      expect(sf.ergebnisse[0].label).toBe('Umsatz')
      expect(sf.ergebnisse[1].korrekt).toBe(200)
    })

    it('mappt sortierung korrekt', () => {
      const lf = lpFrage({
        typ: 'sortierung',
        reihenfolge: ['Erste', 'Zweite', 'Dritte'],
      })
      const sf = toSharedFrage(lf) as SortierungFrage

      expect(sf.typ).toBe('sortierung')
      expect(sf.elemente).toEqual(['Erste', 'Zweite', 'Dritte'])
    })

    it('mappt zeichnen → visualisierung', () => {
      const lf = lpFrage({ typ: 'zeichnen' })
      const sf = toSharedFrage(lf) as VisualisierungFrage

      expect(sf.typ).toBe('visualisierung')
      expect(sf.untertyp).toBe('zeichnen')
    })

    it('mappt bilanz → bilanzstruktur', () => {
      const lf = lpFrage({
        typ: 'bilanz',
        bilanzModus: 'bilanz',
        kontenMitSaldi: [{ nr: '1000', name: 'Kasse', saldo: 5000 }],
      })
      const sf = toSharedFrage(lf) as BilanzERFrage

      expect(sf.typ).toBe('bilanzstruktur')
      expect(sf.modus).toBe('bilanz')
    })

    it('mappt gruppe → aufgabengruppe', () => {
      const lf = lpFrage({
        typ: 'gruppe',
        kontext: 'Lesen Sie den Text und beantworten Sie die Fragen.',
        teil: [{ sub: 'a', type: 'open', q: 'Teilfrage A' }],
      })
      const sf = toSharedFrage(lf) as AufgabengruppeFrage

      expect(sf.typ).toBe('aufgabengruppe')
      expect(sf.kontext).toBe('Lesen Sie den Text und beantworten Sie die Fragen.')
    })

    it('mappt fach → fachbereich', () => {
      const lf = lpFrage({ typ: 'mc', fach: 'BWL', optionen: ['A'], korrekt: 'A' })
      const sf = toSharedFrage(lf)
      expect(sf.fachbereich).toBe('BWL')
    })

    it('mappt taxonomie → bloom', () => {
      const lf = lpFrage({ typ: 'mc', taxonomie: 'K3', optionen: ['A'], korrekt: 'A' })
      const sf = toSharedFrage(lf)
      expect(sf.bloom).toBe('K3')
    })
  })

  describe('fromSharedFrage', () => {
    it('mappt shared MC zurück zu LP-Format', () => {
      const sf: MCFrage = {
        id: 'test-1', version: 1, erstelltAm: '', geaendertAm: '',
        fachbereich: 'VWL', fach: 'VWL', thema: 'BIP', bloom: 'K2',
        tags: [], punkte: 1, musterlosung: '', bewertungsraster: [],
        verwendungen: [], semester: [], gefaesse: [],
        typ: 'mc', fragetext: 'Was ist das BIP?',
        optionen: [
          { id: '1', text: 'Bruttoinlandsprodukt', korrekt: true },
          { id: '2', text: 'Bruttonationalprodukt', korrekt: false },
        ],
        mehrfachauswahl: false, zufallsreihenfolge: false,
      }
      const lf = fromSharedFrage(sf)

      expect(lf.typ).toBe('mc')
      expect(lf.frage).toBe('Was ist das BIP?')
      expect(lf.fach).toBe('VWL')
      expect(lf.optionen).toEqual(['Bruttoinlandsprodukt', 'Bruttonationalprodukt'])
      expect(lf.korrekt).toBe('Bruttoinlandsprodukt')
    })

    it('bewahrt schwierigkeit wenn vorhanden', () => {
      const sf: MCFrage = {
        id: 'test-1', version: 1, erstelltAm: '', geaendertAm: '',
        fachbereich: 'VWL', fach: 'VWL', thema: 'BIP', bloom: 'K2',
        tags: [], punkte: 1, musterlosung: '', bewertungsraster: [],
        verwendungen: [], semester: [], gefaesse: [], schwierigkeit: 3,
        typ: 'mc', fragetext: 'Test',
        optionen: [{ id: '1', text: 'A', korrekt: true }],
        mehrfachauswahl: false, zufallsreihenfolge: false,
      }
      const original = lpFrage({ typ: 'mc', schwierigkeit: 2 })
      const lf = fromSharedFrage(sf, original)

      // Shared hat schwierigkeit 3 → wird übernommen
      expect(lf.schwierigkeit).toBe(3)
    })

    it('setzt uebung: true, pruefungstauglich: false als Default', () => {
      const sf: MCFrage = {
        id: 'test-1', version: 1, erstelltAm: '', geaendertAm: '',
        fachbereich: 'VWL', fach: 'VWL', thema: 'BIP', bloom: 'K2',
        tags: [], punkte: 1, musterlosung: '', bewertungsraster: [],
        verwendungen: [], semester: [], gefaesse: [],
        typ: 'mc', fragetext: 'Test',
        optionen: [{ id: '1', text: 'A', korrekt: true }],
        mehrfachauswahl: false, zufallsreihenfolge: false,
      }
      const lf = fromSharedFrage(sf)

      expect(lf.uebung).toBe(true)
      expect(lf.pruefungstauglich).toBe(false)
    })

    it('bewahrt LP-eigene Felder aus Original', () => {
      const sf: MCFrage = {
        id: 'test-1', version: 1, erstelltAm: '', geaendertAm: '',
        fachbereich: 'VWL', fach: 'VWL', thema: 'BIP', bloom: 'K2',
        tags: [], punkte: 1, musterlosung: '', bewertungsraster: [],
        verwendungen: [], semester: [], gefaesse: [],
        typ: 'mc', fragetext: 'Test',
        optionen: [{ id: '1', text: 'A', korrekt: true }],
        mehrfachauswahl: false, zufallsreihenfolge: false,
      }
      const original = lpFrage({
        typ: 'mc',
        stufe: 'GYM2',
        lernziel: 'BIP berechnen können',
      })
      const lf = fromSharedFrage(sf, original)

      expect(lf.stufe).toBe('GYM2')
      expect(lf.lernziel).toBe('BIP berechnen können')
    })
  })

  describe('roundtrip', () => {
    it('LP → shared → LP bewahrt alle Felder (MC)', () => {
      const original = lpFrage({
        typ: 'mc',
        optionen: ['A', 'B', 'C'],
        korrekt: 'B',
        taxonomie: 'K3',
        stufe: 'GYM1',
        lernziel: 'Test-Lernziel',
      })
      const shared = toSharedFrage(original)
      const result = fromSharedFrage(shared, original)

      expect(result.id).toBe(original.id)
      expect(result.fach).toBe(original.fach)
      expect(result.thema).toBe(original.thema)
      expect(result.typ).toBe('mc')
      expect(result.optionen).toEqual(['A', 'B', 'C'])
      expect(result.korrekt).toBe('B')
      expect(result.stufe).toBe('GYM1')
      expect(result.lernziel).toBe('Test-Lernziel')
    })

    it('LP → shared → LP bewahrt alle Felder (TF)', () => {
      const original = lpFrage({
        typ: 'tf',
        aussagen: [
          { text: 'Aussage 1', korrekt: true },
          { text: 'Aussage 2', korrekt: false },
        ],
      })
      const shared = toSharedFrage(original)
      const result = fromSharedFrage(shared, original)

      expect(result.typ).toBe('tf')
      expect(result.aussagen).toEqual(original.aussagen)
    })

    it('LP → shared → LP bewahrt alle Felder (Fill)', () => {
      const original = lpFrage({
        typ: 'fill',
        luecken: [
          { id: '1', korrekt: 'BIP', optionen: ['BIP', 'BNE'] },
          { id: '2', korrekt: 'Schweiz' },
        ],
      })
      const shared = toSharedFrage(original)
      const result = fromSharedFrage(shared, original)

      expect(result.typ).toBe('fill')
      expect(result.luecken?.[0].korrekt).toBe('BIP')
      expect(result.luecken?.[1].korrekt).toBe('Schweiz')
    })
  })
})
