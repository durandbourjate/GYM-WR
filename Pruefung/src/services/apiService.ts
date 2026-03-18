import type { Frage } from '../types/fragen.ts'
import type { PruefungsConfig } from '../types/pruefung.ts'
import type { Antwort } from '../types/antworten.ts'
import type { MonitoringDaten, PruefungsNachricht } from '../types/monitoring.ts'
import type { PruefungsKorrektur, SchuelerAbgabe, KorrekturZeileUpdate, FeedbackVersandPayload, FeedbackVersandErgebnis } from '../types/korrektur.ts'

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

  // === KI-Korrektur Endpoints ===

  /** Korrektur-Daten einer Prüfung laden (alle SuS + Bewertungen) */
  async ladeKorrektur(pruefungId: string, email: string): Promise<PruefungsKorrektur | null> {
    if (!APPS_SCRIPT_URL) return null

    try {
      const url = `${APPS_SCRIPT_URL}?action=ladeKorrektur&id=${encodeURIComponent(pruefungId)}&email=${encodeURIComponent(email)}`
      const response = await fetch(url)
      if (!response.ok) return null

      const text = await response.text()
      try {
        const data = JSON.parse(text)
        if (data.error) {
          console.error('[API] ladeKorrektur:', data.error)
          return null
        }
        return data as PruefungsKorrektur
      } catch {
        console.error('[API] ladeKorrektur: Antwort ist kein JSON')
        return null
      }
    } catch (error) {
      console.error('[API] ladeKorrektur: Netzwerkfehler:', error)
      return null
    }
  },

  /** Alle Schüler-Abgaben einer Prüfung laden (für Antwort-Anzeige) */
  async ladeAbgaben(pruefungId: string, email: string): Promise<Record<string, SchuelerAbgabe> | null> {
    if (!APPS_SCRIPT_URL) return null

    try {
      const url = `${APPS_SCRIPT_URL}?action=ladeAbgaben&id=${encodeURIComponent(pruefungId)}&email=${encodeURIComponent(email)}`
      const response = await fetch(url)
      if (!response.ok) return null

      const text = await response.text()
      try {
        const data = JSON.parse(text)
        if (data.error) {
          console.error('[API] ladeAbgaben:', data.error)
          return null
        }
        return data.abgaben ?? {}
      } catch {
        console.error('[API] ladeAbgaben: Antwort ist kein JSON')
        return null
      }
    } catch (error) {
      console.error('[API] ladeAbgaben: Netzwerkfehler:', error)
      return null
    }
  },

  /** KI-Korrektur-Batch starten (Auto-Korrektur + Claude API) */
  async starteKorrektur(pruefungId: string, email: string): Promise<{ success: boolean; fehler?: string } | null> {
    if (!APPS_SCRIPT_URL) return null

    try {
      const response = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action: 'starteKorrektur', pruefungId, email }),
      })
      if (!response.ok) return null

      const text = await response.text()
      try {
        return JSON.parse(text)
      } catch {
        console.error('[API] starteKorrektur: Antwort ist kein JSON')
        return null
      }
    } catch (error) {
      console.error('[API] starteKorrektur: Netzwerkfehler:', error)
      return null
    }
  },

  /** Korrektur-Fortschritt abfragen (Polling während Batch) */
  async ladeKorrekturFortschritt(pruefungId: string, email: string): Promise<{
    status: string
    fortschritt: { erledigt: number; gesamt: number }
  } | null> {
    if (!APPS_SCRIPT_URL) return null

    try {
      const url = `${APPS_SCRIPT_URL}?action=korrekturFortschritt&id=${encodeURIComponent(pruefungId)}&email=${encodeURIComponent(email)}`
      const response = await fetch(url)
      if (!response.ok) return null

      const text = await response.text()
      try {
        return JSON.parse(text)
      } catch {
        return null
      }
    } catch {
      return null
    }
  },

  /** Einzelne Korrektur-Zeile speichern (LP-Anpassung) */
  async speichereKorrekturZeile(payload: KorrekturZeileUpdate, email: string): Promise<boolean> {
    if (!APPS_SCRIPT_URL) return false

    try {
      const response = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action: 'speichereKorrekturZeile', email, ...payload }),
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
  },

  /** Feedback-PDFs generieren und per E-Mail versenden */
  async generiereUndSendeFeedback(payload: FeedbackVersandPayload, email: string): Promise<FeedbackVersandErgebnis | null> {
    if (!APPS_SCRIPT_URL) return null

    try {
      const response = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action: 'generiereUndSendeFeedback', email, ...payload }),
      })
      if (!response.ok) return null

      const text = await response.text()
      try {
        return JSON.parse(text)
      } catch {
        console.error('[API] generiereUndSendeFeedback: Antwort ist kein JSON')
        return null
      }
    } catch (error) {
      console.error('[API] generiereUndSendeFeedback: Netzwerkfehler:', error)
      return null
    }
  },


  /** Prüfung freischalten (Warteraum aufheben) */
  async schaltePruefungFrei(pruefungId: string, email: string): Promise<boolean> {
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
  },

  // === Nachrichten (LP → SuS) ===

  /** Nachricht von LP an SuS senden */
  async sendeNachricht(pruefungId: string, lpEmail: string, susEmail: string, text: string): Promise<boolean> {
    if (!APPS_SCRIPT_URL) return false

    try {
      const response = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          action: 'sendeNachricht',
          pruefungId,
          von: lpEmail,
          an: susEmail,
          text,
        }),
      })
      if (!response.ok) return false

      const data = await response.json()
      return data.success === true
    } catch (error) {
      console.error('[API] sendeNachricht: Netzwerkfehler:', error)
      return false
    }
  },

  /** Nachrichten für eine Person laden (SuS oder LP) */
  async ladeNachrichten(pruefungId: string, email: string): Promise<PruefungsNachricht[]> {
    if (!APPS_SCRIPT_URL) return []

    try {
      const url = `${APPS_SCRIPT_URL}?action=ladeNachrichten&id=${encodeURIComponent(pruefungId)}&email=${encodeURIComponent(email)}`
      const response = await fetch(url)
      if (!response.ok) return []

      const text = await response.text()
      try {
        const data = JSON.parse(text)
        if (data.error) {
          console.error('[API] ladeNachrichten:', data.error)
          return []
        }
        return data.nachrichten ?? []
      } catch {
        console.error('[API] ladeNachrichten: Antwort ist kein JSON')
        return []
      }
    } catch (error) {
      console.error('[API] ladeNachrichten: Netzwerkfehler:', error)
      return []
    }
  },

  /** Prüft ob das Backend konfiguriert ist */
  istKonfiguriert(): boolean {
    return !!APPS_SCRIPT_URL
  },
}
