import { describe, it, expect } from 'vitest'
import {
  indexEinstellungenTabs,
  indexHilfeTabs,
  indexKurse,
  indexPruefungen,
  indexUebungen,
  indexFragen,
  indexSchueler,
  SAMMELVIEW_ROUTE_BUILDERS,
} from './sucheAdapter'
import type { TabDefinition } from './tabRegistry'
import type { KursDefinition } from '../types/stammdaten'
import type { PruefungsConfig } from '../types/pruefung'
import type { FrageSummary } from '../types/fragen-storage'

const stubTab = (id: string, titel: string, surface: 'einstellungen' | 'hilfe' = 'einstellungen'): TabDefinition => ({
  id, surface, titel, route: `/${surface}/${id}`,
})

const stubKurs = (id: string, klassen: string[] = []): KursDefinition => ({
  id, name: id.toUpperCase(), fach: 'BWL', fachschaft: 'WR', gefaess: 'SF', klassen,
})

const stubConfig = (id: string, titel: string, typ: 'summativ' | 'formativ', klasse = '29c', fach = 'BWL'): PruefungsConfig => ({
  id, titel, typ, klasse, fach,
  // restliche Required-Felder als Stubs (Plan-Test-Pattern)
  fachbereiche: [fach],
} as unknown as PruefungsConfig)

const stubFrage = (id: string, fragetext: string, tags: string[] = [], thema = 'BWL'): FrageSummary => ({
  id,
  typ: 'mc',
  fachbereich: 'WR' as FrageSummary['fachbereich'],
  thema,
  fragetext,
  bloom: 'K1' as FrageSummary['bloom'],
  punkte: 1,
  tags,
  tagIds: [],
  erstelltAm: '2026-05-12',
  hatAnhang: false,
  hatMaterial: false,
  fach: 'BWL',
})

describe('indexEinstellungenTabs', () => {
  it('findet Tab per Titel', () => {
    const tabs = [stubTab('lernziele', 'Lernziele'), stubTab('profil', 'Profil')]
    const treffer = indexEinstellungenTabs('lern', tabs)
    expect(treffer).toHaveLength(1)
    expect(treffer[0].titel).toBe('Lernziele')
    expect(treffer[0].quelle).toBe('einstellungen-tab')
    expect(treffer[0].navigation.route).toBe('/einstellungen/lernziele')
    expect(treffer[0].iconKey).toBe('einstellungen')
  })

  it('mehrere Tabs', () => {
    const tabs = [stubTab('profil', 'Profil'), stubTab('lernziele', 'Lernziele')]
    expect(indexEinstellungenTabs('zelle', tabs)).toHaveLength(0)
  })
})

describe('indexHilfeTabs', () => {
  it('findet Hilfe-Tab + Route-Builder mit Modal-Param', () => {
    const tabs = [stubTab('bloom', 'Bloom-Taxonomie', 'hilfe')]
    const treffer = indexHilfeTabs('bloom', tabs)
    expect(treffer).toHaveLength(1)
    expect(treffer[0].quelle).toBe('hilfe-tab')
    expect(treffer[0].navigation.route).toBe('/einstellungen?hilfe=bloom')
    expect(treffer[0].iconKey).toBe('hilfe')
  })
})

describe('indexKurse', () => {
  it('findet Kurs per ID-Substring', () => {
    const treffer = indexKurse('29c', [stubKurs('sf-wr-29c', ['29c'])])
    expect(treffer).toHaveLength(1)
    expect(treffer[0].quelle).toBe('kurs')
    expect(treffer[0].navigation.route).toBe('/pruefung')
    expect(treffer[0].iconKey).toBe('kurs')
  })

  it('matched über klassen-Tag-Score', () => {
    const treffer = indexKurse('29a', [stubKurs('sf-wr-29c', ['29a', '29b'])])
    expect(treffer).toHaveLength(1)
  })
})

describe('indexPruefungen', () => {
  it('findet summative Prüfung per Titel', () => {
    const configs = [stubConfig('p1', 'Bilanz-Test', 'summativ')]
    const treffer = indexPruefungen('bilanz', configs)
    expect(treffer).toHaveLength(1)
    expect(treffer[0].quelle).toBe('pruefung')
    expect(treffer[0].subTitel).toContain('29c')
    expect(treffer[0].navigation.route).toBe('/pruefung/p1')
    expect(treffer[0].iconKey).toBe('pruefung')
  })

  it('filtert formative aus', () => {
    const configs = [
      stubConfig('u1', 'Übung A', 'formativ'),
      stubConfig('p1', 'Test B', 'summativ'),
    ]
    const treffer = indexPruefungen('test', configs)
    expect(treffer.map(t => t.id)).toEqual(['p1'])
  })
})

describe('indexUebungen', () => {
  it('findet formative Configs', () => {
    const configs = [
      stubConfig('u1', 'Übung A', 'formativ'),
      stubConfig('p1', 'Test', 'summativ'),
    ]
    const treffer = indexUebungen('übung', configs)
    expect(treffer.map(t => t.id)).toEqual(['u1'])
    expect(treffer[0].navigation.route).toBe('/uebung/u1')
    expect(treffer[0].iconKey).toBe('uebung')
  })
})

