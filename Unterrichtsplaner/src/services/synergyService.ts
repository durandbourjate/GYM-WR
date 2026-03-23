// Synergy-Service: Lädt zentrale Daten via Apps Script + cached in localStorage

// PLACEHOLDER: User muss die Apps Script Web-App-URL einsetzen (gleiche wie Prüfungstool)
const APPS_SCRIPT_URL = ''
const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24h
// LP-E-Mail muss konfiguriert werden bevor der Service funktioniert
const LP_EMAIL = ''

interface CacheEntry<T> {
  data: T
  timestamp: number
}

function getCached<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(`synergy-${key}`)
    if (!raw) return null
    const entry: CacheEntry<T> = JSON.parse(raw)
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) return null
    return entry.data
  } catch { return null }
}

function setCache<T>(key: string, data: T): void {
  try {
    localStorage.setItem(`synergy-${key}`, JSON.stringify({ data, timestamp: Date.now() }))
  } catch { /* localStorage voll — ignorieren */ }
}

async function fetchFromBackend<T>(action: string, params: Record<string, string> = {}): Promise<T | null> {
  if (!APPS_SCRIPT_URL || !LP_EMAIL) return null
  try {
    const url = new URL(APPS_SCRIPT_URL)
    url.searchParams.set('action', action)
    url.searchParams.set('email', LP_EMAIL)
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
    const res = await fetch(url.toString())
    if (!res.ok) return null
    return await res.json() as T
  } catch { return null }
}

export async function ladeKurse(): Promise<unknown[]> {
  const cached = getCached<unknown[]>('kurse')
  if (cached) return cached
  const result = await fetchFromBackend<{ kurse: unknown[] }>('ladeKurse')
  if (result?.kurse) { setCache('kurse', result.kurse); return result.kurse }
  return []
}

export async function ladeSchuljahr(): Promise<unknown | null> {
  const cached = getCached<unknown>('schuljahr')
  if (cached) return cached
  const result = await fetchFromBackend<unknown>('ladeSchuljahr')
  if (result) { setCache('schuljahr', result); return result }
  return null
}

export async function ladeLehrplan(fach?: string, gefaess?: string): Promise<unknown | null> {
  const key = `lehrplan-${fach ?? 'all'}-${gefaess ?? 'all'}`
  const cached = getCached<unknown>(key)
  if (cached) return cached
  const result = await fetchFromBackend<unknown>('ladeLehrplan', { fach: fach ?? '', gefaess: gefaess ?? '' })
  if (result) { setCache(key, result); return result }
  return null
}

export function getCacheAge(key: string): string | null {
  try {
    const raw = localStorage.getItem(`synergy-${key}`)
    if (!raw) return null
    const entry = JSON.parse(raw)
    const age = Date.now() - entry.timestamp
    const h = Math.floor(age / 3600000)
    if (h < 1) return 'vor wenigen Minuten'
    if (h < 24) return `vor ${h}h`
    return `vor ${Math.floor(h / 24)} Tagen`
  } catch { return null }
}

export function istKonfiguriert(): boolean {
  return APPS_SCRIPT_URL.length > 0 && LP_EMAIL.length > 0
}
