import { describe, it, expect, vi, beforeEach } from 'vitest'
import { baueLPConfigAusRoute } from './useTabKaskadeConfig.lp'

describe('baueLPConfigAusRoute', () => {
  const navigate = vi.fn()
  const kurseDefault = [{ id: 'sf-wr-29c', label: 'SF WR 29c' }]
  const pruefungenDefault: Array<{ id: string; titel: string }> = []

  beforeEach(() => {
    try { localStorage.clear() } catch {}
    navigate.mockReset()
  })

  it('erkennt /pruefung → aktivL1 = pruefung, aktivL2 = durchfuehren (default)', () => {
    const cfg = baueLPConfigAusRoute('/pruefung', navigate, { kurse: kurseDefault, pruefungen: pruefungenDefault, aktivePruefungen: [] })
    expect(cfg.aktivL1).toBe('pruefung')
    expect(cfg.aktivL2).toBe('durchfuehren')
  })

  it('erkennt /uebung/kurs/sf-wr-29c → L1=uebung, L2=uebungen, L3=sf-wr-29c', () => {
    const cfg = baueLPConfigAusRoute('/uebung/kurs/sf-wr-29c', navigate, { kurse: kurseDefault, pruefungen: pruefungenDefault, aktivePruefungen: [] })
    expect(cfg.aktivL1).toBe('uebung')
    expect(cfg.aktivL2).toBe('uebungen')
    const l2 = cfg.l1Tabs.find((t) => t.id === 'uebung')!.l2!.find((t) => t.id === 'uebungen')!
    expect(l2.l3?.selectedIds).toEqual(['sf-wr-29c'])
  })

  it('erkennt /fragensammlung → aktivL1 = fragensammlung, kein L2', () => {
    const cfg = baueLPConfigAusRoute('/fragensammlung', navigate, { kurse: [], pruefungen: [], aktivePruefungen: [] })
    expect(cfg.aktivL1).toBe('fragensammlung')
    const fs = cfg.l1Tabs.find((t) => t.id === 'fragensammlung')!
    expect(fs.l2).toBeUndefined()
  })

  it('/pruefung/durchfuehren mit aktiver Prüfung → L3 multi', () => {
    const aktivePruefungen = ['ep-gym1']
    const pruefungen = [{ id: 'ep-gym1', titel: 'Einrichtungsprüfung GYM1' }]
    const cfg = baueLPConfigAusRoute('/pruefung/durchfuehren', navigate, { kurse: [], pruefungen, aktivePruefungen })
    const l2 = cfg.l1Tabs.find((t) => t.id === 'pruefung')!.l2!.find((t) => t.id === 'durchfuehren')!
    expect(l2.l3?.mode).toBe('multi')
    expect(l2.l3?.selectedIds).toEqual(['ep-gym1'])
  })

  it('URL-L3 gewinnt über localStorage (pure function returns URL-based L3)', () => {
    localStorage.setItem('examlab-ueben-letzter-kurs', 'in-28c')
    const cfg = baueLPConfigAusRoute('/uebung/kurs/sf-wr-29c', navigate, {
      kurse: [{ id: 'sf-wr-29c', label: 'SF WR 29c' }, { id: 'in-28c', label: 'IN 28c' }],
      pruefungen: [],
      aktivePruefungen: [],
    })
    const l2 = cfg.l1Tabs.find((t) => t.id === 'uebung')!.l2!.find((t) => t.id === 'uebungen')!
    expect(l2.l3?.selectedIds).toEqual(['sf-wr-29c'])
  })
})
