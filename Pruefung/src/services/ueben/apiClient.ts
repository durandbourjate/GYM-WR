/**
 * API-Client für das Üben-Backend.
 * Nach der Backend-Fusion nutzt die LP das gleiche Apps Script wie ExamLab Prüfen.
 * Die Üben-Endpoints (lernplattform*) sind im selben doPost-Switch.
 */

const APPS_SCRIPT_URL: string = (import.meta.env.VITE_APPS_SCRIPT_URL as string) || ''

/** Prüft ob das Backend konfiguriert ist */
export function uebenIstKonfiguriert(): boolean {
  return !!APPS_SCRIPT_URL
}

/** POST an das Backend (gleiche URL wie ExamLab Prüfen) */
export async function uebenPost<T = unknown>(
  action: string,
  payload: Record<string, unknown>,
  sessionToken?: string,
  timeoutMs = 60000
): Promise<T | null> {
  if (!APPS_SCRIPT_URL) return null

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const body = JSON.stringify({
      action,
      ...(sessionToken ? { sessionToken } : {}),
      ...payload,
    })

    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body,
      signal: controller.signal,
    })

    if (!response.ok) return null
    return await response.json() as T
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}

// Re-export als Objekt für Kompatibilität mit Adapter-Code
export const uebenApiClient = {
  istKonfiguriert: uebenIstKonfiguriert,
  post: uebenPost,
}
