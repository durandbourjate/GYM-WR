import type { GooglePayload, CodeLoginResponse } from '../types/auth'
import type { Gruppe, Mitglied } from '../types/gruppen'

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
