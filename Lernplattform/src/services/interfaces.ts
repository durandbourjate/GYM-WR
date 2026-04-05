import type { GooglePayload, CodeLoginResponse } from '../types/auth'
import type { Gruppe, Mitglied } from '../types/gruppen'
import type { Frage, FragenFilter } from '../types/fragen'
import type { FragenFortschritt, SessionEintrag } from '../types/fortschritt'
import type { Lernziel } from '@shared/types/fragen'

export interface AuthServiceInterface {
  initializeGoogleAuth(onSuccess: (payload: GooglePayload) => void, onError: (error: string) => void): void
  renderGoogleButton(element: HTMLElement): void
  revokeGoogleAuth(email: string): Promise<void>
  decodeJwt(token: string): GooglePayload | null
}

export interface GruppenService {
  ladeGruppen(email: string): Promise<Gruppe[]>
  erstelleGruppe(gruppe: Omit<Gruppe, 'fragebankSheetId' | 'analytikSheetId'>): Promise<Gruppe>
  ladeMitglieder(gruppeId: string): Promise<Mitglied[]>
  einladen(gruppeId: string, email: string, name: string): Promise<void>
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
}

export interface FragenService {
  ladeFragen(gruppeId: string, filter?: FragenFilter): Promise<Frage[]>
  ladeThemen(gruppeId: string, fach?: string): Promise<string[]>
  speichereFrage(gruppeId: string, frage: Frage): Promise<{ success: boolean; id: string }>
  loescheFrage(gruppeId: string, frageId: string, fachbereich: string): Promise<boolean>
  invalidateCache(gruppeId?: string): void
}
