/**
 * API für den Prüfungstracker — Aggregierte Übersicht aller Prüfungen.
 */
import { postJson } from '../apiClient.ts'
import type { TrackerDaten } from '../../types/tracker.ts'

/** Lädt aggregierte Tracker-Daten für alle Prüfungen der LP */
export async function ladeTrackerDaten(email: string): Promise<TrackerDaten | null> {
  return postJson<TrackerDaten>('ladeTrackerDaten', { email })
}
