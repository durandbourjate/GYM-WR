import type { MonitoringDaten } from '../types/monitoring.ts'
import { getJson } from './apiClient'

/** Monitoring-Daten für LP laden (alle SuS einer Prüfung) */
export async function ladeMonitoring(
  pruefungId: string,
  email: string,
  options?: { signal?: AbortSignal }
): Promise<MonitoringDaten | null> {
  return getJson<MonitoringDaten>('monitoring', { id: pruefungId, email }, options)
}
