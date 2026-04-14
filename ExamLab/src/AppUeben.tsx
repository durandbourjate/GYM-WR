import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { useUebenAuthStore } from './store/ueben/authStore'
import { useUebenGruppenStore } from './store/ueben/gruppenStore'
import { useUebenUebungsStore } from './store/ueben/uebungsStore'
import { useUebenFortschrittStore } from './store/ueben/fortschrittStore'
import LoginScreen from './components/ueben/LoginScreen'
import GruppenAuswahl from './components/ueben/GruppenAuswahl'
import Dashboard from './components/ueben/Dashboard'
import UebungsScreen from './components/ueben/UebungsScreen'
import Zusammenfassung from './components/ueben/Zusammenfassung'
import AdminDashboard from './components/ueben/admin/AdminDashboard'
import AppShell from './components/ueben/layout/AppShell'
import { UebenKontextProvider } from './context/ueben/UebenKontextProvider'
import { FrageModeProvider } from './context/FrageModeContext'
import type { UebenRolle } from './types/ueben/auth'
import { useDeepLinkAktivierung } from './hooks/ueben/useDeepLinkAktivierung'
import { useSuSNavigation } from './hooks/ueben/useSuSNavigation'
import { useSuSRouteSync } from './hooks/ueben/useSuSRouteSync'

const DEMO_PARAM = new URLSearchParams(window.location.search).get('demo')
const DEMO_ROLLE: UebenRolle = DEMO_PARAM === 'eltern' ? 'admin' : 'lernend'

interface AppUebenProps {
  /** Callback wenn SuS "Zurück" zur ExamLab-Startseite will */
  onZurueck?: () => void
  /** Callback für Tab-Wechsel (Üben/Prüfen) */
  onModusWechsel?: (modus: 'ueben' | 'pruefen') => void
}

