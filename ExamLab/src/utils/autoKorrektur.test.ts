import { describe, it, expect } from 'vitest'
import { istAutoKorrigierbar, autoKorrigiere } from './autoKorrektur'
import type { Frage, MCFrage, RichtigFalschFrage, SortierungFrage, HotspotFrage, BildbeschriftungFrage, DragDropBildFrage, FormelFrage } from '../types/fragen'
import type { Antwort } from '../types/antworten'

describe('istAutoKorrigierbar', () => {
  it.each([
    'mc', 'richtigfalsch', 'lueckentext', 'zuordnung', 'berechnung',
    'buchungssatz', 'tkonto', 'kontenbestimmung', 'bilanzstruktur',
    'sortierung', 'hotspot', 'bildbeschriftung', 'dragdrop_bild', 'formel',
  ])('gibt true für %s', (typ) => {
    expect(istAutoKorrigierbar(typ)).toBe(true)
  })

  it.each(['freitext', 'pdf', 'visualisierung', 'aufgabengruppe', 'audio', 'code'])('gibt false für %s', (typ) => {
    expect(istAutoKorrigierbar(typ)).toBe(false)
  })
})

// Minimale Frage-Factory für MC
function makeMCFrage(optionen: { id: string; text: string; korrekt: boolean }[], mehrfach = false): MCFrage {
  return {
    id: 'mc-1',
    typ: 'mc',
    version: 1,
    erstelltAm: '2026-01-01',
    geaendertAm: '2026-01-01',
    fachbereich: 'VWL',
    fach: 'Wirtschaft & Recht',
    thema: 'Test',
    semester: ['S3'],
    gefaesse: ['SF'],
    bloom: 'K1',
    tags: [],
    punkte: 2,
    musterlosung: '',
    bewertungsraster: [],
    verwendungen: [],
    fragetext: 'Welche?',
    optionen,
    mehrfachauswahl: mehrfach,
    zufallsreihenfolge: false,
  }
}

