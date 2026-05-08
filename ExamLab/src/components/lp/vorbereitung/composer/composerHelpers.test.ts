import { describe, it, expect, vi, afterEach } from 'vitest'
import { generiereId } from './composerHelpers'
import type { PruefungsConfig } from '../../../../types/pruefung'

const mkConfig = (overrides: Partial<PruefungsConfig> = {}): PruefungsConfig =>
  ({
    klasse: '27a',
    datum: '2026-05-08',
    abschnitte: [],
    fachbereiche: [],
    titel: '',
    typ: 'summativ',
    ...overrides,
  }) as unknown as PruefungsConfig

afterEach(() => {
  vi.restoreAllMocks()
})

describe('generiereId', () => {
  it('strippt special-chars und kleinschreibt + bricht auf 10 Zeichen', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.123456)
    const id = generiereId(mkConfig({ klasse: 'KLASSE-27a/Special!' }))
    // Slug: 'klasse27as' (special-chars raus, lower, slice(0,10))
    expect(id.startsWith('klasse27as-')).toBe(true)
  })

  it('strippt Bindestriche aus Datum', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    const id = generiereId(mkConfig({ klasse: '27a', datum: '2026-05-08' }))
    expect(id).toMatch(/^27a-20260508-[a-z0-9]{1,4}$/)
  })

  it('Random-Suffix hat 1-4 base36-Zeichen', () => {
    const id = generiereId(mkConfig({ klasse: 'k', datum: '2026-01-01' }))
    const suffix = id.split('-').pop() ?? ''
    expect(suffix.length).toBeGreaterThanOrEqual(1)
    expect(suffix.length).toBeLessThanOrEqual(4)
    expect(suffix).toMatch(/^[a-z0-9]+$/)
  })
})
