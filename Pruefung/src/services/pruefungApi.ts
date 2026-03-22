import type { Frage } from '../types/fragen.ts'
import type { PruefungsConfig } from '../types/pruefung.ts'
import type { Antwort } from '../types/antworten.ts'
import type { HeartbeatResponse } from '../types/monitoring.ts'
import { APPS_SCRIPT_URL } from './apiClient'

/** Prüfungskonfiguration + Fragen laden */
export async function ladePruefung(pruefungId: string, email: string): Promise<{
  config: PruefungsConfig
  fragen: Frage[]
} | null> {
  if (!APPS_SCRIPT_URL) return null

  try {
    const url = `${APPS_SCRIPT_URL}?action=ladePruefung&id=${encodeURIComponent(pruefungId)}&email=${encodeURIComponent(email)}`
    const response = await fetch(url)
    if (!response.ok) return null

    const data = await response.json()
    if (data.error) {
      console.error('[API] Fehler:', data.error)
      return null
    }
    return data
  } catch (error) {
    console.error('[API] Netzwerkfehler:', error)
    return null
  }
}

/** Antworten speichern (Auto-Save + Abgabe) */
export async function speichereAntworten(payload: {
  pruefungId: string
  email: string
  antworten: Record<string, Antwort>
  version: number
  istAbgabe: boolean
}): Promise<boolean> {
  if (!APPS_SCRIPT_URL) return false

  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: 'speichereAntworten', ...payload }),
    })
    if (!response.ok) return false

    const data = await response.json()
    return data.success === true
  } catch (error) {
    console.error('[API] Save-Fehler:', error)
    return false
  }
}

/** Heartbeat senden (Monitoring durch LP) — gibt Beenden-Signal zurück */
export async function heartbeat(pruefungId: string, email: string, aktuelleFrage?: number): Promise<HeartbeatResponse> {
  if (!APPS_SCRIPT_URL) return { success: false }

  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({
        action: 'heartbeat',
        pruefungId,
        email,
        timestamp: new Date().toISOString(),
        ...(aktuelleFrage !== undefined ? { aktuelleFrage } : {}),
      }),
    })
    if (!response.ok) return { success: false }

    try {
      const data = await response.json()
      return {
        success: data.success === true,
        beendetUm: data.beendetUm || undefined,
        restzeitMinuten: data.restzeitMinuten != null ? Number(data.restzeitMinuten) : undefined,
        sebAusnahme: data.sebAusnahme === true ? true : undefined,
      }
    } catch {
      return { success: response.ok }
    }
  } catch {
    return { success: false }
  }
}

/** SEB-Ausnahme für einen SuS erlauben (LP-Aktion) */
export async function sebAusnahmeErlauben(pruefungId: string, lpEmail: string, susEmail: string): Promise<boolean> {
  if (!APPS_SCRIPT_URL) return false

  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: 'sebAusnahmeErlauben', pruefungId, email: lpEmail, susEmail }),
    })
    if (!response.ok) return false

    try {
      const data = await response.json()
      return data.success === true
    } catch {
      return false
    }
  } catch {
    return false
  }
}

/** Prüfung freischalten (Warteraum aufheben) */
export async function schaltePruefungFrei(pruefungId: string, email: string): Promise<boolean> {
  if (!APPS_SCRIPT_URL) return false

  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: 'schalteFrei', pruefungId, email }),
    })
    if (!response.ok) return false

    const text = await response.text()
    try {
      const data = JSON.parse(text)
      return data.success === true
    } catch {
      return false
    }
  } catch {
    return false
  }
}

/** Prüfung beenden (LP) — sofort oder mit Restzeit, global oder einzeln */
export async function beendePruefung(payload: {
  pruefungId: string
  email: string
  modus: 'sofort' | 'restzeit'
  restzeitMinuten?: number
  einzelneSuS?: string[]
}): Promise<{ success: boolean; beendetUm?: string; error?: string }> {
  if (!APPS_SCRIPT_URL) return { success: false, error: 'nicht_konfiguriert' }

  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: 'beendePruefung', ...payload }),
    })
    if (!response.ok) return { success: false, error: 'netzwerk_fehler' }

    const text = await response.text()
    try {
      return JSON.parse(text)
    } catch {
      return { success: false, error: 'json_parse_fehler' }
    }
  } catch {
    return { success: false, error: 'netzwerk_fehler' }
  }
}
