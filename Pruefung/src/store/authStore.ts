import { create } from 'zustand'
import type { AuthUser, Rolle } from '../types/auth.ts'
import { usePruefungStore } from './pruefungStore.ts'
import { clearIndexedDB } from '../services/autoSave.ts'
import { clearQueue } from '../services/retryQueue.ts'
import { ladeLehrpersonen, type LPInfo } from '../services/lpApi.ts'

// Cache für LP-Liste (pro Session geladen)
let lpCache: LPInfo[] | null = null

/** Demo-LP-Liste für den Demo-Modus */
const demoLPs: LPInfo[] = [
  { email: 'yannick.durand@gymhofwil.ch', name: 'Yannick Durand Bourjate', kuerzel: 'DUY', fachschaft: 'WR', rolle: 'lp' },
  { email: 'demo-lp@gymhofwil.ch', name: 'Demo-Lehrperson', kuerzel: 'DEM', fachschaft: 'WR', rolle: 'lp' },
  { email: 'kollegin@gymhofwil.ch', name: 'Maria Muster', kuerzel: 'MUM', fachschaft: 'WR', rolle: 'lp' },
  { email: 'hans.meier@gymhofwil.ch', name: 'Hans Meier', kuerzel: 'MEH', fachschaft: 'WR', rolle: 'lp' },
  { email: 'anna.keller@gymhofwil.ch', name: 'Anna Keller', kuerzel: 'KEA', fachschaft: 'IN', rolle: 'lp' },
]

/** Lädt LP-Liste vom Backend (gecacht pro Session). Kann von Komponenten importiert werden. */
export async function ladeUndCacheLPs(callerEmail?: string): Promise<LPInfo[]> {
  if (lpCache) return lpCache
  try {
    lpCache = await ladeLehrpersonen(callerEmail)
    // Im Demo-Modus (kein Backend) Demo-LPs zurückgeben
    return lpCache && lpCache.length > 0 ? lpCache : demoLPs
  } catch {
    return demoLPs
  }
}

function rolleAusDomain(email: string, lpListe?: LPInfo[]): Rolle {
  if (email.endsWith('@stud.gymhofwil.ch')) return 'sus'
  // Dynamisch: LP wenn in Lehrpersonen-Tab
  if (lpListe && lpListe.some(lp => lp.email === email.toLowerCase())) return 'lp'
  // Andere @gymhofwil.ch-Adressen → SuS-Rolle
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

/**
 * Räumt den Prüfungszustand auf — aber NUR wenn die Prüfung bereits abgegeben
 * oder beendet wurde. Bei laufender Prüfung bleibt der State erhalten,
 * damit SuS sich nach Browser-Crash wieder einloggen können.
 */
function resetPruefungState(): void {
  const pruefungId = new URLSearchParams(window.location.search).get('id') || 'default'
  const state = usePruefungStore.getState()

  // Nur aufräumen wenn abgegeben oder beendet — NICHT bei laufender Prüfung!
  if (state.abgegeben || state.beendetUm) {
    console.log(`[auth] Prüfung ${pruefungId}: State wird aufgeräumt (abgegeben=${state.abgegeben}, beendet=${!!state.beendetUm})`)
    usePruefungStore.getState().zuruecksetzen()
    try { localStorage.removeItem(`pruefung-state-${pruefungId}`) } catch { /* ignore */ }
    clearIndexedDB(pruefungId).catch(() => {})
    clearQueue().catch(() => {})
  } else {
    console.log(`[auth] Prüfung ${pruefungId}: State bleibt erhalten (Prüfung läuft oder noch nicht gestartet)`)
  }
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: restoreSession(),
  istDemoModus: restoreDemoFlag(),
  ladeStatus: 'idle',
  fehler: null,

  anmelden: async (credential: GoogleCredential) => {
    set({ ladeStatus: 'laden' })
    // LP-Liste vom Backend laden mit echter E-Mail (gecached pro Session)
    const lps = await ladeUndCacheLPs(credential.email)
    const rolle = rolleAusDomain(credential.email, lps)
    const lpInfo = lps.find(lp => lp.email === credential.email.toLowerCase())
    const user: AuthUser = {
      email: credential.email,
      name: credential.name,
      vorname: credential.given_name || credential.name.split(' ')[0] || '',
      nachname: credential.family_name || credential.name.split(' ').slice(1).join(' ') || '',
      bild: credential.picture,
      rolle,
      fachschaft: lpInfo?.fachschaft,
      adminRolle: lpInfo?.rolle === 'admin',
    }
    // Alten Prüfungszustand aufräumen (verhindert stale State nach Re-Login)
    resetPruefungState()
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
    // Alten Prüfungszustand aufräumen (verhindert stale State nach Re-Login)
    resetPruefungState()
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
    resetPruefungState()
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
