import type { Frage, FrageSummary } from '../types/fragen.ts'
import type { PruefungsConfig } from '../types/pruefung.ts'
import { APPS_SCRIPT_URL, getJson, postBool } from './apiClient'

/** Alle Prüfungs-Configs laden (für LP-Dashboard) */
export async function ladeAlleConfigs(email: string): Promise<PruefungsConfig[] | null> {
  const data = await getJson<{ configs: PruefungsConfig[] }>('ladeAlleConfigs', { email })
  if (!data) return null
  return data.configs ?? []
}

/** Fragenbank laden (alle Fragen für Composer) — langsam, nutze ladeFragenbankSummary für UI */
export async function ladeFragenbank(email: string): Promise<Frage[] | null> {
  const data = await getJson<{ fragen: Frage[] }>('ladeFragenbank', { email }, { timeoutMs: 90_000 })
  if (!data) return null
  return data.fragen ?? []
}

/** Fragenbank-Summaries laden (schnell, ~500KB statt 3-5MB) */
export async function ladeFragenbankSummary(email: string): Promise<FrageSummary[] | null> {
  const data = await getJson<{ summaries: FrageSummary[] }>('ladeFragenbankSummary', { email })
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

/** Einzelne Frage speichern (Fragenbank) */
export async function speichereFrage(email: string, frage: Frage): Promise<boolean> {
  if (!APPS_SCRIPT_URL) return false

  try {
    const payload = JSON.stringify({ action: 'speichereFrage', email, frage })

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

/** Frage aus Fragenbank löschen */
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
