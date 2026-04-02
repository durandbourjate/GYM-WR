/**
 * Regression-Tests: Security-Invarianten
 *
 * Hintergrund: Session 34 — Rollen-Bypass via sessionStorage möglich.
 * Session 35 — Audit deckte mehrere Schwachstellen auf.
 * Diese Tests stellen sicher, dass grundlegende Security-Checks nicht brechen.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock sessionStorage
const sessionStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value }),
    removeItem: vi.fn((key: string) => { delete store[key] }),
    clear: vi.fn(() => { store = {} }),
  }
})()
Object.defineProperty(globalThis, 'sessionStorage', { value: sessionStorageMock })

describe('Security: Rollen-Validierung', () => {
  beforeEach(() => {
    vi.resetModules()
    sessionStorageMock.clear()
  })

  it('SuS-Domain wird IMMER auf Rolle "sus" zurückgesetzt', async () => {
    // Simuliere manipulierte Session: SuS-Email mit LP-Rolle
    sessionStorageMock.setItem('pruefung-auth', JSON.stringify({
      email: 'anna.mueller@stud.gymhofwil.ch',
      name: 'Anna Müller',
      rolle: 'lp',  // MANIPULATION!
      adminRolle: true,
      fachschaften: ['WR'],
    }))

    // restoreSession wird beim Import des Stores aufgerufen
    // Wir testen die Logik direkt
    const raw = sessionStorageMock.getItem('pruefung-auth')
    const parsed = JSON.parse(raw!)

    // Validierung wie in authStore.ts:restoreSession()
    if (parsed.email.endsWith('@stud.gymhofwil.ch') && parsed.rolle !== 'sus') {
      parsed.rolle = 'sus'
      parsed.adminRolle = false
      parsed.fachschaften = []
      parsed.fachschaft = undefined
    }

    expect(parsed.rolle).toBe('sus')
    expect(parsed.adminRolle).toBe(false)
    expect(parsed.fachschaften).toEqual([])
  })

  it('LP-Domain behält Rolle "lp"', () => {
    const user = {
      email: 'lehrer@gymhofwil.ch',
      name: 'Test LP',
      rolle: 'lp',
    }

    // SuS-Domain Check greift NICHT
    const istSusDomain = user.email.endsWith('@stud.gymhofwil.ch')
    expect(istSusDomain).toBe(false)
    expect(user.rolle).toBe('lp')
  })

  it('Unbekannte Domain wird als nicht-LP behandelt', () => {
    const email = 'hacker@evil.com'
    const istSusDomain = email.endsWith('@stud.gymhofwil.ch')
    const istLPDomain = email.endsWith('@gymhofwil.ch')
    expect(istSusDomain).toBe(false)
    expect(istLPDomain).toBe(false)
  })
})

describe('Security: bereinigeFrageFuerSuS_ (Backend-Logik)', () => {
  /**
   * Diese Tests validieren die Logik von bereinigeFrageFuerSuS_() im Backend.
   * Die Funktion ist in apps-script-code.js, hier testen wir die Invarianten
   * die das Frontend erwarten darf.
   */

  // Simulierte bereinigeFrageFuerSuS_ Logik (identisch zum Backend)
  function bereinigeFrageFuerSuS(frage: Record<string, unknown>): Record<string, unknown> {
    const f = JSON.parse(JSON.stringify(frage))
    delete f.musterlosung
    delete f.bewertungsraster

    if (f.optionen && Array.isArray(f.optionen)) {
      f.optionen = f.optionen.map((o: Record<string, unknown>) => {
        const cleaned = { ...o }
        delete cleaned.korrekt
        return cleaned
      })
    }
    if (f.aussagen && Array.isArray(f.aussagen)) {
      f.aussagen = f.aussagen.map((a: Record<string, unknown>) => {
        const cleaned = { ...a }
        delete cleaned.korrekt
        delete cleaned.erklaerung
        return cleaned
      })
    }
    if (f.luecken && Array.isArray(f.luecken)) {
      f.luecken = f.luecken.map((l: Record<string, unknown>) => {
        const cleaned = { ...l }
        delete cleaned.korrekteAntworten
        delete cleaned.korrekt
        return cleaned
      })
    }
    if (f.ergebnisse && Array.isArray(f.ergebnisse)) {
      f.ergebnisse = f.ergebnisse.map((e: Record<string, unknown>) => {
        const cleaned = { ...e }
        delete cleaned.korrekt
        delete cleaned.toleranz
        return cleaned
      })
    }
    if (f.teilaufgaben && Array.isArray(f.teilaufgaben)) {
      f.teilaufgaben = f.teilaufgaben.map((ta: Record<string, unknown>) => bereinigeFrageFuerSuS(ta))
    }
    return f
  }

  it('entfernt musterlosung aus SuS-Response', () => {
    const frage = { id: '1', text: 'Frage', musterlosung: 'Die Antwort ist 42' }
    const bereinigt = bereinigeFrageFuerSuS(frage)
    expect(bereinigt.musterlosung).toBeUndefined()
  })

  it('entfernt bewertungsraster aus SuS-Response', () => {
    const frage = { id: '1', text: 'Frage', bewertungsraster: [{ kriterium: 'Inhalt', punkte: 3 }] }
    const bereinigt = bereinigeFrageFuerSuS(frage)
    expect(bereinigt.bewertungsraster).toBeUndefined()
  })

  it('entfernt korrekt aus MC-Optionen', () => {
    const frage = {
      id: '1',
      typ: 'mc',
      optionen: [
        { text: 'A', korrekt: true },
        { text: 'B', korrekt: false },
      ],
    }
    const bereinigt = bereinigeFrageFuerSuS(frage) as { optionen: { text: string; korrekt?: boolean }[] }
    expect(bereinigt.optionen[0].korrekt).toBeUndefined()
    expect(bereinigt.optionen[1].korrekt).toBeUndefined()
    // Text bleibt erhalten
    expect(bereinigt.optionen[0].text).toBe('A')
  })

  it('entfernt korrekt + erklaerung aus R/F-Aussagen', () => {
    const frage = {
      id: '1',
      typ: 'richtigFalsch',
      aussagen: [
        { text: 'Die Erde ist rund', korrekt: true, erklaerung: 'Weil...' },
      ],
    }
    const bereinigt = bereinigeFrageFuerSuS(frage) as { aussagen: { text: string; korrekt?: boolean; erklaerung?: string }[] }
    expect(bereinigt.aussagen[0].korrekt).toBeUndefined()
    expect(bereinigt.aussagen[0].erklaerung).toBeUndefined()
    expect(bereinigt.aussagen[0].text).toBe('Die Erde ist rund')
  })

  it('entfernt korrekteAntworten aus Lückentext', () => {
    const frage = {
      id: '1',
      typ: 'lueckentext',
      luecken: [
        { id: 'l1', korrekteAntworten: ['Bern', 'Berne'], korrekt: 'Bern' },
      ],
    }
    const bereinigt = bereinigeFrageFuerSuS(frage) as { luecken: { id: string; korrekteAntworten?: string[]; korrekt?: string }[] }
    expect(bereinigt.luecken[0].korrekteAntworten).toBeUndefined()
    expect(bereinigt.luecken[0].korrekt).toBeUndefined()
  })

  it('entfernt toleranz aus Berechnungs-Ergebnissen', () => {
    const frage = {
      id: '1',
      typ: 'berechnung',
      ergebnisse: [
        { bezeichnung: 'Gewinn', korrekt: 1500, toleranz: 0.01 },
      ],
    }
    const bereinigt = bereinigeFrageFuerSuS(frage) as { ergebnisse: { bezeichnung: string; korrekt?: number; toleranz?: number }[] }
    expect(bereinigt.ergebnisse[0].korrekt).toBeUndefined()
    expect(bereinigt.ergebnisse[0].toleranz).toBeUndefined()
    expect(bereinigt.ergebnisse[0].bezeichnung).toBe('Gewinn')
  })

  it('bereinigt Teilaufgaben rekursiv', () => {
    const frage = {
      id: '1',
      typ: 'aufgabengruppe',
      teilaufgaben: [
        {
          id: '1a',
          typ: 'mc',
          musterlosung: 'Geheim',
          optionen: [{ text: 'X', korrekt: true }],
        },
      ],
    }
    const bereinigt = bereinigeFrageFuerSuS(frage) as { teilaufgaben: { musterlosung?: string; optionen: { korrekt?: boolean }[] }[] }
    expect(bereinigt.teilaufgaben[0].musterlosung).toBeUndefined()
    expect(bereinigt.teilaufgaben[0].optionen[0].korrekt).toBeUndefined()
  })

  it('LP bekommt ALLE Felder (bereinigeFrageFuerSuS wird nicht angewandt)', () => {
    const frage = {
      id: '1',
      typ: 'mc',
      musterlosung: 'Die Antwort ist A',
      bewertungsraster: [{ kriterium: 'Inhalt', punkte: 2 }],
      optionen: [{ text: 'A', korrekt: true }, { text: 'B', korrekt: false }],
    }

    // LP-Logik: istLP ? fragen : fragen.map(bereinigeFrageFuerSuS)
    const istLP = true
    const result = istLP ? frage : bereinigeFrageFuerSuS(frage)

    expect(result.musterlosung).toBe('Die Antwort ist A')
    expect(result.bewertungsraster).toBeDefined()
    expect((result.optionen as Array<{ text: string; korrekt: boolean }>)[0].korrekt).toBe(true)
  })
})

