/**
 * API-Client für das Lernplattform-Backend.
 *
 * URL-Auflösung:
 * - __LERNEN_BACKEND_URL__ (vite define, aus process.env.VITE_LERNPLATTFORM_APPS_SCRIPT_URL)
 * - Fallback im Lernen-Build: VITE_APPS_SCRIPT_URL
 *
 * WICHTIG: Die URL wird direkt in getLernenUrl() aufgelöst und NICHT in einer
 * Modul-Level-Variable gespeichert. Der Vite-Minifier dedupliziert Modul-Level-
 * String-Variablen aggressiv, was dazu führt dass die LP-URL mit der Prüfungs-URL
 * zusammengelegt wird.
 */

declare const __LERNEN_BACKEND_URL__: string

/** Gibt die LP-Backend-URL zurück. Inline, nicht als Variable (Minifier-sicher). */
function getLernenUrl(): string {
  // Priorität 1: Explizites LP-Backend-Secret (Pruefung-Build)
  if (typeof __LERNEN_BACKEND_URL__ !== 'undefined' && __LERNEN_BACKEND_URL__) {
    return __LERNEN_BACKEND_URL__
  }
  // Priorität 2: Im Lernen-Build ist VITE_APPS_SCRIPT_URL die LP-URL
  if (import.meta.env.VITE_APP_MODE === 'lernen') {
    return (import.meta.env.VITE_APPS_SCRIPT_URL as string) || ''
  }
  return ''
}

/** Prüft ob das LP-Backend konfiguriert ist */
export function lernenIstKonfiguriert(): boolean {
  return !!getLernenUrl()
}

/** POST an das LP-Backend */
export async function lernenPost<T = unknown>(
  action: string,
  payload: Record<string, unknown>,
  sessionToken?: string,
  timeoutMs = 30000
): Promise<T | null> {
  const url = getLernenUrl()
  if (!url) return null

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const body = JSON.stringify({
      action,
      ...(sessionToken ? { sessionToken } : {}),
      ...payload,
    })

    const response = await fetch(url, {
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
