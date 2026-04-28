import { create } from 'zustand'
import type { AuthUser, Rolle } from '../types/auth.ts'
import { usePruefungStore } from './pruefungStore.ts'
import { clearIndexedDB } from '../services/autoSave.ts'
import { clearQueue } from '../services/retryQueue.ts'
import { ladeLehrpersonen, type LPInfo } from '../services/lpApi.ts'
import { useFavoritenStore } from './favoritenStore.ts'
import { useFragenbankStore } from './fragenbankStore.ts'
import { useKlassenlistenStore } from './klassenlistenStore.ts'
import { useUebenGruppenStore } from './ueben/gruppenStore.ts'

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

  anmelden: (credential: GoogleCredential) => Promise<void>
  anmeldenMitCode: (schuelerId: string, name: string, email: string, sessionToken?: string) => Promise<void>
  demoStarten: (rolle?: 'sus' | 'lp') => void
  abmelden: () => Promise<void>
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
 *
 * async: IDB-Clear awaitet auf tx.oncomplete (siehe S149-Lehre in
 * .claude/rules/safety-pwa.md). Caller müssen vor Hard-Nav awaiten.
 */
async function resetPruefungState(): Promise<void> {
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
    // Beide IDB-Cleanups awaiten — Privacy-Garantie vor potenzieller Hard-Nav
    // im Caller (abmelden ruft window.location.href direkt nach uns).
    await Promise.all([
      clearIndexedDB(pruefungId).catch(() => {}),
      clearQueue().catch(() => {}),
    ])
  } else {
    console.log(`[auth] Prüfung ${pruefungId}: State bleibt erhalten (Prüfung läuft oder noch nicht gestartet)`)
  }
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: restoreSession(),
  istDemoModus: restoreDemoFlag(restoreSession()),
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
      await resetPruefungState()
      saveSession(user)
      saveDemoFlag(false)
      set({ user, istDemoModus: false, ladeStatus: 'fertig', fehler: null })
      // Bundle G.d.2 — Gruppen für ALLE Logins (LP + SuS-via-Google)
      void useUebenGruppenStore.getState().ladeGruppen(credential.email).catch((e) => {
        console.warn('[G.d.2] Gruppen-Pre-Fetch fehlgeschlagen (silent):', e)
      })
      // G.c + G.d.2 — Fragenbank + Klassenlisten sind LP-only.
      // SuS-Google-Login (rolle='sus') würde sonst 403 vom Backend bekommen
      // (silent fail, aber unnötiger API-Roundtrip + Console-Warning).
      if (rolle === 'lp') {
        void useFragenbankStore.getState().lade(credential.email).catch((e) => {
          console.warn('[G.c] Fragenbank-Pre-Fetch fehlgeschlagen (silent):', e)
        })
        void useKlassenlistenStore.getState().lade(credential.email).catch((e) => {
          console.warn('[G.d.2] Klassenlisten-Pre-Fetch fehlgeschlagen (silent):', e)
        })
      }
    } finally {
      loginInProgress = false
    }
  },

  // S157 (Bundle H, 2026-04-28): UI ausgeblendet — Schülercode-Login nicht mehr aktiv.
  // Code für mögliche Re-Aktivierung erhalten. Löschen frühestens nach 4-6 Wochen
  // ohne SuS-Anfragen — siehe Reminder-Plan-Task 12 (Trigger-Datum 2026-06-09).
  anmeldenMitCode: async (schuelerId: string, name: string, email: string, sessionToken?: string) => {
    const user: AuthUser = {
      email,
      name,
      vorname: name.split(' ')[0] || name,
      nachname: name.split(' ').slice(1).join(' ') || '',
      rolle: 'sus',
      schuelerId,
      sessionToken,
    }
    // Alten Prüfungszustand aufräumen (verhindert stale State nach Re-Login).
    // await: IDB-Clear muss vor dem set() durchgelaufen sein, sonst lädt
    // die App ggf. Antworten der vorigen Prüfung aus IDB.
    await resetPruefungState()
    saveSession(user)
    saveDemoFlag(false)
    set({ user, istDemoModus: false, ladeStatus: 'fertig', fehler: null })
    // Bundle G.d.2 — SuS profitiert vom Gruppen-Pre-Fetch falls Wechsel in den Üben-Tab nach Prüfung.
    // KEIN Klassenlisten-Pre-Fetch (LP-only). KEIN Fragenbank-Pre-Fetch (LP-only).
    void useUebenGruppenStore.getState().ladeGruppen(email).catch((e) => {
      console.warn('[G.d.2] Gruppen-Pre-Fetch fehlgeschlagen (SuS, silent):', e)
    })
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
    saveDemoFlag(true)
    // Demo-Favoriten seeden (nur wenn der Demo-User noch keine hat — respektiert bestehende User-Anpassungen)
    if (rolle === 'lp' && useFavoritenStore.getState().favoriten.length === 0) {
      useFavoritenStore.setState({
        favoriten: [
          { typ: 'pruefung', ziel: 'einrichtung-pruefung', label: 'Einführungsprüfung', sortierung: 0 },
          { typ: 'uebung', ziel: 'einrichtung-uebung', label: 'Einführungsübung', sortierung: 1 },
        ],
      })
    }
    set({ user, istDemoModus: true, ladeStatus: 'fertig', fehler: null })
  },

  abmelden: async () => {
    // Bundle G.c + G.d.2 + S150-Hotfix — Frontend-Cache + alle 3 IDB-Datenbanken leeren bevor User wechselt.
    // await ist kritisch: window.location.href triggert Page-Unload und bricht
    // in-flight IDB-Transaktionen ab (S149-Lehre, safety-pwa.md). Privacy-Garantie
    // hängt davon ab dass alle 3 reset()-Aufrufe vor der Hard-Nav committed sind.
    // Promise.all parallel — die 3 Datenbanken sind unabhängig, längste bestimmt
    // die Logout-Latenz (typisch ~50 ms).
    await Promise.all([
      useFragenbankStore.getState().reset(),
      useKlassenlistenStore.getState().reset(),
      useUebenGruppenStore.getState().reset(),
    ])
    clearSession()
    await resetPruefungState()
    set({ user: null, istDemoModus: false, ladeStatus: 'idle', fehler: null })
    // Hart auf /login navigieren — verhindert dass alte Pfade wie /sus/ueben hängen
    // bleiben (würden nach Re-Login wieder das SuSStartseite-Layout statt direkt
    // Prüfung zeigen) und triggert keinen Demo-Login-Loop.
    if (typeof window !== 'undefined') {
      window.location.href = import.meta.env.BASE_URL + 'login'
    }
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

/**
 * Demo-Flag aus User-E-Mail ableiten (NICHT aus sessionStorage — das wäre ein
 * Lockdown-Bypass-Vektor, siehe securityInvarianten.test.ts).
 * Demo-Accounts sind per Konvention feste E-Mail-Adressen. restoreSession()
 * re-validiert Rollen aus der Domain, sodass ein SuS seine E-Mail nicht auf
 * eine Demo-Adresse ändern kann ohne Rolle='sus' zu bekommen.
 * Ohne diese Ableitung geht istDemoModus nach Reload verloren und echte
 * Backend-Calls laufen los, obwohl der User im Demo-Kontext sitzt (C4/C6).
 * Die E-Mail-Liste ist inline (nicht als Modul-const), weil create()
 * restoreDemoFlag() bei Modul-Init aufruft und eine const nach create() in
 * der TDZ landen würde.
 */
function saveDemoFlag(aktiv: boolean): void {
  // bewusst NOOP — Demo-Flag wird nicht in sessionStorage persistiert (Security).
  // Persistenz erfolgt implizit über die gespeicherte User-E-Mail.
  void aktiv
}

function restoreDemoFlag(user: AuthUser | null): boolean {
  if (!user) return false
  const email = user.email.toLowerCase()
  return email === 'demo-lp@gymhofwil.ch' || email === 'demo@example.com'
}
