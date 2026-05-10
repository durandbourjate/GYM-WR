import { uebenApiClient } from './ueben/apiClient'
import type { LoesungsMap } from '../types/ueben/loesung'

export interface LadeLoesungenParams {
  gruppeId: string
  fragenIds: string[]
  email: string
  token: string
  /** Optional: spart Server ~75% Sheet-Reads (1 Tab statt 4 durchsuchen) */
  fachbereich?: string
}

interface LadeLoesungenResponse {
  success: boolean
  loesungen?: LoesungsMap
  error?: string
}

/**
 * Ruft den Apps-Script-Endpoint `uebenLadeLoesungen` auf.
 * Liefert eine flache Map {frageId → LoesungsSlice} zurück oder wirft
 * bei success:false / Netzwerk-Fehler.
 *
 * Wird beim Session-Start im selbstständigen Üben-Modus aufgerufen,
 * damit clientseitige Korrektur instant Feedback geben kann.
 */
export async function ladeLoesungenApi(params: LadeLoesungenParams): Promise<LoesungsMap> {
  const { gruppeId, fragenIds, email, token, fachbereich } = params
  const payload: Record<string, unknown> = { gruppeId, fragenIds, email }
  if (fachbereich) payload.fachbereich = fachbereich

  const response = await uebenApiClient.post<LadeLoesungenResponse>(
    'uebenLadeLoesungen',
    payload,
    token,
  )
  if (!response?.success) {
    throw new Error(response?.error || 'Lösungs-Preload fehlgeschlagen')
  }
  return response.loesungen || {}
}
