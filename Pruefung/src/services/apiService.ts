import type { Frage, FrageAnhang } from '../types/fragen.ts'
import type { PruefungsConfig } from '../types/pruefung.ts'
import type { Antwort } from '../types/antworten.ts'
import type { MonitoringDaten, PruefungsNachricht } from '../types/monitoring.ts'
import type { PruefungsKorrektur, SchuelerAbgabe, KorrekturZeileUpdate, FeedbackVersandPayload, FeedbackVersandErgebnis } from '../types/korrektur.ts'

/** URL des deployed Google Apps Script Web-Apps */
const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL || ''

interface KlassenlistenEintrag {
  klasse: string
  kurs?: string
  email: string
  name: string
  vorname: string
}

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

  /** Heartbeat senden (Monitoring durch LP) — gibt Beenden-Signal zurück */
  async heartbeat(pruefungId: string, email: string, aktuelleFrage?: number): Promise<import('../types/monitoring.ts').HeartbeatResponse> {
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
        }
      } catch {
        return { success: response.ok }
      }
    } catch {
      return { success: false }
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

  /** Prüfung löschen (aus Configs-Sheet entfernen) */
  async loeschePruefung(email: string, pruefungId: string): Promise<boolean> {
    if (!APPS_SCRIPT_URL) return false

    try {
      const payload = JSON.stringify({ action: 'loeschePruefung', email, pruefungId })

      const response = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: payload,
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

  /** Batch-Import von Pool-Fragen */
  async importierePoolFragen(email: string, fragen: Frage[]): Promise<{ erfolg: boolean; importiert: number; aktualisiert: number; fehler: string[] } | null> {
    if (!APPS_SCRIPT_URL) return null
    try {
      const payload = JSON.stringify({ action: 'importierePoolFragen', email, fragen })
      const response = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: payload,
      })
      if (!response.ok) return null
      const text = await response.text()
      try {
        const data = JSON.parse(text)
        if (data.error) { console.error('[API] importierePoolFragen:', data.error); return null }
        return data
      } catch { return null }
    } catch (error) {
      console.error('[API] importierePoolFragen: Netzwerkfehler:', error)
      return null
    }
  },

  /** Batch-Import von Lernzielen */
  async importiereLernziele(lernziele: import('../types/pool').Lernziel[]): Promise<{ erfolg: boolean; neu: number; aktualisiert: number } | null> {
    if (!APPS_SCRIPT_URL) return null
    try {
      const payload = JSON.stringify({ action: 'importiereLernziele', lernziele })
      const response = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: payload,
      })
      if (!response.ok) return null
      const text = await response.text()
      try {
        const data = JSON.parse(text)
        if (data.error) { console.error('[API] importiereLernziele:', data.error); return null }
        return data
      } catch { return null }
    } catch (error) {
      console.error('[API] importiereLernziele: Netzwerkfehler:', error)
      return null
    }
  },

  /** Schreibt Änderungen an Pool-Fragen zurück via GitHub API */
  async schreibePoolAenderung(
    email: string,
    poolDatei: string,
    aenderungen: Array<{
      poolFrageId: string | null
      typ: 'update' | 'export'
      felder: Record<string, unknown>
    }>,
  ): Promise<{
    erfolg: boolean
    aktualisiert: number
    exportiert: number
    commitSha: string
    neueHashes: Record<string, string>
    exportierteIds: Record<string, string>
    fehler: string[]
  } | null> {
    if (!APPS_SCRIPT_URL) return null
    try {
      const payload = JSON.stringify({
        action: 'schreibePoolAenderung',
        email,
        poolDatei,
        aenderungen,
      })
      const response = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: payload,
      })
      if (!response.ok) return null
      const text = await response.text()
      try {
        const data = JSON.parse(text)
        if (data.error) { console.error('[API] schreibePoolAenderung:', data.error); return null }
        return data
      } catch { return null }
    } catch (error) {
      console.error('[API] schreibePoolAenderung: Netzwerkfehler:', error)
      return null
    }
  },

  /** Lernziele laden (optional nach Fach gefiltert) */
  async ladeLernziele(fach?: string): Promise<import('../types/pool').Lernziel[]> {
    if (!APPS_SCRIPT_URL) return []
    try {
      const payload = JSON.stringify({ action: 'ladeLernziele', fach })
      const response = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: payload,
      })
      if (!response.ok) return []
      const text = await response.text()
      try {
        const data = JSON.parse(text)
        return data?.lernziele || []
      } catch { return [] }
    } catch {
      return []
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


  /** Frage aus Fragenbank löschen */
  async loescheFrage(email: string, frageId: string, fachbereich: string): Promise<boolean> {
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

  /** Prüfung beenden (LP) — sofort oder mit Restzeit, global oder einzeln */
  async beendePruefung(payload: {
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

  /** Material-Datei (PDF/Bild) hochladen und Drive-URL zurückgeben */
  async uploadMaterial(email: string, datei: File): Promise<{ driveFileId: string; url: string } | null> {
    if (!APPS_SCRIPT_URL) return null

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve((reader.result as string).split(',')[1])
        reader.onerror = reject
        reader.readAsDataURL(datei)
      })

      const response = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          action: 'uploadMaterial',
          email,
          dateiname: datei.name,
          mimeType: datei.type,
          groesseBytes: datei.size,
          base64Data: base64,
        }),
      })
      if (!response.ok) return null

      const text = await response.text()
      try {
        const data = JSON.parse(text)
        if (data.error) return null
        return { driveFileId: data.driveFileId, url: data.url }
      } catch {
        return null
      }
    } catch {
      return null
    }
  },

  /** Anhang (Bild/PDF) zu einer Frage hochladen */
  async uploadAnhang(email: string, frageId: string, datei: File): Promise<FrageAnhang | null> {
    if (!APPS_SCRIPT_URL) return null

    try {
      // Datei als Base64 kodieren
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve((reader.result as string).split(',')[1])
        reader.onerror = reject
        reader.readAsDataURL(datei)
      })

      const response = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          action: 'uploadAnhang',
          email,
          frageId,
          dateiname: datei.name,
          mimeType: datei.type,
          groesseBytes: datei.size,
          base64Data: base64,
        }),
      })
      if (!response.ok) return null

      const text = await response.text()
      try {
        const data = JSON.parse(text)
        if (data.error) return null
        return data as FrageAnhang
      } catch {
        return null
      }
    } catch {
      return null
    }
  },

  /** KI-Assistent: Claude-basierte Hilfe beim Fragenschreiben */
  async kiAssistent(email: string, aktion: string, daten: Record<string, unknown>): Promise<Record<string, unknown> | null> {
    if (!APPS_SCRIPT_URL) return null

    try {
      const response = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action: 'kiAssistent', email, aktion, daten }),
      })
      if (!response.ok) return null

      const text = await response.text()
      try {
        const data = JSON.parse(text)
        if (data.error) {
          console.error('[API] kiAssistent:', data.error)
          return { error: data.error }
        }
        return data.ergebnis ?? null
      } catch {
        console.error('[API] kiAssistent: Antwort ist kein JSON')
        return null
      }
    } catch (error) {
      console.error('[API] kiAssistent: Netzwerkfehler:', error)
      return null
    }
  },

  /** Audio-Kommentar (Blob) als Base64 hochladen, gibt Drive-File-ID zurück */
  async uploadAudioKommentar(email: string, pruefungId: string, schuelerEmail: string, frageId: string, blob: Blob): Promise<string | null> {
    if (!APPS_SCRIPT_URL) return null

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve((reader.result as string).split(',')[1])
        reader.onerror = reject
        reader.readAsDataURL(blob)
      })

      const mimeType = blob.type || 'audio/webm'
      const dateiname = `audio_${pruefungId}_${schuelerEmail}_${frageId}_${Date.now()}.${mimeType.includes('mp4') ? 'm4a' : 'webm'}`

      const response = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          action: 'uploadAnhang',
          email,
          frageId: `korrektur-${pruefungId}`,
          dateiname,
          mimeType,
          groesseBytes: blob.size,
          base64Data: base64,
        }),
      })
      if (!response.ok) return null

      const text = await response.text()
      try {
        const data = JSON.parse(text)
        if (data.error) return null
        return data.driveFileId ?? null
      } catch {
        return null
      }
    } catch {
      return null
    }
  },

  /** Korrektur für SuS freigeben/sperren */
  async korrekturFreigeben(pruefungId: string, freigegeben: boolean, email: string): Promise<boolean> {
    if (!APPS_SCRIPT_URL) return false
    try {
      const response = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action: 'korrekturFreigeben', email, pruefungId, freigegeben }),
      })
      if (!response.ok) return false
      const text = await response.text()
      try {
        const data = JSON.parse(text)
        return data.success === true
      } catch { return false }
    } catch { return false }
  },

  /** Freigegebene Korrekturen für SuS laden */
  async ladeKorrekturenFuerSuS(email: string): Promise<KorrekturListeEintrag[] | null> {
    if (!APPS_SCRIPT_URL) return null
    try {
      const response = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action: 'ladeKorrekturenFuerSuS', email }),
      })
      if (!response.ok) return null
      const text = await response.text()
      try {
        const data = JSON.parse(text)
        return data.korrekturen ?? null
      } catch { return null }
    } catch { return null }
  },

  /** Detail einer korrigierten Prüfung für SuS laden */
  async ladeKorrekturDetail(pruefungId: string, email: string): Promise<KorrekturDetailDaten | null> {
    if (!APPS_SCRIPT_URL) return null
    try {
      const response = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action: 'ladeKorrekturDetail', email, pruefungId }),
      })
      if (!response.ok) return null
      const text = await response.text()
      try {
        const data = JSON.parse(text)
        if (!data.success) return null
        return data as KorrekturDetailDaten
      } catch { return null }
    } catch { return null }
  },

  /** Lädt Klassenlisten vom Backend (LP-only) */
  async ladeKlassenlisten(email: string): Promise<KlassenlistenEintrag[]> {
    if (!APPS_SCRIPT_URL) return []
    const url = `${APPS_SCRIPT_URL}?action=ladeKlassenlisten&email=${encodeURIComponent(email)}`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`Klassenlisten laden fehlgeschlagen (${res.status})`)
    const data = await res.json()
    if (data.error) throw new Error(data.error)
    return data.klassenlisten ?? []
  },

  /** Setzt Teilnehmer für eine Prüfung (LP-only) */
  async setzeTeilnehmer(
    email: string,
    pruefungId: string,
    teilnehmer: Array<{ email: string; name: string; vorname: string; klasse: string; quelle: 'klassenliste' | 'manuell'; einladungGesendet?: boolean }>,
  ): Promise<boolean> {
    if (!APPS_SCRIPT_URL) return false
    const res = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({
        action: 'setzeTeilnehmer',
        email,
        pruefungId,
        teilnehmer,
      }),
    })
    if (!res.ok) return false
    const data = await res.json()
    return data.success === true
  },

  /** Sendet Einladungs-E-Mails an Teilnehmer (LP-only) */
  async sendeEinladungen(
    email: string,
    pruefungId: string,
    pruefungTitel: string,
    pruefungUrl: string,
    empfaenger: Array<{ email: string; name: string; vorname: string }>,
  ): Promise<Array<{ email: string; erfolg: boolean; fehler?: string }>> {
    if (!APPS_SCRIPT_URL) return []
    const res = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({
        action: 'sendeEinladungen',
        email,
        pruefungId,
        pruefungTitel,
        pruefungUrl,
        empfaenger,
      }),
    })
    if (!res.ok) throw new Error('Einladungen senden fehlgeschlagen')
    const data = await res.json()
    if (data.error) throw new Error(data.error)
    return data.ergebnisse ?? []
  },

  /** Prüft ob das Backend konfiguriert ist */
  istKonfiguriert(): boolean {
    return !!APPS_SCRIPT_URL
  },
}

// Typen für SuS-Korrektur-Einsicht
export interface KorrekturListeEintrag {
  pruefungId: string
  titel: string
  datum: string
  klasse: string
  gesamtPunkte: number
  maxPunkte: number
  note?: number
}

export interface KorrekturDetailBewertung {
  frageId: string
  punkte: number
  maxPunkte: number
  lpKommentar: string | null
  kiFeedback: string | null
  audioKommentarId: string | null
}

export interface KorrekturDetailDaten {
  success: boolean
  titel: string
  datum: string
  klasse: string
  fragen: Array<{ id: string; typ: string; fragetext?: string; anhaenge?: Array<{ id: string; dateiname: string; mimeType: string; groesseBytes: number; driveFileId: string; beschreibung?: string; url?: string }> }>
  antworten: Record<string, unknown>
  bewertungen: Record<string, KorrekturDetailBewertung>
  gesamtPunkte: number
  maxPunkte: number
  audioGesamtkommentarId: string | null
}
