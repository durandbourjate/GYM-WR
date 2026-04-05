/**
 * API-Client für das Lernplattform-Backend.
 * Verwendet VITE_LERNPLATTFORM_APPS_SCRIPT_URL (eigene LP-Deployment-URL).
 * Fallback auf VITE_APPS_SCRIPT_URL (für den Lernen-Build wo nur eine URL existiert).
 */

// Explizit nur die LP-URL verwenden, KEIN Fallback auf Prüfungs-URL.
// Im Lernen-Build (VITE_APP_MODE=lernen) wird VITE_APPS_SCRIPT_URL auf die LP-URL gesetzt.
// Im Pruefung-Build existiert VITE_LERNPLATTFORM_APPS_SCRIPT_URL als separates Secret.
const LERNEN_URL: string = ((): string => {
  const lpUrl = import.meta.env.VITE_LERNPLATTFORM_APPS_SCRIPT_URL
  if (lpUrl) return lpUrl as string
  // Im Lernen-Build: VITE_APP_MODE=lernen → VITE_APPS_SCRIPT_URL ist bereits die LP-URL
  const appMode = import.meta.env.VITE_APP_MODE
  if (appMode === 'lernen') return (import.meta.env.VITE_APPS_SCRIPT_URL as string) || ''
  return ''
})()

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
