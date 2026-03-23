// Prüfung-Bridge: Lädt Prüfungs-Metadaten via Apps Script ladeTrackerDaten + cached in localStorage
// Teilt APPS_SCRIPT_URL und LP_EMAIL mit synergyService.ts (gleiche Konstanten-Konvention)

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxcRXYgyVpfLSicZMxWzVIAs4gtqKPQzz0djQSnPiFUYz_h2dDZ6IMBXcYr5ubbGPSUPA/exec'
const LP_EMAIL = 'yannick.durand@gymhofwil.ch'
const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24h
const CACHE_KEY_PRUEFUNGEN = 'synergy-pruefungen'
const CACHE_KEY_NOTENSTAND = 'synergy-notenstand'

// === Interfaces ===

export interface PruefungBadge {
  pruefungId: string
  titel: string
  datum: string
  kw: number
  hatNoten: boolean
  anzahlSuS: number
}

export interface NotenStandInfo {
  gefaess: string
  semester: string
  vorhandene: number
  erforderliche: number
}

// Internes Cache-Format
interface CacheEntry<T> {
  data: T
  timestamp: number
}

// Tracker-Response (Subset der relevanten Felder)
interface TrackerResponse {
  pruefungen: {
    pruefungId: string
    titel: string
    klasse: string
    gefaess: string
    semester: string
    datum: string
    typ: string
    teilnehmerGesamt: number
    durchschnittNote: number | null
  }[]
  notenStand?: {
    kursId: string
    kurs: string
    gefaess: string
    semester: string
    vorhandeneNoten: number
    erforderlicheNoten: number
    status: string
    naechsterTermin: string
  }[]
  aktualisiert: string
}

// === Caching ===

function getCached<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const entry: CacheEntry<T> = JSON.parse(raw)
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) return null
    return entry.data
  } catch { return null }
}

function setCache<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }))
  } catch { /* localStorage voll — ignorieren */ }
}

// === Datumshilfe: Datum → KW ===

function datumZuKW(datumStr: string): number {
  try {
    const d = new Date(datumStr)
    if (isNaN(d.getTime())) return 0
    // ISO-KW berechnen
    const tmp = new Date(d.getTime())
    tmp.setHours(0, 0, 0, 0)
    tmp.setDate(tmp.getDate() + 3 - ((tmp.getDay() + 6) % 7))
    const week1 = new Date(tmp.getFullYear(), 0, 4)
    return 1 + Math.round(((tmp.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7)
  } catch { return 0 }
}

// === API ===

/**
 * Lädt Prüfungsdaten vom Apps Script ladeTrackerDaten-Endpoint.
 * Cached Prüfungen und Noten-Stand separat in localStorage.
 */
export async function ladePruefungsDaten(): Promise<{ badges: PruefungBadge[]; notenStand: NotenStandInfo[] } | null> {
  if (!APPS_SCRIPT_URL || !LP_EMAIL) return null

  try {
    const url = new URL(APPS_SCRIPT_URL)
    url.searchParams.set('action', 'ladeTrackerDaten')
    url.searchParams.set('email', LP_EMAIL)

    const res = await fetch(url.toString())
    if (!res.ok) return null
    const data = await res.json() as TrackerResponse

    // Prüfungen → Badges transformieren
    const badges: PruefungBadge[] = (data.pruefungen || []).map((p) => ({
      pruefungId: p.pruefungId,
      titel: p.titel,
      datum: p.datum,
      kw: datumZuKW(p.datum),
      hatNoten: p.durchschnittNote !== null,
      anzahlSuS: p.teilnehmerGesamt,
    }))

    // Noten-Stand transformieren
    const notenStand: NotenStandInfo[] = (data.notenStand || []).map((ns) => ({
      gefaess: ns.gefaess,
      semester: ns.semester,
      vorhandene: ns.vorhandeneNoten,
      erforderliche: ns.erforderlicheNoten,
    }))

    // Cachen
    setCache(CACHE_KEY_PRUEFUNGEN, badges)
    setCache(CACHE_KEY_NOTENSTAND, notenStand)

    return { badges, notenStand }
  } catch { return null }
}

/**
 * Gibt die Prüfung für eine bestimmte Kalenderwoche zurück (aus Cache oder frisch laden).
 */
export function getPruefungFuerKW(kw: number): PruefungBadge | undefined {
  const cached = getCached<PruefungBadge[]>(CACHE_KEY_PRUEFUNGEN)
  if (!cached) return undefined
  return cached.find((b) => b.kw === kw)
}

/**
 * Gibt den aktuellen Noten-Stand zurück (aus Cache).
 */
export function getNotenStand(): NotenStandInfo[] {
  return getCached<NotenStandInfo[]>(CACHE_KEY_NOTENSTAND) || []
}

/**
 * Gibt das Alter des Prüfungs-Cache als lesbaren String zurück.
 */
export function getPruefungsCacheAlter(): string | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY_PRUEFUNGEN)
    if (!raw) return null
    const entry = JSON.parse(raw)
    const age = Date.now() - entry.timestamp
    const h = Math.floor(age / 3600000)
    if (h < 1) return 'vor wenigen Minuten'
    if (h < 24) return `vor ${h}h`
    return `vor ${Math.floor(h / 24)} Tagen`
  } catch { return null }
}

/**
 * Prüft ob der Bridge-Service konfiguriert ist.
 */
export function istKonfiguriert(): boolean {
  return APPS_SCRIPT_URL.length > 0 && LP_EMAIL.length > 0
}