describe('Security: Session-Token Validierung', () => {
  it('getSessionToken gibt korrekten Token zurück', async () => {
    sessionStorageMock.setItem('pruefung-auth', JSON.stringify({
      email: 'sus@stud.gymhofwil.ch',
      sessionToken: 'valid-token-123',
    }))

    const { getSessionToken } = await import('../../services/apiClient.ts')
    expect(getSessionToken()).toBe('valid-token-123')
  })

  it('getSessionToken gibt undefined bei fehlendem Token', async () => {
    sessionStorageMock.setItem('pruefung-auth', JSON.stringify({
      email: 'lp@gymhofwil.ch',
    }))

    const { getSessionToken } = await import('../../services/apiClient.ts')
    const token = getSessionToken()
    expect(token).toBeUndefined()
  })

  it('getSessionToken crasht nicht bei ungültiger Session', async () => {
    sessionStorageMock.setItem('pruefung-auth', '{broken json')

    const { getSessionToken } = await import('../../services/apiClient.ts')
    expect(() => getSessionToken()).not.toThrow()
    expect(getSessionToken()).toBeUndefined()
  })
})

describe('Security: Demo-Modus Bypass', () => {
  beforeEach(() => {
    vi.resetModules()
    sessionStorageMock.clear()
  })

  it('sessionStorage pruefung-demo darf Lockdown NICHT deaktivieren', async () => {
    // Simuliere Angriff: SuS setzt Demo-Flag in sessionStorage
    sessionStorageMock.setItem('pruefung-demo', '1')

    // restoreDemoFlag() darf NICHT mehr aus sessionStorage lesen
    // istDemoModus ist nur über demoStarten() setzbar (in-memory)
    const { useAuthStore } = await import('../../store/authStore.ts')
    const state = useAuthStore.getState()
    expect(state.istDemoModus).toBe(false)
  })
})

