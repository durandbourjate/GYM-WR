import { useEffect, useState } from 'react'
import { useUebenAuthStore } from './store/lernen/authStore'
import { useUebenGruppenStore } from './store/lernen/gruppenStore'
import { useUebenUebungsStore } from './store/lernen/uebungsStore'
import { useUebenFortschrittStore } from './store/lernen/fortschrittStore'
import { useUebenNavigationStore } from './store/lernen/navigationStore'
import LoginScreen from './components/lernen/LoginScreen'
import GruppenAuswahl from './components/lernen/GruppenAuswahl'
import Dashboard from './components/lernen/Dashboard'
import UebungsScreen from './components/lernen/UebungsScreen'
import Zusammenfassung from './components/lernen/Zusammenfassung'
import AdminDashboard from './components/lernen/admin/AdminDashboard'
import AppShell from './components/lernen/layout/AppShell'
import { UebenKontextProvider } from './context/lernen/UebenKontextProvider'
import type { UebenRolle } from './types/lernen/auth'

const DEMO_PARAM = new URLSearchParams(window.location.search).get('demo')
const IST_DEMO = !!DEMO_PARAM
const DEMO_ROLLE: UebenRolle = DEMO_PARAM === 'eltern' ? 'admin' : 'lernend'

interface AppUebenProps {
  /** Callback wenn SuS "Zurück" zur ExamLab-Startseite will */
  onZurueck?: () => void
}

export default function AppUeben({ onZurueck: _onZurueck }: AppUebenProps = {}) {
  const { user, istAngemeldet, sessionWiederherstellen, ladeStatus: authStatus } = useUebenAuthStore()
  const { gruppen, aktiveGruppe, ladeGruppen, ladeStatus: gruppenStatus } = useUebenGruppenStore()
  const { session, starteSession } = useUebenUebungsStore()
  const { aktuellerScreen, navigiere } = useUebenNavigationStore()
  const [demoAktiv, setDemoAktiv] = useState(false)

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

      useUebenFortschrittStore.getState().ladeFortschritt().catch(() => {})
      navigiere('dashboard')
    }
  }, [demoAktiv, navigiere])

  // Session nur wiederherstellen wenn NICHT embedded (standalone Üben-Login)
  // Bei embedded (via SuSStartseite/UebungsToolView) wurde der Login bereits gebrückt
  useEffect(() => {
    if (!IST_DEMO && !_onZurueck) sessionWiederherstellen()
  }, [sessionWiederherstellen, _onZurueck])

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
        if (aktuellerScreen !== 'admin') navigiere('admin')
      } else {
        if (user.rolle !== 'lernend') useUebenAuthStore.getState().setzeRolle('lernend')
        if (aktuellerScreen !== 'dashboard' && aktuellerScreen !== 'uebung' && aktuellerScreen !== 'ergebnis') {
          navigiere('dashboard')
        }
      }
    }
  }, [aktiveGruppe, user?.email, user?.rolle, aktuellerScreen, navigiere])

  // Navigation-State synchronisieren
  useEffect(() => {
    if (!istAngemeldet) {
      if (aktuellerScreen !== 'login') navigiere('login')
      return
    }
    if (istAngemeldet && aktuellerScreen === 'login') {
      navigiere(aktiveGruppe ? 'dashboard' : 'gruppenAuswahl')
    }
  }, [istAngemeldet, aktiveGruppe, aktuellerScreen, navigiere])

  // Session → Übung/Ergebnis-Screen
  useEffect(() => {
    if (session && !session.beendet && aktuellerScreen !== 'uebung') {
      navigiere('uebung')
    }
    if (session?.beendet && aktuellerScreen !== 'ergebnis') {
      navigiere('ergebnis')
    }
    if (!session && (aktuellerScreen === 'uebung' || aktuellerScreen === 'ergebnis')) {
      navigiere('dashboard')
    }
  }, [session, session?.beendet, aktuellerScreen, navigiere])

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
    if (_onZurueck) {
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
      _onZurueck()
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
      <AppShell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 text-center max-w-sm">
            <h2 className="text-xl font-bold mb-2 dark:text-white">Keine Gruppen</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-4">
              Du bist noch keiner Gruppe zugeordnet.
            </p>
            <button
              onClick={() => useUebenAuthStore.getState().abmelden()}
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
  if (!aktiveGruppe) return <AppShell><GruppenAuswahl /></AppShell>

  // Screen-Rendering
  return (
    <UebenKontextProvider>
      <AppShell>
        {aktuellerScreen === 'admin' && (
          <AdminDashboard onZuUeben={() => navigiere('dashboard')} />
        )}

        {aktuellerScreen === 'ergebnis' && session?.beendet && (
          <Zusammenfassung
            onZurueck={() => {
              useUebenUebungsStore.setState({ session: null })
              navigiere('dashboard')
            }}
            onNochmal={() => {
              if (aktiveGruppe && user) {
                starteSession(aktiveGruppe.id, user.email, session.fach, session.thema)
              }
            }}
          />
        )}

        {aktuellerScreen === 'uebung' && session && !session.beendet && (
          <UebungsScreen />
        )}

        {aktuellerScreen === 'dashboard' && (
          <Dashboard />
        )}
      </AppShell>
    </UebenKontextProvider>
  )
}
