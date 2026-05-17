import { describe, it, expect } from 'vitest'
import { normalizeForSuche, scoreFromMatch, findeHighlightStellen, gruppiereUndLimitiere, fuehreSucheAus, levenshtein } from './sucheEngine'
import type { SucheTreffer, SucheIndex } from '../types/suche'
import { SCORE_BOUNDS } from '../types/suche'
import type { TabDefinition } from './tabRegistry'
import type { Frage } from '../types/fragen-storage'

describe('normalizeForSuche', () => {
  it('lowercase', () => {
    expect(normalizeForSuche('Bilanz')).toBe('bilanz')
  })

  it('deutsche Ersatzregel: ä/ö/ü/ß → ae/oe/ue/ss', () => {
    expect(normalizeForSuche('Übung')).toBe('uebung')
    expect(normalizeForSuche('Schäfer')).toBe('schaefer')
    expect(normalizeForSuche('für')).toBe('fuer')
    expect(normalizeForSuche('Straße')).toBe('strasse')
  })

  it('NFD-Diakritik-Entfernung (französische Akzente)', () => {
    expect(normalizeForSuche('café')).toBe('cafe')
    expect(normalizeForSuche('señor')).toBe('senor')
  })

  it('preserves base ASCII', () => {
    expect(normalizeForSuche('hello world')).toBe('hello world')
  })

  it('handles empty', () => {
    expect(normalizeForSuche('')).toBe('')
  })

  it('preserves spaces and punctuation', () => {
    expect(normalizeForSuche('Frage 5: BWL')).toBe('frage 5: bwl')
  })
})

describe('scoreFromMatch', () => {
  it('Titel-Prefix = 100', () => {
    expect(scoreFromMatch('bilanz analyse', 'bilanz', 'titel')).toBe(100)
  })

  it('Titel-Substring = 70', () => {
    expect(scoreFromMatch('eine bilanz analyse', 'bilanz', 'titel')).toBe(70)
  })

  it('ID-Exact = 95', () => {
    expect(scoreFromMatch('frg-123', 'frg-123', 'id')).toBe(95)
  })

  it('Tag/Thema = 50', () => {
    expect(scoreFromMatch('Eigenkapital, Bilanz', 'bilanz', 'tag')).toBe(50)
  })

  it('Subtitel = 30', () => {
    expect(scoreFromMatch('Klasse 29c · 25.06', 'klasse', 'subTitel')).toBe(30)
  })

  it('No match = 0', () => {
    expect(scoreFromMatch('foo', 'bar', 'titel')).toBe(0)
  })

  it('deutsche Ersatzregel match (uebung findet Übung)', () => {
    expect(scoreFromMatch('Übung', 'uebung', 'titel')).toBe(100)
    expect(scoreFromMatch('Übung', 'Übung', 'titel')).toBe(100)
  })
})

describe('findeHighlightStellen', () => {
  it('findet erste Stelle', () => {
    expect(findeHighlightStellen('bilanz analyse', 'bilanz', 'titel')).toEqual([
      { start: 0, end: 6, feld: 'titel' },
    ])
  })

  it('mehrere Stellen', () => {
    const stellen = findeHighlightStellen('bilanz und bilanz', 'bilanz', 'titel')
    expect(stellen).toHaveLength(2)
    expect(stellen[0]).toEqual({ start: 0, end: 6, feld: 'titel' })
    expect(stellen[1]).toEqual({ start: 11, end: 17, feld: 'titel' })
  })

  it('case-insensitiv', () => {
    expect(findeHighlightStellen('Bilanz', 'bilanz', 'titel')).toEqual([
      { start: 0, end: 6, feld: 'titel' },
    ])
  })

  it('Diakritik-Ersatz-Match liefert keine Highlight-Stellen (Strings sind nicht Substring-gleich)', () => {
    // "uebung" matched "Übung" via normalizeForSuche fuer Score, aber Original-Substring-Suche findet nichts.
    expect(findeHighlightStellen('Übung 1', 'uebung', 'titel')).toEqual([])
  })

  it('exakter Substring-Match auch mit Diakritik (Übung mit needle Übung)', () => {
    expect(findeHighlightStellen('Übung 1', 'Übung', 'titel')).toEqual([{ start: 0, end: 5, feld: 'titel' }])
  })

  it('keine Stelle bei no-match', () => {
    expect(findeHighlightStellen('foo', 'bar', 'titel')).toEqual([])
  })
})

