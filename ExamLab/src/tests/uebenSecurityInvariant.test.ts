import { describe, it, expect } from 'vitest'

/**
 * Invariante: Eine SuS-Response von uebenLadeFragen darf KEINES der Lösungsfelder enthalten.
 * Dieser Test mockt eine Response-Payload wie sie vom Backend kommt und prüft, dass
 * kein Feld aus der Sperrliste erscheint.
 */
const SPERRLISTE = [
  // Gemeinsam bei allen Fragetypen
  'musterlosung', 'bewertungsraster',
  // Typ-spezifische Lösungsfelder
  'korrekt', 'korrekteAntworten', 'toleranz',
  'erklaerung',
  // FiBu-Typen
  'sollKonto', 'habenKonto', 'korrektBuchung',
  'sollEintraege', 'habenEintraege', 'buchungen',
  'erwarteteAntworten', 'loesung',
  // Bildbeschriftung / DragDrop
  'zoneId', 'korrektesLabel',
  // Formel
  'korrekteFormel',
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
        { id: 'f4', typ: 'zuordnung', fragetext: '?', paare: [] },
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

  it('erkennt Leak von konten[].korrekt (FiBu)', () => {
    const leak = { data: [{ typ: 'tkonto', konten: [{ id: 'k1', korrekt: true }] }] }
    expect(hatSperrfeld(leak)).toBe('data.[0].konten.[0].korrekt')
  })

  it('erkennt Leak von labels[].zoneId (Bildbeschriftung)', () => {
    const leak = { data: [{ typ: 'bildbeschriftung', labels: [{ id: 'l1', text: 'Zellkern', zoneId: 'z1' }] }] }
    expect(hatSperrfeld(leak)).toBe('data.[0].labels.[0].zoneId')
  })

  it('erkennt Leak von bereiche[].korrekt (Hotspot)', () => {
    const leak = { data: [{ typ: 'hotspot', bereiche: [{ id: 'b1', korrekt: true }] }] }
    expect(hatSperrfeld(leak)).toBe('data.[0].bereiche.[0].korrekt')
  })

  it('erkennt Leak von korrekteFormel (Formel)', () => {
    const leak = { data: [{ typ: 'formel', korrekteFormel: 'a^2+b^2=c^2' }] }
    expect(hatSperrfeld(leak)).toBe('data.[0].korrekteFormel')
  })

  it('erkennt Leak von erwarteteAntworten (Kontenbestimmung)', () => {
    const leak = { data: [{ typ: 'kontenbestimmung', aufgaben: [{ id: 'a1', erwarteteAntworten: ['1000'] }] }] }
    expect(hatSperrfeld(leak)).toBe('data.[0].aufgaben.[0].erwarteteAntworten')
  })

  it('erkennt Leak von buchungen (Buchungssatz)', () => {
    const leak = { data: [{ typ: 'buchungssatz', buchungen: [{ soll: '1000', haben: '1001' }] }] }
    expect(hatSperrfeld(leak)).toBe('data.[0].buchungen')
  })

  it('erkennt Leak von loesung (Bilanzstruktur)', () => {
    const leak = { data: [{ typ: 'bilanzstruktur', loesung: { aktiven: 100 } }] }
    expect(hatSperrfeld(leak)).toBe('data.[0].loesung')
  })
})
