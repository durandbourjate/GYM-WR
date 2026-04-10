import { describe, it, expect } from 'vitest'
import type { ThemenFreischaltung, ThemenStatus } from '../types/ueben/themenSichtbarkeit'
import { MAX_AKTIVE_THEMEN } from '../types/ueben/themenSichtbarkeit'

describe('ThemenSichtbarkeit Typen', () => {
  it('MAX_AKTIVE_THEMEN ist 3', () => {
    expect(MAX_AKTIVE_THEMEN).toBe(3)
  })

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

describe('FIFO-Logik (max 3 aktive Themen)', () => {
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

    if (aktive.length > MAX_AKTIVE_THEMEN) {
      const zuSchliessen = aktive.slice(0, aktive.length - MAX_AKTIVE_THEMEN)
      aktualisiert = aktualisiert.map(f => {
        if (zuSchliessen.some(z => z.fach === f.fach && z.thema === f.thema)) {
          return { ...f, status: 'abgeschlossen' as const }
        }
        return f
      })
    }

    return aktualisiert
  }

  it('erlaubt bis zu 3 aktive Themen', () => {
    const ergebnis = fifoSimulation([], 'VWL', 'Konjunktur')
    expect(ergebnis.filter(f => f.status === 'aktiv')).toHaveLength(1)

    const ergebnis2 = fifoSimulation(ergebnis, 'BWL', 'FIBU')
    expect(ergebnis2.filter(f => f.status === 'aktiv')).toHaveLength(2)

    const ergebnis3 = fifoSimulation(ergebnis2, 'Recht', 'OR AT')
    expect(ergebnis3.filter(f => f.status === 'aktiv')).toHaveLength(3)
  })

  it('schliesst ältestes Thema ab wenn 4. aktiviert wird', () => {
    let daten: ThemenFreischaltung[] = []

    // 3 Themen aktivieren mit unterschiedlichen Zeitstempeln
    const themen = [
      { fach: 'VWL', thema: 'Konjunktur', zeit: '2026-04-01T00:00:00Z' },
      { fach: 'BWL', thema: 'FIBU', zeit: '2026-04-02T00:00:00Z' },
      { fach: 'Recht', thema: 'OR AT', zeit: '2026-04-03T00:00:00Z' },
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

    // 4. Thema aktivieren → ältestes (Konjunktur) sollte abgeschlossen werden
    const ergebnis = fifoSimulation(daten, 'VWL', 'Geldpolitik')
    const aktive = ergebnis.filter(f => f.status === 'aktiv')
    const abgeschlossene = ergebnis.filter(f => f.status === 'abgeschlossen')

    expect(aktive).toHaveLength(3)
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
