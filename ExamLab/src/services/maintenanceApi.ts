/**
 * Maintenance-API: Einmalige Wartungs-Operationen (Migration/Backfill).
 *
 * Alle Endpoints sind LP/Admin-only und brauchen `email` im Payload (Backend-Auth-Gate).
 * Memory S130-Pattern + Cluster H-Pattern (siehe tagsApi.ts): postJson<T>-Cast ist Lüge,
 * manuelles unwrap via Helper. So bekommt der UI-Caller im Fehlerfall den echten
 * Backend-Fehler-String statt einer generischen Meldung.
 */
import { postJson } from './apiClient'

interface ApiResponse {
  success?: boolean
  error?: string
  [key: string]: unknown
}

/**
 * Wirft Error bei null-Response oder success:false.
 * Gibt sonst das Response-Objekt zurück.
 */
function unwrap<T extends ApiResponse>(response: T | null, action: string): T {
  if (!response) throw new Error(`${action}: keine Antwort vom Server`)
  if (response.success === false) throw new Error(response.error || `${action}: fehlgeschlagen`)
  return response
}

export interface StatusBackfillErgebnis {
  count: number
  defaultWert: 'draft' | 'sammlung'
  dauerMs: number
}

/**
 * Cluster D Phase 0: Einmaliger Backfill, der alle Frage-Sheets mit leerer
 * status-Spalte auf Default 'sammlung' setzt. Idempotent — bereits gefüllte
 * Zeilen ('draft'/'sammlung') bleiben unangetastet. Admin-only.
 */
export async function backfillStatusDefault(params: {
  email: string
}): Promise<StatusBackfillErgebnis> {
  const r = await postJson<ApiResponse & { count?: number; defaultWert?: string; dauerMs?: number }>(
    'apiBackfillStatusDefault',
    params,
  )
  const u = unwrap(r, 'apiBackfillStatusDefault')
  return {
    count: Number(u.count ?? 0),
    defaultWert: u.defaultWert === 'draft' ? 'draft' : 'sammlung',
    dauerMs: Number(u.dauerMs ?? 0),
  }
}
