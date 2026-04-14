/**
 * Retry-Queue: Speichert fehlgeschlagene Remote-Saves in IndexedDB
 * und sendet sie erneut, wenn die Verbindung wiederhergestellt wird.
 */

import { apiService } from './apiService.ts'
import type { Antwort } from '../types/antworten.ts'

const DB_NAME = 'pruefung-retry-queue'
const DB_VERSION = 1
const STORE_NAME = 'pendingSaves'

interface PendingSave {
  id: number
  timestamp: string
  pruefungId: string
  email: string
  antworten: Record<string, Antwort>
  version: number
  istAbgabe: boolean
  retryCount: number
  requestId?: string
}

/** Öffnet die IndexedDB-Datenbank */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

/** Fügt einen fehlgeschlagenen Save zur Queue hinzu */
export async function enqueue(payload: {
  pruefungId: string
  email: string
  antworten: Record<string, Antwort>
  version: number
  istAbgabe: boolean
  requestId?: string
}): Promise<void> {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    store.add({
      ...payload,
      timestamp: new Date().toISOString(),
      retryCount: 0,
    })
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
    db.close()
  } catch (error) {
    console.error('[RetryQueue] Enqueue fehlgeschlagen:', error)
  }
}

/** Verarbeitet alle ausstehenden Saves in der Queue */
export async function processQueue(): Promise<{ processed: number; failed: number }> {
  let processed = 0
  let failed = 0

  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const request = store.getAll()

    const items: PendingSave[] = await new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })

    for (const item of items) {
      const erfolg = await apiService.speichereAntworten({
        pruefungId: item.pruefungId,
        email: item.email,
        antworten: item.antworten,
        version: item.version,
        istAbgabe: item.istAbgabe,
        requestId: item.requestId,
      })

      if (erfolg) {
        // Erfolgreich → aus Queue entfernen
        const deleteTx = db.transaction(STORE_NAME, 'readwrite')
        deleteTx.objectStore(STORE_NAME).delete(item.id)
        await new Promise<void>((resolve) => {
          deleteTx.oncomplete = () => resolve()
        })
        processed++
      } else if (item.retryCount >= 5) {
        // Max Retries erreicht → entfernen (Daten sind in localStorage gesichert)
        const deleteTx = db.transaction(STORE_NAME, 'readwrite')
        deleteTx.objectStore(STORE_NAME).delete(item.id)
        await new Promise<void>((resolve) => {
          deleteTx.oncomplete = () => resolve()
        })
        console.warn('[RetryQueue] Max Retries erreicht, Item entfernt:', item.id)
        failed++
      } else {
        // Retry-Count hochzählen
        const updateTx = db.transaction(STORE_NAME, 'readwrite')
        updateTx.objectStore(STORE_NAME).put({ ...item, retryCount: item.retryCount + 1 })
        await new Promise<void>((resolve) => {
          updateTx.oncomplete = () => resolve()
        })
        failed++
      }
    }

    db.close()
  } catch (error) {
    console.error('[RetryQueue] Queue-Verarbeitung fehlgeschlagen:', error)
  }

  if (processed > 0) {
    console.log(`[RetryQueue] ${processed} Saves erfolgreich übertragen`)
  }
  if (failed > 0) {
    console.warn(`[RetryQueue] ${failed} Saves noch ausstehend`)
  }

  return { processed, failed }
}

/** Gibt die Anzahl der ausstehenden Saves zurück */
export async function queueSize(): Promise<number> {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const request = store.count()
    const count = await new Promise<number>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    db.close()
    return count
  } catch {
    return 0
  }
}

/** Leert die gesamte Queue */
export async function clearQueue(): Promise<void> {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).clear()
    await new Promise<void>((resolve) => {
      tx.oncomplete = () => resolve()
    })
    db.close()
  } catch (error) {
    console.error('[RetryQueue] Queue leeren fehlgeschlagen:', error)
  }
}
