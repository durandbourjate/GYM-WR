import { describe, it, expect } from 'vitest'
import { validierePflichtfelder } from './pflichtfeldValidation'

describe('validierePflichtfelder — Defensiv-Verhalten', () => {
  it('liefert pflichtErfuellt=true für unbekannten typ (kein Save-Block)', () => {
    const r = validierePflichtfelder({ id: 'x', typ: 'mcc' as any, fragetext: 'q' } as any)
    expect(r.pflichtErfuellt).toBe(true)
    expect(r.empfohlenErfuellt).toBe(false) // konservativ
  })
  it('liefert ok bei null/undefined-Frage', () => {
    expect(validierePflichtfelder(null as any).pflichtErfuellt).toBe(true)
    expect(validierePflichtfelder(undefined as any).pflichtErfuellt).toBe(true)
  })
  it('crasht nicht bei null in Array-Feld (mc.optionen=null)', () => {
    const r = validierePflichtfelder({ id: 'x', typ: 'mc', fragetext: 'q', optionen: null } as any)
    expect(r).toBeDefined()
    expect(r.pflichtErfuellt).toBe(false) // ≥2 Optionen Pflicht
  })
  it('liefert immer ein gültiges ValidationResult', () => {
    const r = validierePflichtfelder({ id: 'x', typ: 'mc', fragetext: 'q' } as any)
    expect(typeof r.felderStatus).toBe('object')
    expect(Array.isArray(r.pflichtLeerFelder)).toBe(true)
    expect(Array.isArray(r.empfohlenLeerFelder)).toBe(true)
  })
  it('throws nie', () => {
    expect(() => validierePflichtfelder(undefined as any)).not.toThrow()
    expect(() => validierePflichtfelder({} as any)).not.toThrow()
  })
})

describe('validierePflichtfelder — mc', () => {
  const minimalGueltig = {
    id: 'm1',
    typ: 'mc',
    fragetext: 'q',
    optionen: [
      { id: 'o1', text: 'A', korrekt: true, erklaerung: 'e1' },
      { id: 'o2', text: 'B', korrekt: false, erklaerung: 'e2' },
    ],
  }
  it('alle erfüllt', () => {
    const r = validierePflichtfelder(minimalGueltig as any)
    expect(r.pflichtErfuellt).toBe(true)
    expect(r.empfohlenErfuellt).toBe(true)
  })
  it('pflicht-leer ohne Frage-Text', () => {
    const r = validierePflichtfelder({ ...minimalGueltig, fragetext: '' } as any)
    expect(r.pflichtErfuellt).toBe(false)
    expect(r.pflichtLeerFelder).toContain('Frage-Text')
  })
  it('pflicht-leer mit nur 1 Option', () => {
    const r = validierePflichtfelder({ ...minimalGueltig, optionen: [minimalGueltig.optionen[0]] } as any)
    expect(r.pflichtErfuellt).toBe(false)
  })
  it('pflicht-leer ohne korrekt-markierte Option', () => {
    const r = validierePflichtfelder({
      ...minimalGueltig,
      optionen: minimalGueltig.optionen.map((o) => ({ ...o, korrekt: false })),
    } as any)
    expect(r.pflichtErfuellt).toBe(false)
  })
  it('empfohlen-leer ohne Erklärungen', () => {
    const r = validierePflichtfelder({
      ...minimalGueltig,
      optionen: minimalGueltig.optionen.map((o) => ({ ...o, erklaerung: '' })),
    } as any)
    expect(r.pflichtErfuellt).toBe(true)
    expect(r.empfohlenErfuellt).toBe(false)
  })
})

