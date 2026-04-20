import type { GooglePayload, CodeLoginResponse } from '../../types/ueben/auth'
import type { Gruppe, Mitglied } from '../../types/ueben/gruppen'
import type { Frage, FragenFilter } from '../../types/ueben/fragen'
import type { FragenFortschritt, SessionEintrag } from '../../types/ueben/fortschritt'
import type { Lernziel } from '@shared/types/fragen'

export interface LernenAuthServiceInterface {
  initializeGoogleAuth(onSuccess: (payload: GooglePayload) => void, onError: (error: string) => void): void
  renderGoogleButton(element: HTMLElement): void
  revokeGoogleAuth(email: string): Promise<void>
  decodeJwt(token: string): GooglePayload | null
}

export interface GruppenService {
  ladeGruppen(email: string): Promise<Gruppe[]>
  erstelleGruppe(gruppe: Omit<Gruppe, 'fragebankSheetId' | 'analytikSheetId'>): Promise<Gruppe>
  ladeMitglieder(gruppeId: string): Promise<Mitglied[]>
  einladen(gruppeId: string, email: string, name: string, rolle?: 'admin' | 'lernend'): Promise<void>
  entfernen(gruppeId: string, email: string): Promise<void>
  generiereCode(gruppeId: string, email: string): Promise<string>
  validiereCode(code: string): Promise<CodeLoginResponse>
}

export interface SessionService {
  generiereSessionToken(email: string): Promise<string>
  validiereSessionToken(token: string, email: string): Promise<boolean>
}

export interface FortschrittService {
  ladeGruppenFortschritt(gruppeId: string): Promise<{
    fortschritte: FragenFortschritt[]
    sessions: SessionEintrag[]
  }>
  ladeLernziele(gruppeId: string): Promise<Lernziel[]>
  speichereLernziel(gruppeId: string, lernziel: Lernziel): Promise<{ id: string }>
  speichereFortschritt(
    gruppeId: string,
    email: string,
    fortschritte: { fragenId: string; korrekt: boolean; sessionId: string }[],
  ): Promise<boolean>
}

export interface FragenService {
  ladeFragen(gruppeId: string, filter?: FragenFilter): Promise<Frage[]>
  ladeThemen(gruppeId: string, fach?: string): Promise<string[]>
  speichereFrage(gruppeId: string, frage: Frage): Promise<{ success: boolean; id: string }>
  loescheFrage(gruppeId: string, frageId: string, fachbereich: string): Promise<boolean>
  invalidateCache(gruppeId?: string): void
}
