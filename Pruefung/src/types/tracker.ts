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

  // Per-Frage-Statistiken (nur bei korrigierten Prüfungen)
  fragenStats?: Record<string, FrageStatEintrag>
}

/** Per-Frage-Statistiken aus einer einzelnen Prüfung */
export interface FrageStatEintrag {
  loesungsquote: number  // 0-100
  durchschnittPunkte: number
  maxPunkte: number
  n: number  // Anzahl bewerteter SuS
  trennschaerfe?: number | null  // Punkt-biseriale Korrelation (-1 bis +1)
}

/** Gesamtantwort des Tracker-Endpoints */
export interface TrackerDaten {
  pruefungen: TrackerPruefungSummary[]
  aktualisiert: string
  notenStand?: NotenStandKurs[]
}

/** SuS die bei einer Prüfung gefehlt haben */
export interface FehlenderSchueler {
  email: string
  name: string
  klasse: string
}

/** Abgeleiteter Prüfungsstatus */
export type PruefungsStatus = 'entwurf' | 'aktiv' | 'beendet' | 'korrigiert'

/** Aggregierte Performance einer Frage über mehrere Prüfungen */
export interface FragenPerformance {
  frageId: string
  anzahlVerwendungen: number
  gesamtN: number
  durchschnittLoesungsquote: number  // 0-100
  durchschnittTrennschaerfe: number | null  // Gewichteter Durchschnitt über Prüfungen
  verwendungen: { pruefungId: string; pruefungTitel: string; datum: string; loesungsquote: number; n: number; trennschaerfe?: number | null }[]
}

/** Noten-Stand eines Kurses gegen MiSDV-Vorgaben */
export interface NotenStandKurs {
  kursId: string
  kurs: string
  gefaess: string
  semester: string
  vorhandeneNoten: number
  erforderlicheNoten: number
  status: 'ok' | 'warning' | 'critical'
  naechsterTermin: string
}
