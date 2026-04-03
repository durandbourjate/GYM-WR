export type Rolle = 'admin' | 'lernend'

export interface AuthUser {
  email: string
  name: string
  vorname: string
  nachname: string
  rolle: Rolle
  sessionToken: string
  loginMethode: 'google' | 'code'
}
