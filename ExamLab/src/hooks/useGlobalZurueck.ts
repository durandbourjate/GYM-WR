import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

/**
 * Top-Level-Routes: Auf diesen Routes ist kein sinnvolles Zurück-Ziel vorhanden.
 * Alle anderen Pfade (inkl. parametrisierte wie /pruefung/:configId) zeigen den Button.
 * Als exportierte Konstante damit Tests dasselbe Set verwenden können.
 */
export const TOP_LEVEL_ROUTES: ReadonlySet<string> = new Set([
  // LP
  '/favoriten',
  '/pruefung',
  '/pruefung/tracker',
  '/pruefung/monitoring',
  '/uebung',
  '/uebung/durchfuehren',
  '/uebung/analyse',
  '/fragensammlung',
  '/einstellungen',
  // SuS
  '/sus',
  '/sus/ueben',
  '/sus/pruefen',
  '/sus/admin',
  '/sus/gruppen',
  '/sus/ueben/fortschritt',
  '/sus/ueben/ergebnisse',
  '/sus/ueben/ergebnis',
  '/sus/pruefen/ergebnisse',
])

/** Default-Route pro Rolle (Fallback wenn History-Stack leer). */
function defaultRoute(rolle: 'lp' | 'sus' | 'unbekannt' | undefined): string {
  return rolle === 'sus' ? '/sus/ueben' : '/favoriten'
}

export interface UseGlobalZurueckResult {
  canGoBack: boolean
  goBack: () => void
}

/**
 * Globaler Zurück-Button-Hook.
 *
 * - canGoBack: true wenn der aktuelle Pfad NICHT zu den Top-Level-Routes gehört.
 * - goBack(): navigiert navigate(-1), ausser beim ersten Direktaufruf (location.key === 'default'),
 *   dann navigiert auf die Rollen-Default-Route mit replace (kein leerer History-Eintrag).
 */
export function useGlobalZurueck(): UseGlobalZurueckResult {
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuthStore(s => s.user)

  const canGoBack = !TOP_LEVEL_ROUTES.has(location.pathname)

  function goBack(): void {
    if (location.key === 'default') {
      // Direkter Bookmark-Aufruf → History-Stack ist leer → auf Default-Route umleiten
      navigate(defaultRoute(user?.rolle), { replace: true })
    } else {
      navigate(-1)
    }
  }

  return { canGoBack, goBack }
}
