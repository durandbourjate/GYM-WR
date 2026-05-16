import { describe, it, expect } from 'vitest'
import { statusReihenfolge, filterLabel, verstossTooltip, stufeIcon } from './aktivPhaseHelpers'
import type { SchuelerStatus } from '../../../types/monitoring'

describe('statusReihenfolge', () => {
  it('liefert deterministische Reihenfolge für alle Status', () => {
    const ordnung: SchuelerStatus['status'][] = ['aktiv', 'inaktiv', 'nicht-gestartet', 'abgegeben', 'beendet-lp']
    const werte = ordnung.map(statusReihenfolge)
    expect(werte).toEqual([0, 1, 2, 3, 4])
  })

  it('fallback default für unbekannte Status', () => {
    expect(statusReihenfolge('unknown' as SchuelerStatus['status'])).toBe(5)
  })
})

describe('filterLabel', () => {
  it('mappt alle Filter auf deutsche Labels', () => {
    expect(filterLabel('alle')).toBe('Alle')
    expect(filterLabel('aktiv')).toBe('Aktiv')
    expect(filterLabel('abgegeben')).toBe('Abgegeben')
    expect(filterLabel('nicht-erschienen')).toBe('Nicht erschienen')
  })
})

describe('verstossTooltip', () => {
  it('liefert "Keine Verstösse" bei leerer Liste', () => {
    const s = { verstoesse: [] } as unknown as SchuelerStatus
    expect(verstossTooltip(s)).toBe('Keine Verstösse')
  })

  it('liefert "Keine Verstösse" wenn verstoesse undefined', () => {
    const s = {} as SchuelerStatus
    expect(verstossTooltip(s)).toBe('Keine Verstösse')
  })

  it('formatiert Verstösse mit Zeitpunkt + Typ', () => {
    const s = {
      verstoesse: [
        { zeitpunkt: '2026-05-09T10:30:00Z', typ: 'tab-blur' },
        { zeitpunkt: '2026-05-09T10:35:00Z', typ: 'fokus-verloren', dauer_sekunden: 12 },
      ],
    } as unknown as SchuelerStatus
    const text = verstossTooltip(s)
    expect(text).toContain('tab-blur')
    expect(text).toContain('fokus-verloren')
    expect(text).toContain('(12s)')
    expect(text.split('\n')).toHaveLength(2)
  })
})

describe('stufeIcon', () => {
  it('liefert Circle mit grünen Fill-Klassen für locker', () => {
    const el = stufeIcon('locker')
    expect(el.props.className).toContain('fill-green-500')
  })
  it('liefert Circle mit roten Fill-Klassen für streng', () => {
    const el = stufeIcon('streng')
    expect(el.props.className).toContain('fill-red-500')
  })
  it('liefert Circle mit gelben Fill-Klassen als Default', () => {
    expect(stufeIcon('standard').props.className).toContain('fill-yellow-500')
    expect(stufeIcon(undefined).props.className).toContain('fill-yellow-500')
  })
})
