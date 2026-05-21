import { describe, it, expect } from 'vitest'
import { mergeFortschritte } from './fortschrittMerge'
import type { FragenFortschritt } from '../../types/ueben/fortschritt'

const fp = (override: Partial<FragenFortschritt> = {}): FragenFortschritt => ({
  fragenId: 'f1',
  email: 'kind@x',
  versuche: 1,
  richtig: 1,
  richtigInFolge: 1,
  sessionIds: ['s1'],
  letzterVersuch: '2026-05-01T10:00:00Z',
  mastery: 'ueben',
  ...override,
})

describe('mergeFortschritte', () => {
  it('Backend mit mehr Versuchen gewinnt über lokal', () => {
    const lokal = { f1: fp({ fragenId: 'f1', versuche: 2, mastery: 'ueben' }) }
    const backend = [fp({ fragenId: 'f1', versuche: 5, mastery: 'gemeistert' })]
    const merged = mergeFortschritte(lokal, backend)
    expect(merged.f1.versuche).toBe(5)
    expect(merged.f1.mastery).toBe('gemeistert')
  })

  it('lokal mit mehr Versuchen gewinnt über Backend (un-gesyncte Antworten)', () => {
    const lokal = { f1: fp({ fragenId: 'f1', versuche: 7 }) }
    const backend = [fp({ fragenId: 'f1', versuche: 4 })]
    const merged = mergeFortschritte(lokal, backend)
    expect(merged.f1.versuche).toBe(7)
  })

  it('bei gleicher Versuchszahl gewinnt das Backend (autoritativ)', () => {
    const lokal = { f1: fp({ fragenId: 'f1', versuche: 3, mastery: 'ueben' }) }
    const backend = [fp({ fragenId: 'f1', versuche: 3, mastery: 'gefestigt' })]
    const merged = mergeFortschritte(lokal, backend)
    expect(merged.f1.mastery).toBe('gefestigt')
  })

  it('Frage nur lokal vorhanden → bleibt erhalten', () => {
    const lokal = { f1: fp({ fragenId: 'f1', versuche: 2 }) }
    const merged = mergeFortschritte(lokal, [])
    expect(merged.f1).toBeDefined()
    expect(merged.f1.versuche).toBe(2)
  })

  it('Frage nur im Backend vorhanden → wird übernommen', () => {
    const backend = [fp({ fragenId: 'fNeu', versuche: 3 })]
    const merged = mergeFortschritte({}, backend)
    expect(merged.fNeu).toBeDefined()
    expect(merged.fNeu.versuche).toBe(3)
  })

  it('mehrere Fragen werden unabhängig gemerged', () => {
    const lokal = {
      f1: fp({ fragenId: 'f1', versuche: 9 }),
      f2: fp({ fragenId: 'f2', versuche: 1 }),
    }
    const backend = [
      fp({ fragenId: 'f1', versuche: 3 }),
      fp({ fragenId: 'f2', versuche: 6 }),
    ]
    const merged = mergeFortschritte(lokal, backend)
    expect(merged.f1.versuche).toBe(9)
    expect(merged.f2.versuche).toBe(6)
  })

  it('mutiert das übergebene lokale Objekt nicht', () => {
    const lokal = { f1: fp({ fragenId: 'f1', versuche: 2 }) }
    mergeFortschritte(lokal, [fp({ fragenId: 'f1', versuche: 5 })])
    expect(lokal.f1.versuche).toBe(2)
  })
})
