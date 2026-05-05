/**
 * draftSync.test.ts — Bundle 3 Phase B.2
 *
 * 8 TDD-Cases für Hybrid IDB+Server-Sync:
 *   Case 1: tippeFrage triggert IDB-Update nach 1s
 *   Case 2: tippeFrage triggert Server-Sync nach 10s
 *   Case 3: Konsekutive tippeFrage resettet beide Debouncer
 *   Case 4: finalisiere führt synchronen Server-Sync mit await
 *   Case 5: Server-Sync 5xx → exp. backoff Retry 3x
 *   Case 6: Server-Sync 401 → eskaliert (sessionWiederherstellen nicht im LP-Auth)
 *   Case 7: Server-Sync 4xx (außer 401/429) → eskaliert sofort
 *   Case 8: BroadcastChannel-Update von anderem Tab → in-Memory-State
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { Frage } from '../types/fragen-storage'

// === BroadcastChannel-Stub für jsdom (jsdom 29 unterstützt es nicht nativ) ===
// Globaler Mini-Hub: alle Channels mit gleichem Namen empfangen jede postMessage.
class StubBroadcastChannel {
  static channels: Map<string, Set<StubBroadcastChannel>> = new Map()
  name: string
  onmessage: ((ev: MessageEvent) => void) | null = null
  private listeners: Array<(ev: MessageEvent) => void> = []
  constructor(name: string) {
    this.name = name
    if (!StubBroadcastChannel.channels.has(name)) StubBroadcastChannel.channels.set(name, new Set())
    StubBroadcastChannel.channels.get(name)!.add(this)
  }
  postMessage(data: unknown): void {
    const peers = StubBroadcastChannel.channels.get(this.name)
    if (!peers) return
    for (const peer of peers) {
      if (peer === this) continue
      const ev = { data } as MessageEvent
      if (peer.onmessage) peer.onmessage(ev)
      for (const fn of peer.listeners) fn(ev)
    }
  }
  addEventListener(_type: string, fn: (ev: MessageEvent) => void): void {
    this.listeners.push(fn)
  }
  removeEventListener(_type: string, fn: (ev: MessageEvent) => void): void {
    this.listeners = this.listeners.filter((l) => l !== fn)
  }
  close(): void {
    StubBroadcastChannel.channels.get(this.name)?.delete(this)
  }
  static reset(): void {
    StubBroadcastChannel.channels.clear()
  }
}
;(globalThis as unknown as { BroadcastChannel: typeof StubBroadcastChannel }).BroadcastChannel =
  StubBroadcastChannel

// === Mocks ===
vi.mock('idb-keyval', () => ({
  get: vi.fn(),
  set: vi.fn().mockResolvedValue(undefined),
  del: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('./fragenbankApi', () => ({
  speichereFrageMitStatus: vi.fn(),
}))

import { set as idbSet } from 'idb-keyval'
import { speichereFrageMitStatus } from './fragenbankApi'
import { tippeFrage, finalisiere, subscribe, resetForTesting } from './draftSync'

// Minimale Frage-Form für Tests (Cast über unknown für Test-Zwecke)
const testFrage = {
  id: 'f1',
  typ: 'mc',
  fachbereich: 'BWL',
  frage: 'Test',
} as unknown as Frage

beforeEach(() => {
  vi.useFakeTimers()
  vi.mocked(idbSet).mockReset().mockResolvedValue(undefined)
  vi.mocked(speichereFrageMitStatus)
    .mockReset()
    .mockResolvedValue({ success: true, status: 'sammlung' })
  StubBroadcastChannel.reset()
  resetForTesting()
})

afterEach(() => {
  vi.useRealTimers()
  StubBroadcastChannel.reset()
})

describe('draftSync', () => {
  it('Case 1: tippeFrage triggert IDB-Update nach 1s', async () => {
    tippeFrage('a@b.ch', testFrage)
    await vi.advanceTimersByTimeAsync(999)
    expect(idbSet).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(2)
    expect(idbSet).toHaveBeenCalledWith(
      'draft:f1',
      expect.objectContaining({ id: 'f1' }),
    )
  })

  it('Case 2: tippeFrage triggert Server-Sync nach 10s', async () => {
    tippeFrage('a@b.ch', testFrage)
    await vi.advanceTimersByTimeAsync(9999)
    expect(speichereFrageMitStatus).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(2)
    expect(speichereFrageMitStatus).toHaveBeenCalledWith('a@b.ch', testFrage)
  })

  it('Case 3: Konsekutive tippeFrage resettet beide Debouncer', async () => {
    tippeFrage('a@b.ch', testFrage)
    await vi.advanceTimersByTimeAsync(500)
    tippeFrage('a@b.ch', testFrage) // Reset Debouncer
    await vi.advanceTimersByTimeAsync(500)
    // Erster wäre nach 1000ms gefeuert, sollte aber resettet sein
    expect(idbSet).not.toHaveBeenCalled()
    expect(speichereFrageMitStatus).not.toHaveBeenCalled()
    // Nach weiteren 600ms (insg 1100ms seit zweitem tippe): IDB sollte gefeuert haben
    await vi.advanceTimersByTimeAsync(600)
    expect(idbSet).toHaveBeenCalledTimes(1)
    expect(speichereFrageMitStatus).not.toHaveBeenCalled()
  })

  it('Case 4: finalisiere führt synchronen Server-Sync mit await', async () => {
    const promise = finalisiere('a@b.ch', testFrage)
    // finalisiere darf NICHT auf Debouncer warten — direkt Server-Call
    await vi.advanceTimersByTimeAsync(0)
    await promise
    expect(speichereFrageMitStatus).toHaveBeenCalledWith('a@b.ch', testFrage)
  })

  it('Case 5: Server-Sync 5xx → exp. backoff Retry 3x', async () => {
    vi.mocked(speichereFrageMitStatus)
      .mockResolvedValueOnce({ success: false, errorStatus: 500 })
      .mockResolvedValueOnce({ success: false, errorStatus: 502 })
      .mockResolvedValueOnce({ success: false, errorStatus: 503 })
      .mockResolvedValueOnce({ success: true, status: 'sammlung' })

    const states: string[] = []
    subscribe('f1', (s) => states.push(s.status))

    tippeFrage('a@b.ch', testFrage)
    await vi.advanceTimersByTimeAsync(10_000) // erster Sync
    await vi.advanceTimersByTimeAsync(1_000) // backoff 1s → retry 2
    await vi.advanceTimersByTimeAsync(2_000) // backoff 2s → retry 3
    await vi.advanceTimersByTimeAsync(4_000) // backoff 4s → retry 4 (success)
    expect(speichereFrageMitStatus).toHaveBeenCalledTimes(4)
    // Endstatus 'sauber' nach erfolgreichem Retry
    expect(states[states.length - 1]).toBe('sauber')
  })

  it('Case 6: Server-Sync 401 → eskaliert (kein sessionWiederherstellen im LP-Auth)', async () => {
    vi.mocked(speichereFrageMitStatus).mockResolvedValue({ success: false, errorStatus: 401 })

    const states: string[] = []
    subscribe('f1', (s) => states.push(s.status))

    tippeFrage('a@b.ch', testFrage)
    await vi.advanceTimersByTimeAsync(10_000)
    await vi.runAllTimersAsync()

    // Bei fehlendem sessionWiederherstellen-Hook → 401 wie 4xx → eskalieren
    expect(states).toContain('server-down')
  })

  it('Case 7: Server-Sync 4xx (außer 401/429) → eskaliert sofort', async () => {
    vi.mocked(speichereFrageMitStatus).mockResolvedValue({ success: false, errorStatus: 400 })

    const states: string[] = []
    subscribe('f1', (s) => states.push(s.status))

    tippeFrage('a@b.ch', testFrage)
    await vi.advanceTimersByTimeAsync(10_000)
    await vi.runAllTimersAsync()

    // 1 Call (kein Retry), Status auf 'server-down'
    expect(speichereFrageMitStatus).toHaveBeenCalledTimes(1)
    expect(states).toContain('server-down')
  })

  it('Case 8: BroadcastChannel-Update von anderem Tab → in-Memory-State', async () => {
    const callback = vi.fn()
    subscribe('f1', callback)

    // Simuliere "anderer Tab" sendet BroadcastChannel-Update
    const otherTab = new StubBroadcastChannel('bundle3-drafts')
    otherTab.postMessage({
      type: 'draft-updated',
      frageId: 'f1',
      status: 'entwurf',
      pruefungstauglich: false,
    })

    await vi.runAllTimersAsync()

    expect(callback).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'entwurf', pruefungstauglich: false }),
    )
    otherTab.close()
  })
})
