import type { FrageAnhang } from '../types/fragen.ts'
import type { KIAssistentRueckgabe } from '@shared/editor/types'
import { APPS_SCRIPT_URL, fileToBase64 } from './apiClient'

/** Material-Datei (PDF/Bild) hochladen und Drive-URL zurückgeben */
export async function uploadMaterial(email: string, datei: File): Promise<{ driveFileId: string; url: string } | null> {
  if (!APPS_SCRIPT_URL) return null

  try {
    const base64 = await fileToBase64(datei)

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
}

/** Anhang (Bild/PDF) zu einer Frage hochladen.
 *  Gibt {FrageAnhang} bei Erfolg, {error: string} bei Backend-Fehler, oder null bei Netzwerkfehler. */
export async function uploadAnhang(email: string, frageId: string, datei: File): Promise<FrageAnhang | { error: string } | null> {
  if (!APPS_SCRIPT_URL) return null

  try {
    const base64 = await fileToBase64(datei)

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
    if (!response.ok) return { error: `HTTP ${response.status}` }

    const text = await response.text()
    try {
      const data = JSON.parse(text)
      if (data.error) return { error: data.error }
      return data as FrageAnhang
    } catch {
      return { error: 'Ungültige Server-Antwort' }
    }
  } catch (err) {
    console.error('[uploadAnhang] Netzwerkfehler:', err)
    return null
  }
}

/** Audio-Kommentar (Blob) als Base64 hochladen, gibt Drive-File-ID zurück */
export async function uploadAudioKommentar(email: string, pruefungId: string, schuelerEmail: string, frageId: string, blob: Blob): Promise<string | null> {
  if (!APPS_SCRIPT_URL) return null

  try {
    const base64 = await fileToBase64(blob)

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
}

/** SuS-Audio-Antwort als Drive-File hochladen (statt inline Base64 im Antwort-JSON).
 *  Gibt die Drive-URL zurück die im Antwort-JSON gespeichert wird.
 *  Reduziert Payload von ~300KB auf wenige Bytes. */
export async function uploadAudioAntwort(pruefungId: string, email: string, frageId: string, blob: Blob): Promise<string | null> {
  if (!APPS_SCRIPT_URL) return null

  try {
    const base64 = await fileToBase64(blob)
    const mimeType = blob.type || 'audio/webm'
    const dateiname = `audio_${pruefungId}_${email.replace('@', '_')}_${frageId}_${Date.now()}.${mimeType.includes('mp4') ? 'm4a' : 'webm'}`

    const sessionToken = sessionStorage.getItem('pruefung-auth')
    let token: string | undefined
    try { token = JSON.parse(sessionToken || '{}')?.sessionToken } catch { /* ignore */ }

    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({
        action: 'uploadAnhang',
        email,
        frageId: `audio-antwort-${pruefungId}`,
        dateiname,
        mimeType,
        groesseBytes: blob.size,
        base64Data: base64,
        ...(token ? { sessionToken: token } : {}),
      }),
    })
    if (!response.ok) return null

    const text = await response.text()
    try {
      const data = JSON.parse(text)
      if (data.error) {
        console.error('[API] uploadAudioAntwort:', data.error)
        return null
      }
      return data.url ?? null
    } catch {
      return null
    }
  } catch (error) {
    console.error('[API] uploadAudioAntwort: Fehler:', error)
    return null
  }
}

/** KI-Assistent: Claude-basierte Hilfe beim Fragenschreiben */
export async function kiAssistent(email: string, aktion: string, daten: Record<string, unknown>): Promise<KIAssistentRueckgabe | null> {
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
        return { ergebnis: { error: data.error } }
      }
      if (data.success && data.ergebnis !== undefined) {
        return {
          ergebnis: data.ergebnis as Record<string, unknown>,
          feedbackId: data.feedbackId as string | undefined,
        }
      }
      // Defensiver Fallback: falls ein künftiger Endpoint den success-Wrapper vergisst,
      // aber ergebnis direkt zurückliefert. Kein bekannter Legacy-Fall — nur Sicherheitsnetz.
      if (data.ergebnis !== undefined) {
        return { ergebnis: data.ergebnis as Record<string, unknown> }
      }
      return null
    } catch {
      console.error('[API] kiAssistent: Antwort ist kein JSON')
      return null
    }
  } catch (error) {
    console.error('[API] kiAssistent: Netzwerkfehler:', error)
    return null
  }
}

/** Feedback-Eintrag als ignoriert markieren (fire-and-forget).
 *  Teilt dem Backend mit, dass der User das Feedback-UI weggeklickt hat. */
export async function markiereFeedbackAlsIgnoriert(email: string, feedbackId: string): Promise<void> {
  if (!APPS_SCRIPT_URL) return
  try {
    await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: 'markiereKIFeedbackAlsIgnoriert', email, feedbackId }),
    })
  } catch (e) {
    console.warn('[API] markiereFeedbackAlsIgnoriert:', e)
  }
}
