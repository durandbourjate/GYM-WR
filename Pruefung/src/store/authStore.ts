import { create } from 'zustand'
import type { AuthUser, Rolle } from '../types/auth.ts'

function rolleAusDomain(email: string): Rolle {
  if (email.endsWith('@stud.gymhofwil.ch')) return 'sus'
  if (email.endsWith('@gymhofwil.ch')) return 'lp'
  return 'unbekannt'
}

interface GoogleCredential {
  email: string
  name: string
  given_name?: string
  family_name?: string
  picture?: string
}

interface AuthStore {
  user: AuthUser | null
  istDemoModus: boolean
  ladeStatus: 'idle' | 'laden' | 'fertig' | 'fehler'
  fehler: string | null

  anmelden: (credential: GoogleCredential) => void
  anmeldenMitCode: (schuelerId: string, name: string) => void
  demoStarten: () => void
  abmelden: () => void
  setFehler: (fehler: string | null) => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: restoreSession(),
  istDemoModus: false,
  ladeStatus: 'idle',
  fehler: null,

  anmelden: (credential: GoogleCredential) => {
    const rolle = rolleAusDomain(credential.email)
    const user: AuthUser = {
      email: credential.email,
      name: credential.name,
      vorname: credential.given_name || credential.name.split(' ')[0] || '',
      nachname: credential.family_name || credential.name.split(' ').slice(1).join(' ') || '',
      bild: credential.picture,
      rolle,
    }
    saveSession(user)
    set({ user, istDemoModus: false, ladeStatus: 'fertig', fehler: null })
  },

  anmeldenMitCode: (schuelerId: string, name: string) => {
    const user: AuthUser = {
      email: '',
      name,
      vorname: name.split(' ')[0] || name,
      nachname: name.split(' ').slice(1).join(' ') || '',
      rolle: 'sus',
      schuelerId,
    }
    saveSession(user)
    set({ user, istDemoModus: false, ladeStatus: 'fertig', fehler: null })
  },

  demoStarten: () => {
    const user: AuthUser = {
      email: 'demo@example.com',
      name: 'Demo-Nutzer',
      vorname: 'Demo',
      nachname: 'Nutzer',
      rolle: 'sus',
    }
    set({ user, istDemoModus: true, ladeStatus: 'fertig', fehler: null })
  },

  abmelden: () => {
    clearSession()
    set({ user: null, istDemoModus: false, ladeStatus: 'idle', fehler: null })
  },

  setFehler: (fehler: string | null) => set({ fehler, ladeStatus: fehler ? 'fehler' : 'idle' }),
}))

// Session via sessionStorage (Tab-gebunden, überlebt Reload aber nicht Tab-Schliessung)
function saveSession(user: AuthUser): void {
  try {
    sessionStorage.setItem('pruefung-auth', JSON.stringify(user))
  } catch {
    // sessionStorage nicht verfügbar
  }
}

function restoreSession(): AuthUser | null {
  try {
    const raw = sessionStorage.getItem('pruefung-auth')
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed.email === 'string' && typeof parsed.name === 'string' && typeof parsed.rolle === 'string') {
      return parsed as AuthUser
    }
    return null
  } catch {
    return null
  }
}

function clearSession(): void {
  try {
    sessionStorage.removeItem('pruefung-auth')
  } catch {
    // ignore
  }
}
