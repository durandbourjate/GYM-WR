export type Rolle = 'admin' | 'lernend'

export type RechteStufe = 'betrachter' | 'bearbeiter'

export interface Berechtigung {
  email: string          // LP-Email, 'fachschaft:WR', oder '*' (schulweit)
  recht: RechteStufe
  name?: string          // Anzeigename (vom Backend befüllt)
}

export interface AuthUser {
  email: string
  name: string
  vorname: string
  nachname: string
  rolle: Rolle
  sessionToken: string
  loginMethode: 'google' | 'code'
}
