import { uebenApiClient } from './ueben/apiClient'
import { useUebenAuthStore } from '../store/ueben/authStore'

/**
 * Bundle G.a — Kill-Switch.
 * Bei Production-Issues auf `false` setzen + Frontend-Deploy.
 */
export const PRE_WARM_ENABLED = true

interface PreWarmResponse {
  success?: boolean
  deduped?: boolean
  fragenAnzahl?: number
  latenzMs?: number
  error?: string
}

/**
 * Pre-Warm den Apps-Script-CacheService für eine Liste von fragenIds.
 *
 * Fire-and-forget: returnt Promise<void>, wirft NIE — Fehler werden silent geswallowed.
 * Wenn `signal.aborted` bei Eintritt: kein API-Call.
 * Wenn `fragenIds` leer: kein API-Call.
 * Wenn `gruppeId` leer: kein API-Call.
 * Wenn `PRE_WARM_ENABLED` false: kein API-Call.
 *
 * Backend-Endpoint: `lernplattformPreWarmFragen`.
 */
export async function preWarmFragen(
  fragenIds: string[],
  gruppeId: string,
  fachbereich?: string,
  signal?: AbortSignal,
): Promise<void> {
  if (!PRE_WARM_ENABLED) return
  if (signal?.aborted) return
  if (!Array.isArray(fragenIds) || fragenIds.length === 0) return
  if (!gruppeId) return

  try {
    const user = useUebenAuthStore.getState().user
    const email = user?.email ?? ''
    const sessionToken = user?.sessionToken ?? ''

    const payload: Record<string, unknown> = { email, fragenIds, gruppeId }
    if (fachbereich) payload.fachbereich = fachbereich

    const response = await uebenApiClient.post<PreWarmResponse>(
      'lernplattformPreWarmFragen',
      payload,
      sessionToken,
    )
    if (response?.error) {
      console.warn('[preWarmFragen] Backend-Error:', response.error)
    }
  } catch (e) {
    console.warn('[preWarmFragen] Fehler (silent):', e)
  }
}

/**
 * Bundle G.d.1 Hebel C — Pre-Warm der Korrektur-Daten.
 *
 * Fire-and-forget: returnt Promise<void>, wirft NIE — Fehler werden silent geswallowed.
 * Wenn `signal.aborted` bei Eintritt: kein API-Call.
 * Wenn `pruefungId` leer: kein API-Call.
 * Wenn `email` leer: kein API-Call.
 * Wenn `PRE_WARM_ENABLED` false: kein API-Call.
 *
 * Backend-Endpoint: `lernplattformPreWarmKorrektur`.
 */
export async function preWarmKorrektur(
  pruefungId: string,
  email: string,
  signal?: AbortSignal,
): Promise<void> {
  if (!PRE_WARM_ENABLED) return
  if (signal?.aborted) return
  if (!pruefungId) return
  if (!email) return

  try {
    const user = useUebenAuthStore.getState().user
    const sessionToken = user?.sessionToken ?? ''
    const response = await uebenApiClient.post<PreWarmResponse>(
      'lernplattformPreWarmKorrektur',
      { email, pruefungId },
      sessionToken,
    )
    if (response?.error) {
      console.warn('[preWarmKorrektur] Backend-Error:', response.error)
    }
  } catch (e) {
    console.warn('[preWarmKorrektur] Fehler (silent):', e)
  }
}
