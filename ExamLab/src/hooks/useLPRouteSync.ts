import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useLPNavigationStore } from '../store/lpUIStore'

/**
 * Synchronisiert die aktuelle URL in den lpNavigationStore.
 *
 * Übergangs-Hook: In Phase 2 liest LPStartseite noch aus dem Store.
 * Dieser Hook sorgt dafür, dass der Store-State zur URL passt.
 * Wenn LPStartseite vollständig auf useLocation/useParams umgestellt ist,
 * kann dieser Hook entfernt werden.
 */
export function useLPRouteSync(): void {
  const location = useLocation()
  useEffect(() => {
    const path = location.pathname
    const store = useLPNavigationStore.getState()

    // Einstellungen: /einstellungen oder /einstellungen/{tab}
    if (path.startsWith('/einstellungen')) {
      const tab = path.split('/')[2] as 'profil' | 'lernziele' | 'admin' | undefined
      if (!store.zeigEinstellungen) {
        store.setZeigEinstellungen(true, tab)
      }
      return
    }

    // Einstellungen schliessen wenn nicht mehr auf /einstellungen
    if (store.zeigEinstellungen) {
      store.setZeigEinstellungen(false)
    }

    // Fragensammlung: /fragensammlung oder /fragensammlung/{frageId}
    if (path.startsWith('/fragensammlung')) {
      if (store.modus !== 'fragensammlung') {
        store.setModus('fragensammlung')
      }
      return
    }

    // Übung: /uebung, /uebung/durchfuehren, /uebung/analyse, /uebung/{configId}
    if (path.startsWith('/uebung')) {
      if (store.modus !== 'uebung') {
        store.setModus('uebung')
      }
      const segment = path.split('/')[2]
      if (segment === 'durchfuehren' && store.uebungsTab !== 'durchfuehren') {
        store.setUebungsTab('durchfuehren')
      } else if (segment === 'analyse' && store.uebungsTab !== 'analyse') {
        store.setUebungsTab('analyse')
      } else if (!segment || segment === '') {
        if (store.uebungsTab !== 'uebungen') store.setUebungsTab('uebungen')
      }
      return
    }

    // Prüfung: /pruefung, /pruefung/tracker, /pruefung/{configId}
    if (path.startsWith('/pruefung')) {
      if (store.modus !== 'pruefung') {
        store.setModus('pruefung')
      }
      const segment = path.split('/')[2]
      if (segment === 'tracker' && store.listenTab !== 'tracker') {
        store.setListenTab('tracker')
      } else if (segment === 'monitoring') {
        // Multi-Monitoring: eigene Route, kein Store-Sync nötig
      } else if (!segment || segment === '') {
        if (store.listenTab !== 'pruefungen') store.setListenTab('pruefungen')
      }
      return
    }

    // Favoriten: /favoriten — kein Store-Sync nötig
  }, [location.pathname])
}
