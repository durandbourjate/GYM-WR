/**
 * Sharing-API: Berechtigungen setzen + Fragen/Prüfungen duplizieren
 */
import { postJson, postBool } from './apiClient'
import type { Berechtigung } from '../types/auth'

/** Berechtigungen für eine Frage oder Prüfung setzen (nur Inhaber) */
export async function setzeBerechtigungen(
  email: string,
  typ: 'frage' | 'pruefung',
  id: string,
  berechtigungen: Berechtigung[]
): Promise<boolean> {
  return postBool('setzeBerechtigungen', { email, typ, id, berechtigungen })
}

/** Frage duplizieren — erstellt Kopie mit neuem Autor */
export async function dupliziereFrage(
  email: string,
  frageId: string
): Promise<string | null> {
  const result = await postJson<{ success: boolean; neueId: string }>('dupliziereFrage', { email, frageId })
  return result?.neueId ?? null
}

/** Prüfung duplizieren — erstellt Kopie mit neuem Ersteller */
export async function duplizierePruefung(
  email: string,
  pruefungId: string
): Promise<string | null> {
  const result = await postJson<{ success: boolean; neueId: string }>('duplizierePruefung', { email, pruefungId })
  return result?.neueId ?? null
}
