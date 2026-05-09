import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ladeHistorie, speichereHistorie, HISTORIE_KEY, MAX_HISTORIE, type GespeichertesErgebnis } from './historie'

function mkErgebnis(id: string): GespeichertesErgebnis {
  return {
    sessionId: id,
    fach: 'BWL',
    thema: 'Test',
    datum: '2026-05-08T10:00:00.000Z',
    anzahlFragen: 5,
    richtig: 3,
    quote: 60,
    dauer: 12345,
    details: [],
  }
}

describe('historie', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('ladeHistorie', () => {
    it('Test 1: ohne localStorage-Eintrag → []', () => {
      expect(ladeHistorie()).toEqual([])
    })

    it('Test 2: mit korruptem JSON → [] (catch-Pfad)', () => {
      localStorage.setItem(HISTORIE_KEY, '{not valid json')
      expect(ladeHistorie()).toEqual([])
    })

    it('Test 3: mit gültigem JSON-Array → parsed', () => {
      const erg = [mkErgebnis('a'), mkErgebnis('b')]
      localStorage.setItem(HISTORIE_KEY, JSON.stringify(erg))
      expect(ladeHistorie()).toEqual(erg)
    })

    it('Test 3b: mit `null`-JSON → [] (Defensiv-Check)', () => {
      localStorage.setItem(HISTORIE_KEY, 'null')
      expect(ladeHistorie()).toEqual([])
    })

    it('Test 3c: mit Objekt-JSON statt Array → [] (Defensiv-Check)', () => {
      localStorage.setItem(HISTORIE_KEY, '{"foo":"bar"}')
      expect(ladeHistorie()).toEqual([])
    })
  })

  describe('speichereHistorie', () => {
    it('Test 4: trimt auf MAX_HISTORIE (50) Einträge', () => {
      const big = Array.from({ length: 51 }, (_, i) => mkErgebnis(`s${i}`))
      speichereHistorie(big)
      const stored = JSON.parse(localStorage.getItem(HISTORIE_KEY) ?? '[]')
      expect(stored).toHaveLength(MAX_HISTORIE)
      expect(stored[0].sessionId).toBe('s0')
      expect(stored[49].sessionId).toBe('s49')
    })

    it('Test 5: localStorage-Quota-Error → silent (catch)', () => {
      const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError')
      })
      expect(() => speichereHistorie([mkErgebnis('a')])).not.toThrow()
      expect(spy).toHaveBeenCalled()
    })
  })
})
