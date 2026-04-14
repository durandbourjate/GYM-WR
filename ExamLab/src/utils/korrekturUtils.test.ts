import { describe, it, expect } from 'vitest'
import { berechneNote, effektivePunkte, berechneGesamtpunkte, DEFAULT_NOTEN_CONFIG, quelleLabel } from './korrekturUtils'
import type { FragenBewertung } from '../types/korrektur'

describe('berechneNote', () => {
  it('gibt 6 bei voller Punktzahl', () => {
    expect(berechneNote(20, 20)).toBe(6)
  })

  it('gibt 1 bei 0 Punkten', () => {
    expect(berechneNote(0, 20)).toBe(1)
  })

  it('gibt 4 bei 60% (Schweizer Formel)', () => {
    // Note = 1 + 5 * (12/20) = 1 + 3 = 4
    expect(berechneNote(12, 20)).toBe(4)
  })

  it('rundet auf 0.5 standardmässig', () => {
    // Note = 1 + 5 * (10/20) = 3.5
    expect(berechneNote(10, 20)).toBe(3.5)
  })

  it('rundet auf 0.1 wenn konfiguriert', () => {
    // Note = 1 + 5 * (13/20) = 4.25 → gerundet auf 0.1 = 4.3
    expect(berechneNote(13, 20, { rundung: 0.1 })).toBe(4.3)
  })

  it('rundet auf 0.25 wenn konfiguriert', () => {
    // Note = 1 + 5 * (13/20) = 4.25 → gerundet auf 0.25 = 4.25
    expect(berechneNote(13, 20, { rundung: 0.25 })).toBe(4.25)
  })

  it('begrenzt auf 6 bei Überschuss', () => {
    expect(berechneNote(25, 20)).toBe(6)
  })

  it('begrenzt auf 1 bei negativen Punkten', () => {
    expect(berechneNote(-5, 20)).toBe(1)
  })

  it('respektiert punkteFuerSechs', () => {
    // Note = 1 + 5 * (16/16) = 6, obwohl maxPunkte = 20
    expect(berechneNote(16, 20, { punkteFuerSechs: 16 })).toBe(6)
  })

  it('gibt 1 bei punkteFuerSechs = 0', () => {
    expect(berechneNote(10, 0)).toBe(1)
  })
})

describe('effektivePunkte', () => {
  it('nimmt lpPunkte wenn vorhanden', () => {
    expect(effektivePunkte({ lpPunkte: 3, kiPunkte: 2, maxPunkte: 5 } as FragenBewertung)).toBe(3)
  })

  it('fällt auf kiPunkte zurück', () => {
    expect(effektivePunkte({ kiPunkte: 2, maxPunkte: 5 } as FragenBewertung)).toBe(2)
  })

  it('gibt 0 ohne Bewertung', () => {
    expect(effektivePunkte({ maxPunkte: 5 } as FragenBewertung)).toBe(0)
  })

  it('behandelt lpPunkte = 0 korrekt (nicht als "leer")', () => {
    expect(effektivePunkte({ lpPunkte: 0, kiPunkte: 3, maxPunkte: 5 } as FragenBewertung)).toBe(0)
  })

  it('behandelt kiPunkte = 0 korrekt', () => {
    expect(effektivePunkte({ kiPunkte: 0, maxPunkte: 5 } as FragenBewertung)).toBe(0)
  })

  it('behandelt leeren String vom Backend als null (lpPunkte)', () => {
    expect(effektivePunkte({ lpPunkte: '' as unknown as number, kiPunkte: 3, maxPunkte: 5 } as FragenBewertung)).toBe(3)
  })

  it('behandelt leeren String vom Backend als null (kiPunkte)', () => {
    expect(effektivePunkte({ lpPunkte: null, kiPunkte: '' as unknown as number, maxPunkte: 5 } as FragenBewertung)).toBe(0)
  })

  it('behandelt beide leere Strings als 0', () => {
    expect(effektivePunkte({ lpPunkte: '' as unknown as number, kiPunkte: '' as unknown as number, maxPunkte: 5 } as FragenBewertung)).toBe(0)
  })

  it('behandelt undefined als null', () => {
    expect(effektivePunkte({ lpPunkte: undefined as unknown as number, kiPunkte: 4, maxPunkte: 5 } as FragenBewertung)).toBe(4)
  })
})

describe('berechneGesamtpunkte', () => {
  it('summiert effektive Punkte', () => {
    const bewertungen: Record<string, FragenBewertung> = {
      f1: { lpPunkte: 3, maxPunkte: 5 } as FragenBewertung,
      f2: { kiPunkte: 4, maxPunkte: 5 } as FragenBewertung,
    }
    const result = berechneGesamtpunkte(bewertungen)
    expect(result.punkte).toBe(7)
    expect(result.maxPunkte).toBe(10)
  })

  it('gibt 0 bei leeren Bewertungen', () => {
    const result = berechneGesamtpunkte({})
    expect(result.punkte).toBe(0)
    expect(result.maxPunkte).toBe(0)
  })
})

describe('DEFAULT_NOTEN_CONFIG', () => {
  it('hat korrekte Standardwerte', () => {
    expect(DEFAULT_NOTEN_CONFIG.punkteFuerSechs).toBe(0)
    expect(DEFAULT_NOTEN_CONFIG.rundung).toBe(0.5)
  })
})

describe('quelleLabel', () => {
  it.each([
    ['auto', 'Auto'],
    ['ki', 'KI'],
    ['manuell', 'Manuell'],
    ['fehler', 'Fehler'],
  ] as const)('gibt "%s" → "%s"', (quelle, label) => {
    expect(quelleLabel(quelle)).toBe(label)
  })
})

describe('berechneNote — Edge-Cases', () => {
  it('rundet auf ganze Noten', () => {
    // Note = 1 + 5 * (14/20) = 4.5 → gerundet auf 1 = 5
    expect(berechneNote(14, 20, { rundung: 1 })).toBe(5)
  })

  it('behandelt halbe Punkte korrekt', () => {
    // Note = 1 + 5 * (0.5/20) = 1.125 → gerundet auf 0.5 = 1
    expect(berechneNote(0.5, 20)).toBe(1)
  })

  it('behandelt sehr kleine Punkte', () => {
    // Note = 1 + 5 * (1/20) = 1.25 → gerundet auf 0.5 = 1.5
    expect(berechneNote(1, 20)).toBe(1.5)
  })
})
