import { useEffect, useState } from 'react'
import { useAuthStore } from './store/authStore'
import { useGruppenStore } from './store/gruppenStore'
import { useUebungsStore } from './store/uebungsStore'
import { useFortschrittStore } from './store/fortschrittStore'
import LoginScreen from './components/LoginScreen'
import GruppenAuswahl from './components/GruppenAuswahl'
import Dashboard from './components/Dashboard'
import UebungsScreen from './components/UebungsScreen'
import Zusammenfassung from './components/Zusammenfassung'
import AdminDashboard from './components/admin/AdminDashboard'

const DEMO_PARAM = new URLSearchParams(window.location.search).get('demo')
const IST_DEMO = !!DEMO_PARAM
const DEMO_ROLLE = DEMO_PARAM === 'eltern' ? 'admin' as const : 'lernend' as const

export default function App() {
  const { user, istAngemeldet, sessionWiederherstellen, ladeStatus: authStatus } = useAuthStore()
  const { gruppen, aktiveGruppe, ladeGruppen, ladeStatus: gruppenStatus } = useGruppenStore()
  const { session, starteSession } = useUebungsStore()
  const [adminModus, setAdminModus] = useState(false)
  const [demoAktiv, setDemoAktiv] = useState(false)

  // Demo-Modus: ?demo=true in URL → Mock-Login ohne Backend
  useEffect(() => {
    if (IST_DEMO && !demoAktiv) {
      setDemoAktiv(true)

      const istEltern = DEMO_ROLLE === 'admin'
      const email = istEltern ? 'eltern@demo.ch' : 'kind@demo.ch'
      const name = istEltern ? 'Demo Elternteil' : 'Demo Kind'
      const vorname = istEltern ? 'Elternteil' : 'Kind'

      // Mock-User setzen
      useAuthStore.setState({
        user: {
          email,
          name,
          vorname,
          nachname: 'Demo',
          rolle: DEMO_ROLLE,
          sessionToken: 'demo-token',
          loginMethode: 'google',
        },
        istAngemeldet: true,
        ladeStatus: 'fertig',
      })

      // Mock-Gruppe setzen (adminEmail = eltern)
      const gruppe = {
        id: 'demo-gruppe',
        name: 'Demo-Familie',
        typ: 'familie' as const,
        adminEmail: 'eltern@demo.ch',
        fragebankSheetId: 'demo',
        analytikSheetId: 'demo',
        mitglieder: ['eltern@demo.ch', 'kind@demo.ch'],
      }
      useGruppenStore.setState({
        gruppen: [gruppe],
        aktiveGruppe: gruppe,
        ladeStatus: 'fertig',
      })

      if (istEltern) setAdminModus(true)

      // Fortschritt aus localStorage laden
      useFortschrittStore.getState().ladeFortschritt()
    }
  }, [demoAktiv])

  useEffect(() => {
    if (!IST_DEMO) sessionWiederherstellen()
  }, [sessionWiederherstellen])

  useEffect(() => {
    if (!IST_DEMO && istAngemeldet && user?.email) {
      ladeGruppen(user.email)
    }
  }, [istAngemeldet, user?.email, ladeGruppen])

  useEffect(() => {
    if (aktiveGruppe && user?.email) {
      const istAdmin = aktiveGruppe.adminEmail.toLowerCase() === user.email.toLowerCase()
      if (istAdmin && user.rolle !== 'admin') {
        useAuthStore.getState().setzeRolle('admin')
        setAdminModus(true)
      } else if (!istAdmin && user.rolle !== 'lernend') {
        useAuthStore.getState().setzeRolle('lernend')
      }
    }
  }, [aktiveGruppe, user?.email, user?.rolle])

  // Laden (nicht im Demo-Modus)
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 text-center max-w-sm">
          <h2 className="text-xl font-bold mb-2 dark:text-white">Keine Gruppen</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Du bist noch keiner Gruppe zugeordnet.
          </p>
          <button onClick={() => useAuthStore.getState().abmelden()} className="text-sm text-gray-400 hover:text-gray-600">
            Abmelden
          </button>
        </div>
      </div>
    )
  }

  // Gruppen-Auswahl
  if (!aktiveGruppe) return <GruppenAuswahl />

  // Uebungs-Session aktiv
  if (session) {
    if (session.beendet) {
      return (
        <Zusammenfassung
          onZurueck={() => useUebungsStore.setState({ session: null })}
          onNochmal={() => {
            if (aktiveGruppe && user) {
              starteSession(aktiveGruppe.id, user.email, session.fach, session.thema)
            }
          }}
        />
      )
    }
    return <UebungsScreen />
  }

  // Admin-Dashboard (wenn Admin + Admin-Modus aktiv)
  if (user?.rolle === 'admin' && adminModus) {
    return <AdminDashboard onZuUeben={() => setAdminModus(false)} />
  }

  // Dashboard (mit Admin-Toggle wenn Admin)
  return (
    <>
      <Dashboard />
      {user?.rolle === 'admin' && (
        <div className="fixed bottom-6 right-6">
          <button
            onClick={() => setAdminModus(true)}
            className="bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-800 px-4 py-2 rounded-full shadow-lg text-sm font-medium min-h-[44px]"
          >
            Admin-Dashboard
          </button>
        </div>
      )}
    </>
  )
}
