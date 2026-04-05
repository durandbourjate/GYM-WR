/**
 * API-Client für das Lernplattform-Backend.
 * Verwendet VITE_LERNPLATTFORM_APPS_SCRIPT_URL (eigene LP-Deployment-URL).
 * Fallback auf VITE_APPS_SCRIPT_URL (für den Lernen-Build wo nur eine URL existiert).
 */

const LERNEN_URL: string =
  (import.meta.env.VITE_LERNPLATTFORM_APPS_SCRIPT_URL as string) ||
  (import.meta.env.VITE_APPS_SCRIPT_URL as string) ||
  ''

/** Prüft ob das LP-Backend konfiguriert ist */
export function lernenIstKonfiguriert(): boolean {
  return !!LERNEN_URL
}

/** POST an das LP-Backend */
export async function lernenPost<T = unknown>(
  action: string,
  payload: Record<string, unknown>,
  sessionToken?: string,
  timeoutMs = 30000
): Promise<T | null> {
  if (!LERNEN_URL) return null

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const body = JSON.stringify({
      action,
      ...(sessionToken ? { sessionToken } : {}),
      ...payload,
    })

    const response = await fetch(LERNEN_URL, {
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
export const lernenApiClient = {
  istKonfiguriert: lernenIstKonfiguriert,
  post: lernenPost,
}
