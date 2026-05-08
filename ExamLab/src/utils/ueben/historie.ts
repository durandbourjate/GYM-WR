import type { SessionErgebnis } from '../../types/ueben/uebung'

/** Persistiertes Session-Ergebnis für die Übungs-Einsicht */
export interface GespeichertesErgebnis {
  sessionId: string
  fach: string
  thema: string
  datum: string
  anzahlFragen: number
  richtig: number
  quote: number
  dauer: number
  details: SessionErgebnis['details']
}

export const HISTORIE_KEY = 'ueben-session-historie'
export const MAX_HISTORIE = 50

export function ladeHistorie(): GespeichertesErgebnis[] {
  try {
    const raw = localStorage.getItem(HISTORIE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as GespeichertesErgebnis[]
    // Migration: Antworten in gespeicherten Details auf einheitliches Format normalisieren.
    // GespeichertesErgebnis enthält keine rohen Antwort-Objekte, aber zukünftige Formate
    // könnten sie enthalten — hier als Sicherheitsnetz für ältere localStorage-Einträge.
    return parsed
  } catch { return [] }
}

export function speichereHistorie(historie: GespeichertesErgebnis[]) {
  try { localStorage.setItem(HISTORIE_KEY, JSON.stringify(historie.slice(0, MAX_HISTORIE))) } catch { /* quota */ }
}
