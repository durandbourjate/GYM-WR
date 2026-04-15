import { describe, it, expect, vi } from 'vitest'
import { baueSuSConfigAusRoute } from './useTabKaskadeConfig.sus'

describe('baueSuSConfigAusRoute', () => {
  const navigate = vi.fn()

  it('/sus/ueben → L1=uebung, L2=themen', () => {
    const cfg = baueSuSConfigAusRoute('/sus/ueben', navigate, { kurse: [] })
    expect(cfg.aktivL1).toBe('uebung')
    expect(cfg.aktivL2).toBe('themen')
  })

  it('/sus/ueben/kurs/sf-wr-29c → L3 single, selectedIds=sf-wr-29c', () => {
    const cfg = baueSuSConfigAusRoute('/sus/ueben/kurs/sf-wr-29c', navigate, {
      kurse: [{ id: 'sf-wr-29c', label: 'SF WR 29c' }],
    })
    const l2 = cfg.l1Tabs.find((t) => t.id === 'uebung')!.l2!.find((t) => t.id === 'themen')!
    expect(l2.l3?.selectedIds).toEqual(['sf-wr-29c'])
  })

  it('/sus/pruefen/ergebnisse → L1=pruefung, L2=ergebnisse', () => {
    const cfg = baueSuSConfigAusRoute('/sus/pruefen/ergebnisse', navigate, { kurse: [] })
    expect(cfg.aktivL1).toBe('pruefung')
    expect(cfg.aktivL2).toBe('ergebnisse')
  })

  it('kein Favoriten und kein Fragensammlung in SuS-L1', () => {
    const cfg = baueSuSConfigAusRoute('/sus/ueben', navigate, { kurse: [] })
    const ids = cfg.l1Tabs.map((t) => t.id)
    expect(ids).not.toContain('favoriten')
    expect(ids).not.toContain('fragensammlung')
    expect(ids).toEqual(['pruefung', 'uebung'])
  })
})
