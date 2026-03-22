/** URL des deployed Google Apps Script Web-Apps */
export const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL || ''

/** Prüft ob das Backend konfiguriert ist */
export function istKonfiguriert(): boolean {
  return !!APPS_SCRIPT_URL
}

/** POST-Request an Apps Script (text/plain um CORS-Preflight zu vermeiden), gibt T | null zurück */
export async function postJson<T>(action: string, payload: Record<string, unknown>): Promise<T | null> {
  if (!APPS_SCRIPT_URL) return null
  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action, ...payload }),
    })
    if (!response.ok) return null
    const text = await response.text()
    try {
      const data = JSON.parse(text)
      if (data.error) {
        console.error(`[API] ${action}:`, data.error)
        return null
      }
      return data
    } catch {
      console.error(`[API] ${action}: Antwort ist kein JSON`)
      return null
    }
  } catch (error) {
    console.error(`[API] ${action}: Netzwerkfehler:`, error)
    return null
  }
}

/** POST-Request der boolean zurückgibt (success-Feld) */
export async function postBool(action: string, payload: Record<string, unknown>): Promise<boolean> {
  if (!APPS_SCRIPT_URL) return false
  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action, ...payload }),
    })
    if (!response.ok) return false
    const text = await response.text()
    try {
      const data = JSON.parse(text)
      return data.success === true
    } catch { return false }
  } catch { return false }
}

/** GET-Request an Apps Script */
export async function getJson<T>(action: string, params: Record<string, string> = {}): Promise<T | null> {
  if (!APPS_SCRIPT_URL) return null
  try {
    const queryParams = Object.entries(params)
      .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
      .join('&')
    const url = `${APPS_SCRIPT_URL}?action=${action}${queryParams ? '&' + queryParams : ''}`
    const response = await fetch(url)
    if (!response.ok) return null
    const text = await response.text()
    try {
      const data = JSON.parse(text)
      if (data.error) {
        console.error(`[API] ${action}:`, data.error)
        return null
      }
      return data
    } catch {
      console.error(`[API] ${action}: Antwort ist kein JSON`)
      return null
    }
  } catch (error) {
    console.error(`[API] ${action}: Netzwerkfehler:`, error)
    return null
  }
}

/** File/Blob zu Base64 konvertieren */
export function fileToBase64(datei: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve((reader.result as string).split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(datei)
  })
}
