// ExamLab/src/utils/ueben/relativeZeit.test.ts
import { describe, it, expect, vi, afterEach } from 'vitest'
import { formatiereRelativeZeit } from './relativeZeit'

const SEKUNDE = 1_000
const MINUTE = 60 * SEKUNDE
const STUNDE = 60 * MINUTE
const TAG = 24 * STUNDE
const MONAT = 30 * TAG
const JAHR = 365 * TAG

/** Baut einen ISO-String der genau `deltaMs` Millisekunden in der Vergangenheit liegt */
function vorMs(deltaMs: number): string {
  return new Date(Date.now() - deltaMs).toISOString()
}

afterEach(() => {
  vi.useRealTimers()
})

describe('formatiereRelativeZeit', () => {
  it('gibt „gerade eben" zurück für unter 2 Minuten', () => {
    expect(formatiereRelativeZeit(vorMs(30 * SEKUNDE))).toBe('gerade eben')
    expect(formatiereRelativeZeit(vorMs(1 * MINUTE + 59 * SEKUNDE))).toBe('gerade eben')
  })

  it('gibt „vor X Minuten" zurück für 2–59 Minuten', () => {
    expect(formatiereRelativeZeit(vorMs(2 * MINUTE))).toBe('vor 2 Minuten')
    expect(formatiereRelativeZeit(vorMs(15 * MINUTE))).toBe('vor 15 Minuten')
    expect(formatiereRelativeZeit(vorMs(59 * MINUTE))).toBe('vor 59 Minuten')
  })

  it('gibt „vor einer Stunde" zurück für genau 1 Stunde', () => {
    expect(formatiereRelativeZeit(vorMs(1 * STUNDE))).toBe('vor einer Stunde')
    // Auch 1h + 59min = immer noch 1 Stunde (tage=0, stunden=1)
    expect(formatiereRelativeZeit(vorMs(1 * STUNDE + 59 * MINUTE))).toBe('vor einer Stunde')
  })

  it('gibt „vor X Stunden" zurück für 2–23 Stunden', () => {
    expect(formatiereRelativeZeit(vorMs(2 * STUNDE))).toBe('vor 2 Stunden')
    expect(formatiereRelativeZeit(vorMs(12 * STUNDE))).toBe('vor 12 Stunden')
    expect(formatiereRelativeZeit(vorMs(23 * STUNDE + 59 * MINUTE))).toBe('vor 23 Stunden')
  })

  it('gibt „gestern" zurück für genau 1 Tag (24h–47h59m)', () => {
    expect(formatiereRelativeZeit(vorMs(1 * TAG))).toBe('gestern')
    expect(formatiereRelativeZeit(vorMs(1 * TAG + 23 * STUNDE + 59 * MINUTE))).toBe('gestern')
  })

  it('gibt „vor X Tagen" zurück für 2–30 Tage', () => {
    expect(formatiereRelativeZeit(vorMs(2 * TAG))).toBe('vor 2 Tagen')
    expect(formatiereRelativeZeit(vorMs(7 * TAG))).toBe('vor 7 Tagen')
    expect(formatiereRelativeZeit(vorMs(30 * TAG))).toBe('vor 30 Tagen')
  })

  it('gibt „vor 1 Monat" zurück für 31–60 Tage (Singular)', () => {
    expect(formatiereRelativeZeit(vorMs(31 * TAG))).toBe('vor 1 Monat')
    expect(formatiereRelativeZeit(vorMs(60 * TAG))).toBe('vor 2 Monaten')
  })

  it('gibt „vor X Monaten" zurück für 2–11 Monate (Plural)', () => {
    expect(formatiereRelativeZeit(vorMs(2 * MONAT))).toBe('vor 2 Monaten')
    expect(formatiereRelativeZeit(vorMs(6 * MONAT))).toBe('vor 6 Monaten')
    expect(formatiereRelativeZeit(vorMs(11 * MONAT))).toBe('vor 11 Monaten')
  })

  it('gibt „vor 1 Jahr" zurück für 366 Tage (Singular)', () => {
    expect(formatiereRelativeZeit(vorMs(366 * TAG))).toBe('vor 1 Jahr')
  })

  it('gibt „vor X Jahren" zurück für 2+ Jahre (Plural)', () => {
    expect(formatiereRelativeZeit(vorMs(2 * JAHR))).toBe('vor 2 Jahren')
    expect(formatiereRelativeZeit(vorMs(5 * JAHR))).toBe('vor 5 Jahren')
  })
})