describe('validierePflichtfelder — richtigfalsch', () => {
  const gueltig = {
    id: 'r1',
    typ: 'richtigfalsch',
    fragetext: 'q',
    aussagen: [
      { id: 'a1', text: 'A1', korrekt: true, erklaerung: 'e1' },
      { id: 'a2', text: 'A2', korrekt: false, erklaerung: 'e2' },
    ],
  }
  it('alle erfüllt', () => {
    const r = validierePflichtfelder(gueltig as any)
    expect(r.pflichtErfuellt).toBe(true)
    expect(r.empfohlenErfuellt).toBe(true)
  })
  it('pflicht-leer mit nur 1 Aussage', () => {
    const r = validierePflichtfelder({ ...gueltig, aussagen: [gueltig.aussagen[0]] } as any)
    expect(r.pflichtErfuellt).toBe(false)
  })
  it('pflicht-leer wenn Aussage ohne korrekt-flag (null)', () => {
    const r = validierePflichtfelder({
      ...gueltig,
      aussagen: [
        { id: 'a1', text: 'A1', korrekt: null, erklaerung: 'e1' },
        { id: 'a2', text: 'A2', korrekt: false, erklaerung: 'e2' },
      ],
    } as any)
    expect(r.pflichtErfuellt).toBe(false)
  })
  it('empfohlen-leer ohne Erklärungen', () => {
    const r = validierePflichtfelder({
      ...gueltig,
      aussagen: gueltig.aussagen.map((a) => ({ ...a, erklaerung: '' })),
    } as any)
    expect(r.pflichtErfuellt).toBe(true)
    expect(r.empfohlenErfuellt).toBe(false)
  })
})

describe('validierePflichtfelder — lueckentext', () => {
  it('Freitext-Modus: alle erfüllt', () => {
    const r = validierePflichtfelder({
      id: 'l1',
      typ: 'lueckentext',
      fragetext: 'q',
      textMitLuecken: 'Das ist ein {{1}} Test',
      lueckentextModus: 'freitext',
      luecken: [{ id: '1', korrekteAntworten: ['Antwort'], caseSensitive: false }],
    } as any)
    expect(r.pflichtErfuellt).toBe(true)
  })
  it('Freitext-Modus: pflicht-leer ohne korrekteAntworten', () => {
    const r = validierePflichtfelder({
      id: 'l1',
      typ: 'lueckentext',
      fragetext: 'q',
      textMitLuecken: '{{1}}',
      lueckentextModus: 'freitext',
      luecken: [{ id: '1', korrekteAntworten: [], caseSensitive: false }],
    } as any)
    expect(r.pflichtErfuellt).toBe(false)
  })
  it('pflicht-leer ohne Lücken-Platzhalter', () => {
    const r = validierePflichtfelder({
      id: 'l1',
      typ: 'lueckentext',
      fragetext: 'q',
      textMitLuecken: 'Kein Platzhalter hier',
      lueckentextModus: 'freitext',
      luecken: [],
    } as any)
    expect(r.pflichtErfuellt).toBe(false)
  })
  it('akzeptiert {N}-Kurzform (S142)', () => {
    const r = validierePflichtfelder({
      id: 'l1',
      typ: 'lueckentext',
      fragetext: 'q',
      textMitLuecken: 'Das ist {1} Test',
      lueckentextModus: 'freitext',
      luecken: [{ id: '1', korrekteAntworten: ['x'], caseSensitive: false }],
    } as any)
    expect(r.pflichtErfuellt).toBe(true)
  })
  it('falsch-positiv vermieden: { ohne Zahl ist KEIN Platzhalter', () => {
    const r = validierePflichtfelder({
      id: 'l1',
      typ: 'lueckentext',
      fragetext: 'q',
      textMitLuecken: 'JSON-Beispiel: { "key": "value" } enthält keine Lücke',
      lueckentextModus: 'freitext',
      luecken: [{ id: '1', korrekteAntworten: ['x'], caseSensitive: false }],
    } as any)
    expect(r.pflichtErfuellt).toBe(false)
    expect(r.pflichtLeerFelder.some(f => f.includes('Platzhalter'))).toBe(true)
  })
  it('Dropdown-Modus: alle erfüllt mit korrektem Eintrag', () => {
    const r = validierePflichtfelder({
      id: 'l1',
      typ: 'lueckentext',
      fragetext: 'q',
      textMitLuecken: '{{1}}',
      lueckentextModus: 'dropdown',
      luecken: [
        {
          id: '1',
          korrekteAntworten: ['A'],
          caseSensitive: false,
          dropdownOptionen: ['A', 'B'],
        },
      ],
    } as any)
    expect(r.pflichtErfuellt).toBe(true)
  })
  it('Dropdown-Modus: pflicht-leer mit nur 1 Option', () => {
    const r = validierePflichtfelder({
      id: 'l1',
      typ: 'lueckentext',
      fragetext: 'q',
      textMitLuecken: '{{1}}',
      lueckentextModus: 'dropdown',
      luecken: [
        {
          id: '1',
          korrekteAntworten: ['A'],
          caseSensitive: false,
          dropdownOptionen: ['A'],
        },
      ],
    } as any)
    expect(r.pflichtErfuellt).toBe(false)
  })
})

