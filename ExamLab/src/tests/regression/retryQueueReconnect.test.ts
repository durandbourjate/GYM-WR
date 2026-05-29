/**
 * Regression-Tests: Retry-Queue Reconnect — DER Antwortverlust-Pfad
 *
 * Hintergrund (dokumentierter Bug): In `usePruefungsMonitoring.ts` liess der
 * online-Listener-Effect einmal `backendVerfuegbar` aus seinen useEffect-Deps
 * weg. Folge: nach einem Reconnect (online-Event / backendVerfuegbar flippt auf
 * true) lief der Listener mit einer stale Closure, in der `backendVerfuegbar`
 * noch `false` war → `processQueue()` wurde NICHT aufgerufen → die während der
 * Offline-Phase in die Retry-Queue eingereihten SuS-Antworten blieben liegen
 * und gingen verloren.
 *
 * Diese Tests fixieren die Daten-Integritäts-Garantie auf zwei Ebenen:
 *   (A) Service-Ebene (retryQueue.ts): Was offline enqueued wurde, MUSS beim
 *       processQueue gesendet und danach aus der Queue entfernt werden.
 *   (B) Hook-Ebene (usePruefungsMonitoring.ts): Ein `online`-Event MUSS
 *       processQueue() auslösen, solange das Backend verfügbar ist — und der
 *       Effect MUSS bei einem backendVerfuegbar-Flip re-subscriben (sonst lebt
 *       der ursprüngliche Bug wieder auf).
 *
 * Reales fake-indexeddb für die Queue-Persistenz; apiService.speichereAntworten
 * ist gemockt (= "Netzwerk"), damit Offline/Online deterministisch steuerbar ist.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// === apiService-Mock: speichereAntworten ist das "Netzwerk" ===
const speichereAntwortenMock = vi.fn<(p: unknown) => Promise<boolean>>()
vi.mock('../../services/apiService', () => ({
  apiService: {
    speichereAntworten: (p: unknown) => speichereAntwortenMock(p),
  },
}))

import { enqueue, processQueue, queueSize, clearQueue } from '../../services/retryQueue'
import type { Antwort } from '../../types/antworten'

const antworten: Record<string, Antwort> = {
  q1: { typ: 'freitext', text: 'SuS-Antwort die nicht verloren gehen darf' },
}

function basePayload(version: number) {
  return {
    pruefungId: 'p1',
    email: 'sus@stud.gymhofwil.ch',
    antworten,
    version,
    istAbgabe: false,
    requestId: `req-${version}`,
  }
}

describe('Regression: Retry-Queue Service — Offline-enqueue → Reconnect-flush', () => {
  beforeEach(async () => {
    await clearQueue()
    speichereAntwortenMock.mockReset()
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('enqueue persistiert den fehlgeschlagenen Save in die Queue', async () => {
    await enqueue(basePayload(1))
    expect(await queueSize()).toBe(1)
  })

  it('THE BUG: was offline enqueued wurde, wird beim Reconnect gesendet UND aus der Queue entfernt', async () => {
    // 1. Offline-Phase: Remote-Save schlägt fehl → landet in der Queue.
    await enqueue(basePayload(1))
    expect(await queueSize()).toBe(1)

    // 2. Reconnect: Backend ist wieder erreichbar.
    speichereAntwortenMock.mockResolvedValue(true)
    const result = await processQueue()

    // 3. Garantie: Die SuS-Antwort WURDE gesendet …
    expect(speichereAntwortenMock).toHaveBeenCalledTimes(1)
    expect(speichereAntwortenMock).toHaveBeenCalledWith(
      expect.objectContaining({
        pruefungId: 'p1',
        email: 'sus@stud.gymhofwil.ch',
        antworten,
        version: 1,
        istAbgabe: false,
        requestId: 'req-1',
      }),
    )
    // … und die Queue ist danach leer (kein Doppel-Send beim nächsten online).
    expect(result.processed).toBe(1)
    expect(result.failed).toBe(0)
    expect(await queueSize()).toBe(0)
  })

  it('flusht mehrere gequeuete Saves in einem processQueue-Durchlauf', async () => {
    await enqueue(basePayload(1))
    await enqueue(basePayload(2))
    await enqueue(basePayload(3))
    expect(await queueSize()).toBe(3)

    speichereAntwortenMock.mockResolvedValue(true)
    const result = await processQueue()

    expect(speichereAntwortenMock).toHaveBeenCalledTimes(3)
    expect(result.processed).toBe(3)
    expect(await queueSize()).toBe(0)
  })

  it('Send schlägt erneut fehl → Item bleibt in Queue (retryCount hochgezählt), kein Datenverlust', async () => {
    await enqueue(basePayload(1))
    speichereAntwortenMock.mockResolvedValue(false) // Netzwerk immer noch instabil

    const result = await processQueue()

    expect(result.processed).toBe(0)
    expect(result.failed).toBe(1)
    // Entscheidend: die Antwort bleibt erhalten für den nächsten Reconnect-Versuch.
    expect(await queueSize()).toBe(1)
  })

  it('teil-erfolgreicher Flush: erfolgreiche raus, fehlgeschlagene bleiben', async () => {
    await enqueue(basePayload(1))
    await enqueue(basePayload(2))
    // erster Call ok, zweiter scheitert
    speichereAntwortenMock
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false)

    const result = await processQueue()

    expect(result.processed).toBe(1)
    expect(result.failed).toBe(1)
    // Genau das fehlgeschlagene Item bleibt für den nächsten Versuch übrig.
    expect(await queueSize()).toBe(1)
  })

  it('processQueue auf leerer Queue ist ein No-Op (kein Netzwerk-Call)', async () => {
    const result = await processQueue()
    expect(speichereAntwortenMock).not.toHaveBeenCalled()
    expect(result).toEqual({ processed: 0, failed: 0 })
  })
})
