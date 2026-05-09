import { describe, it, expect } from 'vitest'
import { validierePflichtfelder } from './pflichtfeldValidation'
import { mockCoreFrage } from '../test-helpers/frageCoreMocks'
import type { Frage, MCOption, Aussage, Luecke, BildbeschriftungLabel, DragDropBildZielzone, DragDropBildLabel, HotspotBereich } from '../types/fragen-core'

describe('validierePflichtfelder — Defensiv-Verhalten', () => {
  it('liefert pflichtErfuellt=true für unbekannten typ (kein Save-Block)', () => {
    const r = validierePflichtfelder({
      id: 'x', typ: 'mcc',
      fragetext: 'q',
    } as unknown as Frage /* Defensive: ungültiger typ-Wert */)
    expect(r.pflichtErfuellt).toBe(true)
    expect(r.empfohlenErfuellt).toBe(false) // konservativ
  })
  it('liefert ok bei null/undefined-Frage', () => {
    expect(validierePflichtfelder(null as unknown as Frage /* Defensive: null-input */).pflichtErfuellt).toBe(true)
    expect(validierePflichtfelder(undefined as unknown as Frage /* Defensive: undefined-input */).pflichtErfuellt).toBe(true)
  })
  it('crasht nicht bei null in Array-Feld (mc.optionen=null)', () => {
    const r = validierePflichtfelder(mockCoreFrage('mc', { fragetext: 'q', optionen: null as unknown as MCOption[] /* Defensive: bewusst null */ }))
    expect(r).toBeDefined()
    expect(r.pflichtErfuellt).toBe(false) // ≥2 Optionen Pflicht
  })
  it('liefert immer ein gültiges ValidationResult', () => {
    const r = validierePflichtfelder(mockCoreFrage('mc', { fragetext: 'q' }))
    expect(typeof r.felderStatus).toBe('object')
    expect(Array.isArray(r.pflichtLeerFelder)).toBe(true)
    expect(Array.isArray(r.empfohlenLeerFelder)).toBe(true)
  })
  it('throws nie', () => {
    expect(() => validierePflichtfelder(undefined as unknown as Frage /* Defensive: undefined-input */)).not.toThrow()
    expect(() => validierePflichtfelder({} as unknown as Frage /* Defensive: leeres Objekt */)).not.toThrow()
  })
})

describe('validierePflichtfelder — mc', () => {
  const minimalOptionen: MCOption[] = [
    { id: 'o1', text: 'A', korrekt: true, erklaerung: 'e1' },
    { id: 'o2', text: 'B', korrekt: false, erklaerung: 'e2' },
  ]
  it('alle erfüllt', () => {
    const r = validierePflichtfelder(mockCoreFrage('mc', { fragetext: 'q', optionen: minimalOptionen }))
    expect(r.pflichtErfuellt).toBe(true)
    expect(r.empfohlenErfuellt).toBe(true)
  })
  it('pflicht-leer ohne Frage-Text', () => {
    const r = validierePflichtfelder(mockCoreFrage('mc', { fragetext: '', optionen: minimalOptionen }))
    expect(r.pflichtErfuellt).toBe(false)
    expect(r.pflichtLeerFelder).toContain('Frage-Text')
  })
  it('pflicht-leer mit nur 1 Option', () => {
    const r = validierePflichtfelder(mockCoreFrage('mc', { fragetext: 'q', optionen: [minimalOptionen[0]] }))
    expect(r.pflichtErfuellt).toBe(false)
  })
  it('pflicht-leer ohne korrekt-markierte Option', () => {
    const r = validierePflichtfelder(mockCoreFrage('mc', {
      fragetext: 'q',
      optionen: minimalOptionen.map((o) => ({ ...o, korrekt: false })),
    }))
    expect(r.pflichtErfuellt).toBe(false)
  })
  it('empfohlen-leer ohne Erklärungen', () => {
    const r = validierePflichtfelder(mockCoreFrage('mc', {
      fragetext: 'q',
      optionen: minimalOptionen.map((o) => ({ ...o, erklaerung: '' })),
    }))
    expect(r.pflichtErfuellt).toBe(true)
    expect(r.empfohlenErfuellt).toBe(false)
  })
})

