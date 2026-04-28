import { describe, it, expect } from 'vitest'
import { anzahlOffeneLuecken, alleLueckenGefuellt } from './lueckentextChecks'
import type { Frage } from '../../types/fragen'
import type { Antwort } from '../../types/antworten'

const baseMeta = {
  id: 'q1',
  version: 1,
  erstelltAm: '2026-01-01T00:00:00Z',
  geaendertAm: '2026-01-01T00:00:00Z',
  fachbereich: 'BWL' as const,
  fach: 'BWL',
  thema: 'Test',
  semester: [],
  gefaesse: [],
  bloom: 'K2' as const,
  tags: [],
  punkte: 1,
  musterlosung: '',
  bewertungsraster: [],
  verwendungen: [],
}

function ltFrage(luecken: { id: string }[]): Frage {
  return {
    ...baseMeta,
    typ: 'lueckentext',
    fragetext: 'F?',
    textMitLuecken: 'A {0} B',
    luecken: luecken.map(l => ({
      id: l.id,
      korrekteAntworten: ['x'],
      caseSensitive: false,
    })),
  } as Frage
}

function mcFrage(): Frage {
  return {
    ...baseMeta,
    typ: 'mc',
    fragetext: 'F?',
    optionen: [{ id: 'a', text: 'A' }],
    korrekteOptionen: ['a'],
    mehrfachauswahl: false,
    zufallsreihenfolge: false,
  } as unknown as Frage
}

describe('anzahlOffeneLuecken', () => {
  it('nicht-Lückentext-Frage → 0 (alleLueckenGefuellt = true)', () => {
    const f = mcFrage()
    expect(anzahlOffeneLuecken(f, null)).toBe(0)
    expect(alleLueckenGefuellt(f, null)).toBe(true)
  })

  it('Lückentext mit 0 Lücken → 0 offen', () => {
    const f = ltFrage([])
    expect(anzahlOffeneLuecken(f, null)).toBe(0)
    expect(alleLueckenGefuellt(f, null)).toBe(true)
  })

  it('Lückentext mit 3 Lücken, antwort=null → 3 offen', () => {
    const f = ltFrage([{ id: 'l0' }, { id: 'l1' }, { id: 'l2' }])
    expect(anzahlOffeneLuecken(f, null)).toBe(3)
    expect(alleLueckenGefuellt(f, null)).toBe(false)
  })

  it('Lückentext mit 3 Lücken, eingaben für 1 → 2 offen', () => {
    const f = ltFrage([{ id: 'l0' }, { id: 'l1' }, { id: 'l2' }])
    const antwort: Antwort = { typ: 'lueckentext', eintraege: { l0: 'foo' } }
    expect(anzahlOffeneLuecken(f, antwort)).toBe(2)
    expect(alleLueckenGefuellt(f, antwort)).toBe(false)
  })

  it('alle Lücken gefüllt → alleLueckenGefuellt=true', () => {
    const f = ltFrage([{ id: 'l0' }, { id: 'l1' }])
    const antwort: Antwort = {
      typ: 'lueckentext',
      eintraege: { l0: 'foo', l1: 'bar' },
    }
    expect(anzahlOffeneLuecken(f, antwort)).toBe(0)
    expect(alleLueckenGefuellt(f, antwort)).toBe(true)
  })

  it('whitespace-only zählt als leer', () => {
    const f = ltFrage([{ id: 'l0' }, { id: 'l1' }])
    const antwort: Antwort = {
      typ: 'lueckentext',
      eintraege: { l0: 'foo', l1: '   ' },
    }
    expect(anzahlOffeneLuecken(f, antwort)).toBe(1)
    expect(alleLueckenGefuellt(f, antwort)).toBe(false)
  })

  it('falsche Antwort-Typ → alle Lücken gelten als offen', () => {
    const f = ltFrage([{ id: 'l0' }, { id: 'l1' }])
    const antwort: Antwort = { typ: 'mc', gewaehlteOptionen: [] }
    expect(anzahlOffeneLuecken(f, antwort)).toBe(2)
  })
})
