/**
 * Üben-spezifische Types.
 * Barrel-Export für alle LP-Typen.
 */

// Antwort-Typen (LP-spezifisches Format für Übungskorrektur)
export type {
  AntwortTyp,
  MCAntwort, MultiAntwort, TFAntwort, FillAntwort,
  CalcAntwort, SortAntwort, SortierungAntwort, ZuordnungAntwort,
  BuchungssatzAntwort, TKontoAntwort, BilanzAntwort, KontenbestimmungAntwort,
  HotspotAntwort, BildbeschriftungAntwort, DragDropBildAntwort,
  OpenAntwort, FormelAntwort, ZeichnenAntwort, GruppeAntwort, PdfAntwort,
  AudioAntwort, CodeAntwort,
} from './antworten'

// Aufträge & Empfehlungen
export type { Auftrag, Empfehlung } from './auftrag'

// Auth (LP-spezifisch: admin/lernend statt sus/lp)
export type { UebenRolle, UebenAuthUser, GooglePayload, CodeLoginResponse } from './auth'

// Fortschritt & Mastery
export type {
  MasteryStufe, FragenFortschritt, Dauerbaustelle,
  ThemenFortschritt, SessionEintrag, LernzielStatus,
} from './fortschritt'

// Fragen (Re-Exports aus @shared + LP-spezifische Ergänzungen)
export type { FrageTyp, FragenFilter } from './fragen'
// Re-Exports aus shared werden durch fragen.ts durchgereicht

// Gruppen
export type { Gruppe, Mitglied } from './gruppen'

// Settings
export type { GruppenEinstellungen } from './settings'
export { DEFAULT_GYM, DEFAULT_FAMILIE, defaultEinstellungen } from './settings'

// Übungssession
export type { UebungsSession, SessionErgebnis } from './uebung'
