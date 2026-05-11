import type { Problemmeldung } from '../types/problemmeldung'
import { postJson } from './apiClient'

interface ListResponse { success: boolean; data?: Problemmeldung[]; error?: string }
interface ToggleResponse { success: boolean; error?: string }

export async function listeProblemmeldungen(email: string): Promise<Problemmeldung[]> {
  const result = await postJson<ListResponse>('listeProblemmeldungen', { email })
  if (!result?.success || !Array.isArray(result.data)) return []
  return result.data
}

export async function toggleProblemmeldung(
  email: string,
  id: string,
  erledigt: boolean,
): Promise<boolean> {
  const result = await postJson<ToggleResponse>(
    'markiereProblemmeldungErledigt',
    { email, id, erledigt },
  )
  return !!result?.success
}

/**
 * Cluster A Bug 6c: Problemmeldung endgültig löschen. Admin-only im Backend.
 * Throws Error wenn Backend fehlschlägt (für optimisticDelete-Helper-Kompatibilität).
 */
export async function loescheProblemmeldung(email: string, id: string): Promise<void> {
  const result = await postJson<ToggleResponse>('loescheProblemmeldung', { email, id })
  if (!result?.success) {
    throw new Error(result?.error || 'Backend-Löschen fehlgeschlagen')
  }
}
