import type { Antwort } from '../types/antworten.ts'

const IDB_NAME = 'pruefung-backup'
const IDB_STORE = 'antworten'
const IDB_KORREKTUR_STORE = 'korrektur'
const IDB_VERSION = 2

// === IndexedDB Helpers ===

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IDB_NAME, IDB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE)
      }
      if (!db.objectStoreNames.contains(IDB_KORREKTUR_STORE)) {
        db.createObjectStore(IDB_KORREKTUR_STORE)
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function saveToIndexedDB(
  pruefungId: string,
  antworten: Record<string, Antwort>,
  startzeit: string | null
): Promise<void> {
  try {
    const db = await openDB()
    const tx = db.transaction(IDB_STORE, 'readwrite')
    const store = tx.objectStore(IDB_STORE)
    store.put(
      {
        antworten,
        startzeit,
        timestamp: new Date().toISOString(),
      },
      pruefungId
    )
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch (e) {
    console.warn('IndexedDB Save fehlgeschlagen:', e)
  }
}

export async function loadFromIndexedDB(
  pruefungId: string
): Promise<{ antworten: Record<string, Antwort>; startzeit: string | null; timestamp: string } | null> {
  try {
    const db = await openDB()
    const tx = db.transaction(IDB_STORE, 'readonly')
    const store = tx.objectStore(IDB_STORE)
    const request = store.get(pruefungId)
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result ?? null)
      request.onerror = () => reject(request.error)
    })
  } catch (e) {
    console.warn('IndexedDB Load fehlgeschlagen:', e)
    return null
  }
}

export async function clearIndexedDB(pruefungId: string): Promise<void> {
  try {
    const db = await openDB()
    const tx = db.transaction(IDB_STORE, 'readwrite')
    const store = tx.objectStore(IDB_STORE)
    store.delete(pruefungId)
    // tx.oncomplete-await ist kritisch wenn Caller direkt danach window.location.href
    // setzt: Browser bricht in-flight IDB-Tx beim Page-Unload ab. Siehe
    // .claude/rules/safety-pwa.md — "IndexedDB vor Hard-Navigation" (S149).
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
      tx.onabort = () => reject(tx.error ?? new Error('IDB transaction aborted'))
    })
  } catch (e) {
    console.warn('IndexedDB Clear fehlgeschlagen:', e)
  }
}

// === Korrektur-Backup (IndexedDB) ===

export async function saveKorrekturToIndexedDB(
  pruefungId: string,
  data: unknown
): Promise<void> {
  try {
    const db = await openDB()
    const tx = db.transaction(IDB_KORREKTUR_STORE, 'readwrite')
    const store = tx.objectStore(IDB_KORREKTUR_STORE)
    store.put(
      {
        data,
        timestamp: new Date().toISOString(),
      },
      pruefungId
    )
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch (e) {
    console.warn('IndexedDB Korrektur-Save fehlgeschlagen:', e)
  }
}

export async function loadKorrekturFromIndexedDB(
  pruefungId: string
): Promise<{ data: unknown; timestamp: string } | null> {
  try {
    const db = await openDB()
    const tx = db.transaction(IDB_KORREKTUR_STORE, 'readonly')
    const store = tx.objectStore(IDB_KORREKTUR_STORE)
    const request = store.get(pruefungId)
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result ?? null)
      request.onerror = () => reject(request.error)
    })
  } catch (e) {
    console.warn('IndexedDB Korrektur-Load fehlgeschlagen:', e)
    return null
  }
}

export async function clearKorrekturIndexedDB(pruefungId: string): Promise<void> {
  try {
    const db = await openDB()
    const tx = db.transaction(IDB_KORREKTUR_STORE, 'readwrite')
    const store = tx.objectStore(IDB_KORREKTUR_STORE)
    store.delete(pruefungId)
    // Analog clearIndexedDB: tx.oncomplete-await fuer Hard-Nav-Sicherheit.
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
      tx.onabort = () => reject(tx.error ?? new Error('IDB transaction aborted'))
    })
  } catch (e) {
    console.warn('IndexedDB Korrektur-Clear fehlgeschlagen:', e)
  }
}
