import type { PruefungsNachricht } from '../types/monitoring.ts'
import { APPS_SCRIPT_URL } from './apiClient'

/** Nachrichten für eine Person laden (SuS oder LP) — gibt [] statt null zurück */
export async function ladeNachrichten(pruefungId: string, email: string): Promise<PruefungsNachricht[]> {
  if (!APPS_SCRIPT_URL) return []

  try {
    const url = `${APPS_SCRIPT_URL}?action=ladeNachrichten&id=${encodeURIComponent(pruefungId)}&email=${encodeURIComponent(email)}`
    const response = await fetch(url)
    if (!response.ok) return []

    const text = await response.text()
    try {
      const data = JSON.parse(text)
      if (data.error) {
        console.error('[API] ladeNachrichten:', data.error)
        return []
      }
      return data.nachrichten ?? []
    } catch {
      console.error('[API] ladeNachrichten: Antwort ist kein JSON')
      return []
    }
  } catch (error) {
    console.error('[API] ladeNachrichten: Netzwerkfehler:', error)
    return []
  }
}
