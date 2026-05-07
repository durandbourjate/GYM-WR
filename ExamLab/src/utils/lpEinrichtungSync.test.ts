import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  SYNC_KEY,
  UEBUNG_SYNC_KEY,
  getSyncVersion,
  getUebungSyncVersion,
  syncFragenSeriell,
  syncEinrichtungsPruefung,
  syncEinrichtungsUebung,
} from './lpEinrichtungSync'
import { einrichtungsPruefung } from '../data/einrichtungsPruefung'
import { einrichtungsFragen } from '../data/einrichtungsFragen'
import { einrichtungsUebung } from '../data/einrichtungsUebung'
import { einrichtungsUebungFragen } from '../data/einrichtungsUebungFragen'

vi.mock('../services/fragensammlungApi', () => ({
  speichereConfig: vi.fn().mockResolvedValue(undefined),
  speichereFrage: vi.fn().mockResolvedValue(undefined),
}))

import { speichereConfig, speichereFrage } from '../services/fragensammlungApi'

describe('lpEinrichtungSync', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('getSyncVersion() ist deterministisch aus einrichtungsPruefung-Feldern', () => {
    expect(getSyncVersion()).toBe(
      `${einrichtungsPruefung.id}-${einrichtungsPruefung.gesamtpunkte}-${einrichtungsPruefung.typ}-${einrichtungsFragen.length}`
    )
  })

  it('getUebungSyncVersion() ist deterministisch aus einrichtungsUebung-Feldern', () => {
    expect(getUebungSyncVersion()).toBe(
      `${einrichtungsUebung.id}-${einrichtungsUebung.gesamtpunkte}-${einrichtungsUebungFragen.length}`
    )
  })

  it('syncFragenSeriell ruft speichereFrage seriell mit 200ms Pause', async () => {
    const fragen = einrichtungsFragen.slice(0, 3)
    const promise = syncFragenSeriell('test@example.com', fragen)
    // Erste Frage: speichereFrage sofort
    await vi.runAllTicks()
    expect(speichereFrage).toHaveBeenCalledTimes(1)
    // Pause 200ms → zweite Frage
    await vi.advanceTimersByTimeAsync(200)
    expect(speichereFrage).toHaveBeenCalledTimes(2)
    await vi.advanceTimersByTimeAsync(200)
    expect(speichereFrage).toHaveBeenCalledTimes(3)
    await vi.advanceTimersByTimeAsync(200)
    await promise
    expect(speichereFrage).toHaveBeenCalledTimes(3)
  })

  it('syncEinrichtungsPruefung skipt wenn localStorage-Guard match', async () => {
    localStorage.setItem(SYNC_KEY, getSyncVersion())
    const onError = vi.fn()
    await syncEinrichtungsPruefung('test@example.com', onError)
    expect(speichereConfig).not.toHaveBeenCalled()
    expect(speichereFrage).not.toHaveBeenCalled()
    expect(onError).not.toHaveBeenCalled()
  })

  it('syncEinrichtungsPruefung speichert Config zuerst, dann Fragen seriell, setzt Guard', async () => {
    const onError = vi.fn()
    const promise = syncEinrichtungsPruefung('test@example.com', onError)
    // Erst speichereConfig (microtask flush)
    await vi.advanceTimersByTimeAsync(0)
    expect(speichereConfig).toHaveBeenCalledTimes(1)
    // Fragen seriell mit 200ms Pause: alle nacheinander
    for (let i = 0; i < einrichtungsFragen.length; i++) {
      await vi.advanceTimersByTimeAsync(200)
    }
    await promise
    expect(speichereFrage).toHaveBeenCalledTimes(einrichtungsFragen.length)
    expect(localStorage.getItem(SYNC_KEY)).toBe(getSyncVersion())
    expect(onError).not.toHaveBeenCalled()
  })

  it('syncEinrichtungsPruefung ruft onError bei Backend-Fehler', async () => {
    vi.mocked(speichereConfig).mockRejectedValueOnce(new Error('backend down'))
    const onError = vi.fn()
    await syncEinrichtungsPruefung('test@example.com', onError)
    expect(onError).toHaveBeenCalledWith(
      expect.stringContaining('Einrichtungsprüfung konnte nicht synchronisiert werden')
    )
    // Guard wurde NICHT gesetzt (Sync schlug fehl)
    expect(localStorage.getItem(SYNC_KEY)).toBeNull()
  })

  it('syncEinrichtungsUebung analog: Guard + Sync-Reihenfolge', async () => {
    const onError = vi.fn()
    const promise = syncEinrichtungsUebung('test@example.com', onError)
    await vi.advanceTimersByTimeAsync(0)
    expect(speichereConfig).toHaveBeenCalledTimes(1)
    for (let i = 0; i < einrichtungsUebungFragen.length; i++) {
      await vi.advanceTimersByTimeAsync(200)
    }
    await promise
    expect(speichereFrage).toHaveBeenCalledTimes(einrichtungsUebungFragen.length)
    expect(localStorage.getItem(UEBUNG_SYNC_KEY)).toBe(getUebungSyncVersion())
    expect(onError).not.toHaveBeenCalled()
  })
})