const trefferStub = (q: SucheTreffer['quelle'], id: string, score: number, titel = id): SucheTreffer => ({
  quelle: q, id, titel, score, navigation: { route: '/' },
})

describe('gruppiereUndLimitiere', () => {
  it('limitiert auf 5 pro Quelle', () => {
    const treffer = Array.from({ length: 8 }, (_, i) => trefferStub('frage', `f${i}`, 70))
    const ergebnis = gruppiereUndLimitiere(treffer, { maxProQuelle: 5 })
    expect(ergebnis.proQuelleSichtbar.frage).toBe(5)
    expect(ergebnis.proQuelleGesamt.frage).toBe(8)
    expect(ergebnis.treffer.filter(t => t.quelle === 'frage')).toHaveLength(5)
  })

  it('sortiert nach score absteigend', () => {
    const treffer = [
      trefferStub('frage', 'a', 50),
      trefferStub('frage', 'b', 100),
      trefferStub('frage', 'c', 70),
    ]
    const ergebnis = gruppiereUndLimitiere(treffer, { maxProQuelle: 5 })
    expect(ergebnis.treffer.map(t => t.id)).toEqual(['b', 'c', 'a'])
  })

  it('tie-break alphabetisch nach titel', () => {
    const treffer = [
      trefferStub('frage', 'a', 70, 'Zebra'),
      trefferStub('frage', 'b', 70, 'Apfel'),
    ]
    const ergebnis = gruppiereUndLimitiere(treffer, { maxProQuelle: 5 })
    expect(ergebnis.treffer.map(t => t.titel)).toEqual(['Apfel', 'Zebra'])
  })

  it('gemischte Quellen behalten ihre eigenen Limits', () => {
    const treffer = [
      ...Array.from({ length: 7 }, (_, i) => trefferStub('frage', `f${i}`, 50)),
      ...Array.from({ length: 3 }, (_, i) => trefferStub('kurs', `k${i}`, 60)),
    ]
    const ergebnis = gruppiereUndLimitiere(treffer, { maxProQuelle: 5 })
    expect(ergebnis.proQuelleGesamt.frage).toBe(7)
    expect(ergebnis.proQuelleSichtbar.frage).toBe(5)
    expect(ergebnis.proQuelleSichtbar.kurs).toBe(3)
  })

  it('leeres Input → LEERES_ERGEBNIS-Shape', () => {
    const ergebnis = gruppiereUndLimitiere([], { maxProQuelle: 5 })
    expect(ergebnis.treffer).toEqual([])
    expect(ergebnis.proQuelleGesamt.frage).toBe(0)
  })
})

function leererIndex(): SucheIndex {
  return {
    einstellungenTabs: [],
    hilfeTabs: [],
    kurse: [],
    schueler: [],    // NEU C.2
    pruefungen: [],
    uebungen: [],
    fragen: [],
  }
}

describe('fuehreSucheAus', () => {
  it('leere Query → keine Treffer', () => {
    expect(fuehreSucheAus('', leererIndex()).treffer).toEqual([])
  })

  it('1 Zeichen → leer', () => {
    expect(fuehreSucheAus('a', leererIndex()).treffer).toEqual([])
  })

  it('Multi-Quelle-Treffer', () => {
    const tab: TabDefinition = { id: 'profil', surface: 'einstellungen', titel: 'Profil', route: '/einstellungen/profil' }
    const index: SucheIndex = {
      ...leererIndex(),
      einstellungenTabs: [tab],
      kurse: [{ id: 'sf-profil-test', name: 'SF Profil Test', fach: 'BWL', fachschaft: 'WR', gefaess: 'SF', klassen: [] }],
    }
    const ergebnis = fuehreSucheAus('profil', index)
    expect(ergebnis.treffer.length).toBeGreaterThanOrEqual(2)
    expect(ergebnis.proQuelleGesamt['einstellungen-tab']).toBe(1)
    expect(ergebnis.proQuelleGesamt.kurs).toBe(1)
  })
})

