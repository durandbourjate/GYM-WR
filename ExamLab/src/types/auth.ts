// Re-Export aus shared (keine Doppeldefinition mehr — identische Inhalte vorher)
export type { Berechtigung, RechteStufe } from '@shared/types/auth'

/** Rollen basierend auf E-Mail-Domain (ExamLab-Welt — abweichend von shared) */
export type Rolle = 'sus' | 'lp' | 'unbekannt'

/** Effektives Recht einer LP auf ein Item (ExamLab-spezifisch) */
export type EffektivesRecht = 'inhaber' | 'bearbeiter' | 'betrachter'

/** Authentifizierter Benutzer */
export interface AuthUser {
  email: string
  name: string
  vorname: string
  nachname: string
  bild?: string
  rolle: Rolle
  schuelerId?: string // 4-stelliger Fallback-Code
  sessionToken?: string // Server-generiertes Session-Token (SuS, verhindert E-Mail-Spoofing)
  fachschaft?: string // LP-Fachschaft (z.B. 'WR')
  fachschaften?: string[] // LP-Fachschaften (Multi-Fach, z.B. ['WR', 'IN'])
  adminRolle?: boolean // Admin-LP (sieht alles)
}