describe('validierePflichtfelder — sortierung', () => {
  it('alle erfüllt', () => {
    const r = validierePflichtfelder({
      id: 's1',
      typ: 'sortierung',
      fragetext: 'q',
      elemente: ['A', 'B', 'C'],
    } as any)
    expect(r.pflichtErfuellt).toBe(true)
  })
  it('pflicht-leer mit nur 1 Element', () => {
    const r = validierePflichtfelder({
      id: 's1',
      typ: 'sortierung',
      fragetext: 'q',
      elemente: ['A'],
    } as any)
    expect(r.pflichtErfuellt).toBe(false)
  })
  it('pflicht-leer ohne Frage-Text', () => {
    const r = validierePflichtfelder({
      id: 's1',
      typ: 'sortierung',
      fragetext: '',
      elemente: ['A', 'B'],
    } as any)
    expect(r.pflichtErfuellt).toBe(false)
  })
})

describe('validierePflichtfelder — buchungssatz', () => {
  const gueltig = {
    id: 'b1',
    typ: 'buchungssatz',
    fragetext: '',
    geschaeftsfall: 'Wareneinkauf bar',
    buchungen: [{ id: 'bu1', sollKonto: '6000', habenKonto: '1000', betrag: 100 }],
  }
  it('alle erfüllt (geschaeftsfall als fragetext-Ersatz)', () => {
    const r = validierePflichtfelder(gueltig as any)
    expect(r.pflichtErfuellt).toBe(true)
  })
  it('pflicht-leer ohne geschaeftsfall + ohne fragetext', () => {
    const r = validierePflichtfelder({ ...gueltig, geschaeftsfall: '' } as any)
    expect(r.pflichtErfuellt).toBe(false)
  })
  it('pflicht-leer ohne Buchungen', () => {
    const r = validierePflichtfelder({ ...gueltig, buchungen: [] } as any)
    expect(r.pflichtErfuellt).toBe(false)
  })
  it('akzeptiert Buchung mit nur sollKonto', () => {
    const r = validierePflichtfelder({
      ...gueltig,
      buchungen: [{ id: 'bu1', sollKonto: '6000', habenKonto: '', betrag: 100 }],
    } as any)
    expect(r.pflichtErfuellt).toBe(true)
  })
})

describe('validierePflichtfelder — tkonto', () => {
  const gueltig = {
    id: 't1',
    typ: 'tkonto',
    aufgabentext: 'Buche',
    konten: [{ id: 'k1', kontonummer: '1000' }],
  }
  it('alle erfüllt', () => {
    const r = validierePflichtfelder(gueltig as any)
    expect(r.pflichtErfuellt).toBe(true)
  })
  it('pflicht-leer ohne aufgabentext', () => {
    const r = validierePflichtfelder({ ...gueltig, aufgabentext: '' } as any)
    expect(r.pflichtErfuellt).toBe(false)
  })
  it('pflicht-leer ohne Konten', () => {
    const r = validierePflichtfelder({ ...gueltig, konten: [] } as any)
    expect(r.pflichtErfuellt).toBe(false)
  })
})