describe('scoreFromMatch — Fuzzy-Fallback (C.5)', () => {
  it('liefert exact-Score wenn substring matched (Fuzzy nicht aktiv)', () => {
    // 'bilan' ist Substring von 'bilanz' → exact-Pfad → startsWith → TITEL_PREFIX
    expect(scoreFromMatch('Bilanz', 'bilan', 'titel')).toBe(SCORE_BOUNDS.TITEL_PREFIX)
  })
  it('liefert TITEL_SUBSTRING - 10 bei dist=1 titel', () => {
    // 'bilantz' gegen token 'bilanz' → dist=1 → 70 - 10 = 60
    expect(scoreFromMatch('Bilanz', 'bilantz', 'titel')).toBe(SCORE_BOUNDS.TITEL_SUBSTRING - 10)
  })
  it('liefert TITEL_SUBSTRING - 20 bei dist=2 titel', () => {
    // 'bilance' gegen token 'bilanz' → sub z→c + ins e = dist 2 → 70 - 20 = 50
    expect(scoreFromMatch('Bilanz', 'bilance', 'titel')).toBe(SCORE_BOUNDS.TITEL_SUBSTRING - 20)
  })
  it('liefert 0 bei dist >= 3 titel', () => {
    // 'xyzabc' gegen token 'bilanz' → dist=5 → kein Match
    expect(scoreFromMatch('Bilanz', 'xyzabc', 'titel')).toBe(0)
  })
  it('respektiert min-length 3 (kurze needle kein fuzzy)', () => {
    // 'ab' (2 chars) → kein Substring-Match + zu kurz für Fuzzy → 0
    expect(scoreFromMatch('Bilanz', 'ab', 'titel')).toBe(0)
  })
  it('fuzzy NICHT auf id-Feld (verworfen, würde Ranking verfälschen)', () => {
    expect(scoreFromMatch('abc-123', 'abc-124', 'id')).toBe(0)
  })
  it('fuzzy NICHT auf tag-Feld', () => {
    expect(scoreFromMatch('Konjunktur', 'konjuncture', 'tag')).toBe(0)
  })
  it('fuzzy NICHT auf subTitel-Feld', () => {
    expect(scoreFromMatch('Konjunktur', 'konjuncture', 'subTitel')).toBe(0)
  })
})

