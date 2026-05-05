import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getCachedGruppen, setCachedGruppen,
  getCachedMitglieder, setCachedMitglieder,
  clearGruppenCache,
} from '../services/gruppenCache'
import type { Gruppe, Mitglied } from '../types/ueben/gruppen'

const g1: Gruppe = {
  id: 'g1', name: 'Klasse 27a', typ: 'gym', adminEmail: 'lp@gymhofwil.ch',
  fragensammlungSheetId: 'sheet1', analytikSheetId: 'an1', mitglieder: [],
}
const g2: Gruppe = { ...g1, id: 'g2', name: 'Klasse 28b' }

const m1: Mitglied[] = [
  { email: 'a@stud.gymhofwil.ch', name: 'A.', rolle: 'lernend', beigetreten: '2026-04-01' },
]
const m2: Mitglied[] = [
  { email: 'b@stud.gymhofwil.ch', name: 'B.', rolle: 'lernend', beigetreten: '2026-04-02' },
]

describe('G.d.2 — gruppenCache', () => {
  beforeEach(async () => {
    await clearGruppenCache()
  })

  it('Gruppen round-trip', async () => {
    await setCachedGruppen([g1, g2])
    expect(await getCachedGruppen()).toEqual([g1, g2])
  })

  it('Gruppen leer → null', async () => {
    expect(await getCachedGruppen()).toBeNull()
  })

  it('Mitglieder pro gruppeId getrennt cachen', async () => {
    await setCachedMitglieder('g1', m1)
    await setCachedMitglieder('g2', m2)
    expect(await getCachedMitglieder('g1')).toEqual(m1)
    expect(await getCachedMitglieder('g2')).toEqual(m2)
  })

  it('Mitglieder unbekannte gruppeId → null', async () => {
    expect(await getCachedMitglieder('nonexistent')).toBeNull()
  })

  it('TTL abgelaufen (Gruppen-Meta manuell auf 25 h zurück) → null', async () => {
    await setCachedGruppen([g1])
    await new Promise<void>((resolve, reject) => {
      const req = indexedDB.open('examlab-gruppen-cache', 1)
      req.onsuccess = () => {
        const db = req.result
        const tx = db.transaction(['meta'], 'readwrite')
        const oldIso = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString()
        tx.objectStore('meta').put({ key: 'gruppen', timestamp: oldIso, count: 1 }, 'gruppen')
        tx.oncomplete = () => { db.close(); resolve() }
        tx.onerror = () => reject(tx.error)
      }
      req.onerror = () => reject(req.error)
    })
    expect(await getCachedGruppen()).toBeNull()
  })

  it('Mitglieder-TTL pro Gruppe abgelaufen → null nur für diese ID', async () => {
    await setCachedMitglieder('g1', m1)
    await setCachedMitglieder('g2', m2)
    // Nur g1-Meta auf 25 h zurücksetzen
    await new Promise<void>((resolve, reject) => {
      const req = indexedDB.open('examlab-gruppen-cache', 1)
      req.onsuccess = () => {
        const db = req.result
        const tx = db.transaction(['meta'], 'readwrite')
        const oldIso = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString()
        tx.objectStore('meta').put({ key: 'mitglieder:g1', timestamp: oldIso, count: 1 }, 'mitglieder:g1')
        tx.oncomplete = () => { db.close(); resolve() }
        tx.onerror = () => reject(tx.error)
      }
      req.onerror = () => reject(req.error)
    })
    expect(await getCachedMitglieder('g1')).toBeNull()
    expect(await getCachedMitglieder('g2')).toEqual(m2)
  })

  it('clearGruppenCache leert Gruppen + Mitglieder + Meta', async () => {
    await setCachedGruppen([g1])
    await setCachedMitglieder('g1', m1)
    await clearGruppenCache()
    expect(await getCachedGruppen()).toBeNull()
    expect(await getCachedMitglieder('g1')).toBeNull()
  })

  it('setCachedGruppen ist silent-fail bei IDB-Fehler', async () => {
    const spy = vi.spyOn(indexedDB, 'open').mockImplementation(() => { throw new Error('defekt') })
    await expect(setCachedGruppen([g1])).resolves.toBeUndefined()
    spy.mockRestore()
  })
})
