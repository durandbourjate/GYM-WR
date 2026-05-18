import { describe, it, expect } from 'vitest'
import {
  indexEinstellungenTabs,
  indexHilfeTabs,
  indexKurse,
  indexPruefungen,
  indexUebungen,
  indexFragen,
  indexSchueler,
  indexFragenVolltext,
  SAMMELVIEW_ROUTE_BUILDERS,
} from './sucheAdapter'
import type { TabDefinition } from './tabRegistry'
import type { KursDefinition } from '../types/stammdaten'
import type { PruefungsConfig } from '../types/pruefung'
import type { FrageSummary, Frage } from '../types/fragen-storage'

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

// ---------------------------------------------------------------------------
// Test-Factory für indexFragenVolltext (C.4)
// Erzeugt ein minimales Storage-Frage-Objekt ohne as-Casts.
// ---------------------------------------------------------------------------
function makeFrage(
  overrides: {
    id?: string
    fragetext?: string
    musterlosung?: string
    thema?: string
    tagIds?: string[]
  } = {},
): Frage {
  return {
    id: overrides.id ?? 'frg-test-001',
    typ: 'freitext',
    fachbereich: 'WR',
    fach: 'BWL',
    thema: overrides.thema ?? 'Allgemein',
    unterthema: undefined,
    bloom: 'K1',
    punkte: 1,
    semester: [],
    gefaesse: [],
    bewertungsraster: [],
    verwendungen: [],
    tagIds: overrides.tagIds ?? [],
    fragetext: overrides.fragetext ?? 'Standardfragetext',
    musterlosung: overrides.musterlosung ?? 'Standardlösung',
    erstelltAm: '2026-05-17',
    geaendertAm: '2026-05-17',
    status: 'aktiv',
  } as unknown as Frage /* Defensive: FreitextFrage hat optionale Core-Felder, die im Test-Stub fehlen */
}

