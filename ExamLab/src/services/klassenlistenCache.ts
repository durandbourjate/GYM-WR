// src/services/klassenlistenCache.ts
import type { KlassenlistenEintrag } from './klassenlistenApi'

const IDB_NAME = 'examlab-klassenlisten-cache'
const IDB_VERSION = 1
const STORE_DATA = 'data'
const STORE_META = 'meta'

// Cache-Gültigkeit: 24 h (Stammdaten ändern sich selten; LP hat Refresh-Button für Sofort-Invalidierung)
const CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000

interface CacheMeta {
  key: string
  timestamp: string
  count: number
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IDB_NAME, IDB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_DATA)) db.createObjectStore(STORE_DATA)
      if (!db.objectStoreNames.contains(STORE_META)) db.createObjectStore(STORE_META)
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

/** Cached Klassenlisten lesen. null bei leerem oder abgelaufenem Cache. */
export async function getCachedKlassenlisten(): Promise<KlassenlistenEintrag[] | null> {
  try {
    const db = await openDB()
    const tx = db.transaction([STORE_DATA, STORE_META], 'readonly')
    const meta = await idbGet<CacheMeta>(tx.objectStore(STORE_META), 'data')
    if (!meta || !isCacheValid(meta)) return null
    const data = await idbGet<KlassenlistenEintrag[]>(tx.objectStore(STORE_DATA), 'data')
    return data || null
  } catch {
    return null
  }
}

/** Klassenlisten in Cache schreiben. Fehler werden silent ignoriert. */
export async function setCachedKlassenlisten(eintraege: KlassenlistenEintrag[]): Promise<void> {
  try {
    const db = await openDB()
    const tx = db.transaction([STORE_DATA, STORE_META], 'readwrite')
    tx.objectStore(STORE_DATA).put(eintraege, 'data')
    tx.objectStore(STORE_META).put({
      key: 'data',
      timestamp: new Date().toISOString(),
      count: eintraege.length,
    } satisfies CacheMeta, 'data')
  } catch {
    // Silent — App funktioniert ohne Cache
  }
}

/** Klassenlisten-Cache leeren (Logout / Refresh).
 * Wartet auf tx.oncomplete — kritisch beim Logout, weil window.location.href
 * direkt danach den Page-Unload triggert (S149-Lehre, safety-pwa.md).
 */
export async function clearKlassenlistenCache(): Promise<void> {
  try {
    const db = await openDB()
    const tx = db.transaction([STORE_DATA, STORE_META], 'readwrite')
    tx.objectStore(STORE_DATA).clear()
    tx.objectStore(STORE_META).clear()
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
      tx.onabort = () => reject(tx.error ?? new Error('IDB transaction aborted'))
    })
  } catch {
    // Silent
  }
}

// --- Helpers ---

function isCacheValid(meta: CacheMeta): boolean {
  const age = Date.now() - new Date(meta.timestamp).getTime()
  return age < CACHE_MAX_AGE_MS
}

function idbGet<T>(store: IDBObjectStore, key: string): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    const req = store.get(key)
    req.onsuccess = () => resolve(req.result as T | undefined)
    req.onerror = () => reject(req.error)
  })
}
