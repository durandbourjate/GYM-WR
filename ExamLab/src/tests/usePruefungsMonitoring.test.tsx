/**
 * Integration-Tests: usePruefungsMonitoring.ts
 *
 * Der zentrale Monitoring-Hook der Prüfungsphase. Orchestriert Auto-Save
 * (lokal + remote), Heartbeat, Focus-Detection und Online/Offline-Handling.
 * Hier verlieren SuS bei einer stillen Regression ihre Antworten — daher
 * Tests auf die Daten-Integritäts-Pfade:
 *
 *  - Reconnect-Wiring: online-Event → processQueue() (mit Re-Subscribe-Test
 *    gegen den dokumentierten stale-closure-Bug auf `backendVerfuegbar`).
 *  - Remote-Save: bei fehlgeschlagenem Save wird die Antwort in die Retry-Queue
 *    eingereiht (enqueue) statt verworfen.
 *  - Submission-Integrity (Frontend-Invariante): sobald `abgegeben === true`
 *    feuern Auto-Save / Remote-Save / Heartbeat NICHT mehr.
 *  - Heartbeat: feuert ans Backend solange aktiv; wird bei unmount aufgeräumt.
 *
 * Realer pruefungStore (echte Antworten/Status-Übergänge); apiService,
 * autoSave und retryQueue sind gemockt (= Netzwerk + Persistenz steuerbar).
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'

// === Mocks (vor Hook-Import) ===
const istKonfiguriertMock = vi.fn<() => boolean>(() => true)
const speichereAntwortenMock = vi.fn<(p: unknown) => Promise<boolean>>()
const heartbeatMock = vi.fn<(...a: unknown[]) => Promise<{ success: boolean; [k: string]: unknown }>>()

vi.mock('../services/apiService', () => ({
  apiService: {
    istKonfiguriert: () => istKonfiguriertMock(),
    speichereAntworten: (p: unknown) => speichereAntwortenMock(p),
    heartbeat: (...a: unknown[]) => heartbeatMock(...a),
  },
}))

const saveToIndexedDBMock = vi.fn<(...a: unknown[]) => Promise<void>>(() => Promise.resolve())
vi.mock('../services/autoSave', () => ({
  saveToIndexedDB: (...a: unknown[]) => saveToIndexedDBMock(...a),
}))

const enqueueMock = vi.fn<(p: unknown) => Promise<void>>(() => Promise.resolve())
const processQueueMock = vi.fn<() => Promise<{ processed: number; failed: number }>>(() =>
  Promise.resolve({ processed: 0, failed: 0 }),
)
vi.mock('../services/retryQueue', () => ({
  enqueue: (p: unknown) => enqueueMock(p),
  processQueue: () => processQueueMock(),
}))

// authStore: steuert backendVerfuegbar = istKonfiguriert() && !istDemoModus && !!user?.email
const authStateRef: { user: { email: string } | null; istDemoModus: boolean } = {
  user: { email: 'sus@stud.gymhofwil.ch' },
  istDemoModus: false,
}
vi.mock('../store/authStore', () => ({
  useAuthStore: (selector: (s: unknown) => unknown) => selector(authStateRef),
}))

import { usePruefungsMonitoring } from '../hooks/usePruefungsMonitoring'
import { usePruefungStore } from '../store/pruefungStore'
import type { PruefungsConfig } from '../types/pruefung'
import type { Frage } from '../types/fragen-storage'
import type { Antwort } from '../types/antworten'

const config = {
  id: 'p1',
  titel: 'Test-Prüfung',
  autoSaveIntervallSekunden: 30,
  heartbeatIntervallSekunden: 15,
} as unknown as PruefungsConfig

const fragen = [
  { id: 'q1', typ: 'freitext' },
  { id: 'q2', typ: 'freitext' },
] as unknown as Frage[]

function starteEchtePruefung() {
  act(() => {
    usePruefungStore.getState().pruefungStarten(config, fragen, fragen)
    usePruefungStore.getState().setAntwort('q1', { typ: 'freitext', text: 'Antwort 1' } as Antwort)
  })
}

beforeEach(() => {
  vi.useFakeTimers()
  istKonfiguriertMock.mockReturnValue(true)
  speichereAntwortenMock.mockReset().mockResolvedValue(true)
  heartbeatMock.mockReset().mockResolvedValue({ success: true })
  saveToIndexedDBMock.mockReset().mockResolvedValue(undefined)
  enqueueMock.mockReset().mockResolvedValue(undefined)
  processQueueMock.mockReset().mockResolvedValue({ processed: 0, failed: 0 })
  authStateRef.user = { email: 'sus@stud.gymhofwil.ch' }
  authStateRef.istDemoModus = false
  // navigator.onLine default true
  Object.defineProperty(navigator, 'onLine', { value: true, configurable: true, writable: true })
  act(() => {
    usePruefungStore.getState().reset()
  })
})

afterEach(() => {
  vi.runOnlyPendingTimers()
  vi.useRealTimers()
})

describe('usePruefungsMonitoring — Reconnect / Retry-Queue-Wiring (Antwortverlust-Schutz)', () => {
  it('online-Event löst processQueue() aus, wenn das Backend verfügbar ist', () => {
    starteEchtePruefung()
    renderHook(() => usePruefungsMonitoring())

    act(() => {
      window.dispatchEvent(new Event('online'))
    })

    expect(processQueueMock).toHaveBeenCalledTimes(1)
    expect(usePruefungStore.getState().verbindungsstatus).toBe('online')
  })

  it('online-Event löst processQueue() NICHT aus, wenn Backend nicht verfügbar (Demo-Modus)', () => {
    authStateRef.istDemoModus = true // → backendVerfuegbar = false
    starteEchtePruefung()
    renderHook(() => usePruefungsMonitoring())

    act(() => {
      window.dispatchEvent(new Event('online'))
    })

    expect(processQueueMock).not.toHaveBeenCalled()
  })

  // Direkte Regression auf den dokumentierten Bug: der online-Listener hatte
  // `backendVerfuegbar` einmal NICHT in den Effect-Deps → stale-closure →
  // nach Reconnect wurde processQueue nie aufgerufen. Hier wird der Flip
  // false→true geprüft: der Effect MUSS re-subscriben und dann flushen.
  it('REGRESSION: nach backendVerfuegbar-Flip false→true flusht das online-Event die Queue', () => {
    authStateRef.istDemoModus = true // Start: Backend NICHT verfügbar
    starteEchtePruefung()
    const { rerender } = renderHook(() => usePruefungsMonitoring())

    // Online während "offline-ähnlich" (kein Backend) → kein Flush
    act(() => {
      window.dispatchEvent(new Event('online'))
    })
    expect(processQueueMock).not.toHaveBeenCalled()

    // Backend wird verfügbar (z.B. Reauth / Reconnect) → Hook re-rendert mit
    // neuem backendVerfuegbar=true. Der online-Listener-Effect MUSS re-binden.
    act(() => {
      authStateRef.istDemoModus = false
      rerender()
    })

    act(() => {
      window.dispatchEvent(new Event('online'))
    })

    // Wäre `backendVerfuegbar` nicht in den Deps → stale Closure → 0 Aufrufe (= der Bug).
    expect(processQueueMock).toHaveBeenCalledTimes(1)
  })

  it('offline-Event setzt Verbindungsstatus auf offline', () => {
    starteEchtePruefung()
    renderHook(() => usePruefungsMonitoring())
    act(() => {
      window.dispatchEvent(new Event('offline'))
    })
    expect(usePruefungStore.getState().verbindungsstatus).toBe('offline')
  })
})

describe('usePruefungsMonitoring — Remote-Save reiht fehlgeschlagene Saves in die Queue', () => {
  it('Remote-Save-Fehler → enqueue() der Antwort (statt Verlust) + Status offline', async () => {
    speichereAntwortenMock.mockResolvedValue(false) // Backend lehnt ab / down
    starteEchtePruefung()
    renderHook(() => usePruefungsMonitoring())

    // Remote-Save-Intervall = autoSaveIntervallSekunden (30s) feuern lassen
    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000)
    })

    expect(speichereAntwortenMock).toHaveBeenCalledTimes(1)
    // Die Antwort darf nicht verworfen werden: sie muss in die Retry-Queue.
    expect(enqueueMock).toHaveBeenCalledTimes(1)
    expect(enqueueMock).toHaveBeenCalledWith(
      expect.objectContaining({
        pruefungId: 'p1',
        email: 'sus@stud.gymhofwil.ch',
        istAbgabe: false,
      }),
    )
    // Die in die Queue gereihte Antwort enthält den aktuellen SuS-Stand.
    const enqueued = enqueueMock.mock.calls[0][0] as { antworten: Record<string, Antwort> }
    expect(enqueued.antworten.q1).toEqual({ typ: 'freitext', text: 'Antwort 1' })
    // Netzwerkfehler wird gezählt (Monitoring-Metrik).
    expect(usePruefungStore.getState().netzwerkFehler).toBeGreaterThanOrEqual(1)
    // Hinweis: verbindungsstatus wird NICHT asserted — bei 30s laufen Remote-Save
    // (offline) und Heartbeat-Intervall (online) interleaved; das End-Resultat ist
    // timing-abhängig. Die offline/online-Status-Semantik decken die online-/
    // offline-Event-Tests oben deterministisch ab.
  })

  it('Remote-Save-Erfolg → KEIN enqueue, remoteSaveVersion erhöht, Status online', async () => {
    speichereAntwortenMock.mockResolvedValue(true)
    starteEchtePruefung()
    renderHook(() => usePruefungsMonitoring())

    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000)
    })

    expect(speichereAntwortenMock).toHaveBeenCalledTimes(1)
    expect(enqueueMock).not.toHaveBeenCalled()
    expect(usePruefungStore.getState().remoteSaveVersion).toBe(1)
    expect(usePruefungStore.getState().verbindungsstatus).toBe('online')
  })

  it('Remote-Save sendet die AKTUELLEN Antworten (kein stale-closure-Verlust bei spätem Tippen)', async () => {
    speichereAntwortenMock.mockResolvedValue(true)
    starteEchtePruefung()
    renderHook(() => usePruefungsMonitoring())

    // SuS tippt NACH Hook-Mount eine weitere Antwort — der Intervall-Callback
    // muss den neuesten Store-Stand sehen (antwortenRef), nicht den vom Mount.
    act(() => {
      usePruefungStore.getState().setAntwort('q2', { typ: 'freitext', text: 'spät getippt' } as Antwort)
    })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000)
    })

    const payload = speichereAntwortenMock.mock.calls[0][0] as { antworten: Record<string, Antwort> }
    expect(payload.antworten.q1).toEqual({ typ: 'freitext', text: 'Antwort 1' })
    expect(payload.antworten.q2).toEqual({ typ: 'freitext', text: 'spät getippt' })
  })
})

describe('usePruefungsMonitoring — IndexedDB Auto-Save (lokales Backup)', () => {
  it('schreibt alle 15s ins IndexedDB und erhöht autoSaveCount', async () => {
    starteEchtePruefung()
    renderHook(() => usePruefungsMonitoring())

    await act(async () => {
      await vi.advanceTimersByTimeAsync(15_000)
    })

    expect(saveToIndexedDBMock).toHaveBeenCalledTimes(1)
    expect(saveToIndexedDBMock).toHaveBeenCalledWith('p1', expect.any(Object), expect.any(String))
    expect(usePruefungStore.getState().autoSaveCount).toBeGreaterThanOrEqual(1)
  })
})

describe('usePruefungsMonitoring — Heartbeat', () => {
  it('feuert nach dem Basis-Intervall ans Backend', async () => {
    starteEchtePruefung()
    renderHook(() => usePruefungsMonitoring())

    // heartbeatIntervallSekunden = 15
    await act(async () => {
      await vi.advanceTimersByTimeAsync(15_000)
    })

    expect(heartbeatMock).toHaveBeenCalled()
    const [pruefungId, email] = heartbeatMock.mock.calls[0]
    expect(pruefungId).toBe('p1')
    expect(email).toBe('sus@stud.gymhofwil.ch')
    expect(usePruefungStore.getState().heartbeats).toBeGreaterThanOrEqual(1)
  })

  it('Cleanup bei unmount: kein weiterer Heartbeat nach Unmount (kein Leak)', async () => {
    starteEchtePruefung()
    const { unmount } = renderHook(() => usePruefungsMonitoring())

    await act(async () => {
      await vi.advanceTimersByTimeAsync(15_000)
    })
    const callsBeforeUnmount = heartbeatMock.mock.calls.length
    expect(callsBeforeUnmount).toBeGreaterThanOrEqual(1)

    unmount()

    // Nach Unmount darf kein neuer Heartbeat mehr geplant/gesendet werden.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000)
    })
    expect(heartbeatMock.mock.calls.length).toBe(callsBeforeUnmount)
  })

  it('Heartbeat feuert NICHT wenn Backend nicht verfügbar (Demo-Modus)', async () => {
    authStateRef.istDemoModus = true
    starteEchtePruefung()
    renderHook(() => usePruefungsMonitoring())

    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000)
    })

    expect(heartbeatMock).not.toHaveBeenCalled()
  })
})

describe('usePruefungsMonitoring — Submission-Integrity (Frontend-Invariante)', () => {
  // Backend erzwingt zusätzlich status=beendet (apps-script-code.js).
  // Frontend-seitig MUSS der Hook nach Abgabe aufhören zu schreiben/pingen,
  // damit der Client nach der Abgabe nichts mehr verändert.
  it('nach pruefungAbgeben(): KEIN Remote-Save, KEIN Heartbeat, KEIN IDB-Save mehr', async () => {
    starteEchtePruefung()
    const { rerender } = renderHook(() => usePruefungsMonitoring())

    act(() => {
      usePruefungStore.getState().pruefungAbgeben() // abgegeben = true
      rerender()
    })

    saveToIndexedDBMock.mockClear()
    speichereAntwortenMock.mockClear()
    heartbeatMock.mockClear()

    // Lange genug für alle Intervalle (IDB 15s, Remote 30s, Heartbeat 15s).
    await act(async () => {
      await vi.advanceTimersByTimeAsync(120_000)
    })

    expect(saveToIndexedDBMock).not.toHaveBeenCalled()
    expect(speichereAntwortenMock).not.toHaveBeenCalled()
    // Hinweis: der finale Abgabe-Heartbeat (Effekt 3b) feuert genau EINMAL beim
    // Übergang abgegeben=true. Hier ist relevant: das wiederkehrende Heartbeat-
    // Intervall darf nicht mehr feuern → keine fortlaufenden Pings.
    expect(heartbeatMock.mock.calls.length).toBeLessThanOrEqual(1)
  })

  it('online-Event nach Abgabe flusht NICHT mehr (Listener abgemeldet)', () => {
    starteEchtePruefung()
    const { rerender } = renderHook(() => usePruefungsMonitoring())

    act(() => {
      usePruefungStore.getState().pruefungAbgeben()
      rerender()
    })
    processQueueMock.mockClear()

    act(() => {
      window.dispatchEvent(new Event('online'))
    })

    expect(processQueueMock).not.toHaveBeenCalled()
  })
})
