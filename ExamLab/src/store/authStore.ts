import { create } from 'zustand'
import type { AuthUser, Rolle } from '../types/auth.ts'
import { usePruefungStore } from './pruefungStore.ts'
import { clearIndexedDB } from '../services/autoSave.ts'
import { clearQueue } from '../services/retryQueue.ts'
import { ladeLehrpersonen, type LPInfo } from '../services/lpApi.ts'

// Cache für LP-Liste (pro Session geladen)
let lpCache: LPInfo[] | null = null

// Guard gegen Doppelklick-Login (verhindert Race Condition bei Google GIS Callback)
let loginInProgress = false

/**
 * Demo-LP-Liste — nur für den expliziten Demo-Modus (ohne Backend).
 * Echte LP-Logins laufen über ladeLehrpersonen() → Backend.
 * Keine echten E-Mail-Adressen hier — nur generische Demo-Accounts.
 */
const demoLPs: LPInfo[] = [
  { email: 'demo-lp@gymhofwil.ch', name: 'Demo-Lehrperson', kuerzel: 'DEM', fachschaft: 'WR', fachschaften: ['WR'], rolle: 'admin' },
  { email: 'kollegin@gymhofwil.ch', name: 'Maria Muster', kuerzel: 'MUM', fachschaft: 'WR', fachschaften: ['WR'], rolle: 'lp' },
  { email: 'hans.meier@gymhofwil.ch', name: 'Hans Meier', kuerzel: 'MEH', fachschaft: 'WR', fachschaften: ['WR'], rolle: 'lp' },
  { email: 'anna.keller@gymhofwil.ch', name: 'Anna Keller', kuerzel: 'KEA', fachschaft: 'IN', fachschaften: ['IN'], rolle: 'lp' },
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
  anmeldenMitCode: (schuelerId: string, name: string, email: string, sessionToken?: string) => void
  demoStarten: (rolle?: 'sus' | 'lp') => void
  abmelden: () => void
  setFehler: (fehler: string | null) => void
}

/**
 * Räumt den Prüfungszustand auf bei Re-Login.
 * KRITISCH: Bei bereits abgegebener Prüfung wird der State NICHT gelöscht,
 * sondern beibehalten — damit App.tsx den Abgabe-Screen sofort zeigen kann.
 * Nur bei laufender Prüfung (nicht abgegeben, nicht beendet) bleibt alles erhalten
 * für Browser-Crash-Recovery.
 * Bei beendeter Prüfung (LP hat beendet) wird aufgeräumt, da App.tsx
 * den Status ohnehin vom Backend holt.
 */
function resetPruefungState(): void {
  const pruefungId = new URLSearchParams(window.location.search).get('id') || 'default'
  const state = usePruefungStore.getState()

  if (state.abgegeben) {
    // NICHT löschen! abgegeben=true bleibt erhalten als lokale Absicherung.
    // App.tsx prüft abgegeben und zeigt direkt den Abgabe-Screen.
    console.log(`[auth] Prüfung ${pruefungId}: Bereits abgegeben — State wird BEIBEHALTEN (Re-Entry-Schutz)`)
    return
  }

  if (state.beendetUm) {
    // LP hat beendet → aufräumen, Backend liefert istBeendet=true
    console.log(`[auth] Prüfung ${pruefungId}: LP-beendet — State wird aufgeräumt`)
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
  istDemoModus: false,
  ladeStatus: 'idle',
  fehler: null,

  anmelden: async (credential: GoogleCredential) => {
    // Guard gegen Doppelklick / doppeltes GIS-Callback
    if (loginInProgress) return
    loginInProgress = true
    set({ ladeStatus: 'laden' })
    try {
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
        fachschaften: lpInfo?.fachschaften ?? (lpInfo?.fachschaft ? [lpInfo.fachschaft] : []),
        adminRolle: lpInfo?.rolle === 'admin',
      }
      // Alten Prüfungszustand aufräumen (verhindert stale State nach Re-Login)
      resetPruefungState()
      saveSession(user)
      set({ user, istDemoModus: false, ladeStatus: 'fertig', fehler: null })
    } finally {
      loginInProgress = false
    }
  },

  anmeldenMitCode: (schuelerId: string, name: string, email: string, sessionToken?: string) => {
    const user: AuthUser = {
      email,
      name,
      vorname: name.split(' ')[0] || name,
      nachname: name.split(' ').slice(1).join(' ') || '',
      rolle: 'sus',
      schuelerId,
      sessionToken,
    }
    // Alten Prüfungszustand aufräumen (verhindert stale State nach Re-Login)
    resetPruefungState()
    saveSession(user)
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
    saveSession(user)
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
function saveSession(user: AuthUser): void {
  try {
    sessionStorage.setItem('pruefung-auth', JSON.stringify(user))
    // Demo-Flag wird NICHT in sessionStorage geschrieben (Security: verhindert Bypass via DevTools)
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
      // SICHERHEIT: Rolle aus E-Mail-Domain re-validieren (verhindert sessionStorage-Manipulation)
      // SuS-Domain ist eindeutig — wenn E-Mail auf @stud.gymhofwil.ch endet, MUSS Rolle 'sus' sein
      if (parsed.email.endsWith('@stud.gymhofwil.ch') && parsed.rolle !== 'sus') {
        console.warn('[auth] Rollen-Manipulation erkannt — setze auf SuS zurück')
        parsed.rolle = 'sus'
        parsed.adminRolle = false
        parsed.fachschaften = []
        parsed.fachschaft = undefined
        sessionStorage.setItem('pruefung-auth', JSON.stringify(parsed))
      }
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
    sessionStorage.removeItem('pruefung-demo')
  } catch {
    // ignore
  }
}
