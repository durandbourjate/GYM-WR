// Synergy-Service: Lädt zentrale Daten via Apps Script + cached in localStorage
import { useSynergyConfigStore } from '../store/synergyConfigStore'

const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24h

// Typen — Spalten gemäss tatsächlichen Google Sheets

export interface ZentralerKurs {
  kursId: string
  label: string
  fach: string
  gefaess: string
  lpEmail: string
  klassen: string
  aktiv: string
}

export interface SchuljahrDaten {
  ferien: Array<{ label: string; startKW: string; endKW: string; schuljahr: string; tage: string }>
  sonderwochen: Array<{ kw: string; label: string; gymLevel: string; schuljahr: string; typ: string }>
  semester: Array<{ kursId: string; semester: string; startKW: string; endKW: string; schuljahr: string; faecher: string }>
  phasen: Array<{ phase: string; startKW: string; endKW: string; schuljahr: string; bemerkung: string }>
}

export interface LehrplanDaten {
  lehrplanziele: Array<{ id: string; ebene: string; parentId: string; fach: string; gefaess: string; semester: string; thema: string; text: string; bloom: string }>
  beurteilungsregeln: Array<{ label: string; deadline: string; minNoten: string; semester: string; stufe: string; wochenlektionen: string; bemerkung: string }>
}

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
  const { appsScriptUrl, lpEmail } = useSynergyConfigStore.getState()
  if (!appsScriptUrl || !lpEmail) return null
  try {
    const url = new URL(appsScriptUrl)
    url.searchParams.set('action', action)
    url.searchParams.set('email', lpEmail)
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
    const res = await fetch(url.toString())
    if (!res.ok) return null
    return await res.json() as T
  } catch { return null }
}

export async function ladeKurse(): Promise<ZentralerKurs[]> {
  const cached = getCached<ZentralerKurs[]>('kurse')
  if (cached) return cached
  const result = await fetchFromBackend<{ kurse: ZentralerKurs[] }>('ladeKurse')
  if (result?.kurse) { setCache('kurse', result.kurse); return result.kurse }
  return []
}

export async function ladeSchuljahr(): Promise<SchuljahrDaten | null> {
  const cached = getCached<SchuljahrDaten>('schuljahr')
  if (cached) return cached
  const result = await fetchFromBackend<SchuljahrDaten>('ladeSchuljahr')
  if (result) { setCache('schuljahr', result); return result }
  return null
}

export async function ladeLehrplan(fach?: string, gefaess?: string): Promise<LehrplanDaten | null> {
  const key = `lehrplan-${fach ?? 'all'}-${gefaess ?? 'all'}`
  const cached = getCached<LehrplanDaten>(key)
  if (cached) return cached
  const result = await fetchFromBackend<LehrplanDaten>('ladeLehrplan', { fach: fach ?? '', gefaess: gefaess ?? '' })
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

