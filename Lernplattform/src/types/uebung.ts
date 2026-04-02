import type { Frage, AntwortTyp } from './fragen'

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
  }[]
}
