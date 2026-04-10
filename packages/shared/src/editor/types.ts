/**
 * Interfaces für den Shared FragenEditor.
 * Host-Apps (Prüfungstool, Lernplattform) implementieren diese Interfaces
 * und übergeben sie via EditorContext.
 */
import type { FrageAnhang, Lernziel } from '../types/fragen'

/** Feature-Flags: was der Editor anzeigen soll */
export interface EditorFeatures {
  kiAssistent: boolean
  anhangUpload: boolean
  bewertungsraster: boolean
  sharing: boolean
  poolSync: boolean
  performance: boolean
}

/** Benutzer-Info die der Editor braucht */
export interface EditorBenutzer {
  email: string
  name?: string
  fachschaft?: string
  fachschaften?: string[]
}

/** LP-Info für die Autoren-Auswahl */
export interface EditorLPInfo {
  email: string
  name: string
  kuerzel?: string
}

/** Konfiguration die der Host bereitstellt */
export interface EditorConfig {
  benutzer: EditorBenutzer
  verfuegbareGefaesse: string[]
  verfuegbareSemester: string[]
  zeigeFiBuTypen: boolean
  lpListe?: EditorLPInfo[]
  features: EditorFeatures
}

/** Services die der Host implementiert (Dependency Injection) */
export interface EditorServices {
  /** Datei-Upload (Bilder, PDFs). Null = Upload nicht verfügbar. */
  uploadAnhang?: (frageId: string, datei: File) => Promise<FrageAnhang | null>

  /** KI-Assistent API-Aufruf. Null = KI nicht verfügbar. */
  kiAssistent?: (aktion: string, daten: Record<string, unknown>) => Promise<Record<string, unknown> | null>

  /** Prüft ob KI verfügbar ist */
  istKIVerfuegbar: () => boolean

  /** Prüft ob Upload verfügbar ist */
  istUploadVerfuegbar: () => boolean

  /** Lernziele für ein Gefäss/Fachbereich laden. Null = nicht verfügbar. */
  ladeLernziele?: (gefaess: string, fachbereich: string) => Promise<Lernziel[]>

  /** Neues Lernziel erstellen. Gibt die neue ID zurück, oder null bei Fehler. */
  speichereLernziel?: (lernziel: Omit<Lernziel, 'id'>) => Promise<string | null>
}