describe('validierePflichtfelder — kontenbestimmung', () => {
  const gueltig = {
    id: 'k1',
    typ: 'kontenbestimmung',
    aufgabentext: 'Bestimme',
    aufgaben: [{ id: 'a1', text: 'Wareneinkauf bar' }],
  }
  it('alle erfüllt', () => {
    const r = validierePflichtfelder(gueltig as any)
    expect(r.pflichtErfuellt).toBe(true)
  })
  it('pflicht-leer ohne aufgabentext', () => {
    const r = validierePflichtfelder({ ...gueltig, aufgabentext: '' } as any)
    expect(r.pflichtErfuellt).toBe(false)
  })
  it('pflicht-leer ohne Aufgaben mit Text', () => {
    const r = validierePflichtfelder({ ...gueltig, aufgaben: [{ id: 'a1', text: '' }] } as any)
    expect(r.pflichtErfuellt).toBe(false)
  })
})

describe('validierePflichtfelder — bilanzstruktur', () => {
  const gueltig = {
    id: 'bi1',
    typ: 'bilanzstruktur',
    aufgabentext: 'Bilanz erstellen',
    kontenMitSaldi: [{ kontonummer: '1000', saldo: 500 }],
  }
  it('alle erfüllt', () => {
    const r = validierePflichtfelder(gueltig as any)
    expect(r.pflichtErfuellt).toBe(true)
  })
  it('pflicht-leer ohne aufgabentext', () => {
    const r = validierePflichtfelder({ ...gueltig, aufgabentext: '' } as any)
    expect(r.pflichtErfuellt).toBe(false)
  })
  it('pflicht-leer ohne Konten mit Saldo', () => {
    const r = validierePflichtfelder({
      ...gueltig,
      kontenMitSaldi: [{ kontonummer: '1000' }],
    } as any)
    expect(r.pflichtErfuellt).toBe(false)
  })
})

describe('validierePflichtfelder — visualisierung', () => {
  it('alle erfüllt mit canvasConfig', () => {
    const r = validierePflichtfelder({
      id: 'v1',
      typ: 'visualisierung',
      fragetext: 'q',
      untertyp: 'zeichnen',
      canvasConfig: { breite: 800, hoehe: 600, koordinatensystem: false, werkzeuge: ['stift'] },
    } as any)
    expect(r.pflichtErfuellt).toBe(true)
  })
  it('alle erfüllt mit ausgangsdiagramm', () => {
    const r = validierePflichtfelder({
      id: 'v1',
      typ: 'visualisierung',
      fragetext: 'q',
      untertyp: 'diagramm-manipulieren',
      ausgangsdiagramm: { typ: 'angebot-nachfrage' },
    } as any)
    expect(r.pflichtErfuellt).toBe(true)
  })
  it('pflicht-leer ohne untertyp', () => {
    const r = validierePflichtfelder({ id: 'v1', typ: 'visualisierung', fragetext: 'q' } as any)
    expect(r.pflichtErfuellt).toBe(false)
  })
})

describe('validierePflichtfelder — pdf', () => {
  const gueltig = {
    id: 'p1',
    typ: 'pdf',
    fragetext: 'q',
    pdfDriveFileId: 'abc',
    erlaubteWerkzeuge: ['highlighter'],
  }
  it('alle erfüllt', () => {
    const r = validierePflichtfelder(gueltig as any)
    expect(r.pflichtErfuellt).toBe(true)
  })
  it('pflicht-leer ohne pdfDriveFileId/pdfUrl', () => {
    const r = validierePflichtfelder({
      ...gueltig,
      pdfDriveFileId: undefined,
    } as any)
    expect(r.pflichtErfuellt).toBe(false)
  })
  it('pflicht-leer ohne erlaubteWerkzeuge', () => {
    const r = validierePflichtfelder({ ...gueltig, erlaubteWerkzeuge: [] } as any)
    expect(r.pflichtErfuellt).toBe(false)
  })
  it('akzeptiert pdfUrl als Alternative', () => {
    const r = validierePflichtfelder({
      id: 'p1',
      typ: 'pdf',
      fragetext: 'q',
      pdfUrl: 'http://x/y.pdf',
      erlaubteWerkzeuge: ['highlighter'],
    } as any)
    expect(r.pflichtErfuellt).toBe(true)
  })
})