describe('autoKorrigiere', () => {
  it('gibt null bei nicht-auto-korrigierbarem Typ', () => {
    const frage = { id: 'f1', typ: 'freitext', punkte: 3 } as Frage
    expect(autoKorrigiere(frage, undefined)).toBeNull()
  })

  it('gibt 0 Punkte bei fehlender Antwort', () => {
    const frage = makeMCFrage([{ id: 'o1', text: 'A', korrekt: true }])
    const result = autoKorrigiere(frage, undefined)
    expect(result).not.toBeNull()
    expect(result!.erreichtePunkte).toBe(0)
    expect(result!.maxPunkte).toBe(2)
  })

  it('korrigiert MC Einfachauswahl korrekt', () => {
    const frage = makeMCFrage([
      { id: 'o1', text: 'A', korrekt: true },
      { id: 'o2', text: 'B', korrekt: false },
    ])
    const antwort: Antwort = { typ: 'mc', gewaehlteOptionen: ['o1'] }
    const result = autoKorrigiere(frage, antwort)
    expect(result).not.toBeNull()
    expect(result!.erreichtePunkte).toBe(2)
  })

  it('korrigiert MC Einfachauswahl falsch', () => {
    const frage = makeMCFrage([
      { id: 'o1', text: 'A', korrekt: true },
      { id: 'o2', text: 'B', korrekt: false },
    ])
    const antwort: Antwort = { typ: 'mc', gewaehlteOptionen: ['o2'] }
    const result = autoKorrigiere(frage, antwort)
    expect(result).not.toBeNull()
    expect(result!.erreichtePunkte).toBe(0)
  })

  it('gibt null bei Typ-Mismatch', () => {
    const frage = makeMCFrage([{ id: 'o1', text: 'A', korrekt: true }])
    const antwort = { typ: 'freitext', text: 'Hallo' } as unknown as Antwort
    const result = autoKorrigiere(frage, antwort)
    expect(result).toBeNull()
  })

  it('korrigiert MC Mehrfachauswahl teilweise korrekt', () => {
    const frage = makeMCFrage([
      { id: 'o1', text: 'A', korrekt: true },
      { id: 'o2', text: 'B', korrekt: true },
      { id: 'o3', text: 'C', korrekt: false },
    ], true)
    const antwort: Antwort = { typ: 'mc', gewaehlteOptionen: ['o1', 'o3'] }
    const result = autoKorrigiere(frage, antwort)
    expect(result).not.toBeNull()
    // o1 korrekt (+1/3 * 2), o3 falsch (-1/3 * 2) → ~ 0 (minimum 0)
    expect(result!.erreichtePunkte).toBeGreaterThanOrEqual(0)
    expect(result!.erreichtePunkte).toBeLessThanOrEqual(2)
  })

  it('korrigiert MC Mehrfachauswahl alle korrekt', () => {
    const frage = makeMCFrage([
      { id: 'o1', text: 'A', korrekt: true },
      { id: 'o2', text: 'B', korrekt: true },
      { id: 'o3', text: 'C', korrekt: false },
    ], true)
    const antwort: Antwort = { typ: 'mc', gewaehlteOptionen: ['o1', 'o2'] }
    const result = autoKorrigiere(frage, antwort)
    expect(result).not.toBeNull()
    expect(result!.erreichtePunkte).toBe(2)
  })

  it('gibt 0 bei leerem gewaehlteOptionen-Array', () => {
    const frage = makeMCFrage([
      { id: 'o1', text: 'A', korrekt: true },
    ])
    const antwort: Antwort = { typ: 'mc', gewaehlteOptionen: [] }
    const result = autoKorrigiere(frage, antwort)
    expect(result).not.toBeNull()
    expect(result!.erreichtePunkte).toBe(0)
  })

  it('korrigiert RichtigFalsch', () => {
    const frage = {
      id: 'rf-1',
      typ: 'richtigfalsch',
      version: 1,
      erstelltAm: '2026-01-01',
      geaendertAm: '2026-01-01',
      fachbereich: 'VWL',
    fach: 'Wirtschaft & Recht',
      thema: 'Test',
      semester: ['S3'],
      gefaesse: ['SF'],
      bloom: 'K1',
      tags: [],
      punkte: 3,
      musterlosung: '',
      bewertungsraster: [],
      verwendungen: [],
      fragetext: 'Richtig oder Falsch?',
      aussagen: [
        { id: 'a1', text: 'Die SNB druckt Geld', korrekt: true },
        { id: 'a2', text: 'Die Sonne ist kalt', korrekt: false },
        { id: 'a3', text: 'Wasser ist nass', korrekt: true },
      ],
    } as RichtigFalschFrage

    const antwort: Antwort = {
      typ: 'richtigfalsch',
      bewertungen: { a1: true, a2: false, a3: true },
    }
    const result = autoKorrigiere(frage, antwort)
    expect(result).not.toBeNull()
    expect(result!.erreichtePunkte).toBe(3) // Alle korrekt
  })

  // === SORTIERUNG ===

  it('korrigiert Sortierung alle korrekt', () => {
    const frage: SortierungFrage = {
      id: 'so-1', typ: 'sortierung', version: 1, erstelltAm: '2026-01-01', geaendertAm: '2026-01-01',
      fachbereich: 'VWL', fach: 'Wirtschaft & Recht', thema: 'Test',
      semester: ['S3'], gefaesse: ['SF'], bloom: 'K2', tags: [],
      punkte: 4, musterlosung: '', bewertungsraster: [], verwendungen: [],
      fragetext: 'Sortiere chronologisch',
      elemente: ['A', 'B', 'C', 'D'],
      teilpunkte: true,
    }
    const antwort: Antwort = { typ: 'sortierung', reihenfolge: ['A', 'B', 'C', 'D'] }
    const result = autoKorrigiere(frage, antwort)
    expect(result).not.toBeNull()
    expect(result!.erreichtePunkte).toBe(4)
  })

  it('korrigiert Sortierung teilweise korrekt (Teilpunkte)', () => {
    const frage: SortierungFrage = {
      id: 'so-2', typ: 'sortierung', version: 1, erstelltAm: '2026-01-01', geaendertAm: '2026-01-01',
      fachbereich: 'VWL', fach: 'Wirtschaft & Recht', thema: 'Test',
      semester: ['S3'], gefaesse: ['SF'], bloom: 'K2', tags: [],
      punkte: 4, musterlosung: '', bewertungsraster: [], verwendungen: [],
      fragetext: 'Sortiere',
      elemente: ['A', 'B', 'C', 'D'],
      teilpunkte: true,
    }
    const antwort: Antwort = { typ: 'sortierung', reihenfolge: ['A', 'B', 'D', 'C'] }
    const result = autoKorrigiere(frage, antwort)
    expect(result).not.toBeNull()
    expect(result!.erreichtePunkte).toBe(2) // A + B korrekt
  })

  it('korrigiert Sortierung ohne Teilpunkte (alles-oder-nichts)', () => {
    const frage: SortierungFrage = {
      id: 'so-3', typ: 'sortierung', version: 1, erstelltAm: '2026-01-01', geaendertAm: '2026-01-01',
      fachbereich: 'VWL', fach: 'Wirtschaft & Recht', thema: 'Test',
      semester: ['S3'], gefaesse: ['SF'], bloom: 'K2', tags: [],
      punkte: 4, musterlosung: '', bewertungsraster: [], verwendungen: [],
      fragetext: 'Sortiere',
      elemente: ['A', 'B', 'C', 'D'],
      teilpunkte: false,
    }
    const antwort: Antwort = { typ: 'sortierung', reihenfolge: ['A', 'B', 'D', 'C'] }
    const result = autoKorrigiere(frage, antwort)
    expect(result).not.toBeNull()
    expect(result!.erreichtePunkte).toBe(0) // Nicht alles korrekt → 0
  })

  // === HOTSPOT ===

  it('korrigiert Hotspot Treffer in Rechteck', () => {
    const frage: HotspotFrage = {
      id: 'hs-1', typ: 'hotspot', version: 1, erstelltAm: '2026-01-01', geaendertAm: '2026-01-01',
      fachbereich: 'VWL', fach: 'Wirtschaft & Recht', thema: 'Test',
      semester: ['S3'], gefaesse: ['SF'], bloom: 'K2', tags: [],
      punkte: 2, musterlosung: '', bewertungsraster: [], verwendungen: [],
      fragetext: 'Klicke auf das richtige Feld',
      bildUrl: 'https://example.com/bild.png',
      bereiche: [{
        id: 'b1', form: 'rechteck',
        koordinaten: { x: 10, y: 10, breite: 20, hoehe: 20 },
        label: 'Bereich 1', punkte: 2,
      }],
      mehrfachauswahl: false,
    }
    const antwort: Antwort = { typ: 'hotspot', klicks: [{ x: 15, y: 15 }] }
    const result = autoKorrigiere(frage, antwort)
    expect(result).not.toBeNull()
    expect(result!.erreichtePunkte).toBe(2)
  })

  it('korrigiert Hotspot Fehltreffer', () => {
    const frage: HotspotFrage = {
      id: 'hs-2', typ: 'hotspot', version: 1, erstelltAm: '2026-01-01', geaendertAm: '2026-01-01',
      fachbereich: 'VWL', fach: 'Wirtschaft & Recht', thema: 'Test',
      semester: ['S3'], gefaesse: ['SF'], bloom: 'K2', tags: [],
      punkte: 2, musterlosung: '', bewertungsraster: [], verwendungen: [],
      fragetext: 'Klicke auf das richtige Feld',
      bildUrl: 'https://example.com/bild.png',
      bereiche: [{
        id: 'b1', form: 'rechteck',
        koordinaten: { x: 10, y: 10, breite: 20, hoehe: 20 },
        label: 'Bereich 1', punkte: 2,
      }],
      mehrfachauswahl: false,
    }
    const antwort: Antwort = { typ: 'hotspot', klicks: [{ x: 50, y: 50 }] }
    const result = autoKorrigiere(frage, antwort)
    expect(result).not.toBeNull()
    expect(result!.erreichtePunkte).toBe(0)
  })

  it('korrigiert Hotspot Treffer in Kreis', () => {
    const frage: HotspotFrage = {
      id: 'hs-3', typ: 'hotspot', version: 1, erstelltAm: '2026-01-01', geaendertAm: '2026-01-01',
      fachbereich: 'VWL', fach: 'Wirtschaft & Recht', thema: 'Test',
      semester: ['S3'], gefaesse: ['SF'], bloom: 'K2', tags: [],
      punkte: 3, musterlosung: '', bewertungsraster: [], verwendungen: [],
      fragetext: 'Klicke auf den Kreis',
      bildUrl: 'https://example.com/bild.png',
      bereiche: [{
        id: 'b1', form: 'kreis',
        koordinaten: { x: 50, y: 50, radius: 10 },
        label: 'Zentrum', punkte: 3,
      }],
      mehrfachauswahl: false,
    }
    const antwort: Antwort = { typ: 'hotspot', klicks: [{ x: 55, y: 50 }] }
    const result = autoKorrigiere(frage, antwort)
    expect(result).not.toBeNull()
    expect(result!.erreichtePunkte).toBe(3) // Innerhalb des Radius
  })

  // === BILDBESCHRIFTUNG ===

  it('korrigiert Bildbeschriftung alle korrekt', () => {
    const frage: BildbeschriftungFrage = {
      id: 'bb-1', typ: 'bildbeschriftung', version: 1, erstelltAm: '2026-01-01', geaendertAm: '2026-01-01',
      fachbereich: 'VWL', fach: 'Wirtschaft & Recht', thema: 'Test',
      semester: ['S3'], gefaesse: ['SF'], bloom: 'K2', tags: [],
      punkte: 3, musterlosung: '', bewertungsraster: [], verwendungen: [],
      fragetext: 'Beschrifte das Bild',
      bildUrl: 'https://example.com/bild.png',
      beschriftungen: [
        { id: 'l1', position: { x: 10, y: 10 }, korrekt: ['Angebot', 'Supply'] },
        { id: 'l2', position: { x: 50, y: 50 }, korrekt: ['Nachfrage'] },
        { id: 'l3', position: { x: 80, y: 20 }, korrekt: ['Gleichgewicht', 'GGW'] },
      ],
    }
    const antwort: Antwort = {
      typ: 'bildbeschriftung',
      eintraege: { l1: 'Angebot', l2: 'Nachfrage', l3: 'GGW' },
    }
    const result = autoKorrigiere(frage, antwort)
    expect(result).not.toBeNull()
    expect(result!.erreichtePunkte).toBe(3)
  })

  it('korrigiert Bildbeschriftung case-insensitive', () => {
    const frage: BildbeschriftungFrage = {
      id: 'bb-2', typ: 'bildbeschriftung', version: 1, erstelltAm: '2026-01-01', geaendertAm: '2026-01-01',
      fachbereich: 'VWL', fach: 'Wirtschaft & Recht', thema: 'Test',
      semester: ['S3'], gefaesse: ['SF'], bloom: 'K2', tags: [],
      punkte: 2, musterlosung: '', bewertungsraster: [], verwendungen: [],
      fragetext: 'Beschrifte',
      bildUrl: 'https://example.com/bild.png',
      beschriftungen: [
        { id: 'l1', position: { x: 10, y: 10 }, korrekt: ['BIP'] },
        { id: 'l2', position: { x: 50, y: 50 }, korrekt: ['Inflation'] },
      ],
    }
    const antwort: Antwort = {
      typ: 'bildbeschriftung',
      eintraege: { l1: 'bip', l2: 'INFLATION' },
    }
    const result = autoKorrigiere(frage, antwort)
    expect(result).not.toBeNull()
    expect(result!.erreichtePunkte).toBe(2)
  })

  it('korrigiert Bildbeschriftung teilweise falsch', () => {
    const frage: BildbeschriftungFrage = {
      id: 'bb-3', typ: 'bildbeschriftung', version: 1, erstelltAm: '2026-01-01', geaendertAm: '2026-01-01',
      fachbereich: 'VWL', fach: 'Wirtschaft & Recht', thema: 'Test',
      semester: ['S3'], gefaesse: ['SF'], bloom: 'K2', tags: [],
      punkte: 2, musterlosung: '', bewertungsraster: [], verwendungen: [],
      fragetext: 'Beschrifte',
      bildUrl: 'https://example.com/bild.png',
      beschriftungen: [
        { id: 'l1', position: { x: 10, y: 10 }, korrekt: ['BIP'] },
        { id: 'l2', position: { x: 50, y: 50 }, korrekt: ['Inflation'] },
      ],
    }
    const antwort: Antwort = {
      typ: 'bildbeschriftung',
      eintraege: { l1: 'BIP', l2: 'Deflation' },
    }
    const result = autoKorrigiere(frage, antwort)
    expect(result).not.toBeNull()
    expect(result!.erreichtePunkte).toBe(1) // Nur l1 korrekt
  })

  // === DRAG & DROP BILD ===

  it('korrigiert DragDropBild alle korrekt', () => {
    const frage: DragDropBildFrage = {
      id: 'dd-1', typ: 'dragdrop_bild', version: 1, erstelltAm: '2026-01-01', geaendertAm: '2026-01-01',
      fachbereich: 'VWL', fach: 'Wirtschaft & Recht', thema: 'Test',
      semester: ['S3'], gefaesse: ['SF'], bloom: 'K2', tags: [],
      punkte: 3, musterlosung: '', bewertungsraster: [], verwendungen: [],
      fragetext: 'Ordne die Labels zu',
      bildUrl: 'https://example.com/bild.png',
      zielzonen: [
        { id: 'z1', position: { x: 10, y: 10, breite: 20, hoehe: 20 }, korrektesLabel: 'Angebot' },
        { id: 'z2', position: { x: 50, y: 50, breite: 20, hoehe: 20 }, korrektesLabel: 'Nachfrage' },
        { id: 'z3', position: { x: 80, y: 20, breite: 10, hoehe: 10 }, korrektesLabel: 'Preis' },
      ],
      labels: ['Angebot', 'Nachfrage', 'Preis', 'Menge'],
    }
    const antwort: Antwort = {
      typ: 'dragdrop_bild',
      zuordnungen: { z1: 'Angebot', z2: 'Nachfrage', z3: 'Preis' },
    }
    const result = autoKorrigiere(frage, antwort)
    expect(result).not.toBeNull()
    expect(result!.erreichtePunkte).toBe(3)
  })

  it('korrigiert DragDropBild teilweise korrekt', () => {
    const frage: DragDropBildFrage = {
      id: 'dd-2', typ: 'dragdrop_bild', version: 1, erstelltAm: '2026-01-01', geaendertAm: '2026-01-01',
      fachbereich: 'VWL', fach: 'Wirtschaft & Recht', thema: 'Test',
      semester: ['S3'], gefaesse: ['SF'], bloom: 'K2', tags: [],
      punkte: 2, musterlosung: '', bewertungsraster: [], verwendungen: [],
      fragetext: 'Ordne zu',
      bildUrl: 'https://example.com/bild.png',
      zielzonen: [
        { id: 'z1', position: { x: 10, y: 10, breite: 20, hoehe: 20 }, korrektesLabel: 'BIP' },
        { id: 'z2', position: { x: 50, y: 50, breite: 20, hoehe: 20 }, korrektesLabel: 'Inflation' },
      ],
      labels: ['BIP', 'Inflation', 'Deflation'],
    }
    const antwort: Antwort = {
      typ: 'dragdrop_bild',
      zuordnungen: { z1: 'BIP', z2: 'Deflation' },
    }
    const result = autoKorrigiere(frage, antwort)
    expect(result).not.toBeNull()
    expect(result!.erreichtePunkte).toBe(1) // Nur z1 korrekt
  })

  it('korrigiert DragDropBild case-insensitive', () => {
    const frage: DragDropBildFrage = {
      id: 'dd-3', typ: 'dragdrop_bild', version: 1, erstelltAm: '2026-01-01', geaendertAm: '2026-01-01',
      fachbereich: 'VWL', fach: 'Wirtschaft & Recht', thema: 'Test',
      semester: ['S3'], gefaesse: ['SF'], bloom: 'K2', tags: [],
      punkte: 2, musterlosung: '', bewertungsraster: [], verwendungen: [],
      fragetext: 'Ordne zu',
      bildUrl: 'https://example.com/bild.png',
      zielzonen: [
        { id: 'z1', position: { x: 10, y: 10, breite: 20, hoehe: 20 }, korrektesLabel: 'BIP' },
      ],
      labels: ['BIP'],
    }
    const antwort: Antwort = {
      typ: 'dragdrop_bild',
      zuordnungen: { z1: 'bip' },
    }
    const result = autoKorrigiere(frage, antwort)
    expect(result).not.toBeNull()
    expect(result!.erreichtePunkte).toBe(2) // Case-insensitive match
  })

  it('korrigiert DragDropBild leere Zuordnung', () => {
    const frage: DragDropBildFrage = {
      id: 'dd-4', typ: 'dragdrop_bild', version: 1, erstelltAm: '2026-01-01', geaendertAm: '2026-01-01',
      fachbereich: 'VWL', fach: 'Wirtschaft & Recht', thema: 'Test',
      semester: ['S3'], gefaesse: ['SF'], bloom: 'K2', tags: [],
      punkte: 2, musterlosung: '', bewertungsraster: [], verwendungen: [],
      fragetext: 'Ordne zu',
      bildUrl: 'https://example.com/bild.png',
      zielzonen: [
        { id: 'z1', position: { x: 10, y: 10, breite: 20, hoehe: 20 }, korrektesLabel: 'BIP' },
        { id: 'z2', position: { x: 50, y: 50, breite: 20, hoehe: 20 }, korrektesLabel: 'Inflation' },
      ],
      labels: ['BIP', 'Inflation'],
    }
    const antwort: Antwort = {
      typ: 'dragdrop_bild',
      zuordnungen: {},
    }
    const result = autoKorrigiere(frage, antwort)
    expect(result).not.toBeNull()
    expect(result!.erreichtePunkte).toBe(0)
    expect(result!.details.every(d => !d.korrekt)).toBe(true)
  })

  // === FORMEL ===

  function makeFormelFrage(korrekteFormel: string): FormelFrage {
    return {
      id: 'fo-1', typ: 'formel', version: 1, erstelltAm: '2026-01-01', geaendertAm: '2026-01-01',
      fachbereich: 'VWL', fach: 'Wirtschaft & Recht', thema: 'Test',
      semester: ['S3'], gefaesse: ['SF'], bloom: 'K3', tags: [],
      punkte: 2, musterlosung: '', bewertungsraster: [], verwendungen: [],
      fragetext: 'Geben Sie die Formel ein',
      korrekteFormel,
      vergleichsModus: 'exakt',
    }
  }

  it('korrigiert Formel exakt korrekt', () => {
    const frage = makeFormelFrage('\\frac{a}{b}')
    const antwort: Antwort = { typ: 'formel', latex: '\\frac{a}{b}' }
    const result = autoKorrigiere(frage, antwort)
    expect(result).not.toBeNull()
    expect(result!.erreichtePunkte).toBe(2)
  })

  it('korrigiert Formel mit Whitespace-Normalisierung', () => {
    const frage = makeFormelFrage('x^{2} + y^{2}')
    const antwort: Antwort = { typ: 'formel', latex: ' x^2 + y^2 ' }
    const result = autoKorrigiere(frage, antwort)
    expect(result).not.toBeNull()
    expect(result!.erreichtePunkte).toBe(2)
  })

  it('korrigiert Formel falsch', () => {
    const frage = makeFormelFrage('\\frac{a}{b}')
    const antwort: Antwort = { typ: 'formel', latex: '\\frac{b}{a}' }
    const result = autoKorrigiere(frage, antwort)
    expect(result).not.toBeNull()
    expect(result!.erreichtePunkte).toBe(0)
  })
})
