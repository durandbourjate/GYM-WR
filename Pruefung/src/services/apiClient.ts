/** URL des deployed Google Apps Script Web-Apps */
export const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL || ''

/** Prüft ob das Backend konfiguriert ist */
export function istKonfiguriert(): boolean {
  return !!APPS_SCRIPT_URL
}

/** Standard-Timeout für API-Calls (30s — Apps Script kann langsam sein) */
const DEFAULT_TIMEOUT_MS = 30_000

// === Write-Serialisierung (nur SuS-Writes) ===
// Heartbeat und speichereAntworten (beide via postBool) dürfen nicht parallel laufen,
// weil sie in dieselbe Sheet-Zeile schreiben → Race Condition.
// LP-GETs (Monitoring, Nachrichten, Config) bleiben parallel — keine Queue.
let writeQueue: Promise<unknown> = Promise.resolve()

/** Reiht einen SuS-Write in die serielle Queue ein. Wartet auf vorherigen Write. */
function enqueueWrite<T>(fn: () => Promise<T>): Promise<T> {
  const queued = writeQueue.then(fn, fn) // Auch nach Fehler weiter
  writeQueue = queued.then(() => {}, () => {}) // Fehler nicht propagieren in Queue
  return queued
}

/** Fetch mit AbortController-Timeout. Optionaler externer AbortSignal für Caller-Cancellation. */
function fetchMitTimeout(
  url: string,
  options: RequestInit & { signal?: AbortSignal } = {},
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  // Wenn Caller ein eigenes Signal mitgibt, bei dessen Abort auch unseren Controller abbrechen
  if (options.signal) {
    options.signal.addEventListener('abort', () => controller.abort(), { once: true })
  }

  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timeoutId))
}

/** Liest Session-Token aus sessionStorage (für SuS-Authentifizierung) */
export function getSessionToken(): string | undefined {
  try {
    const raw = sessionStorage.getItem('pruefung-auth')
    if (!raw) return undefined
    const parsed = JSON.parse(raw)
    return parsed?.sessionToken || undefined
  } catch {
    return undefined
  }
}

/** POST-Request an Apps Script (text/plain um CORS-Preflight zu vermeiden), gibt T | null zurück */
export async function postJson<T>(
  action: string,
  payload: Record<string, unknown>,
  options?: { signal?: AbortSignal; timeoutMs?: number }
): Promise<T | null> {
  if (!APPS_SCRIPT_URL) return null
  try {
    // Session-Token automatisch mitsenden wenn vorhanden (SuS-Authentifizierung)
    const sessionToken = getSessionToken()
    const body = sessionToken ? { action, sessionToken, ...payload } : { action, ...payload }
    const response = await fetchMitTimeout(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(body),
      signal: options?.signal,
    }, options?.timeoutMs)
    if (!response.ok) return null
    const text = await response.text()
    try {
      const data = JSON.parse(text)
      if (data.error) {
        console.error(`[API] ${action}:`, data.error)
        return null
      }
      return data as T
    } catch {
      console.error(`[API] ${action}: Antwort ist kein JSON`)
      return null
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      console.warn(`[API] ${action}: Timeout oder abgebrochen`)
      return null
    }
    console.error(`[API] ${action}: Netzwerkfehler:`, error)
    return null
  }
}

/** POST-Request der boolean zurückgibt (success-Feld).
 *  Läuft durch Write-Queue (serialisiert heartbeat + speichereAntworten). */
export async function postBool(
  action: string,
  payload: Record<string, unknown>,
  options?: { signal?: AbortSignal }
): Promise<boolean> {
  if (!APPS_SCRIPT_URL) return false
  return enqueueWrite(async () => {
    try {
      const sessionToken = getSessionToken()
      const body = sessionToken ? { action, sessionToken, ...payload } : { action, ...payload }
      const response = await fetchMitTimeout(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(body),
        signal: options?.signal,
      })
      if (!response.ok) return false
      const text = await response.text()
      try {
        const data = JSON.parse(text)
        return data.success === true
      } catch { return false }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        console.warn(`[API] ${action}: Timeout oder abgebrochen`)
      }
      return false
    }
  })
}

/** GET-Request an Apps Script (ohne Queue — GETs dürfen parallel laufen) */
export async function getJson<T>(
  action: string,
  params: Record<string, string> = {},
  options?: { signal?: AbortSignal; timeoutMs?: number }
): Promise<T | null> {
  if (!APPS_SCRIPT_URL) return null
  try {
    // Session-Token auch bei GET-Requests mitsenden (SuS-Authentifizierung)
    const sessionToken = getSessionToken()
    const allParams = { ...params, ...(sessionToken ? { sessionToken } : {}) }
    const queryParams = Object.entries(allParams)
      .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
      .join('&')
    const url = `${APPS_SCRIPT_URL}?action=${action}${queryParams ? '&' + queryParams : ''}`
    const response = await fetchMitTimeout(url, { signal: options?.signal }, options?.timeoutMs)
    if (!response.ok) return null
    const text = await response.text()
    try {
      const data = JSON.parse(text)
      if (data.error) {
        console.error(`[API] ${action}:`, data.error)
        return null
      }
      return data as T
    } catch {
      console.error(`[API] ${action}: Antwort ist kein JSON`)
      return null
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      console.warn(`[API] ${action}: Timeout oder abgebrochen`)
      return null
    }
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