describe('validierePflichtfelder — richtigfalsch', () => {
  const gueltigeAussagen: Aussage[] = [
    { id: 'a1', text: 'A1', korrekt: true, erklaerung: 'e1' },
    { id: 'a2', text: 'A2', korrekt: false, erklaerung: 'e2' },
  ]
  it('alle erfüllt', () => {
    const r = validierePflichtfelder(mockCoreFrage('richtigfalsch', { fragetext: 'q', aussagen: gueltigeAussagen }))
    expect(r.pflichtErfuellt).toBe(true)
    expect(r.empfohlenErfuellt).toBe(true)
  })
  it('pflicht-leer mit nur 1 Aussage', () => {
    const r = validierePflichtfelder(mockCoreFrage('richtigfalsch', { fragetext: 'q', aussagen: [gueltigeAussagen[0]] }))
    expect(r.pflichtErfuellt).toBe(false)
  })
  it('pflicht-leer wenn Aussage ohne korrekt-flag (null)', () => {
    const r = validierePflichtfelder(mockCoreFrage('richtigfalsch', {
      fragetext: 'q',
      aussagen: [
        { id: 'a1', text: 'A1', korrekt: null as unknown as boolean /* Defensive: bewusst null */, erklaerung: 'e1' },
        { id: 'a2', text: 'A2', korrekt: false, erklaerung: 'e2' },
      ] as Aussage[],
    }))
    expect(r.pflichtErfuellt).toBe(false)
  })
  it('empfohlen-leer ohne Erklärungen', () => {
    const r = validierePflichtfelder(mockCoreFrage('richtigfalsch', {
      fragetext: 'q',
      aussagen: gueltigeAussagen.map((a) => ({ ...a, erklaerung: '' })),
    }))
    expect(r.pflichtErfuellt).toBe(true)
    expect(r.empfohlenErfuellt).toBe(false)
  })
})

describe('validierePflichtfelder — lueckentext', () => {
  it('Freitext-Modus: alle erfüllt', () => {
    const r = validierePflichtfelder(mockCoreFrage('lueckentext', {
      fragetext: 'q',
      textMitLuecken: 'Das ist ein {{1}} Test',
      lueckentextModus: 'freitext',
      luecken: [{ id: '1', korrekteAntworten: ['Antwort'], caseSensitive: false }],
    }))
    expect(r.pflichtErfuellt).toBe(true)
  })
  it('Freitext-Modus: pflicht-leer ohne korrekteAntworten', () => {
    const r = validierePflichtfelder(mockCoreFrage('lueckentext', {
      fragetext: 'q',
      textMitLuecken: '{{1}}',
      lueckentextModus: 'freitext',
      luecken: [{ id: '1', korrekteAntworten: [], caseSensitive: false }],
    }))
    expect(r.pflichtErfuellt).toBe(false)
  })
  it('pflicht-leer ohne Lücken-Platzhalter', () => {
    const r = validierePflichtfelder(mockCoreFrage('lueckentext', {
      fragetext: 'q',
      textMitLuecken: 'Kein Platzhalter hier',
      lueckentextModus: 'freitext',
      luecken: [],
    }))
    expect(r.pflichtErfuellt).toBe(false)
  })
  it('akzeptiert {N}-Kurzform (S142)', () => {
    const r = validierePflichtfelder(mockCoreFrage('lueckentext', {
      fragetext: 'q',
      textMitLuecken: 'Das ist {1} Test',
      lueckentextModus: 'freitext',
      luecken: [{ id: '1', korrekteAntworten: ['x'], caseSensitive: false }],
    }))
    expect(r.pflichtErfuellt).toBe(true)
  })
  it('falsch-positiv vermieden: { ohne Zahl ist KEIN Platzhalter', () => {
    const r = validierePflichtfelder(mockCoreFrage('lueckentext', {
      fragetext: 'q',
      textMitLuecken: 'JSON-Beispiel: { "key": "value" } enthält keine Lücke',
      lueckentextModus: 'freitext',
      luecken: [{ id: '1', korrekteAntworten: ['x'], caseSensitive: false }],
    }))
    expect(r.pflichtErfuellt).toBe(false)
    expect(r.pflichtLeerFelder.some(f => f.includes('Platzhalter'))).toBe(true)
  })
  it('Dropdown-Modus: alle erfüllt mit korrektem Eintrag', () => {
    const r = validierePflichtfelder(mockCoreFrage('lueckentext', {
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
    }))
    expect(r.pflichtErfuellt).toBe(true)
  })
  it('Dropdown-Modus: pflicht-leer mit nur 1 Option', () => {
    const r = validierePflichtfelder(mockCoreFrage('lueckentext', {
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
    }))
    expect(r.pflichtErfuellt).toBe(false)
  })
})