describe('validierePflichtfelder — code', () => {
  it('alle erfüllt', () => {
    const r = validierePflichtfelder({
      id: 'c1',
      typ: 'code',
      fragetext: 'q',
      sprache: 'python',
      musterLoesung: 'print(1)',
      testCases: [{ input: '', output: '1' }],
    } as any)
    expect(r.pflichtErfuellt).toBe(true)
    expect(r.empfohlenErfuellt).toBe(true)
  })
  it('pflicht-leer ohne sprache', () => {
    const r = validierePflichtfelder({ id: 'c1', typ: 'code', fragetext: 'q' } as any)
    expect(r.pflichtErfuellt).toBe(false)
  })
  it('empfohlen-leer ohne musterloesung & testCases', () => {
    const r = validierePflichtfelder({
      id: 'c1',
      typ: 'code',
      fragetext: 'q',
      sprache: 'python',
    } as any)
    expect(r.pflichtErfuellt).toBe(true)
    expect(r.empfohlenErfuellt).toBe(false)
  })
})

describe('validierePflichtfelder — formel', () => {
  it('alle erfüllt', () => {
    const r = validierePflichtfelder({
      id: 'fo1',
      typ: 'formel',
      fragetext: 'q',
      korrekteFormel: 'a^2',
      toleranz: 0.01,
      erklaerung: 'Lösung',
    } as any)
    expect(r.pflichtErfuellt).toBe(true)
    expect(r.empfohlenErfuellt).toBe(true)
  })
  it('pflicht-leer ohne korrekteFormel', () => {
    const r = validierePflichtfelder({ id: 'fo1', typ: 'formel', fragetext: 'q' } as any)
    expect(r.pflichtErfuellt).toBe(false)
  })
  it('empfohlen-leer ohne toleranz/erklaerung', () => {
    const r = validierePflichtfelder({
      id: 'fo1',
      typ: 'formel',
      fragetext: 'q',
      korrekteFormel: 'a^2',
    } as any)
    expect(r.pflichtErfuellt).toBe(true)
    expect(r.empfohlenErfuellt).toBe(false)
  })
})

describe('validierePflichtfelder — aufgabengruppe (rekursiv)', () => {
  it('2 Ebenen alle erfüllt', () => {
    const r = validierePflichtfelder({
      id: 'ag1',
      typ: 'aufgabengruppe',
      fragetext: 'Kontext',
      teilaufgaben: [
        {
          id: 'ag1_a',
          typ: 'mc',
          fragetext: 'q',
          optionen: [
            { id: 'o1', text: 'A', korrekt: true, erklaerung: 'e1' },
            { id: 'o2', text: 'B', korrekt: false, erklaerung: 'e2' },
          ],
        },
      ],
    } as any)
    expect(r.pflichtErfuellt).toBe(true)
    expect(r.empfohlenErfuellt).toBe(true)
  })
  it('1 Teilaufgabe pflicht-leer → propagiert', () => {
    const r = validierePflichtfelder({
      id: 'ag1',
      typ: 'aufgabengruppe',
      fragetext: 'Kontext',
      teilaufgaben: [
        {
          id: 'ag1_a',
          typ: 'mc',
          fragetext: '',
          optionen: [],
        },
      ],
    } as any)
    expect(r.pflichtErfuellt).toBe(false)
    expect(r.pflichtLeerFelder.length).toBeGreaterThan(0)
  })
  it('ohne Teilaufgaben → pflicht-leer', () => {
    const r = validierePflichtfelder({
      id: 'ag1',
      typ: 'aufgabengruppe',
      fragetext: 'Kontext',
      teilaufgaben: [],
    } as any)
    expect(r.pflichtErfuellt).toBe(false)
  })
  it('akzeptiert kontext als fragetext-Fallback', () => {
    const r = validierePflichtfelder({
      id: 'ag1',
      typ: 'aufgabengruppe',
      kontext: 'Kontext',
      teilaufgaben: [
        {
          id: 'ag1_a',
          typ: 'mc',
          fragetext: 'q',
          optionen: [
            { id: 'o1', text: 'A', korrekt: true, erklaerung: 'e1' },
            { id: 'o2', text: 'B', korrekt: false, erklaerung: 'e2' },
          ],
        },
      ],
    } as any)
    expect(r.pflichtErfuellt).toBe(true)
  })
  it('4 Ebenen → Pass-Through bei Tiefe ≥ 3 (DEFAULT_OK)', () => {
    const tiefe4 = {
      id: 'ag1',
      typ: 'aufgabengruppe',
      fragetext: 'L1',
      teilaufgaben: [
        {
          id: 'ag2',
          typ: 'aufgabengruppe',
          fragetext: 'L2',
          teilaufgaben: [
            {
              id: 'ag3',
              typ: 'aufgabengruppe',
              fragetext: 'L3',
              teilaufgaben: [
                {
                  id: 'ag4',
                  typ: 'aufgabengruppe',
                  fragetext: '',
                  teilaufgaben: [],
                },
              ],
            },
          ],
        },
      ],
    }
    const r = validierePflichtfelder(tiefe4 as any)
    expect(r.pflichtErfuellt).toBe(true)
  })
})

