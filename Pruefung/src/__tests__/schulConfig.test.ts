import { describe, it, expect, beforeEach } from 'vitest'
import { DEFAULT_SCHUL_CONFIG } from '../types/schulConfig'
import { useSchulConfig } from '../store/schulConfigStore'

// Zustand-Store vor jedem Test zurücksetzen
beforeEach(() => {
  useSchulConfig.setState({
    config: DEFAULT_SCHUL_CONFIG,
    geladen: false,
    fehler: null,
  })
})

describe('DEFAULT_SCHUL_CONFIG', () => {
  it('hat den korrekten Schulnamen', () => {
    expect(DEFAULT_SCHUL_CONFIG.schulName).toBe('Gymnasium Hofwil')
  })

  it('hat das korrekte Schulkürzel', () => {
    expect(DEFAULT_SCHUL_CONFIG.schulKuerzel).toBe('GH')
  })

  it('hat die korrekte LP-Domain', () => {
    expect(DEFAULT_SCHUL_CONFIG.lpDomain).toBe('gymhofwil.ch')
  })

  it('hat die korrekte SuS-Domain', () => {
    expect(DEFAULT_SCHUL_CONFIG.susDomain).toBe('stud.gymhofwil.ch')
  })

  it('enthält 20 Fächer', () => {
    expect(DEFAULT_SCHUL_CONFIG.faecher).toHaveLength(20)
  })

  it('enthält die erwarteten Gefässe', () => {
    expect(DEFAULT_SCHUL_CONFIG.gefaesse).toEqual(['SF', 'EF', 'EWR', 'GF', 'FF'])
  })

  it('enthält WR-fachschaftsTags mit VWL, BWL und Recht', () => {
    const wrTags = DEFAULT_SCHUL_CONFIG.fachschaftsTags['WR']
    expect(wrTags).toBeDefined()
    const namen = wrTags.map((t) => t.name)
    expect(namen).toContain('VWL')
    expect(namen).toContain('BWL')
    expect(namen).toContain('Recht')
  })

  it('hat korrekte Farben für WR-Tags', () => {
    const wrTags = DEFAULT_SCHUL_CONFIG.fachschaftsTags['WR']
    const vwl = wrTags.find((t) => t.name === 'VWL')
    const bwl = wrTags.find((t) => t.name === 'BWL')
    const recht = wrTags.find((t) => t.name === 'Recht')
    expect(vwl?.farbe).toBe('#f97316')
    expect(bwl?.farbe).toBe('#3b82f6')
    expect(recht?.farbe).toBe('#22c55e')
  })

  it('hat ein gültiges Semestermodell', () => {
    expect(DEFAULT_SCHUL_CONFIG.semesterModell.regel.anzahl).toBe(8)
    expect(DEFAULT_SCHUL_CONFIG.semesterModell.taf.anzahl).toBe(10)
  })
})

describe('useSchulConfig Store', () => {
  it('startet mit DEFAULT_SCHUL_CONFIG', () => {
    const { config } = useSchulConfig.getState()
    expect(config.schulName).toBe('Gymnasium Hofwil')
    expect(config.lpDomain).toBe('gymhofwil.ch')
  })

  it('startet mit geladen=false', () => {
    const { geladen } = useSchulConfig.getState()
    expect(geladen).toBe(false)
  })

  it('startet ohne Fehler', () => {
    const { fehler } = useSchulConfig.getState()
    expect(fehler).toBeNull()
  })

  it('setzt geladen=true nach ladeSchulConfig()', async () => {
    const { ladeSchulConfig } = useSchulConfig.getState()
    await ladeSchulConfig()
    const { geladen } = useSchulConfig.getState()
    expect(geladen).toBe(true)
  })

  it('behält DEFAULT_SCHUL_CONFIG nach ladeSchulConfig()', async () => {
    const { ladeSchulConfig } = useSchulConfig.getState()
    await ladeSchulConfig()
    const { config } = useSchulConfig.getState()
    expect(config.schulName).toBe('Gymnasium Hofwil')
  })

  it('hat fehler=null nach erfolgreichem ladeSchulConfig()', async () => {
    const { ladeSchulConfig } = useSchulConfig.getState()
    await ladeSchulConfig()
    const { fehler } = useSchulConfig.getState()
    expect(fehler).toBeNull()
  })
})