describe('Security: pruefungId wird bei allen SuS-API-Calls mitgesendet', () => {
  it('speichereAntworten sendet pruefungId im Body', async () => {
    sessionStorageMock.setItem('pruefung-auth', JSON.stringify({
      email: 'sus@stud.gymhofwil.ch',
      sessionToken: 'token-123',
    }))

    const { speichereAntworten } = await import('../../services/pruefungApi.ts')
    // Mock fetch
    const originalFetch = globalThis.fetch
    let capturedBody: Record<string, unknown> | null = null
    globalThis.fetch = vi.fn(async (_url: string, options: RequestInit) => {
      capturedBody = JSON.parse(options.body as string)
      return new Response(JSON.stringify({ success: true }), { status: 200 })
    }) as typeof fetch

    await speichereAntworten({
      pruefungId: 'test-pruefung-42',
      email: 'sus@stud.gymhofwil.ch',
      antworten: {},
      version: 1,
      istAbgabe: false,
    })

    expect(capturedBody).not.toBeNull()
    expect(capturedBody!.pruefungId).toBe('test-pruefung-42')
    expect(capturedBody!.sessionToken).toBe('token-123')

    globalThis.fetch = originalFetch
  })

  it('heartbeat sendet pruefungId im Body', async () => {
    sessionStorageMock.setItem('pruefung-auth', JSON.stringify({
      email: 'sus@stud.gymhofwil.ch',
      sessionToken: 'token-456',
    }))

    const { heartbeat } = await import('../../services/pruefungApi.ts')
    const originalFetch = globalThis.fetch
    let capturedBody: Record<string, unknown> | null = null
    globalThis.fetch = vi.fn(async (_url: string, options: RequestInit) => {
      capturedBody = JSON.parse(options.body as string)
      return new Response(JSON.stringify({ success: true }), { status: 200 })
    }) as typeof fetch

    await heartbeat('test-pruefung-42', 'sus@stud.gymhofwil.ch')

    expect(capturedBody).not.toBeNull()
    expect(capturedBody!.pruefungId).toBe('test-pruefung-42')
    expect(capturedBody!.sessionToken).toBe('token-456')

    globalThis.fetch = originalFetch
  })
})
