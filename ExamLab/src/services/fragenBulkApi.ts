/**
 * Cluster D Phase 1b — Bulk-API für Multi-Frage-Update + Multi-Frage-Soft-Delete.
 *
 * Memory-Patterns aktiv:
 *  - feedback_service_wrapper_email_pflicht.md (email als Pflicht-Param)
 *  - tagsApi.ts unwrap-Pattern (Memory S130 — postJson<T>-Cast ist Lüge)
 *
 * Wire-Vertrag: action='apiBulkUpdateFragen' und 'apiBulkLoescheFragen'.
 * Backend implementiert die finale Hybrid-Logic + Audit-Log (siehe apps-script-code.js).
 */
import { postJson } from './apiClient'

interface ApiResponse {
  success?: boolean
  error?: string
  [key: string]: unknown
}

export interface FragenBulkPatch {
  fachbereich?: 'VWL' | 'BWL' | 'Recht' | 'Informatik' | 'Allgemein'
  bloom?: 'K1' | 'K2' | 'K3' | 'K4' | 'K5' | 'K6'
  status?: 'draft' | 'sammlung'
  gefaesse?: string[]
  semester?: string[]
  lernzielIds?: string[]
  // Mutually exclusive Tag-Modi (Frontend + Backend prüfen beide)
  tagsHinzufuegen?: string[]
  tagsErsetzen?: string[]
  tagsEntfernen?: string[]
}

export interface FragenBulkResult {
  erfolgreich: number
  affectedIds: string[]
  fehlgeschlagen: string[]
}

function unwrap<T extends ApiResponse>(r: T | null, action: string): T {
  if (!r) throw new Error(`${action}: keine Antwort vom Server`)
  if (r.success === false) throw new Error(r.error || `${action}: fehlgeschlagen`)
  return r
}

function validateMutuallyExclusive(patch: FragenBulkPatch): void {
  const count = [patch.tagsHinzufuegen, patch.tagsErsetzen, patch.tagsEntfernen].filter(
    (x) => x !== undefined,
  ).length
  if (count > 1) {
    throw new Error(
      'Nur einer von tagsHinzufuegen/tagsErsetzen/tagsEntfernen darf gesetzt sein',
    )
  }
}

/**
 * Bulk-Update mit dem gegebenen Patch auf alle IDs.
 * Partial-Update: nur die im Patch enthaltenen Felder werden geschrieben.
 * Tag-Modi (tagsHinzufuegen/tagsErsetzen/tagsEntfernen) sind mutually exclusive.
 */
export async function bulkUpdateFragen(
  ids: string[],
  patch: FragenBulkPatch,
  email: string,
): Promise<FragenBulkResult> {
  validateMutuallyExclusive(patch)
  const r = await postJson<ApiResponse & Partial<FragenBulkResult>>('apiBulkUpdateFragen', {
    email,
    ids,
    patch,
  })
  const u = unwrap(r, 'apiBulkUpdateFragen')
  return {
    erfolgreich: u.erfolgreich ?? 0,
    affectedIds: u.affectedIds ?? [],
    fehlgeschlagen: u.fehlgeschlagen ?? [],
  }
}

/**
 * Soft-Delete (Papierkorb) für alle IDs.
 * Setzt geloescht_am-Timestamp pro Frage analog zu loescheFrage.
 */
export async function bulkLoescheFragen(
  ids: string[],
  email: string,
): Promise<FragenBulkResult> {
  const r = await postJson<ApiResponse & Partial<FragenBulkResult>>('apiBulkLoescheFragen', {
    email,
    ids,
  })
  const u = unwrap(r, 'apiBulkLoescheFragen')
  return {
    erfolgreich: u.erfolgreich ?? 0,
    affectedIds: u.affectedIds ?? [],
    fehlgeschlagen: u.fehlgeschlagen ?? [],
  }
}
