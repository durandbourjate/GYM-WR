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
    const parsed = JSON.parse(raw) as unknown
    // Defensiv: localStorage-Wert kann durch externe Manipulation `null`, ein Objekt
    // oder eine andere Struktur sein. Caller ruft `.map`/`.slice` darauf auf.
    if (!Array.isArray(parsed)) return []
    return parsed as GespeichertesErgebnis[]
  } catch { return [] }
}

export function speichereHistorie(historie: GespeichertesErgebnis[]) {
  try { localStorage.setItem(HISTORIE_KEY, JSON.stringify(historie.slice(0, MAX_HISTORIE))) } catch { /* quota */ }
}
