import type { Antwort } from './antworten.ts'

// === Bewertung einer einzelnen Frage für einen SuS ===

export interface FragenBewertung {
  frageId: string
  fragenTyp: string  // 'mc' | 'freitext' | 'zuordnung' | 'lueckentext' | 'richtigfalsch' | 'berechnung'

  // Punkte
  maxPunkte: number
  kiPunkte: number | null       // KI-Vorschlag (null wenn nicht KI-bewertet)
  lpPunkte: number | null       // LP-Anpassung (null = KI-Wert übernehmen)

  // Texte
  kiBegruendung: string | null  // Interne Begründung für LP
  kiFeedback: string | null     // Feedback für SuS
  lpKommentar: string | null    // LP-Ergänzung/Überschreibung

  // Meta
  quelle: 'auto' | 'ki' | 'manuell' | 'fehler'
  geprueft: boolean             // LP hat explizit bestätigt
}

// === Gesamte Korrektur eines SuS ===

export interface SchuelerKorrektur {
  email: string
  name: string
  klasse?: string

  bewertungen: Record<string, FragenBewertung>  // frageId → Bewertung

  // Aggregiert (berechnet aus bewertungen)
  gesamtPunkte: number
  maxPunkte: number
  note?: number  // Optional, LP setzt manuell oder via berechneNote()
  noteOverride?: number | null  // LP-Überschreibung der berechneten Note

  // Status
  korrekturStatus: 'offen' | 'ki-bewertet' | 'review-fertig' | 'versendet'
  feedbackGesendet?: string  // ISO-Timestamp
}

// === Gesamter Korrektur-Datensatz einer Prüfung ===

export interface PruefungsKorrektur {
  pruefungId: string
  pruefungTitel: string
  datum: string
  klasse: string

  schueler: SchuelerKorrektur[]

  // Batch-Status (KI-Korrektur)
  batchStatus: 'idle' | 'laeuft' | 'fertig' | 'fehler'
  batchFortschritt?: { erledigt: number; gesamt: number }
  batchFehler?: string

  letzteAktualisierung: string
}

// === Schüler-Abgabe (für LP-Ansicht mit Antworten) ===

export interface SchuelerAbgabe {
  email: string
  name: string
  antworten: Record<string, Antwort>
  abgabezeit: string
}

// === Korrektur-Zeile Speicher-Payload ===

export interface KorrekturZeileUpdate {
  pruefungId: string
  schuelerEmail: string
  frageId: string
  lpPunkte?: number | null
  lpKommentar?: string | null
  geprueft?: boolean
}

// === Feedback-Versand-Payload ===

export interface FeedbackVersandPayload {
  pruefungId: string
  schuelerEmails: string[]
}

export interface FeedbackVersandErgebnis {
  erfolg: string[]   // E-Mails die erfolgreich versendet wurden
  fehler: string[]   // E-Mails bei denen der Versand fehlschlug
}
