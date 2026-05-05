import type { Frage, FrageSummary } from '../types/fragen-storage'
import type { PruefungsConfig } from '../types/pruefung.ts'
import { APPS_SCRIPT_URL, getJson, postBool, postJson } from './apiClient'

/** Alle Prüfungs-Configs laden (für LP-Dashboard) */
export async function ladeAlleConfigs(email: string): Promise<PruefungsConfig[] | null> {
  const data = await getJson<{ configs: PruefungsConfig[] }>('ladeAlleConfigs', { email })
  if (!data) return null
  return data.configs ?? []
}

/** Fragensammlung laden (alle Fragen für Composer) — langsam, nutze ladeFragensammlungSummary für UI */
export async function ladeFragensammlung(email: string): Promise<Frage[] | null> {
  const data = await getJson<{ fragen: Frage[] }>('ladeFragensammlung', { email }, { timeoutMs: 90_000 })
  if (!data) return null
  return data.fragen ?? []
}

/** Fragensammlung-Summaries laden (schnell, ~500KB statt 3-5MB) */
export async function ladeFragensammlungSummary(email: string): Promise<FrageSummary[] | null> {
  const data = await getJson<{ summaries: FrageSummary[] }>('ladeFragensammlungSummary', { email })
  if (!data) return null
  return data.summaries ?? []
}

/** Einzelne Frage mit allen Details laden */
export async function ladeFrageDetail(email: string, frageId: string, fachbereich: string): Promise<Frage | null> {
  const data = await getJson<{ frage: Frage }>('ladeFrageDetail', { email, frageId, fachbereich }, { timeoutMs: 15_000 })
  if (!data) return null
  return data.frage ?? null
}

/** Prüfungs-Config speichern (Composer -> Configs-Sheet) */
export async function speichereConfig(email: string, config: PruefungsConfig): Promise<boolean> {
  if (!APPS_SCRIPT_URL) return false

  try {
    const payload = JSON.stringify({ action: 'speichereConfig', email, config })

    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: payload,
    })

    if (!response.ok) {
      console.error('[API] speichereConfig: Response nicht ok')
      return false
    }

    const text = await response.text()
    try {
      const data = JSON.parse(text)
      if (data.error) {
        console.error('[API] speichereConfig: Server-Fehler:', data.error)
        return false
      }
      return data.success === true
    } catch {
      console.error('[API] speichereConfig: Antwort ist kein JSON')
      return false
    }
  } catch (error) {
    console.error('[API] speichereConfig: Netzwerkfehler:', error)
    return false
  }
}

/** Prüfung löschen (aus Configs-Sheet entfernen) */
export async function loeschePruefung(email: string, pruefungId: string): Promise<boolean> {
  return postBool('loeschePruefung', { email, pruefungId })
}

/** Offener KI-Feedback-Eintrag (spiegelt shared/useKIAssistent::OffenerKIFeedback) */
interface OffenerKIFeedbackPayload {
  aktion: string
  feedbackId: string
  wichtig: boolean
}

/** Bundle-3-Save-Result: enthält den vom Backend bestimmten Status (`'draft' | 'sammlung'`)
 *  und im Fehlerfall den HTTP-Status für die draftSync-Retry-Eskalation. */
export interface SpeichereFrageResult {
  success: boolean
  /** Vom Backend gesetzter Status nach Save. `'draft'` wenn Pflichtfelder fehlen, sonst `'sammlung'`. */
  status?: 'draft' | 'sammlung'
  /** Server-vergebene Frage-ID (falls neu erstellt) */
  id?: string
  /** Bei `success=false`: HTTP-Status-Code für Retry-Logik in draftSync.ts.
   *  Network-Fehler werden als 0 codiert. `Retry-After`-Header wird nach Möglichkeit weitergegeben. */
  errorStatus?: number
  /** Bei 429: Wert des `Retry-After`-Headers in Sekunden (oder undefined). */
  retryAfterSeconds?: number
}

/** Einzelne Frage speichern UND HTTP-Status zurückgeben (Bundle 3, draftSync.ts).
 *  Im Gegensatz zum existing `speichereFrage` (boolean-Return) liefert diese Funktion
 *  den Backend-bestimmten Auto-Save-Status und unterscheidet Fehler-Klassen für
 *  die 4-Stufen-Retry-Logik. Existing `speichereFrage` bleibt UNVERÄNDERT. */
