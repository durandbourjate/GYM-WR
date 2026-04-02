import { useEffect } from 'react'
import { useAuthStore } from './store/authStore'
import { useGruppenStore } from './store/gruppenStore'
import { useUebungsStore } from './store/uebungsStore'
import LoginScreen from './components/LoginScreen'
import GruppenAuswahl from './components/GruppenAuswahl'
import Dashboard from './components/Dashboard'
import UebungsScreen from './components/UebungsScreen'
import Zusammenfassung from './components/Zusammenfassung'

export default function App() {
  const { user, istAngemeldet, sessionWiederherstellen, ladeStatus: authStatus } = useAuthStore()
  const { gruppen, aktiveGruppe, ladeGruppen, ladeStatus: gruppenStatus } = useGruppenStore()
  const { session, starteSession } = useUebungsStore()

  useEffect(() => {
    sessionWiederherstellen()
  }, [sessionWiederherstellen])

  useEffect(() => {
    if (istAngemeldet && user?.email) {
      ladeGruppen(user.email)
    }
  }, [istAngemeldet, user?.email, ladeGruppen])

  useEffect(() => {
    if (aktiveGruppe && user?.email) {
      const istAdmin = aktiveGruppe.adminEmail.toLowerCase() === user.email.toLowerCase()
      if (istAdmin && user.rolle !== 'admin') {
        useAuthStore.getState().setzeRolle('admin')
      } else if (!istAdmin && user.rolle !== 'lernend') {
        useAuthStore.getState().setzeRolle('lernend')
      }
    }
  }, [aktiveGruppe, user?.email, user?.rolle])

  // Laden
  if (authStatus === 'laden') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <p className="text-gray-500">Wird geladen...</p>
      </div>
    )
  }

  // Nicht eingeloggt
  if (!istAngemeldet) return <LoginScreen />

  // Gruppen laden
  if (gruppenStatus === 'laden') {
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

  // Dashboard
  return <Dashboard />
}
