import { describe, it, expect } from 'vitest'
import { filterMeldungen, priorisiereDeepLink } from './filterLogik'
import type { Problemmeldung } from '../../../types/problemmeldung'

const base: Problemmeldung = {
  id: 'x', zeitstempel: '2026-04-23T10:00:00Z', typ: 'problem', category: 'Fachlicher Fehler',
  comment: '', rolle: 'lp', frageId: '', frageText: '', frageTyp: '', modus: '',
  pruefungId: '', gruppeId: '', ort: 'dashboard', appVersion: '', inhaberEmail: '',
  inhaberAktiv: true, istPoolFrage: false, recht: 'betrachter', erledigt: false,
}

describe('filterMeldungen', () => {
  const m = (patch: Partial<Problemmeldung>): Problemmeldung => ({ ...base, ...patch })

  it('Status Offen filtert erledigte raus', () => {
    const input = [m({ id: 'a', erledigt: false }), m({ id: 'b', erledigt: true })]
    expect(filterMeldungen(input, { status: 'offen', typ: 'alle', nurMeine: false }).map(x => x.id)).toEqual(['a'])
  })
  it('Status Erledigt filtert offene raus', () => {
    const input = [m({ id: 'a', erledigt: false }), m({ id: 'b', erledigt: true })]
    expect(filterMeldungen(input, { status: 'erledigt', typ: 'alle', nurMeine: false }).map(x => x.id)).toEqual(['b'])
  })
  it('Status Alle lässt alle durch', () => {
    const input = [m({ id: 'a', erledigt: false }), m({ id: 'b', erledigt: true })]
    expect(filterMeldungen(input, { status: 'alle', typ: 'alle', nurMeine: false })).toHaveLength(2)
  })
  it('Typ problem filtert Wünsche raus', () => {
    const input = [m({ id: 'a', typ: 'problem' }), m({ id: 'b', typ: 'wunsch' })]
    expect(filterMeldungen(input, { status: 'alle', typ: 'problem', nurMeine: false }).map(x => x.id)).toEqual(['a'])
  })
  it('nurMeine filtert auf recht=inhaber', () => {
    const input = [m({ id: 'a', recht: 'inhaber' }), m({ id: 'b', recht: 'betrachter' })]
    expect(filterMeldungen(input, { status: 'alle', typ: 'alle', nurMeine: true }).map(x => x.id)).toEqual(['a'])
  })
})

describe('priorisiereDeepLink', () => {
  const m = (patch: Partial<Problemmeldung>): Problemmeldung => ({ ...base, ...patch })

  it('frageId hat höchste Priorität', () => {
    expect(priorisiereDeepLink(m({ frageId: 'f1', pruefungId: 'p1' }))).toEqual({ art: 'frage', id: 'f1' })
  })
  it('pruefungId > gruppeId > ort', () => {
    expect(priorisiereDeepLink(m({ pruefungId: 'p1', gruppeId: 'g1' }))).toEqual({ art: 'pruefung', id: 'p1' })
    expect(priorisiereDeepLink(m({ gruppeId: 'g1' }))).toEqual({ art: 'gruppe', id: 'g1' })
    expect(priorisiereDeepLink(m({ ort: 'dashboard' }))).toEqual({ art: 'ort', id: 'dashboard' })
  })
  it('Pool-Frage liefert kein Ziel (Deep-Link deaktiviert)', () => {
    expect(priorisiereDeepLink(m({ frageId: 'f1', istPoolFrage: true, ort: '' }))).toBeNull()
  })
  it('Pool-Frage mit zusätzlicher Prüfungs-ID fällt auf Prüfung zurück', () => {
    expect(priorisiereDeepLink(m({ frageId: 'f1', istPoolFrage: true, pruefungId: 'p1' }))).toEqual({ art: 'pruefung', id: 'p1' })
  })
  it('Alle Felder leer liefert null', () => {
    expect(priorisiereDeepLink(m({ ort: '' }))).toBeNull()
  })
})
