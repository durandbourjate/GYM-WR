import { describe, it, expect } from 'vitest'

/**
 * Invariante: Eine SuS-Response von lernplattformLadeFragen darf KEINES der Lösungsfelder enthalten.
 * Dieser Test mockt eine Response-Payload wie sie vom Backend kommt und prüft, dass
 * kein Feld aus der Sperrliste erscheint.
 */
const SPERRLISTE = [
  'musterlosung', 'bewertungsraster',
  'korrekt', 'korrekteAntworten', 'toleranz',
  'erklaerung', 'sollKonto', 'habenKonto', 'korrektBuchung',
  'sollEintraege', 'habenEintraege',
]

function hatSperrfeld(obj: unknown, pfad: string[] = []): string | null {
  if (obj === null || typeof obj !== 'object') return null
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      const hit = hatSperrfeld(obj[i], [...pfad, `[${i}]`])
      if (hit) return hit
    }
    return null
  }
  for (const key of Object.keys(obj)) {
    if (SPERRLISTE.includes(key)) return [...pfad, key].join('.')
    const hit = hatSperrfeld((obj as Record<string, unknown>)[key], [...pfad, key])
    if (hit) return hit
  }
  return null
}

describe('Security-Invariant: SuS-Response hat keine Lösungsfelder', () => {
  it('Mock-Response passt Invariante', () => {
    const saubereResponse = {
      success: true,
      data: [
        { id: 'f1', typ: 'mc', fragetext: '?', optionen: [{ id: 'o1', text: 'A' }, { id: 'o2', text: 'B' }] },
        { id: 'f2', typ: 'richtigfalsch', fragetext: '?', aussagen: [{ id: 'a1', text: 'X' }] },
        { id: 'f3', typ: 'sortierung', fragetext: '?', elemente: ['x', 'y', 'z'] },
        { id: 'f4', typ: 'zuordnung', fragetext: '?', linksItems: [], rechtsItems: [] },
        { id: 'f5', typ: 'lueckentext', fragetext: '?', textMitLuecken: '...', luecken: [{ id: 'l1' }] },
      ],
    }
    expect(hatSperrfeld(saubereResponse)).toBeNull()
  })

  it('erkennt Leak von korrekt', () => {
    const leak = { data: [{ optionen: [{ id: 'o1', korrekt: true }] }] }
    expect(hatSperrfeld(leak)).toBe('data.[0].optionen.[0].korrekt')
  })

  it('erkennt Leak von musterlosung', () => {
    const leak = { data: [{ musterlosung: 'X' }] }
    expect(hatSperrfeld(leak)).toBe('data.[0].musterlosung')
  })
})