export async function speichereFrageMitStatus(
  email: string,
  frage: Frage,
): Promise<SpeichereFrageResult> {
  if (!APPS_SCRIPT_URL) return { success: false, errorStatus: 0 }

  try {
    const payload = JSON.stringify({ action: 'speichereFrage', email, frage })
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: payload,
    })

    if (!response.ok) {
      const result: SpeichereFrageResult = { success: false, errorStatus: response.status }
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After')
        const seconds = retryAfter ? parseInt(retryAfter, 10) : NaN
        if (!isNaN(seconds) && seconds > 0) result.retryAfterSeconds = seconds
      }
      return result
    }

    const text = await response.text()
    try {
      const data = JSON.parse(text) as {
        success?: boolean
        status?: 'draft' | 'sammlung'
        id?: string
        error?: string
      }
      if (data.error || data.success === false) {
        return { success: false, errorStatus: response.status }
      }
      return {
        success: data.success === true,
        status: data.status,
        id: data.id,
      }
    } catch {
      return { success: false, errorStatus: response.status }
    }
  } catch {
    // Network-Error → errorStatus=0 signalisiert Retry-fähig (wie 5xx)
    return { success: false, errorStatus: 0 }
  }
}

/** Einzelne Frage speichern (Fragensammlung).
 *  offeneKIFeedbacks: optionale KI-Kalibrierungsdaten — werden im Payload mitgesendet,
 *  Backend kann sie für Feedback-Loop nutzen oder ignorieren. */
export async function speichereFrage(
  email: string,
  frage: Frage,
  offeneKIFeedbacks?: OffenerKIFeedbackPayload[]
): Promise<boolean> {
  if (!APPS_SCRIPT_URL) return false

  try {
    const payload = JSON.stringify({
      action: 'speichereFrage',
      email,
      frage,
      ...(offeneKIFeedbacks && offeneKIFeedbacks.length > 0 ? { offeneKIFeedbacks } : {}),
    })

    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: payload,
    })

    if (!response.ok) return false

    const text = await response.text()
    try {
      const data = JSON.parse(text)
      if (data.error) {
        console.error('[API] speichereFrage: Server-Fehler:', data.error)
        return false
      }
      return data.success === true
    } catch {
      console.error('[API] speichereFrage: Antwort ist kein JSON')
      return false
    }
  } catch (error) {
    console.error('[API] speichereFrage: Netzwerkfehler:', error)
    return false
  }
}

/** Frage aus Fragensammlung löschen */
export async function loescheFrage(email: string, frageId: string, fachbereich: string): Promise<boolean> {
  if (!APPS_SCRIPT_URL) return false
  try {
    const payload = JSON.stringify({ action: 'loescheFrage', email, frageId, fachbereich })
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: payload,
    })
    if (!response.ok) return false
    const text = await response.text()
    try {
      const data = JSON.parse(text)
      if (data.error) { console.error('[API] loescheFrage:', data.error); return false }
      return data.success === true
    } catch { return false }
  } catch (error) {
    console.error('[API] loescheFrage: Netzwerkfehler:', error)
    return false
  }
}

// === Bulk-Toggle für Lückentext-Modus (admin-only) ===

/**
 * Backend liefert immer `{ success, data }`. `postJson<T>` returnt das volle
 * Response-Objekt. Dieser Helper unwrappt `.data` und gibt null zurück wenn
 * `success` fehlt, data nicht vorhanden oder falscher Shape.
 *
 * Analog zu kalibrierungApi::unwrap (S130 Hotfix-Pattern).
 */
async function unwrap<T>(
  result: { success?: boolean; data?: unknown } | null,
): Promise<T | null> {
  if (!result || typeof result !== 'object') return null
  if (result.success === false) return null
  if (result.data === undefined || result.data === null) return null
  return result.data as T
}

export interface LueckentextBulkResult {
  total: number
  geaendert: number
  alleBereits: boolean
}

/**
 * Setzt `lueckentextModus` für ALLE Lückentext-Fragen in der Fragensammlung.
 * Admin-only. Idempotent — skippt Fragen die bereits im Ziel-Modus sind.
 *
 * Reversibel: jederzeit aufs andere Modus-Label zurücksetzbar.
 */
export async function bulkSetzeLueckentextModus(
  email: string,
  modus: 'freitext' | 'dropdown',
): Promise<LueckentextBulkResult | null> {
  const r = await postJson<{ success: boolean; data?: LueckentextBulkResult }>(
    'bulkSetzeLueckentextModus',
    { email, modus },
  )
  return unwrap<LueckentextBulkResult>(r)
}
