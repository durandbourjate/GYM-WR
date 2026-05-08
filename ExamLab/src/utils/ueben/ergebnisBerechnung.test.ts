import { describe, it, expect, vi } from 'vitest'
import { berechneErgebnis } from './ergebnisBerechnung'
import type { Frage } from '../../types/ueben/fragen'
import type { UebungsSession } from '../../types/ueben/uebung'

function mkFrage(id: string): Frage {
  return { id, typ: 'mc', frage: `Q${id}`, fachbereich: 'BWL', musterlosung: `M${id}` } as unknown as Frage
}

function erzeugeSession(opts: {
  fragen?: Frage[]
  ergebnisse?: Record<string, boolean>
  unsicher?: Set<string>
  uebersprungen?: Set<string>
  gestartet?: string
  beendet?: string
}): UebungsSession {
  return {
    id: 's_test',
    gruppeId: 'g',
    email: 'sus@gymhof.ch',
    fach: 'BWL',
    thema: 'T',
    modus: 'standard',
    quellen: undefined,
    fragen: opts.fragen ?? [],
    antworten: {},
    ergebnisse: opts.ergebnisse ?? {},
    aktuelleFrageIndex: 0,
    gestartet: opts.gestartet ?? '2026-05-08T10:00:00.000Z',
    unsicher: opts.unsicher ?? new Set(),
    uebersprungen: opts.uebersprungen ?? new Set(),
    score: 0,
    freiwillig: false,
    beendet: opts.beendet,
  } as UebungsSession
}

describe('berechneErgebnis', () => {
  it('Test 1: null-Session → Default-SessionErgebnis', () => {
    expect(berechneErgebnis(null)).toEqual({
      sessionId: '', anzahlFragen: 0, richtig: 0, falsch: 0, quote: 0, dauer: 0, details: [],
    })
  })

  it('Test 2: leere fragen → quote = 0 (Div-by-zero-Branch)', () => {
    const erg = berechneErgebnis(erzeugeSession({ fragen: [] }))
    expect(erg.quote).toBe(0)
    expect(erg.anzahlFragen).toBe(0)
    expect(erg.details).toEqual([])
  })

  it('Test 3: alle korrekt → quote 100, richtig=N, falsch=0', () => {
    const fragen = [mkFrage('a'), mkFrage('b'), mkFrage('c')]
    const ergebnisse = { a: true, b: true, c: true }
    const erg = berechneErgebnis(erzeugeSession({ fragen, ergebnisse }))
    expect(erg.richtig).toBe(3)
    expect(erg.falsch).toBe(0)
    expect(erg.quote).toBe(100)
  })

  it('Test 4: Mix 1 von 3 → quote ≈ 33.33', () => {
    const fragen = [mkFrage('a'), mkFrage('b'), mkFrage('c')]
    const ergebnisse = { a: true, b: false, c: false }
    const erg = berechneErgebnis(erzeugeSession({ fragen, ergebnisse }))
    expect(erg.richtig).toBe(1)
    expect(erg.falsch).toBe(2)
    expect(erg.quote).toBeCloseTo(33.33, 1)
  })

  it('Test 5: Übersprungene Frage zählt nicht als falsch', () => {
    const fragen = [mkFrage('a'), mkFrage('b'), mkFrage('c')]
    const ergebnisse = { a: true, b: false, c: false }
    const uebersprungen = new Set(['c'])
    const erg = berechneErgebnis(erzeugeSession({ fragen, ergebnisse, uebersprungen }))
    expect(erg.richtig).toBe(1)
    expect(erg.falsch).toBe(1)  // nur 'b' zählt als falsch, 'c' ist übersprungen
  })

  it('Test 6: unsicher- und uebersprungen-Sets werden in details propagiert', () => {
    const fragen = [mkFrage('a'), mkFrage('b')]
    const ergebnisse = { a: true, b: false }
    const unsicher = new Set(['a'])
    const uebersprungen = new Set(['b'])
    const erg = berechneErgebnis(erzeugeSession({ fragen, ergebnisse, unsicher, uebersprungen }))
    expect(erg.details[0]).toMatchObject({ frageId: 'a', unsicher: true, uebersprungen: false })
    expect(erg.details[1]).toMatchObject({ frageId: 'b', unsicher: false, uebersprungen: true })
  })

  it('Test 7: dauer-Berechnung beendet vs. nicht-beendet', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-08T10:00:30.000Z'))
    try {
      const fragen = [mkFrage('a')]
      // Variante A: nicht beendet — dauer = Date.now() - gestartet
      const ohneEnde = berechneErgebnis(erzeugeSession({
        fragen, ergebnisse: { a: true }, gestartet: '2026-05-08T10:00:00.000Z',
      }))
      expect(ohneEnde.dauer).toBe(30_000)
      // Variante B: beendet — dauer = beendet - gestartet
      const mitEnde = berechneErgebnis(erzeugeSession({
        fragen, ergebnisse: { a: true },
        gestartet: '2026-05-08T10:00:00.000Z',
        beendet: '2026-05-08T10:00:25.000Z',
      }))
      expect(mitEnde.dauer).toBe(25_000)
    } finally {
      vi.useRealTimers()
    }
  })
})