describe('validierePflichtfelder — sortierung', () => {
  it('alle erfüllt', () => {
    const r = validierePflichtfelder(mockCoreFrage('sortierung', {
      fragetext: 'q',
      elemente: ['A', 'B', 'C'],
    }))
    expect(r.pflichtErfuellt).toBe(true)
  })
  it('pflicht-leer mit nur 1 Element', () => {
    const r = validierePflichtfelder(mockCoreFrage('sortierung', {
      fragetext: 'q',
      elemente: ['A'],
    }))
    expect(r.pflichtErfuellt).toBe(false)
  })
  it('pflicht-leer ohne Frage-Text', () => {
    const r = validierePflichtfelder(mockCoreFrage('sortierung', {
      fragetext: '',
      elemente: ['A', 'B'],
    }))
    expect(r.pflichtErfuellt).toBe(false)
  })
})

describe('validierePflichtfelder — buchungssatz', () => {
  it('alle erfüllt (geschaeftsfall als fragetext-Ersatz)', () => {
    const r = validierePflichtfelder(mockCoreFrage('buchungssatz', {
      geschaeftsfall: 'Wareneinkauf bar',
      buchungen: [{ id: 'bu1', sollKonto: '6000', habenKonto: '1000', betrag: 100 }],
    }))
    expect(r.pflichtErfuellt).toBe(true)
  })
  it('pflicht-leer ohne geschaeftsfall + ohne fragetext', () => {
    const r = validierePflichtfelder(mockCoreFrage('buchungssatz', {
      geschaeftsfall: '',
      buchungen: [{ id: 'bu1', sollKonto: '6000', habenKonto: '1000', betrag: 100 }],
    }))
    expect(r.pflichtErfuellt).toBe(false)
  })
  it('pflicht-leer ohne Buchungen', () => {
    const r = validierePflichtfelder(mockCoreFrage('buchungssatz', {
      geschaeftsfall: 'Wareneinkauf bar',
      buchungen: [],
    }))
    expect(r.pflichtErfuellt).toBe(false)
  })
  it('akzeptiert Buchung mit nur sollKonto', () => {
    const r = validierePflichtfelder(mockCoreFrage('buchungssatz', {
      geschaeftsfall: 'Wareneinkauf bar',
      buchungen: [{ id: 'bu1', sollKonto: '6000', habenKonto: '', betrag: 100 }],
    }))
    expect(r.pflichtErfuellt).toBe(true)
  })
})

describe('validierePflichtfelder — tkonto', () => {
  it('alle erfüllt', () => {
    const r = validierePflichtfelder(mockCoreFrage('tkonto', {
      aufgabentext: 'Buche',
      konten: [{ id: 'k1', kontonummer: '1000' }],
    }))
    expect(r.pflichtErfuellt).toBe(true)
  })
  it('pflicht-leer ohne aufgabentext', () => {
    const r = validierePflichtfelder(mockCoreFrage('tkonto', {
      aufgabentext: '',
      konten: [{ id: 'k1', kontonummer: '1000' }],
    }))
    expect(r.pflichtErfuellt).toBe(false)
  })
  it('pflicht-leer ohne Konten', () => {
    const r = validierePflichtfelder(mockCoreFrage('tkonto', {
      aufgabentext: 'Buche',
      konten: [],
    }))
    expect(r.pflichtErfuellt).toBe(false)
  })
})

