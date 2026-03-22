import type { MonitoringDaten } from '../types/monitoring.ts'
import { APPS_SCRIPT_URL } from './apiClient'

/** Monitoring-Daten für LP laden (alle SuS einer Prüfung) — verwendet response.json() direkt */
export async function ladeMonitoring(pruefungId: string, email: string): Promise<MonitoringDaten | null> {
  if (!APPS_SCRIPT_URL) return null

  try {
    const url = `${APPS_SCRIPT_URL}?action=monitoring&id=${encodeURIComponent(pruefungId)}&email=${encodeURIComponent(email)}`
    const response = await fetch(url)
    if (!response.ok) return null

    const data = await response.json()
    if (data.error) {
      console.error('[API] Monitoring-Fehler:', data.error)
      return null
    }
    return data as MonitoringDaten
  } catch (error) {
    console.error('[API] Monitoring-Netzwerkfehler:', error)
    return null
  }
}
