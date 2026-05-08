import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { Frage } from '../../types/ueben/fragen'
import type { Antwort } from '../../types/antworten'
import type { UebungsSession } from '../../types/ueben/uebung'

vi.mock('./korrektur', () => ({
  pruefeAntwort: vi.fn(),
}))

import { pruefeClientseitig } from './pruefeClientseitig'
import { pruefeAntwort } from './korrektur'

const mkFrage = (overrides: Partial<Frage> = {}): Frage => ({
  id: 'q1',
  typ: 'mc',
  frage: 'Test',
  fachbereich: 'wr',
  ...overrides,
} as unknown as Frage)

const mkSession = (overrides: Partial<UebungsSession> = {}): UebungsSession => ({
  id: 's_test',
  gruppeId: 'g1',
  email: 'test@example.com',
  fach: 'wr',
  thema: 'X',
  modus: 'standard',
  quellen: undefined,
  fragen: [],
  antworten: {},
  ergebnisse: {},
  aktuelleFrageIndex: 0,
  gestartet: '2026-01-01T00:00:00.000Z',
  unsicher: new Set(),
  uebersprungen: new Set(),
  score: 5,
  freiwillig: false,
  ...overrides,
})

const mkMcAntwort = (gewaehlt: string[]): Antwort => ({ typ: 'mc', gewaehlteOptionen: gewaehlt })

describe('pruefeClientseitig', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(pruefeAntwort).mockReturnValue(true)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('korrekt=true: score wird incrementiert + ergebnisse[id]=true', () => {
    const session = mkSession({ score: 5 })
    const frage = mkFrage({ id: 'q1' })
    const antwort = mkMcAntwort(['a'])
    const result = pruefeClientseitig({ session, frage, normalized: antwort })
    expect(result.korrekt).toBe(true)
    expect(result.sessionUpdates.score).toBe(6)
    expect(result.sessionUpdates.ergebnisse).toEqual({ q1: true })
  })

  it('korrekt=false: score unverändert + ergebnisse[id]=false', () => {
    vi.mocked(pruefeAntwort).mockReturnValue(false)
    const session = mkSession({ score: 5 })
    const frage = mkFrage({ id: 'q1' })
    const antwort = mkMcAntwort(['a'])
    const result = pruefeClientseitig({ session, frage, normalized: antwort })
    expect(result.korrekt).toBe(false)
    expect(result.sessionUpdates.score).toBe(5)
    expect(result.sessionUpdates.ergebnisse).toEqual({ q1: false })
  })

  it('letzteMusterloesung übernommen aus frage.musterlosung', () => {
    const session = mkSession()
    const frage = mkFrage({ musterlosung: 'Antwort: A' } as unknown as Frage)
    const antwort = mkMcAntwort(['a'])
    const result = pruefeClientseitig({ session, frage, normalized: antwort })
    expect(result.letzteMusterloesung).toBe('Antwort: A')
  })

  it('letzteMusterloesung=null falls frage.musterlosung undefined', () => {
    const session = mkSession()
    const frage = mkFrage({ id: 'q1' })
    const antwort = mkMcAntwort(['a'])
    const result = pruefeClientseitig({ session, frage, normalized: antwort })
    expect(result.letzteMusterloesung).toBe(null)
  })

  it('sessionUpdates.antworten ist immutable (alte Antworten preserved)', () => {
    const altAntwort: Antwort = { typ: 'mc', gewaehlteOptionen: ['old'] }
    const session = mkSession({ antworten: { q0: altAntwort } })
    const frage = mkFrage({ id: 'q1' })
    const antwort = mkMcAntwort(['new'])
    const result = pruefeClientseitig({ session, frage, normalized: antwort })
    expect(result.sessionUpdates.antworten).toEqual({ q0: altAntwort, q1: antwort })
    // Original session.antworten unverändert
    expect(session.antworten).toEqual({ q0: altAntwort })
  })
})
