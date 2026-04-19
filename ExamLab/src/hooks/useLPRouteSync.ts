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
/**
 * Pfad-Segmente, die keine Config-ID sind, sondern eigene Sub-Routen.
 * Alles andere nach /pruefung/ oder /uebung/ wird als Config-ID interpretiert.
 */
const RESERVIERTE_SEGMENTE = new Set([
  'tracker', 'monitoring', 'durchfuehren', 'analyse', 'kurs',
])

/**
 * Liest die Config-ID aus einem Pfad wie /pruefung/abc123 oder /uebung/xyz/korrektur.
 * Gibt null zurück, wenn kein configId-Segment vorhanden ist.
 * 'neu' ist ein Sentinel für neue/duplizierte Prüfungen (kein Config-Lookup, nur Composer öffnen).
 */
function leseConfigIdAusPfad(path: string): string | null {
  const match = path.match(/^\/(?:pruefung|uebung)\/([^/]+)/)
  if (!match) return null
  const segment = match[1]
  if (RESERVIERTE_SEGMENTE.has(segment)) return null
  return segment
}

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

    // Config-ID aus der URL ableiten (für /pruefung/:id und /uebung/:id).
    // Wird unten von Prüfung/Übung-Branch benötigt, um Composer zu öffnen.
    const configIdInUrl = leseConfigIdAusPfad(path)

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
      } else if (segment === 'kurs') {
        if (store.uebungsTab !== 'uebungen') store.setUebungsTab('uebungen')
      } else if (!segment || segment === '') {
        if (store.uebungsTab !== 'uebungen') store.setUebungsTab('uebungen')
      }
      syncComposerState(store, configIdInUrl)
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
      syncComposerState(store, configIdInUrl)
      return
    }

    // Favoriten: /favoriten — kein Store-Sync nötig. Composer schliessen falls noch offen.
    if (store.ansicht === 'composer') {
      store.zurueckZumDashboard()
    }
  }, [location.pathname])
}

/**
 * Synct Composer-State (ansicht + aktiveConfigId) mit der URL.
 * - /pruefung/neu → Composer öffnen ohne Config-Lookup (für "Neue"/"Duplizieren")
 * - /pruefung/{id} → aktiveConfigId setzen, LPStartseite öffnet Composer via useEffect
 * - /pruefung oder /pruefung/tracker → Composer schliessen
 */
function syncComposerState(
  store: ReturnType<typeof useLPNavigationStore.getState>,
  configIdInUrl: string | null,
): void {
  if (configIdInUrl === 'neu') {
    // Neue/Duplizierte Prüfung: Composer direkt öffnen, keine Config-ID im Store setzen
    if (store.ansicht !== 'composer') {
      store.navigiereZuComposer('Neu')
    }
    return
  }

  if (configIdInUrl) {
    // Bestehende Config: ID in Store schreiben, LPStartseite-Effect öffnet den Composer
    if (store.aktiveConfigId !== configIdInUrl) {
      store.setAktiveConfigId(configIdInUrl)
    }
    return
  }

  // Kein Composer-Pfad → zurück zum Dashboard, wenn noch offen
  if (store.ansicht === 'composer') {
    store.zurueckZumDashboard()
  }
}
