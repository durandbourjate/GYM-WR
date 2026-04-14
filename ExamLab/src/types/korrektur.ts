import type { Antwort } from './antworten.ts'

// === Bewertung eines einzelnen Kriteriums (kriterienbasierte KI-Korrektur) ===

export interface KriteriumBewertung {
  kriterium: string        // Beschreibung des Kriteriums (aus Bewertungsraster)
  maxPunkte: number
  kiPunkte: number | null  // KI-Vorschlag pro Kriterium
  lpPunkte: number | null  // LP-Überschreibung pro Kriterium
  kurzbegruendung?: string // KI-Erklärung für dieses Kriterium
}

// === Bewertung einer einzelnen Frage für einen SuS ===

export interface FragenBewertung {
  frageId: string
  fragenTyp: string  // 'mc' | 'freitext' | 'zuordnung' | 'lueckentext' | 'richtigfalsch' | 'berechnung'

  // Punkte
  maxPunkte: number
  kiPunkte: number | null       // KI-Vorschlag (null wenn nicht KI-bewertet)
  lpPunkte: number | null       // LP-Anpassung (null = KI-Wert übernehmen)

  // Kriterienbasierte Bewertung (optional, bei Fragen mit Bewertungsraster)
  kriterienBewertung?: KriteriumBewertung[]

  // Texte
  kiBegruendung: string | null  // Interne Begründung für LP
  kiFeedback: string | null     // Feedback für SuS
  lpKommentar: string | null    // LP-Ergänzung/Überschreibung

  // Meta
  quelle: 'auto' | 'ki' | 'manuell' | 'fehler'
  geprueft: boolean             // LP hat explizit bestätigt
  audioKommentarId?: string     // Drive-File-ID des Audio-Kommentars
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
  audioGesamtkommentarId?: string  // Drive-File-ID des Gesamt-Audio-Kommentars
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
  audioKommentarId?: string | null  // null = entfernen
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