describe('validierePflichtfelder — kontenbestimmung', () => {
  it('alle erfüllt', () => {
    const r = validierePflichtfelder(mockCoreFrage('kontenbestimmung', {
      aufgabentext: 'Bestimme',
      aufgaben: [{ id: 'a1', text: 'Wareneinkauf bar' }],
    }))
    expect(r.pflichtErfuellt).toBe(true)
  })
  it('pflicht-leer ohne aufgabentext', () => {
    const r = validierePflichtfelder(mockCoreFrage('kontenbestimmung', {
      aufgabentext: '',
      aufgaben: [{ id: 'a1', text: 'Wareneinkauf bar' }],
    }))
    expect(r.pflichtErfuellt).toBe(false)
  })
  it('pflicht-leer ohne Aufgaben mit Text', () => {
    const r = validierePflichtfelder(mockCoreFrage('kontenbestimmung', {
      aufgabentext: 'Bestimme',
      aufgaben: [{ id: 'a1', text: '' }],
    }))
    expect(r.pflichtErfuellt).toBe(false)
  })
})

describe('validierePflichtfelder — bilanzstruktur', () => {
  it('alle erfüllt', () => {
    const r = validierePflichtfelder(mockCoreFrage('bilanzstruktur', {
      aufgabentext: 'Bilanz erstellen',
      kontenMitSaldi: [{ kontonummer: '1000', saldo: 500 }],
    }))
    expect(r.pflichtErfuellt).toBe(true)
  })
  it('pflicht-leer ohne aufgabentext', () => {
    const r = validierePflichtfelder(mockCoreFrage('bilanzstruktur', {
      aufgabentext: '',
      kontenMitSaldi: [{ kontonummer: '1000', saldo: 500 }],
    }))
    expect(r.pflichtErfuellt).toBe(false)
  })
  it('pflicht-leer ohne Konten mit Saldo', () => {
    const r = validierePflichtfelder(mockCoreFrage('bilanzstruktur', {
      aufgabentext: 'Bilanz erstellen',
      kontenMitSaldi: [{ kontonummer: '1000' }],
    }))
    expect(r.pflichtErfuellt).toBe(false)
  })
})

describe('validierePflichtfelder — visualisierung', () => {
  it('alle erfüllt mit canvasConfig', () => {
    const r = validierePflichtfelder(mockCoreFrage('visualisierung', {
      fragetext: 'q',
      canvasConfig: { breite: 800, hoehe: 600, koordinatensystem: false, werkzeuge: ['stift'] },
    }))
    expect(r.pflichtErfuellt).toBe(true)
  })
  it('alle erfüllt mit ausgangsdiagramm', () => {
    const r = validierePflichtfelder(mockCoreFrage('visualisierung', {
      fragetext: 'q',
      ausgangsdiagramm: { typ: 'angebot-nachfrage' },
    }))
    expect(r.pflichtErfuellt).toBe(true)
  })
})