describe('validierePflichtfelder — bildbeschriftung', () => {
  const gueltig = {
    id: 'b1',
    typ: 'bildbeschriftung',
    fragetext: 'q',
    bildUrl: 'http://x/y.png',
    beschriftungen: [
      { id: 'l1', position: { x: 10, y: 20 }, korrekt: ['Antwort'] },
    ],
  }
  it('alle erfüllt', () => {
    const r = validierePflichtfelder(gueltig as any)
    expect(r.pflichtErfuellt).toBe(true)
  })
  it('pflicht-leer ohne bildUrl', () => {
    const r = validierePflichtfelder({ ...gueltig, bildUrl: '' } as any)
    expect(r.pflichtErfuellt).toBe(false)
  })
  it('pflicht-leer mit Beschriftung ohne korrekt-Antwort', () => {
    const r = validierePflichtfelder({
      ...gueltig,
      beschriftungen: [{ id: 'l1', position: { x: 10, y: 20 }, korrekt: [''] }],
    } as any)
    expect(r.pflichtErfuellt).toBe(false)
  })
  it('pflicht-leer ohne Beschriftungen', () => {
    const r = validierePflichtfelder({ ...gueltig, beschriftungen: [] } as any)
    expect(r.pflichtErfuellt).toBe(false)
  })
})

describe('validierePflichtfelder — dragdrop_bild', () => {
  const gueltig = {
    id: 'd1',
    typ: 'dragdrop_bild',
    fragetext: 'q',
    bildUrl: 'http://x/y.png',
    zielzonen: [{ id: 'z1', form: 'rechteck', punkte: [], korrektesLabel: 'A' }],
    labels: ['A', 'B'],
  }
  it('alle erfüllt', () => {
    const r = validierePflichtfelder(gueltig as any)
    expect(r.pflichtErfuellt).toBe(true)
  })
  it('pflicht-leer wenn korrektesLabel nicht im labels-Pool', () => {
    const r = validierePflichtfelder({ ...gueltig, labels: ['B', 'C'] } as any)
    expect(r.pflichtErfuellt).toBe(false)
  })
  it('pflicht-leer ohne Zielzonen', () => {
    const r = validierePflichtfelder({ ...gueltig, zielzonen: [] } as any)
    expect(r.pflichtErfuellt).toBe(false)
  })
})

