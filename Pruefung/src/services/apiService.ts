import type { Frage } from '../types/fragen.ts'
import type { PruefungsConfig } from '../types/pruefung.ts'
import type { Antwort } from '../types/antworten.ts'
import type { MonitoringDaten } from '../types/monitoring.ts'

/** URL des deployed Google Apps Script Web-Apps */
const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL || ''

/** API-Service für Kommunikation mit Google Apps Script Backend */
export const apiService = {
  /** Prüfungskonfiguration + Fragen laden */
  async ladePruefung(pruefungId: string, email: string): Promise<{
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
  },

  /** Antworten speichern (Auto-Save + Abgabe) */
  async speichereAntworten(payload: {
    pruefungId: string
    email: string
    antworten: Record<string, Antwort>
    version: number
    istAbgabe: boolean
  }): Promise<boolean> {
    if (!APPS_SCRIPT_URL) return false

    try {
      // text/plain vermeidet CORS-Preflight (OPTIONS), den Apps Script nicht beantwortet
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
  },

  /** Heartbeat senden (Monitoring durch LP) */
  async heartbeat(pruefungId: string, email: string): Promise<boolean> {
    if (!APPS_SCRIPT_URL) return false

    try {
      // text/plain vermeidet CORS-Preflight
      const response = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          action: 'heartbeat',
          pruefungId,
          email,
          timestamp: new Date().toISOString(),
        }),
      })
      return response.ok
    } catch {
      return false
    }
  },

  /** Monitoring-Daten für LP laden (alle SuS einer Prüfung) */
  async ladeMonitoring(pruefungId: string, email: string): Promise<MonitoringDaten | null> {
    if (!APPS_SCRIPT_URL) return null

    try {
      const url = `${APPS_SCRIPT_URL}?action=monitoring&id=${encodeURIComponent(pruefungId)}&email=${encodeURIComponent(email)}`
      const response = await fetch(url)
      if (!response.ok) return null

      const data = await response.json()
      if (data.error) {
        console.error('[API] Monitoring-Fehler:', data.error)
        return null
      }
      return data as MonitoringDaten
    } catch (error) {
      console.error('[API] Monitoring-Netzwerkfehler:', error)
      return null
    }
  },

  /** Alle Prüfungs-Configs laden (für LP-Dashboard) */
  async ladeAlleConfigs(email: string): Promise<PruefungsConfig[] | null> {
    if (!APPS_SCRIPT_URL) return null

    try {
      const url = `${APPS_SCRIPT_URL}?action=ladeAlleConfigs&email=${encodeURIComponent(email)}`
      const response = await fetch(url)
      if (!response.ok) return null

      const text = await response.text()
      try {
        const data = JSON.parse(text)
        if (data.error) {
          console.error('[API] Configs-Fehler:', data.error)
          return null
        }
        return data.configs ?? []
      } catch {
        console.error('[API] ladeAlleConfigs: Antwort ist kein JSON')
        return null
      }
    } catch (error) {
      console.error('[API] Configs-Netzwerkfehler:', error)
      return null
    }
  },

  /** Fragenbank laden (alle Fragen für Composer) */
  async ladeFragenbank(email: string): Promise<Frage[] | null> {
    if (!APPS_SCRIPT_URL) return null

    try {
      const url = `${APPS_SCRIPT_URL}?action=ladeFragenbank&email=${encodeURIComponent(email)}`
      const response = await fetch(url)
      if (!response.ok) return null

      const text = await response.text()
      try {
        const data = JSON.parse(text)
        if (data.error) {
          console.error('[API] Fragenbank-Fehler:', data.error)
          return null
        }
        return data.fragen ?? []
      } catch {
        console.error('[API] ladeFragenbank: Antwort ist kein JSON')
        return null
      }
    } catch (error) {
      console.error('[API] Fragenbank-Netzwerkfehler:', error)
      return null
    }
  },

  /** Prüfungs-Config speichern (Composer → Configs-Sheet) */
  async speichereConfig(email: string, config: PruefungsConfig): Promise<boolean> {
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
  },

  /** Einzelne Frage speichern (Fragenbank) */
  async speichereFrage(email: string, frage: Frage): Promise<boolean> {
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
  },


  /** Schülercode gegen Klassenliste validieren */
  async validiereSchuelercode(email: string, code: string): Promise<{
    success: boolean
    name?: string
    vorname?: string
    klasse?: string
    error?: string
  } | null> {
    if (!APPS_SCRIPT_URL) return null

    try {
      const response = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action: 'validiereSchuelercode', email, code }),
      })
      if (!response.ok) return null

      const text = await response.text()
      try {
        return JSON.parse(text)
      } catch {
        console.error('[API] validiereSchuelercode: Antwort ist kein JSON')
        return null
      }
    } catch (error) {
      console.error('[API] validiereSchuelercode: Netzwerkfehler:', error)
      return null
    }
  },

  /** Prüft ob das Backend konfiguriert ist */
  istKonfiguriert(): boolean {
    return !!APPS_SCRIPT_URL
  },
}
