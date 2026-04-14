import type { Frage } from './fragen'
import type { Antwort } from '../antworten'

export type SessionModus = 'standard' | 'mix' | 'repetition'

export interface ThemaQuelle {
  fach: string
  thema: string
}

export interface UebungsSession {
  id: string
  gruppeId: string
  email: string
  fach: string
  thema: string
  modus?: SessionModus
  quellen?: ThemaQuelle[]
  fragen: Frage[]
  antworten: Record<string, Antwort>
  ergebnisse: Record<string, boolean>
  aktuelleFrageIndex: number
  gestartet: string
  beendet?: string
  /** IDs der als "unsicher" markierten Fragen */
  unsicher: Set<string>
  /** IDs der übersprungenen Fragen */
  uebersprungen: Set<string>
  /** Punkte-Score (richtig = +1, falsch = 0) */
  score: number
  /** Freiwilliges Üben (gesperrtes Thema) — Fortschritt wird NICHT gespeichert */
  freiwillig?: boolean
  /** Zwischenstände für Multi-Feld-Fragetypen (ohne Korrektur) */
  zwischenstande?: Record<string, Antwort>
}

export interface SessionErgebnis {
  sessionId: string
  anzahlFragen: number
  richtig: number
  falsch: number
  quote: number
  dauer: number
  details: {
    frageId: string
    frage: string
    typ: string
    korrekt: boolean
    erklaerung?: string
    unsicher?: boolean
    uebersprungen?: boolean
  }[]
}
