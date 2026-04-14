import { describe, it, expect, beforeEach } from 'vitest'
import { getAlleVerfuegbarenTypen, getSichtbareTypen, setSichtbareTypen } from '../utils/sichtbareTypen'

// localStorage-Mock für Tests
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
  }
})()

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
})

beforeEach(() => {
  localStorageMock.clear()
})

describe('getAlleVerfuegbarenTypen', () => {
  it('enthält generische Typen für alle LPs', () => {
    const typen = getAlleVerfuegbarenTypen([])
    expect(typen).toContain('mc')
    expect(typen).toContain('freitext')
    expect(typen).toContain('zuordnung')
    expect(typen).toContain('lueckentext')
    expect(typen).toContain('richtigfalsch')
    expect(typen).toContain('berechnung')
    expect(typen).toContain('aufgabengruppe')
    expect(typen).toContain('visualisierung')
    expect(typen).toContain('pdf')
    expect(typen).toContain('sortierung')
    expect(typen).toContain('hotspot')
    expect(typen).toContain('bildbeschriftung')
    expect(typen).toContain('audio')
    expect(typen).toContain('dragdrop_bild')
  })

  it('enthält FiBu-Typen für WR-Fachschaft', () => {
    const typen = getAlleVerfuegbarenTypen(['WR'])
    expect(typen).toContain('buchungssatz')
    expect(typen).toContain('tkonto')
    expect(typen).toContain('kontenbestimmung')
    expect(typen).toContain('bilanzstruktur')
  })

  it('enthält keine FiBu-Typen für nicht-WR', () => {
    const typen = getAlleVerfuegbarenTypen(['IN'])
    expect(typen).not.toContain('buchungssatz')
    expect(typen).not.toContain('tkonto')
  })

  it('enthält keine FiBu-Typen bei leerer Fachschaftsliste', () => {
    const typen = getAlleVerfuegbarenTypen([])
    expect(typen).not.toContain('buchungssatz')
  })
})

describe('getSichtbareTypen', () => {
  it('gibt alle verfügbaren Typen zurück wenn kein Eintrag in localStorage', () => {
    const typen = getSichtbareTypen(['WR'])
    expect(typen).toContain('mc')
    expect(typen).toContain('buchungssatz')
  })

  it('liest gespeicherte Typen aus localStorage', () => {
    setSichtbareTypen(['mc', 'freitext'])
    const typen = getSichtbareTypen(['WR'])
    expect(typen).toEqual(['mc', 'freitext'])
  })

  it('filtert FiBu-Typen für nicht-WR-LP auch wenn in localStorage gespeichert', () => {
    setSichtbareTypen(['mc', 'buchungssatz', 'tkonto'])
    const typen = getSichtbareTypen(['IN'])
    expect(typen).toContain('mc')
    expect(typen).not.toContain('buchungssatz')
    expect(typen).not.toContain('tkonto')
  })

  it('behält FiBu-Typen für WR-LP wenn in localStorage gespeichert', () => {
    setSichtbareTypen(['mc', 'buchungssatz'])
    const typen = getSichtbareTypen(['WR'])
    expect(typen).toContain('mc')
    expect(typen).toContain('buchungssatz')
  })

  it('gibt Fallback zurück bei korruptem localStorage', () => {
    localStorageMock.setItem('pruefung_sichtbareTypen', 'INVALID_JSON{{{')
    const typen = getSichtbareTypen(['WR'])
    expect(typen).toContain('mc')
    expect(typen).toContain('buchungssatz')
  })
})

describe('setSichtbareTypen', () => {
  it('speichert Typen in localStorage', () => {
    setSichtbareTypen(['mc', 'freitext'])
    const gespeichert = localStorageMock.getItem('pruefung_sichtbareTypen')
    expect(gespeichert).not.toBeNull()
    const parsed = JSON.parse(gespeichert!)
    expect(parsed).toEqual(['mc', 'freitext'])
  })

  it('überschreibt bestehende Einträge', () => {
    setSichtbareTypen(['mc'])
    setSichtbareTypen(['freitext', 'zuordnung'])
    const gespeichert = localStorageMock.getItem('pruefung_sichtbareTypen')
    const parsed = JSON.parse(gespeichert!)
    expect(parsed).toEqual(['freitext', 'zuordnung'])
  })

  it('schlägt nicht fehl wenn localStorage nicht verfügbar', () => {
    const originalSetItem = localStorageMock.setItem
    localStorageMock.setItem = () => { throw new Error('QuotaExceeded') }
    expect(() => setSichtbareTypen(['mc'])).not.toThrow()
    localStorageMock.setItem = originalSetItem
  })
})
