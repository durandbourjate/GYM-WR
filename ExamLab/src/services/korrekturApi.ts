import type { PruefungsKorrektur, SchuelerAbgabe, KorrekturZeileUpdate, FeedbackVersandPayload, FeedbackVersandErgebnis } from '../types/korrektur.ts'
import { APPS_SCRIPT_URL, getJson, postJson, postBool } from './apiClient'

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

/** MC-Option in Korrektur-Ansicht */
export interface KorrekturMCOption {
  id: string
  text: string
}

/** R/F-Aussage in Korrektur-Ansicht */
export interface KorrekturRFAussage {
  id: string
  text: string
  korrekt: boolean
}

export interface KorrekturDetailDaten {
  success: boolean
  titel: string
  datum: string
  klasse: string
  fragen: Array<{
    id: string
    typ: string
    fragetext?: string
    geschaeftsfall?: string
    aufgabentext?: string
    anhaenge?: Array<{ id: string; dateiname: string; mimeType: string; groesseBytes: number; driveFileId: string; beschreibung?: string; url?: string }>
    // MC-spezifisch
    optionen?: KorrekturMCOption[]
    korrekteOptionen?: string[]
    mehrfachauswahl?: boolean
    // R/F-spezifisch
    aussagen?: KorrekturRFAussage[]
  }>
  antworten: Record<string, unknown>
  bewertungen: Record<string, KorrekturDetailBewertung>
  gesamtPunkte: number
  maxPunkte: number
  audioGesamtkommentarId: string | null
  pdfFreigegeben?: boolean  // LP hat PDF-Download für SuS freigegeben
}

/** Korrektur-Status: Wie viele Zeilen geprüft vs. offen? */
export interface KorrekturStatus {
  korrigiert: number
  offen: number
  gesamt: number
}

export async function ladeKorrekturStatus(pruefungId: string, email: string): Promise<KorrekturStatus | null> {
  return getJson<KorrekturStatus>('ladeKorrekturStatus', { id: pruefungId, email })
}

/** Korrektur-Daten einer Prüfung laden (alle SuS + Bewertungen) */
export async function ladeKorrektur(pruefungId: string, email: string): Promise<PruefungsKorrektur | null> {
  return getJson<PruefungsKorrektur>('ladeKorrektur', { id: pruefungId, email })
}

/** Alle Schüler-Abgaben einer Prüfung laden (für Antwort-Anzeige) */
export async function ladeAbgaben(pruefungId: string, email: string): Promise<Record<string, SchuelerAbgabe> | null> {
  const data = await getJson<{ abgaben: Record<string, SchuelerAbgabe> }>('ladeAbgaben', { id: pruefungId, email })
  if (!data) return null
  return data.abgaben ?? {}
}

/** Autokorrektur-Batch starten (algorithmische Korrektur für deterministische Fragetypen) */
export async function starteKorrektur(pruefungId: string, email: string): Promise<{ success: boolean; fehler?: string } | null> {
  return postJson<{ success: boolean; fehler?: string }>('starteKorrektur', { pruefungId, email })
}

/** Korrektur-Fortschritt abfragen (Polling während Batch) */
export async function ladeKorrekturFortschritt(pruefungId: string, email: string): Promise<{
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
}

/** Einzelne Korrektur-Zeile speichern (LP-Anpassung) */
export async function speichereKorrekturZeile(payload: KorrekturZeileUpdate, email: string): Promise<boolean> {
  return postBool('speichereKorrekturZeile', { email, ...payload })
}

/** Feedback-PDFs generieren und per E-Mail versenden */
export async function generiereUndSendeFeedback(payload: FeedbackVersandPayload, email: string): Promise<FeedbackVersandErgebnis | null> {
  return postJson<FeedbackVersandErgebnis>('generiereUndSendeFeedback', { email, ...payload })
}

/** Korrektur für SuS freigeben/sperren (typ: 'einsicht' | 'pdf') */
export async function korrekturFreigeben(pruefungId: string, freigegeben: boolean, email: string, typ: 'einsicht' | 'pdf' = 'einsicht'): Promise<boolean> {
  return postBool('korrekturFreigeben', { email, pruefungId, freigegeben, typ })
}

/** Freigegebene Korrekturen für SuS laden */
export async function ladeKorrekturenFuerSuS(email: string): Promise<KorrekturListeEintrag[] | null> {
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
}

/** Detail einer korrigierten Prüfung für SuS laden */
export async function ladeKorrekturDetail(pruefungId: string, email: string): Promise<KorrekturDetailDaten | null> {
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
}