describe('validierePflichtfelder — pdf', () => {
  it('alle erfüllt', () => {
    const r = validierePflichtfelder(mockCoreFrage('pdf', {
      fragetext: 'q',
      pdfDriveFileId: 'abc',
      erlaubteWerkzeuge: ['highlighter'],
    }))
    expect(r.pflichtErfuellt).toBe(true)
  })
  it('pflicht-leer ohne pdfDriveFileId/pdfUrl', () => {
    const r = validierePflichtfelder(mockCoreFrage('pdf', {
      fragetext: 'q',
      pdfDriveFileId: undefined,
      erlaubteWerkzeuge: ['highlighter'],
    }))
    expect(r.pflichtErfuellt).toBe(false)
  })
  it('pflicht-leer ohne erlaubteWerkzeuge', () => {
    const r = validierePflichtfelder(mockCoreFrage('pdf', {
      fragetext: 'q',
      pdfDriveFileId: 'abc',
      erlaubteWerkzeuge: [],
    }))
    expect(r.pflichtErfuellt).toBe(false)
  })
  it('akzeptiert pdfUrl als Alternative', () => {
    const r = validierePflichtfelder(mockCoreFrage('pdf', {
      fragetext: 'q',
      pdfUrl: 'http://x/y.pdf',
      erlaubteWerkzeuge: ['highlighter'],
    }))
    expect(r.pflichtErfuellt).toBe(true)
  })
  it('akzeptiert pdf: MediaQuelle ohne Alt-Felder (Phase 6.a Resolver-Read)', () => {
    const r = validierePflichtfelder(mockCoreFrage('pdf', {
      fragetext: 'q',
      pdfDriveFileId: undefined,
      pdf: { typ: 'app', appPfad: 'materialien/witzsammlung.pdf', mimeType: 'application/pdf', dateiname: 'witzsammlung.pdf' },
      erlaubteWerkzeuge: ['highlighter'],
    }))
    expect(r.pflichtErfuellt).toBe(true)
  })
})

describe('validierePflichtfelder — code', () => {
  it('alle erfüllt', () => {
    const r = validierePflichtfelder(mockCoreFrage('code', {
      fragetext: 'q',
      sprache: 'python',
      musterLoesung: 'print(1)',
      testCases: [{ input: '', output: '1' }],
    }))
    expect(r.pflichtErfuellt).toBe(true)
    expect(r.empfohlenErfuellt).toBe(true)
  })
  it('pflicht-leer ohne sprache', () => {
    const r = validierePflichtfelder(mockCoreFrage('code', {
      fragetext: 'q',
      sprache: '' as unknown as string /* Defensive: bewusst leer */,
    }))
    expect(r.pflichtErfuellt).toBe(false)
  })
  it('empfohlen-leer ohne musterloesung & testCases', () => {
    const r = validierePflichtfelder(mockCoreFrage('code', {
      fragetext: 'q',
      sprache: 'python',
    }))
    expect(r.pflichtErfuellt).toBe(true)
    expect(r.empfohlenErfuellt).toBe(false)
  })
})

describe('validierePflichtfelder — formel', () => {
  it('alle erfüllt', () => {
    const r = validierePflichtfelder(mockCoreFrage('formel', {
      fragetext: 'q',
      korrekteFormel: 'a^2',
      toleranz: 0.01,
      erklaerung: 'Lösung',
    }))
    expect(r.pflichtErfuellt).toBe(true)
    expect(r.empfohlenErfuellt).toBe(true)
  })
  it('pflicht-leer ohne korrekteFormel', () => {
    const r = validierePflichtfelder(mockCoreFrage('formel', {
      fragetext: 'q',
      korrekteFormel: '',
    }))
    expect(r.pflichtErfuellt).toBe(false)
  })
  it('empfohlen-leer ohne toleranz/erklaerung', () => {
    const r = validierePflichtfelder(mockCoreFrage('formel', {
      fragetext: 'q',
      korrekteFormel: 'a^2',
    }))
    expect(r.pflichtErfuellt).toBe(true)
    expect(r.empfohlenErfuellt).toBe(false)
  })
})

