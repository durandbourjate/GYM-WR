/**
 * Types für den Prüfungstracker — Aggregierte Übersicht aller Prüfungen.
 */

/** Zusammenfassung einer einzelnen Prüfung für den Tracker */
export interface TrackerPruefungSummary {
  pruefungId: string
  titel: string
  klasse: string
  gefaess: string
  fachbereiche: string[]
  semester: string
  datum: string
  typ: 'summativ' | 'formativ'
  gesamtpunkte: number
  freigeschaltet: boolean
  beendetUm: string | null

  // Teilnahme
  teilnehmerGesamt: number
  eingereicht: number
  nichtErschienen: FehlenderSchueler[]

  // Korrektur
  korrekturStatus: 'keine-daten' | 'offen' | 'teilweise' | 'fertig'
  korrigiertAnzahl: number
  korrigiertGesamt: number
  durchschnittNote: number | null
  bestandenRate: number | null
}

/** Gesamtantwort des Tracker-Endpoints */
export interface TrackerDaten {
  pruefungen: TrackerPruefungSummary[]
  aktualisiert: string
}

/** SuS die bei einer Prüfung gefehlt haben */
export interface FehlenderSchueler {
  email: string
  name: string
  klasse: string
}

/** Abgeleiteter Prüfungsstatus */
export type PruefungsStatus = 'entwurf' | 'aktiv' | 'beendet' | 'korrigiert'

/** Noten-Stand eines Kurses gegen MiSDV-Vorgaben */
export interface NotenStandKurs {
  kurs: string
  gefaess: string
  semester: string
  vorhandeneNoten: number
  erforderlicheNoten: number
  status: 'ok' | 'warning' | 'critical'
  naechsterTermin: string
}