describe('indexFragen', () => {
  it('matched Titel (fragetext)', () => {
    const treffer = indexFragen('bilanz', [stubFrage('f1', 'Was ist eine Bilanz?')])
    expect(treffer).toHaveLength(1)
    expect(treffer[0].quelle).toBe('frage')
    expect(treffer[0].navigation.route).toBe('/fragensammlung/f1')
    expect(treffer[0].iconKey).toBe('frage')
  })

  // Cluster H Phase 3 (17.05.2026): String-Tag-Suche entfernt — Tag-Suche
  // erfolgt jetzt via tagIds + tagsStore-Lookup. Wenn der Store leer ist (Test-
  // Default), liefert tagNamenFuerFrage [] zurueck und der Suchtext matched nicht.
  // Separate Tag-Such-Tests fuer Store-basierte Lookups gehoeren ggf. in einen
  // tagsStore-Integration-Test.

  it('matched ID-exakt mit ID_EXACT-Score', () => {
    const treffer = indexFragen('frg-12345', [stubFrage('frg-12345', 'Foo')])
    expect(treffer).toHaveLength(1)
    expect(treffer[0].score).toBe(95)
  })

  it('matched Thema', () => {
    const treffer = indexFragen('rechnungswesen', [stubFrage('f1', 'Foo', [], 'Rechnungswesen')])
    expect(treffer).toHaveLength(1)
  })

  it('kürzt sehr langen fragetext auf 80 Zeichen', () => {
    const langeFrage = 'A'.repeat(150)
    const treffer = indexFragen('aaa', [stubFrage('f1', langeFrage)])
    expect(treffer[0].titel.length).toBeLessThanOrEqual(80)
  })
})

describe('SAMMELVIEW_ROUTE_BUILDERS', () => {
  it('einstellungen-tab routes to /einstellungen', () => {
    expect(SAMMELVIEW_ROUTE_BUILDERS['einstellungen-tab']('xy')).toBe('/einstellungen')
  })
  it('hilfe-tab routes to /hilfe', () => {
    expect(SAMMELVIEW_ROUTE_BUILDERS['hilfe-tab']('xy')).toBe('/hilfe')
  })
  it('kurs routes to /pruefung mit ?suche', () => {
    expect(SAMMELVIEW_ROUTE_BUILDERS.kurs('BWL')).toBe('/pruefung?suche=BWL')
  })
  it('pruefung routes to /pruefung mit ?suche', () => {
    expect(SAMMELVIEW_ROUTE_BUILDERS.pruefung('Bilanz')).toBe('/pruefung?suche=Bilanz')
  })
  it('uebung routes to /uebung mit ?suche (separate Route, kein modus-Param)', () => {
    expect(SAMMELVIEW_ROUTE_BUILDERS.uebung('Aktien')).toBe('/uebung?suche=Aktien')
  })
  it('frage routes to /fragensammlung mit ?suche', () => {
    expect(SAMMELVIEW_ROUTE_BUILDERS.frage('Wert')).toBe('/fragensammlung?suche=Wert')
  })
  it('encoded Sonderzeichen werden via encodeURIComponent escaped', () => {
    expect(SAMMELVIEW_ROUTE_BUILDERS.frage('a&b')).toBe('/fragensammlung?suche=a%26b')
  })
})

const eintraege = [
  { vorname: 'Anna', name: 'Müller', email: 'anna.mueller@stud.gymhofwil.ch', klasse: '28c' },
  { vorname: 'Ben', name: 'Schmidt', email: 'ben.s@stud.gymhofwil.ch', klasse: '27a' },
  { vorname: 'Clara', name: 'Weber', email: 'clara.w@stud.gymhofwil.ch', klasse: '28c', kurs: 'WR-SF' },
]

describe('indexSchueler (Cluster C.2)', () => {
  it('matched vorname → Anna Müller', () => {
    const treffer = indexSchueler('anna', eintraege)
    expect(treffer.length).toBeGreaterThanOrEqual(1)
    expect(treffer[0].titel).toBe('Anna Müller')
    expect(treffer[0].quelle).toBe('schueler')
  })
  it('matched nachname → Ben Schmidt', () => {
    const treffer = indexSchueler('Schmidt', eintraege)
    expect(treffer.map(t => t.titel)).toContain('Ben Schmidt')
  })
  it('matched email als id-exact → Anna Müller', () => {
    const treffer = indexSchueler('anna.mueller', eintraege)
    expect(treffer.map(t => t.titel)).toContain('Anna Müller')
  })
  it('matched klasse → 2 Schüler in 28c', () => {
    const treffer = indexSchueler('28c', eintraege)
    expect(treffer.map(t => t.titel).sort()).toEqual(['Anna Müller', 'Clara Weber'])
  })
  it('subTitel zeigt klasse + kurs wenn vorhanden', () => {
    const treffer = indexSchueler('clara', eintraege)
    expect(treffer[0].subTitel).toBe('28c · WR-SF')
  })
  it('subTitel nur klasse wenn kein kurs', () => {
    const treffer = indexSchueler('anna', eintraege)
    expect(treffer[0].subTitel).toBe('28c')
  })
  it('leere eintraege → leeres Array', () => {
    expect(indexSchueler('anna', [])).toEqual([])
  })
  it('kein Match → leeres Array', () => {
    expect(indexSchueler('xyz123', eintraege)).toEqual([])
  })
})
