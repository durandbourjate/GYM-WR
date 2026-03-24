import { create } from 'zustand'
import type { AuthUser, Rolle } from '../types/auth.ts'
import { usePruefungStore } from './pruefungStore.ts'

// Zugelassene LP-E-Mail-Adressen (vorerst nur DUY)
const ZUGELASSENE_LP: string[] = [
  'yannick.durand@gymhofwil.ch',
]

function rolleAusDomain(email: string): Rolle {
  if (email.endsWith('@stud.gymhofwil.ch')) return 'sus'
  if (ZUGELASSENE_LP.includes(email.toLowerCase())) return 'lp'
  // Andere @gymhofwil.ch-Adressen → SuS-Rolle (kein Zugriff auf Composer/Fragenbank)
  if (email.endsWith('@gymhofwil.ch')) return 'sus'
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
  anmeldenMitCode: (schuelerId: string, name: string, email: string) => void
  demoStarten: (rolle?: 'sus' | 'lp') => void
  abmelden: () => void
  setFehler: (fehler: string | null) => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: restoreSession(),
  istDemoModus: restoreDemoFlag(),
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
    saveSession(user, false)
    set({ user, istDemoModus: false, ladeStatus: 'fertig', fehler: null })
  },

  anmeldenMitCode: (schuelerId: string, name: string, email: string) => {
    const user: AuthUser = {
      email,
      name,
      vorname: name.split(' ')[0] || name,
      nachname: name.split(' ').slice(1).join(' ') || '',
      rolle: 'sus',
      schuelerId,
    }
    saveSession(user, false)
    set({ user, istDemoModus: false, ladeStatus: 'fertig', fehler: null })
  },

  demoStarten: (rolle: 'sus' | 'lp' = 'sus') => {
    // Alten Prüfungszustand zurücksetzen (sonst bleibt z.B. 'abgegeben' hängen)
    usePruefungStore.getState().zuruecksetzen()
    const user: AuthUser = rolle === 'lp' ? {
      email: 'demo-lp@gymhofwil.ch',
      name: 'Demo-Lehrperson',
      vorname: 'Demo',
      nachname: 'Lehrperson',
      rolle: 'lp',
    } : {
      email: 'demo@example.com',
      name: 'Demo-Nutzer',
      vorname: 'Demo',
      nachname: 'Nutzer',
      rolle: 'sus',
    }
    saveSession(user, true)
    set({ user, istDemoModus: true, ladeStatus: 'fertig', fehler: null })
  },

  abmelden: () => {
    clearSession()
    usePruefungStore.getState().zuruecksetzen()
    // Persistierten Prüfungszustand löschen (dynamischer Key mit pruefungId)
    const pruefungId = new URLSearchParams(window.location.search).get('id') || 'default'
    try { localStorage.removeItem(`pruefung-state-${pruefungId}`) } catch { /* ignore */ }
    set({ user: null, istDemoModus: false, ladeStatus: 'idle', fehler: null })
  },

  setFehler: (fehler: string | null) => set({ fehler, ladeStatus: fehler ? 'fehler' : 'idle' }),
}))

// Session via sessionStorage (Tab-gebunden, überlebt Reload aber nicht Tab-Schliessung)
function saveSession(user: AuthUser, demo = false): void {
  try {
    sessionStorage.setItem('pruefung-auth', JSON.stringify(user))
    if (demo) {
      sessionStorage.setItem('pruefung-demo', '1')
    } else {
      sessionStorage.removeItem('pruefung-demo')
    }
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

function restoreDemoFlag(): boolean {
  try {
    return sessionStorage.getItem('pruefung-demo') === '1'
  } catch {
    return false
  }
}

function clearSession(): void {
  try {
    sessionStorage.removeItem('pruefung-auth')
    sessionStorage.removeItem('pruefung-demo')
  } catch {
    // ignore
  }
}
