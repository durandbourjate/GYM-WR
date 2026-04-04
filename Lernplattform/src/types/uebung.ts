import type { Frage } from './fragen'
import type { AntwortTyp } from './antworten'

export interface UebungsSession {
  id: string
  gruppeId: string
  email: string
  fach: string
  thema: string
  fragen: Frage[]
  antworten: Record<string, AntwortTyp>
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
