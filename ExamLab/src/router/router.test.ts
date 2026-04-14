import { describe, it, expect, vi, beforeEach } from 'vitest'

// --- hashMigration Tests ---

describe('migrateHashBookmarks', () => {
  beforeEach(() => {
    // Reset des migrated-Flags: Module neu laden
    vi.resetModules()
  })

  it('konvertiert #/pruefung/abc zu /pruefung/abc', async () => {
    const replaceState = vi.spyOn(window.history, 'replaceState')

    // Hash setzen
    Object.defineProperty(window, 'location', {
      value: { ...window.location, hash: '#/pruefung/abc123' },
      writable: true,
    })

    // Fresh import um migrated-Flag zurückzusetzen
    const { migrateHashBookmarks: migrate } = await import('./hashMigration')
    migrate('/Pruefung/')

    expect(replaceState).toHaveBeenCalledWith(null, '', '/Pruefung/pruefung/abc123')
    replaceState.mockRestore()
  })

  it('ignoriert URLs ohne Hash', async () => {
    const replaceState = vi.spyOn(window.history, 'replaceState')

    Object.defineProperty(window, 'location', {
      value: { ...window.location, hash: '' },
      writable: true,
    })

    const { migrateHashBookmarks: migrate } = await import('./hashMigration')
    migrate('/Pruefung/')

    expect(replaceState).not.toHaveBeenCalled()
    replaceState.mockRestore()
  })

  it('ignoriert Hashes die nicht mit #/ beginnen', async () => {
    const replaceState = vi.spyOn(window.history, 'replaceState')

    Object.defineProperty(window, 'location', {
      value: { ...window.location, hash: '#section1' },
      writable: true,
    })

    const { migrateHashBookmarks: migrate } = await import('./hashMigration')
    migrate('/Pruefung/')

    expect(replaceState).not.toHaveBeenCalled()
    replaceState.mockRestore()
  })
})

// --- SuS Route-Screen-Ermittlung Tests ---

describe('ermittleScreen (URL → Screen-Typ)', () => {
  // Die Logik aus AppUeben.tsx und useSuSRouteSync.ts testen
  function ermittleScreen(pathname: string): string {
    if (pathname.startsWith('/sus/admin')) return 'admin'
    if (pathname.startsWith('/sus/ueben/ergebnis')) return 'ergebnis'
    if (pathname.match(/^\/sus\/ueben\/[^/]+/)) return 'uebung'
    if (pathname.startsWith('/sus/ueben')) return 'dashboard'
    if (pathname.startsWith('/sus/gruppen')) return 'gruppenAuswahl'
    if (pathname.startsWith('/sus/login')) return 'login'
    return 'dashboard'
  }

  it('/sus/ueben → dashboard', () => {
    expect(ermittleScreen('/sus/ueben')).toBe('dashboard')
  })

  it('/sus/ueben/ergebnis → ergebnis (statisch VOR :themaId)', () => {
    expect(ermittleScreen('/sus/ueben/ergebnis')).toBe('ergebnis')
  })

  it('/sus/ueben/vwl-konjunktur → uebung', () => {
    expect(ermittleScreen('/sus/ueben/vwl-konjunktur')).toBe('uebung')
  })

  it('/sus/ueben/mix → uebung', () => {
    expect(ermittleScreen('/sus/ueben/mix')).toBe('uebung')
  })

  it('/sus/admin → admin', () => {
    expect(ermittleScreen('/sus/admin')).toBe('admin')
  })

  it('/sus/gruppen → gruppenAuswahl', () => {
    expect(ermittleScreen('/sus/gruppen')).toBe('gruppenAuswahl')
  })

  it('/sus → dashboard (default)', () => {
    expect(ermittleScreen('/sus')).toBe('dashboard')
  })

  it('Route-Priorität: /sus/ueben/ergebnis ist ergebnis, nicht uebung', () => {
    // Wichtig: ergebnis MUSS vor :themaId matchen
    expect(ermittleScreen('/sus/ueben/ergebnis')).toBe('ergebnis')
    expect(ermittleScreen('/sus/ueben/etwas-anderes')).toBe('uebung')
  })
})