describe('validierePflichtfelder — aufgabengruppe (rekursiv)', () => {
  it('2 Ebenen alle erfüllt', () => {
    const r = validierePflichtfelder(mockCoreFrage('aufgabengruppe', {
      fragetext: 'Kontext',
      teilaufgaben: [
        mockCoreFrage('mc', {
          fragetext: 'q',
          optionen: [
            { id: 'o1', text: 'A', korrekt: true, erklaerung: 'e1' },
            { id: 'o2', text: 'B', korrekt: false, erklaerung: 'e2' },
          ],
        }),
      ],
    }))
    expect(r.pflichtErfuellt).toBe(true)
    expect(r.empfohlenErfuellt).toBe(true)
  })
  it('1 Teilaufgabe pflicht-leer → propagiert', () => {
    const r = validierePflichtfelder(mockCoreFrage('aufgabengruppe', {
      fragetext: 'Kontext',
      teilaufgaben: [
        mockCoreFrage('mc', {
          fragetext: '',
          optionen: [],
        }),
      ],
    }))
    expect(r.pflichtErfuellt).toBe(false)
    expect(r.pflichtLeerFelder.length).toBeGreaterThan(0)
  })
  it('ohne Teilaufgaben → pflicht-leer', () => {
    const r = validierePflichtfelder(mockCoreFrage('aufgabengruppe', {
      fragetext: 'Kontext',
      teilaufgaben: [],
    }))
    expect(r.pflichtErfuellt).toBe(false)
  })
  it('akzeptiert kontext als fragetext-Fallback', () => {
    const r = validierePflichtfelder(mockCoreFrage('aufgabengruppe', {
      kontext: 'Kontext',
      fragetext: undefined as unknown as string /* Defensive: kein fragetext, nur kontext */,
      teilaufgaben: [
        mockCoreFrage('mc', {
          fragetext: 'q',
          optionen: [
            { id: 'o1', text: 'A', korrekt: true, erklaerung: 'e1' },
            { id: 'o2', text: 'B', korrekt: false, erklaerung: 'e2' },
          ],
        }),
      ],
    }))
    expect(r.pflichtErfuellt).toBe(true)
  })
  it('4 Ebenen → Pass-Through bei Tiefe ≥ 3 (DEFAULT_OK)', () => {
    const tiefe4 = mockCoreFrage('aufgabengruppe', {
      fragetext: 'L1',
      teilaufgaben: [
        mockCoreFrage('aufgabengruppe', {
          fragetext: 'L2',
          teilaufgaben: [
            mockCoreFrage('aufgabengruppe', {
              fragetext: 'L3',
              teilaufgaben: [
                mockCoreFrage('aufgabengruppe', {
                  fragetext: '',
                  teilaufgaben: [],
                }),
              ],
            }),
          ],
        }),
      ],
    })
    const r = validierePflichtfelder(tiefe4)
    expect(r.pflichtErfuellt).toBe(true)
  })
})

describe('validierePflichtfelder — bildbeschriftung', () => {
  const gueltigeBeschriftungen: BildbeschriftungLabel[] = [
    { id: 'l1', position: { x: 10, y: 20 }, korrekt: ['Antwort'] },
  ]
  it('alle erfüllt', () => {
    const r = validierePflichtfelder(mockCoreFrage('bildbeschriftung', {
      fragetext: 'q',
      bildUrl: 'http://x/y.png',
      beschriftungen: gueltigeBeschriftungen,
    }))
    expect(r.pflichtErfuellt).toBe(true)
  })
  it('pflicht-leer ohne bildUrl', () => {
    const r = validierePflichtfelder(mockCoreFrage('bildbeschriftung', {
      fragetext: 'q',
      bildUrl: '',
      beschriftungen: gueltigeBeschriftungen,
    }))
    expect(r.pflichtErfuellt).toBe(false)
  })
  it('pflicht-leer mit Beschriftung ohne korrekt-Antwort', () => {
    const r = validierePflichtfelder(mockCoreFrage('bildbeschriftung', {
      fragetext: 'q',
      bildUrl: 'http://x/y.png',
      beschriftungen: [{ id: 'l1', position: { x: 10, y: 20 }, korrekt: [''] }],
    }))
    expect(r.pflichtErfuellt).toBe(false)
  })
  it('pflicht-leer ohne Beschriftungen', () => {
    const r = validierePflichtfelder(mockCoreFrage('bildbeschriftung', {
      fragetext: 'q',
      bildUrl: 'http://x/y.png',
      beschriftungen: [],
    }))
    expect(r.pflichtErfuellt).toBe(false)
  })
})

