import { describe, it, expect } from 'vitest'
import { normalisiereFrageDaten, normalisiereLueckentext, normalisiereDragDropBild } from './fragetypNormalizer'
import { stabilId } from '../../../../packages/shared/src/utils/stabilId'

describe('normalisiereMc', () => {
  it('setzt fehlendes optionen[].korrekt auf false (Default)', () => {
    const frage: any = { id: 'f1', typ: 'mc', optionen: [{ id: 'o1', text: 'A' }, { id: 'o2', text: 'B' }] }
    const n: any = normalisiereFrageDaten(frage)
    expect(n.optionen.every((o: any) => typeof o.korrekt === 'boolean')).toBe(true)
  })

  it('behält bestehendes optionen[].korrekt', () => {
    const frage: any = { id: 'f1', typ: 'mc', optionen: [{ id: 'o1', text: 'A', korrekt: true }, { id: 'o2', text: 'B', korrekt: false }] }
    const n: any = normalisiereFrageDaten(frage)
    expect(n.optionen[0].korrekt).toBe(true)
    expect(n.optionen[1].korrekt).toBe(false)
  })

  it('handelt fehlendes optionen[] als leeres Array', () => {
    const frage: any = { id: 'f1', typ: 'mc' }
    const n: any = normalisiereFrageDaten(frage)
    expect(Array.isArray(n.optionen)).toBe(true)
    expect(n.optionen.length).toBe(0)
  })
})

describe('normalisiereRichtigFalsch', () => {
  it('setzt fehlendes aussagen[].korrekt auf false', () => {
    const f: any = { id: 'f1', typ: 'richtigfalsch', aussagen: [{ id: 'a1', text: 'X' }] }
    const n: any = normalisiereFrageDaten(f)
    expect(typeof n.aussagen[0].korrekt).toBe('boolean')
  })
  it('fehlendes aussagen[] → []', () => {
    const n: any = normalisiereFrageDaten({ id: 'f1', typ: 'richtigfalsch' } as any)
    expect(Array.isArray(n.aussagen)).toBe(true)
  })
})

describe('normalisiereSortierung', () => {
  it('fehlendes elemente[] → []', () => {
    const n: any = normalisiereFrageDaten({ id: 'f1', typ: 'sortierung' } as any)
    expect(Array.isArray(n.elemente)).toBe(true)
  })
})
describe('normalisiereZuordnung', () => {
  it('fehlendes paare[] → [] und linksItems/rechtsItems Fallback', () => {
    const n: any = normalisiereFrageDaten({ id: 'f1', typ: 'zuordnung' } as any)
    expect(Array.isArray(n.paare)).toBe(true)
    expect(Array.isArray(n.linksItems)).toBe(true)
    expect(Array.isArray(n.rechtsItems)).toBe(true)
  })
  it('rekonstruiert paare[] aus linksItems + rechtsItems (neues Backend-Format)', () => {
    const f: any = { id: 'f1', typ: 'zuordnung', linksItems: [{ id: 'L1', text: 'a' }], rechtsItems: [{ id: 'R1', text: 'b' }] }
    const n: any = normalisiereFrageDaten(f)
    expect(Array.isArray(n.paare)).toBe(true)
  })
})

describe('normalisiereLueckentext — lueckentextModus', () => {
  it('setzt Default freitext wenn Feld fehlt UND keine dropdownOptionen', () => {
    const frage: any = {
      typ: 'lueckentext',
      luecken: [{ id: 'l0', korrekteAntworten: ['x'], caseSensitive: false }],
    }
    const normalisiert = normalisiereLueckentext(frage)
    expect(normalisiert.lueckentextModus).toBe('freitext')
  })

  it('setzt dropdown wenn Feld fehlt ABER dropdownOptionen non-empty (Legacy-Fragen)', () => {
    const frage: any = {
      typ: 'lueckentext',
      luecken: [{ id: 'l0', korrekteAntworten: ['x'], dropdownOptionen: ['x','y','z'], caseSensitive: false }],
    }
    const normalisiert = normalisiereLueckentext(frage)
    expect(normalisiert.lueckentextModus).toBe('dropdown')
  })

  it('respektiert expliziten Wert falls vorhanden', () => {
    const frage: any = {
      typ: 'lueckentext',
      lueckentextModus: 'dropdown',
      luecken: [{ id: 'l0', korrekteAntworten: ['x'], caseSensitive: false }],
    }
    const normalisiert = normalisiereLueckentext(frage)
    expect(normalisiert.lueckentextModus).toBe('dropdown')
  })
})

describe('normalisiereDragDropBild', () => {
  it('Pre-Migration-Frage: string[]-Pool wird zu DragDropBildLabel[] mit stabilen IDs', () => {
    const alt = {
      id: 'f1',
      typ: 'dragdrop_bild',
      labels: ['Aktiva', 'Passiva', 'Aktiva'],
      zielzonen: [
        { id: 'z1', korrektesLabel: 'Aktiva' },
        { id: 'z2', korrektesLabel: 'Passiva' },
      ],
    }
    const out = normalisiereDragDropBild(alt)
    expect(out.labels).toHaveLength(3)
    expect(out.labels[0].id).toBe(stabilId('f1', 'Aktiva', 0))
    expect(out.labels[2].id).toBe(stabilId('f1', 'Aktiva', 2))
    expect(out.labels[0].id).not.toBe(out.labels[2].id)
  })

  it('Post-Migration-Frage: DragDropBildLabel[]-Pool bleibt unverändert', () => {
    const neu = {
      id: 'f1',
      typ: 'dragdrop_bild',
      labels: [{ id: 'abc', text: 'Aktiva' }, { id: 'def', text: 'Passiva' }],
      zielzonen: [
        { id: 'z1', korrekteLabels: ['Aktiva'] },
        { id: 'z2', korrekteLabels: ['Passiva'] },
      ],
    }
    const out = normalisiereDragDropBild(neu)
    expect(out.labels[0].id).toBe('abc')
    expect(out.zielzonen[0].korrekteLabels).toEqual(['Aktiva'])
  })

  it('gemischte Migrations-Übergangs-Form: Pre + Post Felder gleichzeitig', () => {
    const mix = {
      id: 'f1',
      typ: 'dragdrop_bild',
      labels: [{ id: 'abc', text: 'Aktiva' }, 'Passiva'],
      zielzonen: [
        { id: 'z1', korrekteLabels: ['Aktiva'], korrektesLabel: 'Aktiva' },
        { id: 'z2', korrektesLabel: 'Passiva' },
      ],
    }
    const out = normalisiereDragDropBild(mix)
    expect(out.labels[0].id).toBe('abc')
    expect(out.labels[1].id).toBe(stabilId('f1', 'Passiva', 1))
    expect(out.zielzonen[0].korrekteLabels).toEqual(['Aktiva'])
    expect(out.zielzonen[1].korrekteLabels).toEqual(['Passiva'])
  })

  it('leere Zone: korrekteLabels = []', () => {
    const f = {
      id: 'f1',
      typ: 'dragdrop_bild',
      labels: [],
      zielzonen: [{ id: 'z1' }],
    }
    const out = normalisiereDragDropBild(f)
    expect(out.zielzonen[0].korrekteLabels).toEqual([])
  })
})
