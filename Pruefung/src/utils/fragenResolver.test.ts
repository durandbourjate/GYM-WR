import { describe, it, expect } from 'vitest'
import { resolveFragenFuerPruefung } from './fragenResolver'
import type { PruefungsConfig } from '../types/pruefung'
import type { Frage } from '../types/fragen'

// Minimal-Config-Factory
function makeConfig(abschnitte: { fragenIds: string[] }[]): PruefungsConfig {
  return {
    id: 'test-1',
    titel: 'Test',
    klasse: '29c',
    gefaess: 'SF',
    semester: 'S3',
    fachbereiche: ['VWL'],
    datum: '2026-03-27',
    typ: 'summativ',
    modus: 'pruefung',
    dauerMinuten: 45,
    zeitModus: 'countdown',
    gesamtpunkte: 10,
    erlaubteKlasse: '29c',
    abschnitte: abschnitte.map((a, i) => ({ titel: `Abschnitt ${i + 1}`, ...a })),
    zufallsreihenfolgeFragen: false,
    zufallsreihenfolgeOptionen: false,
    ruecknavigation: true,
    zeitanzeigeTyp: 'countdown',
    freigeschaltet: true,
    autoSaveIntervallSekunden: 15,
    heartbeatIntervallSekunden: 5,
    sebErforderlich: false,
    korrektur: { aktiviert: false, modus: 'batch' },
    feedback: { zeitpunkt: 'manuell', format: 'in-app-und-pdf', detailgrad: 'vollstaendig' },
  }
}

function makeFrage(id: string, typ = 'mc'): Frage {
  return {
    id,
    typ,
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
    fragetext: 'Test?',
    optionen: [{ id: 'o1', text: 'A', korrekt: true }],
    mehrfachauswahl: false,
    zufallsreihenfolge: false,
  } as unknown as Frage
}

describe('resolveFragenFuerPruefung', () => {
  it('löst einfache Fragen aus einem Abschnitt auf', () => {
    const config = makeConfig([{ fragenIds: ['f1', 'f2'] }])
    const fragen = [makeFrage('f1'), makeFrage('f2')]
    const result = resolveFragenFuerPruefung(config, fragen)

    expect(result.navigationsFragen).toHaveLength(2)
    expect(result.alleFragen).toHaveLength(2)
    expect(result.navigationsFragen.map(f => f.id)).toEqual(['f1', 'f2'])
  })

  it('löst Fragen aus mehreren Abschnitten auf', () => {
    const config = makeConfig([{ fragenIds: ['f1'] }, { fragenIds: ['f2', 'f3'] }])
    const fragen = [makeFrage('f1'), makeFrage('f2'), makeFrage('f3')]
    const result = resolveFragenFuerPruefung(config, fragen)

    expect(result.navigationsFragen).toHaveLength(3)
    expect(result.navigationsFragen.map(f => f.id)).toEqual(['f1', 'f2', 'f3'])
  })

  it('ignoriert fehlende Fragen', () => {
    const config = makeConfig([{ fragenIds: ['f1', 'fehlt', 'f2'] }])
    const fragen = [makeFrage('f1'), makeFrage('f2')]
    const result = resolveFragenFuerPruefung(config, fragen)

    expect(result.navigationsFragen).toHaveLength(2)
    expect(result.navigationsFragen.map(f => f.id)).toEqual(['f1', 'f2'])
  })

  it('vermeidet Duplikate bei gleicher Frage in mehreren Abschnitten', () => {
    const config = makeConfig([{ fragenIds: ['f1', 'f2'] }, { fragenIds: ['f1'] }])
    const fragen = [makeFrage('f1'), makeFrage('f2')]
    const result = resolveFragenFuerPruefung(config, fragen)

    expect(result.navigationsFragen).toHaveLength(2)
  })

  it('löst Aufgabengruppen-Teilaufgaben in alleFragen auf', () => {
    const gruppe = {
      ...makeFrage('g1', 'aufgabengruppe'),
      teilaufgabenIds: ['t1', 't2'],
    } as unknown as Frage
    const config = makeConfig([{ fragenIds: ['g1'] }])
    const fragen = [gruppe, makeFrage('t1'), makeFrage('t2')]
    const result = resolveFragenFuerPruefung(config, fragen)

    // Navigation: nur die Gruppe
    expect(result.navigationsFragen).toHaveLength(1)
    expect(result.navigationsFragen[0].id).toBe('g1')

    // Alle Fragen: Gruppe + Teilaufgaben
    expect(result.alleFragen).toHaveLength(3)
    expect(result.alleFragen.map(f => f.id)).toEqual(['g1', 't1', 't2'])
  })

  it('gibt leere Arrays bei leerer Config zurück', () => {
    const config = makeConfig([{ fragenIds: [] }])
    const result = resolveFragenFuerPruefung(config, [])

    expect(result.navigationsFragen).toHaveLength(0)
    expect(result.alleFragen).toHaveLength(0)
  })
})
