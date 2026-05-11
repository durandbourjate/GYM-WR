import { describe, it, expect } from 'vitest'
import { TAB_REGISTRY, tabsFuerSurface } from './tabRegistry'

describe('TAB_REGISTRY', () => {
  it('alle IDs sind innerhalb einer Surface unique', () => {
    const byFlavor: Record<string, Set<string>> = {}
    for (const t of TAB_REGISTRY) {
      byFlavor[t.surface] ??= new Set()
      const s = byFlavor[t.surface]
      expect(s.has(t.id), `Duplikat ${t.surface}/${t.id}`).toBe(false)
      s.add(t.id)
    }
  })

  it('IDs sind kebab-case (lowercase + Bindestrich)', () => {
    for (const t of TAB_REGISTRY) {
      expect(t.id).toMatch(/^[a-z][a-z0-9-]*$/)
    }
  })

  it('enthält die Einstellungen-Tabs aus Spec', () => {
    const ids = TAB_REGISTRY.filter(t => t.surface === 'einstellungen').map(t => t.id)
    expect(ids).toEqual(expect.arrayContaining([
      'profil', 'lernziele', 'favoriten', 'problemmeldungen',
      'uebungen', 'fragensammlung', 'testdaten', 'admin', 'ki-kalibrierung',
    ]))
  })

  it('enthält die Hilfe-Tabs aus Spec in Workflow-Order', () => {
    const hilfeIds = TAB_REGISTRY.filter(t => t.surface === 'hilfe').map(t => t.id)
    expect(hilfeIds).toEqual([
      'einstieg', 'fragen', 'pruefung', 'durchfuehrung', 'korrektur',
      'ueben', 'ki', 'bloom', 'zusammenarbeit', 'faq',
    ])
  })

  it('Hilfe-Tab-IDs sind stabil (Hash-Link-Kompatibilität)', () => {
    // Diese IDs werden in HilfeSeite.tsx als KOMPONENTEN-Map-Keys verwendet.
    // Eine Umbenennung würde stillen Render-Bruch verursachen.
    const hilfeIds = TAB_REGISTRY.filter(t => t.surface === 'hilfe').map(t => t.id).sort()
    expect(hilfeIds).toEqual([
      'bloom', 'durchfuehrung', 'einstieg', 'faq',
      'fragen', 'ki', 'korrektur', 'pruefung',
      'ueben', 'zusammenarbeit',
    ])
  })
})

describe('tabsFuerSurface', () => {
  it('filtert nach Surface', () => {
    const e = tabsFuerSurface('einstellungen', { istAdmin: false })
    expect(e.length).toBeGreaterThan(0)
    expect(e.every(t => t.surface === 'einstellungen')).toBe(true)
  })

  it('versteckt Admin-Tab für Non-Admins', () => {
    const e = tabsFuerSurface('einstellungen', { istAdmin: false })
    expect(e.find(t => t.id === 'admin')).toBeUndefined()
  })

  it('zeigt Admin-Tab für Admins', () => {
    const e = tabsFuerSurface('einstellungen', { istAdmin: true })
    expect(e.find(t => t.id === 'admin')).toBeDefined()
  })

  it('Default-Tabs (ohne sichtbar-Predicate) erscheinen immer', () => {
    const e1 = tabsFuerSurface('einstellungen', { istAdmin: false })
    const e2 = tabsFuerSurface('einstellungen', { istAdmin: true })
    expect(e1.find(t => t.id === 'profil')).toBeDefined()
    expect(e2.find(t => t.id === 'profil')).toBeDefined()
  })
})
