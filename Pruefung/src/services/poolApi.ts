import type { Frage } from '../types/fragen.ts'
import type { Lernziel } from '../types/pool'
import { APPS_SCRIPT_URL, postJson } from './apiClient'

/** Batch-Import von Pool-Fragen */
export async function importierePoolFragen(email: string, fragen: Frage[]): Promise<{ erfolg: boolean; importiert: number; aktualisiert: number; fehler: string[] } | null> {
  return postJson<{ erfolg: boolean; importiert: number; aktualisiert: number; fehler: string[] }>('importierePoolFragen', { email, fragen })
}

/** Batch-Import von Lernzielen */
export async function importiereLernziele(lernziele: Lernziel[]): Promise<{ erfolg: boolean; neu: number; aktualisiert: number } | null> {
  return postJson<{ erfolg: boolean; neu: number; aktualisiert: number }>('importiereLernziele', { lernziele })
}

/** Schreibt Änderungen an Pool-Fragen zurück via GitHub API */
export async function schreibePoolAenderung(
  email: string,
  poolDatei: string,
  aenderungen: Array<{
    poolFrageId: string | null
    typ: 'update' | 'export'
    felder: Record<string, unknown>
  }>,
): Promise<{
  erfolg: boolean
  aktualisiert: number
  exportiert: number
  commitSha: string
  neueHashes: Record<string, string>
  exportierteIds: Record<string, string>
  fehler: string[]
} | null> {
  return postJson('schreibePoolAenderung', { email, poolDatei, aenderungen })
}

/** Einzelnes Lernziel erstellen — gibt die neue ID zurück, oder null bei Fehler */
export async function speichereLernziel(email: string, lernziel: Omit<Lernziel, 'id'>): Promise<string | null> {
  const result = await postJson<{ erfolg: boolean; id: string }>('speichereLernziel', { email, lernziel })
  return result?.id ?? null
}

/** Lernziele laden (optional nach Fach gefiltert) — gibt [] statt null zurück */
export async function ladeLernziele(email: string, fach?: string): Promise<Lernziel[]> {
  if (!APPS_SCRIPT_URL) return []
  try {
    const payload = JSON.stringify({ action: 'ladeLernziele', email, fach })
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: payload,
    })
    if (!response.ok) return []
    const text = await response.text()
    try {
      const data = JSON.parse(text)
      return data?.lernziele || []
    } catch { return [] }
  } catch {
    return []
  }
}
