import type { Unterbrechung } from './antworten.ts'

/** Status eines einzelnen Schülers/einer einzelnen Schülerin während der Prüfung */
export interface SchuelerStatus {
  email: string
  name: string
  klasse?: string

  /** Aktuelle Aktivität */
  status: 'aktiv' | 'inaktiv' | 'abgegeben' | 'nicht-gestartet'

  /** Zeitpunkt des letzten Heartbeats (ISO-String) */
  letzterHeartbeat: string | null

  /** Zeitpunkt des letzten Auto-Saves (ISO-String) */
  letzterSave: string | null

  /** Anzahl beantworteter Fragen */
  beantworteteFragen: number

  /** Gesamtanzahl Fragen */
  gesamtFragen: number

  /** Zeitpunkt der Abgabe (ISO-String), null wenn noch nicht abgegeben */
  abgabezeit: string | null

  /** Zeitpunkt des Starts (ISO-String) */
  startzeit: string | null

  /** Anzahl erfolgreicher Heartbeats */
  heartbeats: number

  /** Anzahl Netzwerkfehler */
  netzwerkFehler: number

  /** Auto-Save-Zähler */
  autoSaveCount: number

  /** Protokollierte Unterbrechungen */
  unterbrechungen: Unterbrechung[]

  /** SEB-Info */
  sebVersion?: string
  browserInfo?: string
}

/** Zusammenfassung der Prüfungs-Monitoring-Daten für LP */
export interface MonitoringDaten {
  pruefungId: string
  pruefungTitel: string
  gesamtSus: number
  aktualisiert: string // ISO-Timestamp der letzten Datenaktualisierung
  schueler: SchuelerStatus[]
}
