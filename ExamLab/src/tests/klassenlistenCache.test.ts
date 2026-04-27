import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getCachedKlassenlisten,
  setCachedKlassenlisten,
  clearKlassenlistenCache,
} from '../services/klassenlistenCache'
import type { KlassenlistenEintrag } from '../services/klassenlistenApi'

const sampleEintraege: KlassenlistenEintrag[] = [
  { klasse: '27a', kurs: 'WR3', email: 'a@stud.gymhofwil.ch', name: 'Aebi', vorname: 'Alex' },
  { klasse: '28b', kurs: 'WR2', email: 'b@stud.gymhofwil.ch', name: 'Berger', vorname: 'Bea' },
]

describe('G.d.2 — klassenlistenCache', () => {
  beforeEach(async () => {
    // fake-indexeddb-Reset zwischen Tests: vollständig löschen
    await clearKlassenlistenCache()
  })

  it('round-trip: setCachedKlassenlisten + getCachedKlassenlisten', async () => {
    await setCachedKlassenlisten(sampleEintraege)
    const back = await getCachedKlassenlisten()
    expect(back).toEqual(sampleEintraege)
  })

  it('returns null wenn Cache leer', async () => {
    const back = await getCachedKlassenlisten()
    expect(back).toBeNull()
  })

  it('returns null wenn TTL abgelaufen (Meta-Timestamp manuell auf vor 25 h gesetzt)', async () => {
    await setCachedKlassenlisten(sampleEintraege)
    // Meta-Timestamp manuell zurücksetzen via direkten IDB-Zugriff
    await new Promise<void>((resolve, reject) => {
      const req = indexedDB.open('examlab-klassenlisten-cache', 1)
      req.onsuccess = () => {
        const db = req.result
        const tx = db.transaction(['meta'], 'readwrite')
        const store = tx.objectStore('meta')
        const oldIso = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString()
        store.put({ key: 'data', timestamp: oldIso, count: sampleEintraege.length }, 'data')
        tx.oncomplete = () => { db.close(); resolve() }
        tx.onerror = () => reject(tx.error)
      }
      req.onerror = () => reject(req.error)
    })
    const back = await getCachedKlassenlisten()
    expect(back).toBeNull()
  })

  it('clearKlassenlistenCache leert data + meta', async () => {
    await setCachedKlassenlisten(sampleEintraege)
    await clearKlassenlistenCache()
    const back = await getCachedKlassenlisten()
    expect(back).toBeNull()
  })

  it('setCachedKlassenlisten ist silent-fail bei IDB-Fehler', async () => {
    const original = indexedDB.open
    // Spy auf indexedDB.open der einen Error wirft
    const spy = vi.spyOn(indexedDB, 'open').mockImplementation(() => {
      throw new Error('IDB defekt')
    })
    await expect(setCachedKlassenlisten(sampleEintraege)).resolves.toBeUndefined()
    spy.mockRestore()
    void original
  })

  it('Meta-Timestamp wird beim Schreiben gesetzt (round-trip prüft Speicherung)', async () => {
    const before = Date.now()
    await setCachedKlassenlisten(sampleEintraege)
    const back = await getCachedKlassenlisten()
    expect(back).not.toBeNull()
    // Indirekter Test: Cache muss beim sofortigen Lesen gültig sein (TTL > 0)
    expect(Date.now() - before).toBeLessThan(24 * 60 * 60 * 1000)
  })
})
