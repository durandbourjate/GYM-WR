import { getQueue, removeFromQueue } from './offlineQueue'
import { apiClient } from '../services/apiClient'

let syncing = false

export function initSyncManager(): void {
  window.addEventListener('online', () => flushQueue())
}

export async function flushQueue(): Promise<void> {
  if (syncing || !navigator.onLine) return
  syncing = true
  try {
    const queue = await getQueue()
    for (const item of queue) {
      try {
        const token = getTokenFromStorage()
        await apiClient.post(item.action, item.payload, token)
        await removeFromQueue(item.id)
      } catch {
        break // Beim ersten Fehler abbrechen, spaeter nochmal versuchen
      }
    }
  } finally { syncing = false }
}

function getTokenFromStorage(): string | undefined {
  try {
    const stored = localStorage.getItem('lernplattform-auth')
    return stored ? JSON.parse(stored).sessionToken : undefined
  } catch { return undefined }
}
