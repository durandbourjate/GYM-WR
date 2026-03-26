import type { Unterbrechung } from './antworten.ts'

/** Status eines einzelnen Schülers/einer einzelnen Schülerin während der Prüfung */
export interface SchuelerStatus {
  email: string
  name: string
  klasse?: string

  /** Aktuelle Frage (0-basierter Index), null wenn unbekannt */
  aktuelleFrage: number | null

  /** Aktuelle Aktivität */
  status: 'aktiv' | 'inaktiv' | 'abgegeben' | 'nicht-gestartet' | 'beendet-lp'

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

  /** Lockdown-Info */
  geraet?: 'laptop' | 'tablet' | 'unbekannt'
  vollbild?: boolean
  kontrollStufe?: 'keine' | 'locker' | 'standard' | 'streng'
  verstossZaehler?: number
  gesperrt?: boolean
  verstoesse?: Array<{ zeitpunkt: string; typ: string; dauer_sekunden?: number }>
}

/** Zusammenfassung der Prüfungs-Monitoring-Daten für LP */
export interface MonitoringDaten {
  pruefungId: string
  pruefungTitel: string
  gesamtSus: number
  aktualisiert: string // ISO-Timestamp der letzten Datenaktualisierung
  schueler: SchuelerStatus[]
  zeitverlaengerungen?: Record<string, number> // E-Mail → zusätzliche Minuten (Nachteilsausgleich)
}

/** Antwort des Heartbeat-Endpoints (erweitert um Beenden-Signal) */
export interface HeartbeatResponse {
  success: boolean
  beendetUm?: string        // ISO-Timestamp — LP hat Prüfung beendet
  restzeitMinuten?: number   // Original-Restzeit (für Nachteilsausgleich)
  sebAusnahme?: boolean      // LP hat SEB-Ausnahme für diesen SuS erteilt
  kontrollStufeOverride?: 'keine' | 'locker' | 'standard' | 'streng'  // LP hat Kontrollstufe geändert
  entsperrt?: boolean        // LP hat SuS entsperrt
  phase?: 'vorbereitung' | 'lobby' | 'aktiv' | 'live'  // Aktuelle Phase (für Warteraum-Anzeige + Freischaltungserkennung)
  tabSessionUngueltig?: boolean  // Multi-Tab-Schutz: Dieser Tab ist nicht die aktive Session
}

/** Nachricht von LP an SuS während einer Prüfung */
export interface PruefungsNachricht {
  id: string           // timestamp-basierte unique ID
  von: string          // E-Mail des Absenders (LP)
  an: string           // E-Mail des Empfängers (SuS), oder '*' für Broadcast
  text: string         // Nachrichteninhalt
  zeitpunkt: string    // ISO-Timestamp
  gelesen: boolean     // Vom Empfänger gelesen
}

/** Phasen des Prüfungs-Workflows */
export type PruefungsPhase = 'vorbereitung' | 'lobby' | 'aktiv' | 'beendet'
