import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { Frage } from '../../types/ueben/fragen'
import type { FragenFortschritt } from '../../types/ueben/fortschritt'

vi.mock('./blockBuilder', () => ({
  erstelleBlock: vi.fn(),
  erstelleMixBlock: vi.fn(),
  erstelleRepetitionsBlock: vi.fn(),
}))
vi.mock('./mastery', () => ({
  istDauerbaustelle: vi.fn(),
}))

import { erstelleSessionBlock } from './sessionBlockBau'
import { erstelleBlock, erstelleMixBlock, erstelleRepetitionsBlock } from './blockBuilder'
import { istDauerbaustelle } from './mastery'

const mkFrage = (id: string): Frage => ({
  id,
  typ: 'mc',
  frage: 'Test',
  fachbereich: 'wr',
} as unknown as Frage)

const mkFortschritt = (overrides: Partial<FragenFortschritt> = {}): FragenFortschritt => ({
  fragenId: 'q1',
  email: 'test@example.com',
  versuche: 0,
  richtig: 0,
  richtigInFolge: 0,
  sessionIds: [],
  letzterVersuch: '',
  mastery: 'neu',
  ...overrides,
})

describe('erstelleSessionBlock', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(erstelleBlock).mockReturnValue([mkFrage('q1')])
    vi.mocked(erstelleMixBlock).mockReturnValue([mkFrage('q2')])
    vi.mocked(erstelleRepetitionsBlock).mockReturnValue([mkFrage('q3')])
    vi.mocked(istDauerbaustelle).mockReturnValue(false)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('modus=standard ruft erstelleBlock mit thema und mastery', () => {
    const fragen = [mkFrage('q1')]
    erstelleSessionBlock({
      alleFragen: fragen,
      fach: 'wr',
      thema: 'Doppelte-Buchhaltung',
      modus: 'standard',
      quellen: undefined,
      fortschritte: { q1: mkFortschritt({ fragenId: 'q1', mastery: 'gefestigt' }) },
    })
    expect(erstelleBlock).toHaveBeenCalledWith(
      fragen,
      'Doppelte-Buchhaltung',
      { mastery: { q1: 'gefestigt' } },
    )
  })

  it('modus=mix mit quellen ruft erstelleMixBlock', () => {
    const fragen = [mkFrage('q1')]
    erstelleSessionBlock({
      alleFragen: fragen,
      fach: 'wr',
      thema: 'Mix',
      modus: 'mix',
      quellen: [{ fach: 'wr', thema: 'A' }],
      fortschritte: {},
    })
    expect(erstelleMixBlock).toHaveBeenCalled()
    expect(erstelleBlock).not.toHaveBeenCalled()
  })

  it('modus=repetition mit Dauerbaustelle propagiert ID in dauerBau-Set', () => {
    const fragen = [mkFrage('q1'), mkFrage('q2')]
    vi.mocked(istDauerbaustelle).mockImplementation((versuche: number, _richtig: number) => versuche >= 5)
    erstelleSessionBlock({
      alleFragen: fragen,
      fach: 'wr',
      thema: 'Rep',
      modus: 'repetition',
      quellen: undefined,
      fortschritte: {
        q1: mkFortschritt({ fragenId: 'q1', versuche: 5, richtig: 1 }),
        q2: mkFortschritt({ fragenId: 'q2', versuche: 1, richtig: 1 }),
      },
    })
    expect(erstelleRepetitionsBlock).toHaveBeenCalled()
    const aufruf = vi.mocked(erstelleRepetitionsBlock).mock.calls[0]
    const dauerBau = aufruf[2] as Set<string>
    expect(dauerBau.has('q1')).toBe(true)
    expect(dauerBau.has('q2')).toBe(false)
  })

  it('modus=repetition ohne Dauerbaustellen ruft erstelleRepetitionsBlock mit leerem Set', () => {
    erstelleSessionBlock({
      alleFragen: [mkFrage('q1')],
      fach: 'wr',
      thema: 'Rep',
      modus: 'repetition',
      quellen: undefined,
      fortschritte: { q1: mkFortschritt({ fragenId: 'q1', versuche: 1, richtig: 1 }) },
    })
    const aufruf = vi.mocked(erstelleRepetitionsBlock).mock.calls[0]
    const dauerBau = aufruf[2] as Set<string>
    expect(dauerBau.size).toBe(0)
  })

  it('mastery-Map wird aus fortschritte gefüllt; fehlende IDs default neu', () => {
    const fragen = [mkFrage('q1'), mkFrage('q2')]
    const result = erstelleSessionBlock({
      alleFragen: fragen,
      fach: 'wr',
      thema: 'X',
      modus: 'standard',
      quellen: undefined,
      fortschritte: { q1: mkFortschritt({ fragenId: 'q1', mastery: 'gemeistert' }) },
    })
    expect(result.mastery).toEqual({ q1: 'gemeistert', q2: 'neu' })
  })

  it('leere alleFragen liefert leeren Block + leere mastery-Map', () => {
    vi.mocked(erstelleBlock).mockReturnValue([])
    const result = erstelleSessionBlock({
      alleFragen: [],
      fach: 'wr',
      thema: 'X',
      modus: 'standard',
      quellen: undefined,
      fortschritte: {},
    })
    expect(result.block).toEqual([])
    expect(result.mastery).toEqual({})
  })
})