export default function AppUeben({ onZurueck, onModusWechsel }: AppUebenProps = {}) {
  const { user, istAngemeldet, sessionWiederherstellen, ladeStatus: authStatus } = useUebenAuthStore()
  const { gruppen, aktiveGruppe, ladeGruppen, ladeStatus: gruppenStatus } = useUebenGruppenStore()
  const { session, starteSession } = useUebenUebungsStore()
  const [demoAktiv, setDemoAktiv] = useState(false)
  // Demo-Modus: URL-Parameter ODER Haupt-Auth-Store (bei Einbettung via SuSStartseite)
  const hauptAuthDemo = useAuthStore(s => s.istDemoModus)
  const IST_DEMO = !!DEMO_PARAM || hauptAuthDemo

  // Router-basierte Navigation
  const { zuDashboard, zuUebung, zuErgebnis, zuAdmin, zuGruppenAuswahl } = useSuSNavigation()

  // URL → Store Sync (Übergangs-Hook)
  useSuSRouteSync()

  // Aktuellen Screen aus URL ableiten
  const location = useLocation()
  const aktuellerScreen = ermittleScreen(location.pathname)

  // Deep-Link: ?fach=...&thema=... → Thema automatisch aktivieren + Ziel merken
  const deepLinkZiel = useDeepLinkAktivierung(aktiveGruppe?.id, user?.email, istAngemeldet)

  // Demo-Modus: ?demo=true in URL → Mock-Login ohne Backend
  useEffect(() => {
    if (IST_DEMO && !demoAktiv) {
      setDemoAktiv(true)

      const istEltern = DEMO_ROLLE === 'admin'
      const email = istEltern ? 'eltern@demo.ch' : 'kind@demo.ch'
      const name = istEltern ? 'Demo Elternteil' : 'Demo Kind'
      const vorname = istEltern ? 'Elternteil' : 'Kind'

      useUebenAuthStore.setState({
        user: {
          email, name, vorname, nachname: 'Demo',
          rolle: DEMO_ROLLE, sessionToken: 'demo-token', loginMethode: 'google',
        },
        istAngemeldet: true, ladeStatus: 'fertig',
      })

      const gruppe = {
        id: 'demo-gruppe', name: 'Demo-Familie', typ: 'familie' as const,
        adminEmail: 'eltern@demo.ch', fragebankSheetId: 'demo',
        analytikSheetId: 'demo', mitglieder: ['eltern@demo.ch', 'kind@demo.ch'],
      }
      useUebenGruppenStore.setState({ gruppen: [gruppe], aktiveGruppe: gruppe, ladeStatus: 'fertig' })

      // Demo: Leeren Fortschritt setzen statt Backend aufzurufen
      useUebenFortschrittStore.setState({ fortschritte: {} })
      zuDashboard()
    }
  }, [demoAktiv, zuDashboard])

  // Session nur wiederherstellen wenn NICHT embedded (standalone Üben-Login)
  // Bei embedded (via SuSStartseite/UebungsToolView) wurde der Login bereits gebrückt
  useEffect(() => {
    if (!IST_DEMO && !onZurueck) sessionWiederherstellen()
  }, [sessionWiederherstellen, onZurueck])

  useEffect(() => {
    if (!IST_DEMO && istAngemeldet && user?.email) {
      ladeGruppen(user.email)
    }
  }, [istAngemeldet, user?.email, ladeGruppen])

  // Rolle aus Gruppe ableiten + zum richtigen Screen navigieren
  useEffect(() => {
    if (aktiveGruppe && user?.email) {
      const istAdmin = aktiveGruppe.adminEmail.toLowerCase() === user.email.toLowerCase()
      if (istAdmin) {
        if (user.rolle !== 'admin') useUebenAuthStore.getState().setzeRolle('admin')
        if (aktuellerScreen !== 'admin') zuAdmin()
      } else {
        if (user.rolle !== 'lernend') useUebenAuthStore.getState().setzeRolle('lernend')
        if (aktuellerScreen !== 'dashboard' && aktuellerScreen !== 'uebung' && aktuellerScreen !== 'ergebnis') {
          zuDashboard()
        }
      }
    }
  }, [aktiveGruppe, user?.email, user?.rolle, aktuellerScreen, zuAdmin, zuDashboard])

  // Navigation-State synchronisieren
  useEffect(() => {
    if (!istAngemeldet) {
      // Nicht eingeloggt — kein Redirect nötig (wird unten behandelt)
      return
    }
    if (istAngemeldet && aktuellerScreen === 'login') {
      if (aktiveGruppe) zuDashboard()
      else zuGruppenAuswahl()
    }
  }, [istAngemeldet, aktiveGruppe, aktuellerScreen, zuDashboard, zuGruppenAuswahl])

  // Session → Übung/Ergebnis-Screen
  useEffect(() => {
    if (session && !session.beendet && aktuellerScreen !== 'uebung') {
      zuUebung(session.thema)
    }
    if (session?.beendet && aktuellerScreen !== 'ergebnis') {
      zuErgebnis()
    }
    // Nur von 'uebung' zurück zum Dashboard wenn keine Session — NICHT von 'ergebnis'
    // (Zusammenfassung zeigt Fallback-UI wenn Session bereits null ist)
    if (!session && aktuellerScreen === 'uebung') {
      zuDashboard()
    }
  }, [session, session?.beendet, aktuellerScreen, zuUebung, zuErgebnis, zuDashboard])

  // Laden
  if (!IST_DEMO && authStatus === 'laden') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <p className="text-slate-500">Wird geladen...</p>
      </div>
    )
  }

  // Nicht eingeloggt
  if (!istAngemeldet) {
    if (onZurueck) {
      // Embedded: Wenn Auth noch nicht versucht wurde (idle), warte auf Login-Bridging
      // Wenn Auth fehlgeschlagen oder abgemeldet → zurück zur Startseite
      if (authStatus === 'idle') {
        return (
          <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
            <p className="text-slate-500 dark:text-slate-400">Übungen werden vorbereitet...</p>
          </div>
        )
      }
      // Auth ist fertig aber nicht angemeldet → zurück (z.B. nach Logout)
      onZurueck()
      return null
    }
    return <LoginScreen />
  }

  // Gruppen laden
  if (!IST_DEMO && gruppenStatus === 'laden') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <p className="text-slate-500">Gruppen werden geladen...</p>
      </div>
    )
  }

  // Keine Gruppen
  if (gruppen.length === 0 && gruppenStatus === 'fertig') {
    return (
      <AppShell onExamLabHome={onZurueck} onModusWechsel={onModusWechsel}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 text-center max-w-sm">
            <h2 className="text-xl font-bold mb-2 dark:text-white">Keine Gruppen</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-4">
              Du bist noch keiner Gruppe zugeordnet.
            </p>
            <button
              onClick={() => {
                // Beide Auth-Stores aufräumen, damit Session komplett beendet wird
                useUebenAuthStore.getState().abmelden()
                useAuthStore.getState().abmelden()
                window.location.href = import.meta.env.BASE_URL + 'login'
              }}
              className="px-4 py-2 text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 cursor-pointer"
            >
              Abmelden
            </button>
          </div>
        </div>
      </AppShell>
    )
  }

  // Gruppen-Auswahl
  if (!aktiveGruppe) return <AppShell onExamLabHome={onZurueck} onModusWechsel={onModusWechsel}><GruppenAuswahl /></AppShell>

  // Screen-Rendering
  return (
    <FrageModeProvider mode="ueben">
      <UebenKontextProvider>
        <AppShell onExamLabHome={onZurueck} onModusWechsel={onModusWechsel}>
          {aktuellerScreen === 'admin' && (
            <AdminDashboard onZuUeben={zuDashboard} />
          )}

          {(aktuellerScreen === 'ergebnis' || (session?.beendet && aktuellerScreen === 'uebung')) && (
            <Zusammenfassung
              onZurueck={() => {
                useUebenUebungsStore.setState({ session: null })
                zuDashboard()
              }}
              onNochmal={() => {
                if (aktiveGruppe && user && session) {
                  starteSession(aktiveGruppe.id, user.email, session.fach, session.thema)
                }
              }}
            />
          )}

          {aktuellerScreen === 'uebung' && session && !session.beendet && (
            <UebungsScreen />
          )}

          {/* Fallback: Auf 'uebung' ohne Session → Dashboard anzeigen (verhindert schwarzen Bildschirm) */}
          {aktuellerScreen === 'uebung' && !session && (
            <Dashboard deepLinkZiel={deepLinkZiel} />
          )}

          {aktuellerScreen === 'dashboard' && (
            <Dashboard deepLinkZiel={deepLinkZiel} />
          )}
        </AppShell>
      </UebenKontextProvider>
    </FrageModeProvider>
  )
}

/**
 * Leitet den aktuellerScreen-Wert aus dem URL-Pfad ab.
 * Wird für die Übergangsphase benötigt, bis alle Komponenten
 * direkt useLocation() nutzen.
 */
function ermittleScreen(pathname: string): string {
  if (pathname.startsWith('/sus/admin')) return 'admin'
  if (pathname.startsWith('/sus/ueben/ergebnis')) return 'ergebnis'
  if (pathname.match(/^\/sus\/ueben\/[^/]+/)) return 'uebung'
  if (pathname.startsWith('/sus/ueben')) return 'dashboard'
  if (pathname.startsWith('/sus/gruppen')) return 'gruppenAuswahl'
  if (pathname.startsWith('/sus/login')) return 'login'
  // Default: dashboard (wenn auf /sus oder /sus/*)
  return 'dashboard'
}
