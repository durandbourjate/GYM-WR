/** Rollen basierend auf E-Mail-Domain */
export type Rolle = 'sus' | 'lp' | 'unbekannt'

/** Berechtigung für geteilte Inhalte (Google-Docs-Modell) */
export type RechteStufe = 'betrachter' | 'bearbeiter'

export interface Berechtigung {
  email: string          // LP-Email, 'fachschaft:WR', oder '*' (schulweit)
  recht: RechteStufe
  name?: string          // Anzeigename (vom Backend befüllt)
}

/** Effektives Recht einer LP auf ein Item */
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
