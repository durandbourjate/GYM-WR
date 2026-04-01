import type { Frage } from '../types/fragen.ts'
import type { PruefungsConfig } from '../types/pruefung.ts'
import type { Antwort } from '../types/antworten.ts'
import type { HeartbeatResponse } from '../types/monitoring.ts'
import { APPS_SCRIPT_URL, getJson, getSessionToken, postBool } from './apiClient'

/** Einzelne Prüfungs-Config laden (leichtgewichtig, für Polling) */
export async function ladeEinzelConfig(pruefungId: string, email: string): Promise<PruefungsConfig | null> {
  const result = await getJson<{ config: PruefungsConfig }>('ladeEinzelConfig', { id: pruefungId, email })
  return result?.config ?? null
}

/** Prüfungskonfiguration + Fragen laden */
export async function ladePruefung(pruefungId: string, email: string): Promise<{
  config: PruefungsConfig
  fragen: Frage[]
  istAbgegeben?: boolean
  istBeendet?: boolean
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
    // SICHERHEIT: Session-Token aus Backend-Response speichern (für Google OAuth SuS)
    if (data.sessionToken) {
      try {
        const raw = sessionStorage.getItem('pruefung-auth')
        if (raw) {
          const auth = JSON.parse(raw)
          auth.sessionToken = data.sessionToken
          sessionStorage.setItem('pruefung-auth', JSON.stringify(auth))
        }
      } catch { /* sessionStorage nicht verfügbar */ }
    }
    return data
  } catch (error) {
    console.error('[API] Netzwerkfehler:', error)
    return null
  }
}

/** Antworten speichern (Auto-Save + Abgabe) — mit Timeout + automatischem Retry */
export async function speichereAntworten(payload: {
  pruefungId: string
  email: string
  antworten: Record<string, Antwort>
  version: number
  istAbgabe: boolean
  gesamtFragen?: number
  requestId?: string
}): Promise<boolean> {
  if (!APPS_SCRIPT_URL) return false

  // Payload-Groesse warnen (> 500KB kann bei Apps Script Probleme machen)
  const payloadStr = JSON.stringify(payload)
  if (payloadStr.length > 500_000) {
    console.warn(`[API] Save-Payload gross: ${Math.round(payloadStr.length / 1024)} KB`)
  }

  // Erster Versuch
  const erfolg = await postBool('speichereAntworten', payload)
  if (erfolg) return true

  // Retry nach 3s (einmal) — verhindert Datenverlust bei transienten Netzwerkfehlern
  await new Promise(r => setTimeout(r, 3000))
  return postBool('speichereAntworten', payload)
}

/** Lockdown-Metadaten für Heartbeat */
export interface LockdownMeta {
  geraet: string
  vollbild: boolean
  kontrollStufe: string
  verstossZaehler: number
  gesperrt: boolean
  neusteVerstoesse: Array<{ zeitpunkt: string; typ: string; dauer_sekunden?: number }>
}

/** Heartbeat senden (Monitoring durch LP) — gibt Beenden-Signal zurück */
export async function heartbeat(
  pruefungId: string,
  email: string,
  aktuelleFrage?: number,
  beantworteteFragen?: number,
  lockdownMeta?: LockdownMeta,
  autoSaveCount?: number,
  tabSessionId?: string,
  gesamtFragen?: number,
): Promise<HeartbeatResponse> {
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
        sessionToken: getSessionToken(),
        ...(aktuelleFrage !== undefined ? { aktuelleFrage } : {}),
        ...(beantworteteFragen !== undefined ? { beantworteteFragen } : {}),
        ...(lockdownMeta ? { lockdownMeta } : {}),
        ...(autoSaveCount !== undefined ? { autoSaveCount } : {}),
        ...(tabSessionId ? { tabSessionId } : {}),
        ...(gesamtFragen !== undefined ? { gesamtFragen } : {}),
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
        kontrollStufeOverride: data.kontrollStufeOverride || undefined,
        entsperrt: data.entsperrt === true ? true : undefined,
        phase: data.phase || undefined,
        tabSessionUngueltig: data.tabSessionUngueltig === true ? true : undefined,
      }
    } catch {
      return { success: response.ok }
    }
  } catch {
    return { success: false }
  }
}

/** SuS entsperren (LP-Aktion) */
export async function entsperreSuS(pruefungId: string, lpEmail: string, schuelerEmail: string): Promise<boolean> {
  if (!APPS_SCRIPT_URL) return false

  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: 'entsperreSuS', pruefungId, email: lpEmail, schuelerEmail }),
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

/** Kontrollstufe für einzelnen SuS ändern (LP-Aktion) */
export async function setzeKontrollStufe(pruefungId: string, lpEmail: string, schuelerEmail: string, stufe: string): Promise<boolean> {
  if (!APPS_SCRIPT_URL) return false

  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: 'setzeKontrollStufe', pruefungId, email: lpEmail, schuelerEmail, stufe }),
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
  if (!APPS_SCRIPT_URL) return false // Kein Backend → Aktion nicht möglich

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
  if (!APPS_SCRIPT_URL) return { success: false, error: 'kein_backend' } // Kein Backend → Aktion nicht möglich

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

/** Prüfung zurücksetzen für neue Durchführung (LP) */
export async function resetPruefung(pruefungId: string, email: string): Promise<boolean> {
  if (!APPS_SCRIPT_URL) return false // Kein Backend → Aktion nicht möglich

  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: 'resetPruefung', pruefungId, email }),
    })
    if (!response.ok) return false
    const text = await response.text()
    try {
      const data = JSON.parse(text)
      return data.success === true
    } catch { return false }
  } catch { return false }
}
