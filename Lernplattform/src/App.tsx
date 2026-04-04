import { useEffect, useState } from 'react'
import { initSyncManager } from './utils/syncManager'
import { useAuthStore } from './store/authStore'
import { useGruppenStore } from './store/gruppenStore'
import { useUebungsStore } from './store/uebungsStore'
import { useFortschrittStore } from './store/fortschrittStore'
import { useNavigationStore } from './store/navigationStore'
import LoginScreen from './components/LoginScreen'
import GruppenAuswahl from './components/GruppenAuswahl'
import Dashboard from './components/Dashboard'
import UebungsScreen from './components/UebungsScreen'
import Zusammenfassung from './components/Zusammenfassung'
import AdminDashboard from './components/admin/AdminDashboard'
import AppShell from './components/layout/AppShell'
import { LernKontextProvider } from './context/LernKontextProvider'

const DEMO_PARAM = new URLSearchParams(window.location.search).get('demo')
const IST_DEMO = !!DEMO_PARAM
const DEMO_ROLLE = DEMO_PARAM === 'eltern' ? 'admin' as const : 'lernend' as const

export default function App() {
  const { user, istAngemeldet, sessionWiederherstellen, ladeStatus: authStatus } = useAuthStore()
  const { gruppen, aktiveGruppe, ladeGruppen, ladeStatus: gruppenStatus } = useGruppenStore()
  const { session, starteSession } = useUebungsStore()
  const { aktuellerScreen, navigiere } = useNavigationStore()
  const [demoAktiv, setDemoAktiv] = useState(false)

  // SyncManager initialisieren (Offline-Queue bei Verbindungswiederherstellung leeren)
  useEffect(() => {
    initSyncManager()
  }, [])

  // Demo-Modus: ?demo=true in URL → Mock-Login ohne Backend
  useEffect(() => {
    if (IST_DEMO && !demoAktiv) {
      setDemoAktiv(true)

      const istEltern = DEMO_ROLLE === 'admin'
      const email = istEltern ? 'eltern@demo.ch' : 'kind@demo.ch'
      const name = istEltern ? 'Demo Elternteil' : 'Demo Kind'
      const vorname = istEltern ? 'Elternteil' : 'Kind'

      useAuthStore.setState({
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
      useGruppenStore.setState({ gruppen: [gruppe], aktiveGruppe: gruppe, ladeStatus: 'fertig' })

      useFortschrittStore.getState().ladeFortschritt().catch(() => {})
      navigiere('dashboard')
    }
  }, [demoAktiv, navigiere])

  useEffect(() => {
    if (!IST_DEMO) sessionWiederherstellen()
  }, [sessionWiederherstellen])

  useEffect(() => {
    if (!IST_DEMO && istAngemeldet && user?.email) {
      ladeGruppen(user.email)
    }
  }, [istAngemeldet, user?.email, ladeGruppen])

  // Rolle aus Gruppe ableiten + Admin direkt zu Admin-Screen navigieren
  useEffect(() => {
    if (aktiveGruppe && user?.email) {
      const istAdmin = aktiveGruppe.adminEmail.toLowerCase() === user.email.toLowerCase()
      if (istAdmin && user.rolle !== 'admin') {
        useAuthStore.getState().setzeRolle('admin')
        navigiere('admin')
      } else if (!istAdmin && user.rolle !== 'lernend') {
        useAuthStore.getState().setzeRolle('lernend')
      }
    }
  }, [aktiveGruppe, user?.email, user?.rolle, navigiere])

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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <p className="text-gray-500">Wird geladen...</p>
      </div>
    )
  }

  // Nicht eingeloggt
  if (!istAngemeldet) return <LoginScreen />

  // Gruppen laden
  if (!IST_DEMO && gruppenStatus === 'laden') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <p className="text-gray-500">Gruppen werden geladen...</p>
      </div>
    )
  }

  // Keine Gruppen
  if (gruppen.length === 0 && gruppenStatus === 'fertig') {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 text-center max-w-sm">
            <h2 className="text-xl font-bold mb-2 dark:text-white">Keine Gruppen</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Du bist noch keiner Gruppe zugeordnet.
            </p>
            <button
              onClick={() => useAuthStore.getState().abmelden()}
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
    <LernKontextProvider>
      <AppShell>
        {aktuellerScreen === 'admin' && (
          <AdminDashboard onZuUeben={() => navigiere('dashboard')} />
        )}

        {aktuellerScreen === 'ergebnis' && session?.beendet && (
          <Zusammenfassung
            onZurueck={() => {
              useUebungsStore.setState({ session: null })
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
    </LernKontextProvider>
  )
}