describe('validierePflichtfelder — dragdrop_bild', () => {
  const gueltigeZielzonen: DragDropBildZielzone[] = [{ id: 'z1', form: 'rechteck', punkte: [], korrekteLabels: ['A'] }]
  const gueltigeLabels: DragDropBildLabel[] = [{ id: 'l1', text: 'A' }, { id: 'l2', text: 'B' }]
  it('alle erfüllt', () => {
    const r = validierePflichtfelder(mockCoreFrage('dragdrop_bild', {
      fragetext: 'q',
      bildUrl: 'http://x/y.png',
      zielzonen: gueltigeZielzonen,
      labels: gueltigeLabels,
    }))
    expect(r.pflichtErfuellt).toBe(true)
  })
  it('pflicht-leer wenn ein korrekteLabels-Eintrag nicht im labels-Pool ist', () => {
    const r = validierePflichtfelder(mockCoreFrage('dragdrop_bild', {
      fragetext: 'q',
      bildUrl: 'http://x/y.png',
      zielzonen: gueltigeZielzonen,
      labels: [{ id: 'l1', text: 'B' }, { id: 'l2', text: 'C' }],
    }))
    expect(r.pflichtErfuellt).toBe(false)
  })
  it('pflicht-leer ohne Zielzonen', () => {
    const r = validierePflichtfelder(mockCoreFrage('dragdrop_bild', {
      fragetext: 'q',
      bildUrl: 'http://x/y.png',
      zielzonen: [],
      labels: gueltigeLabels,
    }))
    expect(r.pflichtErfuellt).toBe(false)
  })
  it('Multi-Label-Synonyme: alle müssen im Pool sein', () => {
    const multiLabelZonen: DragDropBildZielzone[] = [{ id: 'z1', form: 'rechteck', punkte: [], korrekteLabels: ['A', 'Alpha'] }]
    const multiLabelPool: DragDropBildLabel[] = [{ id: 'l1', text: 'A' }, { id: 'l2', text: 'Alpha' }, { id: 'l3', text: 'B' }]
    expect(validierePflichtfelder(mockCoreFrage('dragdrop_bild', {
      fragetext: 'q',
      bildUrl: 'http://x/y.png',
      zielzonen: multiLabelZonen,
      labels: multiLabelPool,
    })).pflichtErfuellt).toBe(true)
    const fehlt: DragDropBildLabel[] = [{ id: 'l1', text: 'A' }, { id: 'l3', text: 'B' }]  // 'Alpha' fehlt
    expect(validierePflichtfelder(mockCoreFrage('dragdrop_bild', {
      fragetext: 'q',
      bildUrl: 'http://x/y.png',
      zielzonen: multiLabelZonen,
      labels: fehlt,
    })).pflichtErfuellt).toBe(false)
  })
})

describe('validierePflichtfelder — hotspot', () => {
  const gueltigeBereiche: HotspotBereich[] = [{ id: 'br1', form: 'rechteck', punkte: [], label: 'A', punktzahl: 1 }]
  it('alle erfüllt', () => {
    const r = validierePflichtfelder(mockCoreFrage('hotspot', {
      fragetext: 'q',
      bildUrl: 'http://x/y.png',
      bereiche: gueltigeBereiche,
    }))
    expect(r.pflichtErfuellt).toBe(true)
  })
  it('pflicht-leer ohne bildUrl', () => {
    const r = validierePflichtfelder(mockCoreFrage('hotspot', {
      fragetext: 'q',
      bildUrl: '',
      bereiche: gueltigeBereiche,
    }))
    expect(r.pflichtErfuellt).toBe(false)
  })
  it('pflicht-leer ohne Bereiche', () => {
    const r = validierePflichtfelder(mockCoreFrage('hotspot', {
      fragetext: 'q',
      bildUrl: 'http://x/y.png',
      bereiche: [],
    }))
    expect(r.pflichtErfuellt).toBe(false)
  })
  it('akzeptiert legacy hotspots[]-Feld', () => {
    // Defensive: legacy 'hotspots'-Feld existiert nicht im Typ; bereiche muss entfernt werden
    const r = validierePflichtfelder({
      ...mockCoreFrage('hotspot', { fragetext: 'q', bildUrl: 'http://x/y.png' }),
      bereiche: undefined,
      hotspots: [{ id: 'br1' }],
    } as unknown as Frage /* Defensive: legacy hotspots-Feld, bereiche bewusst entfernt */)
    expect(r.pflichtErfuellt).toBe(true)
  })
  it('akzeptiert bild: MediaQuelle ohne bildUrl (Phase 6.a Resolver-Read)', () => {
    const r = validierePflichtfelder(mockCoreFrage('hotspot', {
      fragetext: 'q',
      bildUrl: '',
      bild: { typ: 'app', appPfad: 'demo-bilder/europa.svg', mimeType: 'image/svg+xml' },
      bereiche: gueltigeBereiche,
    }))
    expect(r.pflichtErfuellt).toBe(true)
  })
})

