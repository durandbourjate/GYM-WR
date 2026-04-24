import { useCallback } from 'react'
import { useLPNavigation } from '../../../hooks/useLPNavigation'
import type { DeepLinkZiel } from './filterLogik'

export function useDeepLink(schliesseEinstellungen: () => void) {
  const nav = useLPNavigation()
  return useCallback((ziel: DeepLinkZiel | null) => {
    if (!ziel) return
    schliesseEinstellungen()
    switch (ziel.art) {
      case 'frage':
        nav.navigiereZuFrageneditor(ziel.id)
        break
      case 'pruefung':
      case 'gruppe':
        // Präfix explizit aus Meldung-modus, nicht aus window.location (wäre /einstellungen/...)
        nav.navigate(ziel.istUebung ? `/uebung/${ziel.id}` : `/pruefung/${ziel.id}`)
        break
      case 'ort':
        // Nur Info, kein Navigate
        break
    }
  }, [nav, schliesseEinstellungen])
}
