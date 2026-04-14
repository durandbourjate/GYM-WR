import { describe, it, expect } from 'vitest'
import type { ThemenFreischaltung, ThemenStatus } from '../types/ueben/themenSichtbarkeit'

/** Default aus GruppenEinstellungen (konfigurierbar, hier für Tests hardcoded) */
const DEFAULT_MAX_AKTIVE_THEMEN = 5

describe('ThemenSichtbarkeit Typen', () => {
  it('ThemenFreischaltung hat korrekte Struktur', () => {
    const eintrag: ThemenFreischaltung = {
      fach: 'VWL',
      thema: 'Konjunktur',
      status: 'aktiv',
      aktiviertAm: '2026-04-07T00:00:00.000Z',
      aktiviertVon: 'test-lp@gymhofwil.ch',
      typ: 'manuell',
    }
    expect(eintrag.fach).toBe('VWL')
    expect(eintrag.status).toBe('aktiv')
    expect(eintrag.typ).toBe('manuell')
  })

  it('ThemenStatus hat alle 3 gültigen Werte', () => {
    const werte: ThemenStatus[] = ['nicht_freigeschaltet', 'aktiv', 'abgeschlossen']
    expect(werte).toHaveLength(3)
  })
})

describe('FIFO-Logik (max 5 aktive Themen, konfigurierbar)', () => {
  function fifoSimulation(freischaltungen: ThemenFreischaltung[], neuesFach: string, neuesThema: string): ThemenFreischaltung[] {
    const bestehend = freischaltungen.filter(
      f => !(f.fach === neuesFach && f.thema === neuesThema)
    )
    const neuerEintrag: ThemenFreischaltung = {
      fach: neuesFach,
      thema: neuesThema,
      status: 'aktiv',
      aktiviertAm: new Date().toISOString(),
      aktiviertVon: 'test@test.ch',
      typ: 'manuell',
    }
    let aktualisiert = [...bestehend, neuerEintrag]

    const aktive = aktualisiert
      .filter(f => f.status === 'aktiv')
      .sort((a, b) => a.aktiviertAm.localeCompare(b.aktiviertAm))

    if (aktive.length > DEFAULT_MAX_AKTIVE_THEMEN) {
      const zuSchliessen = aktive.slice(0, aktive.length - DEFAULT_MAX_AKTIVE_THEMEN)
      aktualisiert = aktualisiert.map(f => {
        if (zuSchliessen.some(z => z.fach === f.fach && z.thema === f.thema)) {
          return { ...f, status: 'abgeschlossen' as const }
        }
        return f
      })
    }

    return aktualisiert
  }

  it('erlaubt bis zu 5 aktive Themen (Default)', () => {
    const ergebnis = fifoSimulation([], 'VWL', 'Konjunktur')
    expect(ergebnis.filter(f => f.status === 'aktiv')).toHaveLength(1)

    const ergebnis2 = fifoSimulation(ergebnis, 'BWL', 'FIBU')
    expect(ergebnis2.filter(f => f.status === 'aktiv')).toHaveLength(2)

    const ergebnis3 = fifoSimulation(ergebnis2, 'Recht', 'OR AT')
    expect(ergebnis3.filter(f => f.status === 'aktiv')).toHaveLength(3)

    const ergebnis4 = fifoSimulation(ergebnis3, 'VWL', 'Geldpolitik')
    expect(ergebnis4.filter(f => f.status === 'aktiv')).toHaveLength(4)

    const ergebnis5 = fifoSimulation(ergebnis4, 'BWL', 'Marketing')
    expect(ergebnis5.filter(f => f.status === 'aktiv')).toHaveLength(5)
  })

  it('schliesst ältestes Thema ab wenn 6. aktiviert wird', () => {
    let daten: ThemenFreischaltung[] = []

    // 5 Themen aktivieren mit unterschiedlichen Zeitstempeln
    const themen = [
      { fach: 'VWL', thema: 'Konjunktur', zeit: '2026-04-01T00:00:00Z' },
      { fach: 'BWL', thema: 'FIBU', zeit: '2026-04-02T00:00:00Z' },
      { fach: 'Recht', thema: 'OR AT', zeit: '2026-04-03T00:00:00Z' },
      { fach: 'VWL', thema: 'Geldpolitik', zeit: '2026-04-04T00:00:00Z' },
      { fach: 'BWL', thema: 'Marketing', zeit: '2026-04-05T00:00:00Z' },
    ]

    for (const t of themen) {
      daten.push({
        fach: t.fach,
        thema: t.thema,
        status: 'aktiv',
        aktiviertAm: t.zeit,
        aktiviertVon: 'test@test.ch',
        typ: 'manuell',
      })
    }

    // 6. Thema aktivieren → ältestes (Konjunktur) sollte abgeschlossen werden
    const ergebnis = fifoSimulation(daten, 'Recht', 'Sachenrecht')
    const aktive = ergebnis.filter(f => f.status === 'aktiv')
    const abgeschlossene = ergebnis.filter(f => f.status === 'abgeschlossen')

    expect(aktive).toHaveLength(5)
    expect(abgeschlossene).toHaveLength(1)
    expect(abgeschlossene[0].thema).toBe('Konjunktur')
  })

  it('bestehendes Thema wird nicht dupliziert bei Re-Aktivierung', () => {
    const daten: ThemenFreischaltung[] = [
      { fach: 'VWL', thema: 'Konjunktur', status: 'abgeschlossen', aktiviertAm: '2026-04-01T00:00:00Z', aktiviertVon: 'lp', typ: 'manuell' },
    ]

    const ergebnis = fifoSimulation(daten, 'VWL', 'Konjunktur')
    const konjunktur = ergebnis.filter(f => f.thema === 'Konjunktur')
    expect(konjunktur).toHaveLength(1)
    expect(konjunktur[0].status).toBe('aktiv')
  })
})
