/**
 * Integration-Tests: services/autoSave.ts (IndexedDB-Backup)
 *
 * autoSave.ts ist die letzte lokale Verteidigungslinie gegen Antwortverlust:
 * Alle 15s schreibt usePruefungsMonitoring die SuS-Antworten ins IndexedDB,
 * damit nach einem Reload/Crash der Recovery-Pfad sie wiederherstellen kann.
 * Diese Tests fixieren das Daten-Integritäts-Verhalten: Round-Trip,
 * "letzter Stand gewinnt" (kein Verlust bei schnellen Folge-Saves), Clear.
 *
 * Reales fake-indexeddb (über test-setup.ts global geladen) — kein Mock der
 * Persistenz, damit der echte IDB-Transaktions-Pfad getestet wird.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import {
  saveToIndexedDB,
  loadFromIndexedDB,
  clearIndexedDB,
} from '../services/autoSave'
import type { Antwort } from '../types/antworten'

const PID = 'pruefung-test-1'

const antwortenA: Record<string, Antwort> = {
  q1: { typ: 'freitext', text: 'erste Antwort' },
  q2: { typ: 'mc', gewaehlteOptionen: ['a'] },
}

const antwortenB: Record<string, Antwort> = {
  q1: { typ: 'freitext', text: 'KORRIGIERTE Antwort' },
  q2: { typ: 'mc', gewaehlteOptionen: ['a', 'b'] },
  q3: { typ: 'richtigfalsch', bewertungen: { s1: true } },
}

describe('autoSave.ts — IndexedDB-Backup (Daten-Integrität)', () => {
  beforeEach(async () => {
    await clearIndexedDB(PID)
    await clearIndexedDB('andere-pruefung')
  })

  it('Round-Trip: save → load liefert exakt dieselben Antworten + startzeit', async () => {
    await saveToIndexedDB(PID, antwortenA, '2026-05-29T08:00:00.000Z')
    const back = await loadFromIndexedDB(PID)
    expect(back).not.toBeNull()
    expect(back!.antworten).toEqual(antwortenA)
    expect(back!.startzeit).toBe('2026-05-29T08:00:00.000Z')
    expect(typeof back!.timestamp).toBe('string')
  })

  it('load auf leerem Store gibt null zurück (kein throw)', async () => {
    const back = await loadFromIndexedDB('noch-nie-gespeichert')
    expect(back).toBeNull()
  })

  it('letzter Save gewinnt: zweiter save überschreibt den ersten (kein Verlust des neuesten Stands)', async () => {
    await saveToIndexedDB(PID, antwortenA, '2026-05-29T08:00:00.000Z')
    // SuS tippt weiter → neuer, vollständigerer Stand
    await saveToIndexedDB(PID, antwortenB, '2026-05-29T08:00:00.000Z')
    const back = await loadFromIndexedDB(PID)
    // Der NEUESTE Stand muss persistiert sein — nicht der alte.
    expect(back!.antworten).toEqual(antwortenB)
    expect(back!.antworten.q1).toEqual({ typ: 'freitext', text: 'KORRIGIERTE Antwort' })
    expect(Object.keys(back!.antworten)).toHaveLength(3)
  })

  it('isoliert pro pruefungId: Save unter A beeinflusst B nicht', async () => {
    await saveToIndexedDB(PID, antwortenA, null)
    await saveToIndexedDB('andere-pruefung', antwortenB, null)
    const a = await loadFromIndexedDB(PID)
    const b = await loadFromIndexedDB('andere-pruefung')
    expect(a!.antworten).toEqual(antwortenA)
    expect(b!.antworten).toEqual(antwortenB)
  })

  it('clearIndexedDB entfernt den Backup-Eintrag → danach load=null', async () => {
    await saveToIndexedDB(PID, antwortenA, '2026-05-29T08:00:00.000Z')
    expect(await loadFromIndexedDB(PID)).not.toBeNull()
    await clearIndexedDB(PID)
    expect(await loadFromIndexedDB(PID)).toBeNull()
  })

  it('startzeit=null wird unverfälscht gespeichert und gelesen', async () => {
    await saveToIndexedDB(PID, antwortenA, null)
    const back = await loadFromIndexedDB(PID)
    expect(back!.startzeit).toBeNull()
  })
})