describe('indexFragenVolltext (C.4)', () => {
  // Test 1: matched Fragetext → score aus fragetext, subTitel enthält Snippet
  // Suchbegriff muss ausserhalb der ersten 77 Zeichen des fragetexts liegen,
  // damit der abgeschnittene Titel ihn nicht enthält und volltextMatch greift.
  it('matched Fragetext → subTitel enthält Snippet des fragetexts', () => {
    const frage = makeFrage({
      // Suchbegriff 'Buchführungspflicht' kommt erst ab Zeichen ~100 vor
      fragetext:
        'Erkläre ausführlich, welche gesetzlichen Grundlagen und welche konkreten Anforderungen an die Buchführungspflicht in der Schweiz gelten.',
      musterlosung: 'Keine relevante Antwort hier.',
      thema: 'Rechnungswesen',
    })
    const treffer = indexFragenVolltext('buchführungspflicht', [frage])
    expect(treffer).toHaveLength(1)
    expect(treffer[0].score).toBeGreaterThan(0)
    expect(treffer[0].subTitel).toBeDefined()
    expect(treffer[0].subTitel!.toLowerCase()).toContain('buchf')
  })

  // Test 2: matched Musterlösung → subTitel enthält Snippet der musterlosung
  it('matched Musterlösung → subTitel enthält Snippet der Musterlösung', () => {
    const frage = makeFrage({
      fragetext: 'Was ist Rechnungswesen?',
      musterlosung: 'Rechnungswesen umfasst Buchführung und Bilanzierung.',
    })
    const treffer = indexFragenVolltext('Buchführung', [frage])
    expect(treffer).toHaveLength(1)
    expect(treffer[0].subTitel).toBeDefined()
    expect(treffer[0].subTitel!.toLowerCase()).toContain('buchf')
  })

  // Test 3: Titel-Match dominiert über Volltext-Match → snippet fällt auf thema zurück
  it('Titel-Match dominiert: subTitel zeigt thema statt Snippet', () => {
    const frage = makeFrage({
      fragetext: 'Bilanz',
      musterlosung: 'Bilanz wird oft im Rechnungswesen verwendet.',
      thema: 'Rechnungswesen',
    })
    // Query matcht den kurzen fragetext exakt als Titel — titelScore wird höher als subTitel-Score
    const treffer = indexFragenVolltext('Bilanz', [frage])
    expect(treffer).toHaveLength(1)
    // Wenn titelScore >= fragetextScore, ist volltextMatch false → subTitel = thema
    // Ein exakter Titel-Treffer (TITEL_PREFIX = 100) dominiert einen subTitel-Treffer (SUBTITEL = 30)
    expect(treffer[0].subTitel).toBe('Rechnungswesen')
  })

  // Test 4: Volltext-Match zeigt Snippet im subTitel (nicht thema)
  // Fragetext > 80 Zeichen: Titel ist abgeschnitten und enthält 'buchführung' nicht.
  it('reiner Volltext-Match: subTitel zeigt Snippet, nicht thema', () => {
    const frage = makeFrage({
      fragetext:
        'Erkläre ausführlich den grundlegenden Unterschied zwischen Aktiva und Passiva in der Buchführung.',
      musterlosung: 'Keine relevante Antwort.',
      thema: 'Bilanzierung',
    })
    // fragetext ist > 80 Zeichen → Titel endet vor 'Buchführung' → volltextMatch greift
    const treffer = indexFragenVolltext('buchführung', [frage])
    expect(treffer).toHaveLength(1)
    expect(treffer[0].subTitel).not.toBe('Bilanzierung')
    expect(treffer[0].subTitel!.toLowerCase()).toContain('buchf')
  })

  // Test 5: highlightStellen aus Snippet für Volltext, aus titel bei Titel-Match
  // Fragetext > 80 Zeichen damit volltextMatch greift (Titel enthält Suchbegriff nicht).
  it('highlightStellen referenzieren subTitel bei Volltext-Match', () => {
    const frage = makeFrage({
      fragetext:
        'Erkläre ausführlich den Unterschied zwischen Aktiva und Passiva in der Buchführung und erläutere mehr.',
      musterlosung: 'Keine relevante Antwort.',
    })
    const treffer = indexFragenVolltext('buchführung', [frage])
    expect(treffer).toHaveLength(1)
    const hlStellen = treffer[0].highlightStellen ?? []
    // Bei volltextMatch: highlightStellen werden aus snippet/subTitel berechnet
    const subTitelStellen = hlStellen.filter(h => h.feld === 'subTitel')
    expect(subTitelStellen.length).toBeGreaterThan(0)
  })

  // Test 6: undefined musterlosung → kein Crash
  it('undefined musterlosung → kein Crash, trotzdem match möglich', () => {
    const frage = {
      ...makeFrage({
        fragetext: 'Was ist der Unterschied zwischen Soll und Haben?',
        thema: 'Buchführung',
      }),
      musterlosung: undefined,
    } as unknown as Frage /* Defensive: erzwingt musterlosung=undefined gegen Core-Type */

    expect(() => indexFragenVolltext('soll', [frage])).not.toThrow()
    const treffer = indexFragenVolltext('soll', [frage])
    // fragetext > 80 Zeichen ist hier nicht der Fall (45 Zeichen) — titel === fragetext.
    // Query "soll" matcht im titel → genau 1 Treffer, subTitel = thema (kein Crash bei undefined musterlosung).
    expect(treffer).toHaveLength(1)
    expect(treffer[0].subTitel).toBe('Buchführung')
  })

  // Test 7: Tag-Match funktioniert (Verhaltensparität mit indexFragen, Store leer → kein Match)
  it('Tag-Match via tagIds: bei leerem Store kein treffer auf tag-Text', () => {
    const frage = makeFrage({
      fragetext: 'Allgemeine Frage ohne relevante Keywords.',
      tagIds: ['tag-xyz'],
    })
    // tagsStore ist in Tests nicht gemockt → tagNamenFuerFrage gibt [] zurück
    const treffer = indexFragenVolltext('tag-xyz', [frage])
    // Kein Match erwartet, da tag-Namen nicht aufgelöst werden
    expect(treffer).toHaveLength(0)
  })

  // Test 8: Thema-Match funktioniert
  it('Thema-Match: matched auf thema-Feld', () => {
    const frage = makeFrage({
      fragetext: 'Eine neutrale Frage ohne besondere Keywords.',
      musterlosung: 'Neutrale Antwort.',
      thema: 'Rechnungswesen',
    })
    const treffer = indexFragenVolltext('rechnungswesen', [frage])
    expect(treffer).toHaveLength(1)
    expect(treffer[0].quelle).toBe('frage')
  })

  // Test 9: leeres Array → leeres Ergebnis
  it('leeres fragen-Array → leeres Ergebnis', () => {
    expect(indexFragenVolltext('bilanz', [])).toEqual([])
  })

  // Test 10: Query matcht kein Feld → leeres Ergebnis
  it('Query ohne Match → leeres Ergebnis', () => {
    const frage = makeFrage({
      fragetext: 'Was ist eine Bilanz?',
      musterlosung: 'Eine Bilanz zeigt die Vermögenslage.',
      thema: 'Rechnungswesen',
    })
    expect(indexFragenVolltext('xyz987ohneTreffer', [frage])).toEqual([])
  })

  // Spawn-Task 1 (18.05.2026): AufgabengruppeFrage.kontext als 4. Fallback in fragetextVonFrage.
  it('AufgabengruppeFrage: kontext-Feld wird als Volltext indiziert', () => {
    const aufgabengruppe = {
      id: 'agf-001',
      typ: 'aufgabengruppe',
      fachbereich: 'WR',
      fach: 'BWL',
      thema: 'Fall',
      bloom: 'K3',
      punkte: 5,
      semester: [],
      gefaesse: [],
      bewertungsraster: [],
      verwendungen: [],
      tagIds: [],
      // Query "Liquiditätssituation" muss > Position 77 stehen, damit titel-Truncation
      // (slice 0,77) das Wort NICHT enthält und der Volltext-Branch greift.
      kontext:
        'Lange Fallbeschreibung mit relevanten Sachverhalten einer Aktiengesellschaft, die zentralen Punkten der Liquiditätssituation und der angemessenen Kapitalstruktur betrachten lässt.',
      teilaufgaben: [],
      erstelltAm: '2026-05-18',
      geaendertAm: '2026-05-18',
      status: 'aktiv',
    } as unknown as Frage /* Defensive: AufgabengruppeFrage hat optionale Core-Felder, die im Test-Stub fehlen */
    const treffer = indexFragenVolltext('Liquiditätssituation', [aufgabengruppe])
    expect(treffer).toHaveLength(1)
    expect(treffer[0].subTitel).toBeDefined()
    expect(treffer[0].subTitel!.toLowerCase()).toContain('liquidität')
  })
})