describe('validierePflichtfelder — freitext', () => {
  it('alle erfüllt mit musterloesung + bewertungsraster', () => {
    const r = validierePflichtfelder(mockCoreFrage('freitext', {
      fragetext: 'q',
      musterlosung: 'antwort',
      bewertungsraster: [{ beschreibung: 'b', punkte: 1 }],
    }))
    expect(r.pflichtErfuellt).toBe(true)
    expect(r.empfohlenErfuellt).toBe(true)
  })
  it('pflicht-leer ohne fragetext', () => {
    const r = validierePflichtfelder(mockCoreFrage('freitext', { fragetext: '' }))
    expect(r.pflichtErfuellt).toBe(false)
  })
  it('empfohlen-leer ohne musterloesung & ohne bewertungsraster', () => {
    const r = validierePflichtfelder(mockCoreFrage('freitext', { fragetext: 'q' }))
    expect(r.pflichtErfuellt).toBe(true)
    expect(r.empfohlenErfuellt).toBe(false)
  })
})

describe('validierePflichtfelder — berechnung', () => {
  it('alle erfüllt', () => {
    const r = validierePflichtfelder(mockCoreFrage('berechnung', {
      fragetext: 'q',
      erklaerung: 'Lösungsweg',
      ergebnisse: [
        { id: 'e1', label: 'Result', korrekt: 42, toleranz: 0.1, einheit: 'CHF' },
      ],
    }))
    expect(r.pflichtErfuellt).toBe(true)
    expect(r.empfohlenErfuellt).toBe(true)
  })
  it('pflicht-leer ohne ergebnisse', () => {
    const r = validierePflichtfelder(mockCoreFrage('berechnung', {
      fragetext: 'q',
      ergebnisse: [],
    }))
    expect(r.pflichtErfuellt).toBe(false)
  })
  it('empfohlen-leer ohne toleranz/einheit', () => {
    const r = validierePflichtfelder(mockCoreFrage('berechnung', {
      fragetext: 'q',
      ergebnisse: [{ id: 'e1', label: 'Result', korrekt: 42 }],
    }))
    expect(r.pflichtErfuellt).toBe(true)
    expect(r.empfohlenErfuellt).toBe(false)
  })
})

describe('validierePflichtfelder — zuordnung', () => {
  it('alle erfüllt', () => {
    const r = validierePflichtfelder(mockCoreFrage('zuordnung', {
      fragetext: 'q',
      paare: [
        { links: 'L1', rechts: 'R1' },
        { links: 'L2', rechts: 'R2' },
      ],
    }))
    expect(r.pflichtErfuellt).toBe(true)
  })
  it('pflicht-leer mit nur 1 Paar', () => {
    const r = validierePflichtfelder(mockCoreFrage('zuordnung', {
      fragetext: 'q',
      paare: [{ links: 'L1', rechts: 'R1' }],
    }))
    expect(r.pflichtErfuellt).toBe(false)
  })
  it('pflicht-leer mit halbem Paar (rechts leer)', () => {
    const r = validierePflichtfelder(mockCoreFrage('zuordnung', {
      fragetext: 'q',
      paare: [
        { links: 'L1', rechts: 'R1' },
        { links: 'L2', rechts: '' },
      ],
    }))
    expect(r.pflichtErfuellt).toBe(false)
  })
})
