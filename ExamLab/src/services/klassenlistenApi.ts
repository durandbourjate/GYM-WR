import { APPS_SCRIPT_URL } from './apiClient'

export interface KlassenlistenEintrag {
  klasse: string
  kurs?: string
  email: string
  name: string
  vorname: string
}

/** Lädt Klassenlisten vom Backend (LP-only) — throws bei Fehler */
export async function ladeKlassenlisten(email: string): Promise<KlassenlistenEintrag[]> {
  if (!APPS_SCRIPT_URL) return []
  const url = `${APPS_SCRIPT_URL}?action=ladeKlassenlisten&email=${encodeURIComponent(email)}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Klassenlisten laden fehlgeschlagen (${res.status})`)
  const data = await res.json()
  if (data.error) throw new Error(data.error)
  return data.klassenlisten ?? []
}

/** Setzt Teilnehmer für eine Prüfung (LP-only) */
export async function setzeTeilnehmer(
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
}

/** Sendet Einladungs-E-Mails an Teilnehmer (LP-only) — throws bei Fehler */
export async function sendeEinladungen(
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
}

/** Schülercode gegen Klassenliste validieren */
export async function validiereSchuelercode(email: string, code: string, pruefungId?: string): Promise<{
  success: boolean
  name?: string
  vorname?: string
  klasse?: string
  sessionToken?: string
  error?: string
} | null> {
  if (!APPS_SCRIPT_URL) return null

  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: 'validiereSchuelercode', email, code, pruefungId }),
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
}
