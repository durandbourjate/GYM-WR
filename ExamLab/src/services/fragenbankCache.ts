// src/services/fragenbankCache.ts
import type { Frage, FrageSummary } from '../types/fragen.ts'

const IDB_NAME = 'examlab-fragenbank-cache'
const IDB_VERSION = 1
const STORE_SUMMARIES = 'summaries'
const STORE_DETAILS = 'details'
const STORE_META = 'meta'

// Cache-Gültigkeit: 10 Minuten (Multi-Teacher)
const CACHE_MAX_AGE_MS = 10 * 60 * 1000

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
      if (!db.objectStoreNames.contains(STORE_SUMMARIES)) {
        db.createObjectStore(STORE_SUMMARIES)
      }
      if (!db.objectStoreNames.contains(STORE_DETAILS)) {
        db.createObjectStore(STORE_DETAILS)
      }
      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META)
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

/** Summaries aus Cache lesen. Gibt null zurück wenn Cache leer oder abgelaufen. */
export async function getCachedSummaries(): Promise<FrageSummary[] | null> {
  try {
    const db = await openDB()
    const tx = db.transaction([STORE_SUMMARIES, STORE_META], 'readonly')
    const meta = await idbGet<CacheMeta>(tx.objectStore(STORE_META), 'summaries')
    if (!meta || !isCacheValid(meta)) return null
    const data = await idbGet<FrageSummary[]>(tx.objectStore(STORE_SUMMARIES), 'data')
    return data || null
  } catch {
    return null
  }
}

/** Summaries in Cache schreiben. Fehler werden silent ignoriert. */
export async function setCachedSummaries(summaries: FrageSummary[]): Promise<void> {
  try {
    const db = await openDB()
    const tx = db.transaction([STORE_SUMMARIES, STORE_META], 'readwrite')
    tx.objectStore(STORE_SUMMARIES).put(summaries, 'data')
    tx.objectStore(STORE_META).put({
      key: 'summaries',
      timestamp: new Date().toISOString(),
      count: summaries.length,
    } satisfies CacheMeta, 'summaries')
  } catch {
    // Silent — App funktioniert ohne Cache
  }
}

/** Details aus Cache lesen. Gibt null zurück wenn leer/abgelaufen. */
export async function getCachedDetails(): Promise<Frage[] | null> {
  try {
    const db = await openDB()
    const tx = db.transaction([STORE_DETAILS, STORE_META], 'readonly')
    const meta = await idbGet<CacheMeta>(tx.objectStore(STORE_META), 'details')
    if (!meta || !isCacheValid(meta)) return null
    const data = await idbGet<Frage[]>(tx.objectStore(STORE_DETAILS), 'data')
    return data || null
  } catch {
    return null
  }
}

/** Details in Cache schreiben. */
export async function setCachedDetails(details: Frage[]): Promise<void> {
  try {
    const db = await openDB()
    const tx = db.transaction([STORE_DETAILS, STORE_META], 'readwrite')
    tx.objectStore(STORE_DETAILS).put(details, 'data')
    tx.objectStore(STORE_META).put({
      key: 'details',
      timestamp: new Date().toISOString(),
      count: details.length,
    } satisfies CacheMeta, 'details')
  } catch {
    // Silent
  }
}

/** Gesamten Fragenbank-Cache leeren (Logout, Invalidierung).
 * Wartet auf Transaktions-Commit — kritisch beim Logout, weil window.location.href
 * direkt danach den Page-Unload triggert und in-flight IDB-Transaktionen abbricht.
 */
export async function clearFragenbankCache(): Promise<void> {
  try {
    const db = await openDB()
    const tx = db.transaction([STORE_SUMMARIES, STORE_DETAILS, STORE_META], 'readwrite')
    tx.objectStore(STORE_SUMMARIES).clear()
    tx.objectStore(STORE_DETAILS).clear()
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
