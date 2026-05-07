// ExamLab/src/components/fragetypen/tkonto/tkontoUtils.ts
import type { Antwort } from '../../../types/antworten.ts'

// === Types ===

export interface EintragZeile {
  id: string
  gegenkonto: string
  betrag: string
  gfNr: string // Geschäftsfall-Nummer
}

export interface KontoEingabe {
  id: string
  beschriftungLinks: string
  beschriftungRechts: string
  kontenkategorie: string
  sollHaben: string              // Legacy (nicht mehr im UI)
  zunahmeAbnahme: string         // Legacy (nicht mehr im UI)
  zunahmeAbnahmeLinks: string
  zunahmeAbnahmeRechts: string
  anfangsbestandLinks: string
  anfangsbestandRechts: string
  eintraegeLinks: EintragZeile[]
  eintraegeRechts: EintragZeile[]
  saldoLinks: string
  saldoRechts: string
}

export type TKontoAntwort = Extract<Antwort, { typ: 'tkonto' }>

export type SusEintrag = { gegenkonto: string; betrag: number }

export type EintragStatus =
  | { art: 'korrekt'; gegenkonto: string; betrag: number }
  | { art: 'falsch'; gegenkonto: string; betrag: number; hinweis: string }
  | { art: 'fehlend'; gegenkonto: string; betrag: number }

export interface KontoBewertung {
  linksStatus: EintragStatus[]
  rechtsStatus: EintragStatus[]
  alleLinksOk: boolean
  alleRechtsOk: boolean
  saldoBalanciert: boolean
  kontoKorrekt: boolean
}

// === Border-Klasse: violett wenn leer + nicht readOnly ===

export function brd(wert: string, readOnly: boolean): string {
  if (readOnly) return 'border-slate-300 dark:border-slate-600'
  return !wert ? 'border-violet-400 dark:border-violet-500' : 'border-slate-300 dark:border-slate-600'
}

// === Factory-Helpers ===

export function neueId(): string {
  return crypto.randomUUID()
}

export function leereZeile(): EintragZeile {
  return { id: neueId(), gegenkonto: '', betrag: '', gfNr: '' }
}

export function leereKontoEingabe(id: string): KontoEingabe {
  return {
    id,
    beschriftungLinks: '',
    beschriftungRechts: '',
    kontenkategorie: '',
    sollHaben: '',
    zunahmeAbnahme: '',
    zunahmeAbnahmeLinks: '',
    zunahmeAbnahmeRechts: '',
    anfangsbestandLinks: '',
    anfangsbestandRechts: '',
    eintraegeLinks: [leereZeile()],
    eintraegeRechts: [leereZeile()],
    saldoLinks: '',
    saldoRechts: '',
  }
}

// === Pure Functions (zuAntwort/vonAntwort/matcheEintraege/bewerteKonto) folgen in Tasks 1.2-1.5 ===
