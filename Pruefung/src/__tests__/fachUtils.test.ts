import { describe, it, expect } from 'vitest'
import {
  tagBadgeKlassen,
  istFachschaftMitFiBu,
  defaultFach,
  typLabel,
  bloomLabel,
  FIBU_TYPEN,
  fachbereichFarbe,
  istWRFachschaft,
  defaultFachbereich,
  zeigeFachbereichBadge,
} from '../utils/fachUtils'
import type { Tag } from '../types/tags'

// === Neue Funktionen ===

describe('tagBadgeKlassen', () => {
  it('gibt orange Klassen für #f97316', () => {
    const tag: Tag = { name: 'VWL', farbe: '#f97316', ebene: 'fachschaft' }
    expect(tagBadgeKlassen(tag)).toContain('orange')
  })

  it('gibt blaue Klassen für #3b82f6', () => {
    const tag: Tag = { name: 'BWL', farbe: '#3b82f6', ebene: 'fachschaft' }
    expect(tagBadgeKlassen(tag)).toContain('blue')
  })

  it('gibt slate Klassen für unbekannte Farben', () => {
    const tag: Tag = { name: 'Custom', farbe: '#aabbcc', ebene: 'persoenlich' }
    expect(tagBadgeKlassen(tag)).toContain('slate')
  })
})

describe('istFachschaftMitFiBu', () => {
  it('gibt true wenn WR enthalten', () => {
    expect(istFachschaftMitFiBu(['WR'])).toBe(true)
    expect(istFachschaftMitFiBu(['IN', 'WR'])).toBe(true)
  })

  it('gibt false wenn WR nicht enthalten', () => {
    expect(istFachschaftMitFiBu(['IN'])).toBe(false)
    expect(istFachschaftMitFiBu([])).toBe(false)
  })
})

describe('defaultFach', () => {
  it('gibt Wirtschaft & Recht für WR', () => {
    expect(defaultFach(['WR'])).toBe('Wirtschaft & Recht')
  })

  it('gibt Informatik für IN', () => {
    expect(defaultFach(['IN'])).toBe('Informatik')
  })

  it('nimmt erste passende Fachschaft', () => {
    expect(defaultFach(['DE', 'WR'])).toBe('Deutsch')
  })

  it('gibt Allgemein für leere Liste', () => {
    expect(defaultFach([])).toBe('Allgemein')
  })
})

describe('FIBU_TYPEN', () => {
  it('enthält alle FiBu-Fragetypen', () => {
    expect(FIBU_TYPEN.has('buchungssatz')).toBe(true)
    expect(FIBU_TYPEN.has('tkonto')).toBe(true)
    expect(FIBU_TYPEN.has('kontenbestimmung')).toBe(true)
    expect(FIBU_TYPEN.has('bilanzstruktur')).toBe(true)
  })

  it('enthält keine nicht-FiBu-Typen', () => {
    expect(FIBU_TYPEN.has('mc')).toBe(false)
    expect(FIBU_TYPEN.has('freitext')).toBe(false)
  })
})

// === Backward-Compat Funktionen (Tests migriert von fachbereich.test.ts) ===

describe('fachbereichFarbe (compat)', () => {
  it('gibt orange Klassen für VWL', () => {
    expect(fachbereichFarbe('VWL')).toContain('orange')
  })

  it('gibt blaue Klassen für BWL', () => {
    expect(fachbereichFarbe('BWL')).toContain('blue')
  })

  it('gibt grüne Klassen für Recht', () => {
    expect(fachbereichFarbe('Recht')).toContain('green')
  })

  it('gibt graue Klassen für Informatik', () => {
    expect(fachbereichFarbe('Informatik')).toContain('gray')
  })

  it('gibt slate Klassen für unbekannte Fachbereiche', () => {
    expect(fachbereichFarbe('Allgemein')).toContain('slate')
    expect(fachbereichFarbe('xyz')).toContain('slate')
  })
})

describe('zeigeFachbereichBadge (compat)', () => {
  it('gibt true für WR-Fachbereiche', () => {
    expect(zeigeFachbereichBadge('VWL')).toBe(true)
    expect(zeigeFachbereichBadge('BWL')).toBe(true)
    expect(zeigeFachbereichBadge('Recht')).toBe(true)
  })

  it('gibt false für nicht-WR-Fachbereiche', () => {
    expect(zeigeFachbereichBadge('Informatik')).toBe(false)
    expect(zeigeFachbereichBadge('Allgemein')).toBe(false)
    expect(zeigeFachbereichBadge('')).toBe(false)
  })
})

describe('istWRFachschaft (compat)', () => {
  it('gibt true für WR', () => {
    expect(istWRFachschaft('WR')).toBe(true)
  })

  it('gibt false für andere Fachschaften', () => {
    expect(istWRFachschaft('IN')).toBe(false)
    expect(istWRFachschaft(undefined)).toBe(false)
    expect(istWRFachschaft('')).toBe(false)
  })
})

describe('defaultFachbereich (compat)', () => {
  it('gibt VWL für WR', () => {
    expect(defaultFachbereich('WR')).toBe('VWL')
  })

  it('gibt Informatik für IN', () => {
    expect(defaultFachbereich('IN')).toBe('Informatik')
    expect(defaultFachbereich('Informatik')).toBe('Informatik')
  })

  it('gibt Allgemein für andere', () => {
    expect(defaultFachbereich('DE')).toBe('Allgemein')
    expect(defaultFachbereich(undefined)).toBe('Allgemein')
  })
})

describe('typLabel', () => {
  it.each([
    ['mc', 'Multiple Choice'],
    ['freitext', 'Freitext'],
    ['lueckentext', 'Lückentext'],
    ['zuordnung', 'Zuordnung'],
    ['richtigfalsch', 'Richtig/Falsch'],
    ['berechnung', 'Berechnung'],
    ['buchungssatz', 'Buchungssatz'],
    ['tkonto', 'T-Konto'],
    ['kontenbestimmung', 'Kontenbestimmung'],
    ['bilanzstruktur', 'Bilanz/ER'],
    ['aufgabengruppe', 'Aufgabengruppe'],
    ['visualisierung', 'Zeichnen'],
    ['pdf', 'PDF-Annotation'],
  ])('gibt "%s" → "%s"', (typ, label) => {
    expect(typLabel(typ)).toBe(label)
  })

  it('gibt den Typ selbst für unbekannte zurück', () => {
    expect(typLabel('xyz')).toBe('xyz')
  })
})

describe('bloomLabel', () => {
  it.each([
    ['K1', 'Wissen'],
    ['K2', 'Verstehen'],
    ['K3', 'Anwenden'],
    ['K4', 'Analysieren'],
    ['K5', 'Beurteilen'],
    ['K6', 'Erschaffen'],
  ])('gibt "%s" → "%s"', (stufe, label) => {
    expect(bloomLabel(stufe)).toBe(label)
  })

  it('gibt leeren String für unbekannte Stufen', () => {
    expect(bloomLabel('K7')).toBe('')
    expect(bloomLabel('')).toBe('')
  })
})
