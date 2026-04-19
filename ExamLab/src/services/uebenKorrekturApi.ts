import { uebenApiClient } from './ueben/apiClient'
import type { Antwort } from '../types/antworten'
import type { PruefResultat } from '../types/ueben/pruefResultat'

export interface PruefenParams {
  gruppeId: string
  frageId: string
  antwort: Antwort
  email: string
  token: string
  /** Optional: spart Server ~75% Sheet-Reads (1 Tab statt 4 durchsuchen) */
  fachbereich?: string
}

/**
 * Ruft den Apps-Script-Endpoint `lernplattformPruefeAntwort` auf.
 * Liefert ein {@link PruefResultat} zurück oder wirft bei success:false / Netzwerk-Fehler.
 */
export async function pruefeAntwortApi(params: PruefenParams): Promise<PruefResultat> {
  const { gruppeId, frageId, antwort, email, token, fachbereich } = params
  const response = await uebenApiClient.post<PruefResultat>(
    'lernplattformPruefeAntwort',
    { gruppeId, frageId, antwort, email, fachbereich },
    token,
  )
  if (!response?.success) {
    throw new Error(response?.error || 'Prüfung fehlgeschlagen')
  }
  return response
}