describe('validierePflichtfelder — hotspot', () => {
  const gueltig = {
    id: 'h1',
    typ: 'hotspot',
    fragetext: 'q',
    bildUrl: 'http://x/y.png',
    bereiche: [{ id: 'br1', form: 'rechteck', punkte: [], label: 'A', punktzahl: 1 }],
  }
  it('alle erfüllt', () => {
    const r = validierePflichtfelder(gueltig as any)
    expect(r.pflichtErfuellt).toBe(true)
  })
  it('pflicht-leer ohne bildUrl', () => {
    const r = validierePflichtfelder({ ...gueltig, bildUrl: '' } as any)
    expect(r.pflichtErfuellt).toBe(false)
  })
  it('pflicht-leer ohne Bereiche', () => {
    const r = validierePflichtfelder({ ...gueltig, bereiche: [] } as any)
    expect(r.pflichtErfuellt).toBe(false)
  })
  it('akzeptiert legacy hotspots[]-Feld', () => {
    const r = validierePflichtfelder({
      id: 'h1',
      typ: 'hotspot',
      fragetext: 'q',
      bildUrl: 'http://x/y.png',
      hotspots: [{ id: 'br1' }],
    } as any)
    expect(r.pflichtErfuellt).toBe(true)
  })
})

describe('validierePflichtfelder — freitext', () => {
  it('alle erfüllt mit musterloesung + bewertungsraster', () => {
    const r = validierePflichtfelder({
      id: 'f1',
      typ: 'freitext',
      fragetext: 'q',
      musterlosung: 'antwort',
      bewertungsraster: [{ beschreibung: 'b', punkte: 1 }],
    } as any)
    expect(r.pflichtErfuellt).toBe(true)
    expect(r.empfohlenErfuellt).toBe(true)
  })
  it('pflicht-leer ohne fragetext', () => {
    const r = validierePflichtfelder({ id: 'f1', typ: 'freitext', fragetext: '' } as any)
    expect(r.pflichtErfuellt).toBe(false)
  })
  it('empfohlen-leer ohne musterloesung & ohne bewertungsraster', () => {
    const r = validierePflichtfelder({ id: 'f1', typ: 'freitext', fragetext: 'q' } as any)
    expect(r.pflichtErfuellt).toBe(true)
    expect(r.empfohlenErfuellt).toBe(false)
  })
})

describe('validierePflichtfelder — berechnung', () => {
  const gueltig = {
    id: 'br1',
    typ: 'berechnung',
    fragetext: 'q',
    erklaerung: 'Lösungsweg',
    ergebnisse: [
      { id: 'e1', label: 'Result', korrekt: 42, toleranz: 0.1, einheit: 'CHF' },
    ],
  }
  it('alle erfüllt', () => {
    const r = validierePflichtfelder(gueltig as any)
    expect(r.pflichtErfuellt).toBe(true)
    expect(r.empfohlenErfuellt).toBe(true)
  })
  it('pflicht-leer ohne ergebnisse', () => {
    const r = validierePflichtfelder({ ...gueltig, ergebnisse: [] } as any)
    expect(r.pflichtErfuellt).toBe(false)
  })
  it('empfohlen-leer ohne toleranz/einheit', () => {
    const r = validierePflichtfelder({
      ...gueltig,
      ergebnisse: [{ id: 'e1', label: 'Result', korrekt: 42 }],
    } as any)
    expect(r.pflichtErfuellt).toBe(true)
    expect(r.empfohlenErfuellt).toBe(false)
  })
})

describe('validierePflichtfelder — zuordnung', () => {
  it('alle erfüllt', () => {
    const r = validierePflichtfelder({
      id: 'z1',
      typ: 'zuordnung',
      fragetext: 'q',
      paare: [
        { links: 'L1', rechts: 'R1' },
        { links: 'L2', rechts: 'R2' },
      ],
    } as any)
    expect(r.pflichtErfuellt).toBe(true)
  })
  it('pflicht-leer mit nur 1 Paar', () => {
    const r = validierePflichtfelder({
      id: 'z1',
      typ: 'zuordnung',
      fragetext: 'q',
      paare: [{ links: 'L1', rechts: 'R1' }],
    } as any)
    expect(r.pflichtErfuellt).toBe(false)
  })
  it('pflicht-leer mit halbem Paar (rechts leer)', () => {
    const r = validierePflichtfelder({
      id: 'z1',
      typ: 'zuordnung',
      fragetext: 'q',
      paare: [
        { links: 'L1', rechts: 'R1' },
        { links: 'L2', rechts: '' },
      ],
    } as any)
    expect(r.pflichtErfuellt).toBe(false)
  })
})
