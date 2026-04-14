import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useUebenNavigationStore, type UebenScreenTyp } from '../../store/ueben/navigationStore'

/**
 * Synchronisiert die aktuelle URL in den navigationStore (aktuellerScreen).
 *
 * Übergangs-Hook: Solange AppShell und andere Komponenten noch
 * aktuellerScreen aus dem Store lesen, hält dieser Hook den Store
 * mit der URL synchron.
 *
 * Kann entfernt werden, sobald alle Komponenten direkt useLocation() nutzen.
 */
export function useSuSRouteSync(): void {
  const location = useLocation()

  useEffect(() => {
    const path = location.pathname
    const store = useUebenNavigationStore.getState()

    let screen: UebenScreenTyp | null = null

    if (path.startsWith('/sus/admin')) {
      screen = 'admin'
    } else if (path.startsWith('/sus/ueben/ergebnis')) {
      screen = 'ergebnis'
    } else if (path.match(/^\/sus\/ueben\/[^/]+/)) {
      // /sus/ueben/:themaId → aktive Übung
      screen = 'uebung'
    } else if (path.startsWith('/sus/ueben')) {
      screen = 'dashboard'
    } else if (path.startsWith('/sus/gruppen')) {
      screen = 'gruppenAuswahl'
    } else if (path.startsWith('/sus/login')) {
      screen = 'login'
    }

    // Nur aktualisieren wenn sich der Screen tatsächlich ändert
    if (screen && screen !== store.aktuellerScreen) {
      useUebenNavigationStore.setState({ aktuellerScreen: screen })
    }
  }, [location.pathname])
}