describe('fuehreSucheAus — Volltext (C.4)', () => {
  // Minimales Frage-Objekt für Volltext-Tests (nur benötigte Felder).
  // Defensive: Test-Stub hat nicht alle FrageBase-Pflichtfelder — as unknown as Frage ist sicher
  // weil indexFragenVolltext nur id, fragetext, musterlosung, tagIds, thema liest.
  function makeFrageVoll(id: string, fragetext: string, musterlosung = ''): Frage {
    return { id, typ: 'freitext', fragetext, musterlosung, tagIds: [] } as unknown as Frage /* Defensive: Test-Stub */
  }

  it('opts.volltext + index.fragenVoll → switcht zu indexFragenVolltext (findet Volltext-Treffer)', () => {
    // Fragetext > 80 Zeichen: langer Satz, Keyword am Ende (nicht im Summary-Titel)
    const langerText =
      'Diese Frage handelt von etwas sehr langem sodass der Titel abgeschnitten wird aber: EOSAKWORT'
    const index: SucheIndex = {
      ...leererIndex(),
      fragen: [], // Summary-Index leer → kein Treffer ohne Volltext
      fragenVoll: [makeFrageVoll('fv1', langerText)],
    }
    // Ohne opts.volltext: query matcht nur den gekürzten Titel (77 Zeichen) → kein Treffer
    const ohneVolltext = fuehreSucheAus('EOSAKWORT', index)
    expect(ohneVolltext.treffer).toHaveLength(0)

    // Mit opts.volltext: indexFragenVolltext sucht im vollen Text → Treffer
    const mitVolltext = fuehreSucheAus('EOSAKWORT', index, { volltext: true })
    expect(mitVolltext.treffer.length).toBeGreaterThanOrEqual(1)
    expect(mitVolltext.treffer[0].id).toBe('fv1')
  })

  it('opts.volltext enforces min-length=3 (query "ab" → leer, "abc" → Suche)', () => {
    const index: SucheIndex = {
      ...leererIndex(),
      fragenVoll: [makeFrageVoll('fv2', 'Eine Frage mit abc als Inhalt')],
    }
    // "ab" (2 Zeichen) → unter Volltext-MinLen 3 → LEERES_ERGEBNIS
    const kurzeQuery = fuehreSucheAus('ab', index, { volltext: true })
    expect(kurzeQuery.treffer).toHaveLength(0)

    // "abc" (3 Zeichen) → Suche läuft, Treffer gefunden
    const dreizeichen = fuehreSucheAus('abc', index, { volltext: true })
    expect(dreizeichen.treffer.length).toBeGreaterThanOrEqual(1)
  })

  it('opts.volltext aber index.fragenVoll fehlt → fällt zurück auf indexFragen (summary)', () => {
    const index: SucheIndex = {
      ...leererIndex(),
      fragen: [{ id: 'fs1', fragetext: 'Bilanzanalyse', tagIds: [] } as unknown as SucheIndex['fragen'][0]], /* Defensive: Test-Stub */
      // fragenVoll absichtlich nicht gesetzt (undefined)
    }
    const ergebnis = fuehreSucheAus('Bilanz', index, { volltext: true })
    // Sollte indexFragen verwenden und den Summary-Eintrag finden
    expect(ergebnis.treffer.length).toBeGreaterThanOrEqual(1)
    expect(ergebnis.treffer[0].id).toBe('fs1')
  })

  it('ohne opts → Verhalten unverändert, min-length=2 gilt weiterhin', () => {
    const index: SucheIndex = {
      ...leererIndex(),
      fragen: [{ id: 'fs2', fragetext: 'EK', tagIds: [] } as unknown as SucheIndex['fragen'][0]], /* Defensive: Test-Stub */
    }
    // 2-Zeichen-Query läuft ohne opts (normal mode min-length=2)
    const ergebnis = fuehreSucheAus('EK', index)
    // EK ist exakter Treffer auf Titel
    expect(ergebnis.treffer.length).toBeGreaterThanOrEqual(1)
  })
})

describe('levenshtein', () => {
  it('returns 0 for identical strings', () => {
    expect(levenshtein('bilanz', 'bilanz')).toBe(0)
  })
  it('returns length for empty input', () => {
    expect(levenshtein('', 'bilanz')).toBe(6)
    expect(levenshtein('bilanz', '')).toBe(6)
    expect(levenshtein('', '')).toBe(0)
  })
  it('handles single-char insertion (dist 1)', () => {
    expect(levenshtein('bilanz', 'bilanze')).toBe(1)
  })
  it('handles single-char deletion (dist 1)', () => {
    expect(levenshtein('bilantz', 'bilanz')).toBe(1)
  })
  it('handles single-char substitution (dist 1)', () => {
    expect(levenshtein('bilanz', 'bilanc')).toBe(1)
  })
  it('handles multi-char edit (dist 3: 1 sub + 2 ins)', () => {
    // bilanz → bilanc (sub z→c) → bilance (ins e) → bilancen (ins n) = 3
    expect(levenshtein('bilanz', 'bilancen')).toBe(3)
  })
  it('handles transposition as 2 edits', () => {
    expect(levenshtein('abc', 'bac')).toBe(2)
  })
  it('early-exit when length-diff > maxDist', () => {
    // Mit maxDist=2 sollte 'ab' vs 'abcdef' früh abbrechen (length-diff 4 > 2)
    expect(levenshtein('ab', 'abcdef', 2)).toBeGreaterThan(2)  // korrekt: 4
  })
  it('handles case-sensitive (caller normalizes)', () => {
    expect(levenshtein('Bilanz', 'bilanz')).toBe(1)  // 1 substitution
  })
  it('handles longer strings', () => {
    expect(levenshtein('konjunktur', 'konjunkturzyklus')).toBe(6)
  })
})
