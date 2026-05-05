/**
 * Draft-API: Papierkorb-Endpoints (Bundle 3)
 *
 * Alle Endpoints sind LP-only und brauchen `email` im Payload.
 * Memory S130-Pattern: postJson<T>-Cast ist Lüge, manuelles unwrap via Helper.
 */
import { postJson } from './apiClient'
import type { Frage } from '../types/fragen-storage'

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

/** Frage aus Papierkorb wiederherstellen (LP-only) */
export async function stelleWiederHer(params: {
  email: string
  frageId: string
  fachbereich: string
}): Promise<{ success: true; id: string }> {
  const r = await postJson<ApiResponse>('stelleWiederHer', params)
  const u = unwrap(r, 'stelleWiederHer')
  return { success: true, id: u['id'] as string }
}

/** Frage permanent löschen (LP-only, nicht umkehrbar) */
export async function hardDeleteFrage(params: {
  email: string
  frageId: string
  fachbereich: string
}): Promise<{ success: true }> {
  const r = await postJson<ApiResponse>('hardDeleteFrage', params)
  unwrap(r, 'hardDeleteFrage')
  return { success: true }
}

/** Alle Fragen im Papierkorb laden (LP-only) */
export async function listePapierkorb(params: {
  email: string
}): Promise<Frage[]> {
  const r = await postJson<ApiResponse & { fragen?: Frage[] }>('listePapierkorb', params)
  const u = unwrap(r, 'listePapierkorb')
  return u.fragen ?? []
}
