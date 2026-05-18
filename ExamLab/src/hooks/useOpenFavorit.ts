import { useState, useCallback } from 'react'
import type { Favorit } from '../types/favorit'
import { useLPNavigationStore, type EinstellungenTab } from '../store/lpUIStore'

/**
 * Cluster E.5 Spawn-Task (17.05.2026): Zentralisierte Auflösung eines Favoriten
 * in entweder einen Link-Target (für Routing via `<Link to>`) oder eine Action
 * (Overlay-Öffnung via Button). Konsumenten rendern entsprechend `<Link>` oder
 * `<button>`. Verwendung in Favoriten.tsx; LPStartseite-Wiring optional, wenn
 * dort Tab-Typen unterstützt werden sollen.
 *
 * Hintergrund: Die Logik für `einstellungen-tab` / `hilfe-tab` Overlay-Open lag
 * inline in Favoriten.tsx (Hotfix #4). Eine wiederverwendbare Abstraktion
 * vermeidet Duplikation, sobald weitere Surfaces (Sidebar, LPStartseite,
 * Search-Result-Click) Favorit-Öffnen brauchen.
 */
export type FavoritOpenResolution =
  | { kind: 'navigate'; to: string }
  | { kind: 'action'; onClick: () => void }

export interface UseOpenFavoritResult {
  /** Liefert die Render-Strategie für einen Favorit. */
  resolveFavorit: (fav: Favorit) => FavoritOpenResolution
  /** Tab-ID die der HilfeSeite vorab gesetzt werden soll (wenn ein hilfe-tab-Favorit gedrückt wurde). */
  initialHilfeKategorie: string | undefined
  /** Manueller Setter (z.B. wenn der Hilfe-Overlay schliesst und der Wert zurückgesetzt werden soll). */
  setInitialHilfeKategorie: (k: string | undefined) => void
}

export function useOpenFavorit(): UseOpenFavoritResult {
  const [initialHilfeKategorie, setInitialHilfeKategorie] = useState<string | undefined>(undefined)
  const zeigHilfe = useLPNavigationStore(s => s.zeigHilfe)
  const toggleHilfe = useLPNavigationStore(s => s.toggleHilfe)
  const setZeigEinstellungen = useLPNavigationStore(s => s.setZeigEinstellungen)

  const resolveFavorit = useCallback((fav: Favorit): FavoritOpenResolution => {
    switch (fav.typ) {
      case 'einstellungen-tab':
        return {
          kind: 'action',
          onClick: () => setZeigEinstellungen(true, fav.ziel as EinstellungenTab),
        }
      case 'hilfe-tab':
        return {
          kind: 'action',
          onClick: () => {
            setInitialHilfeKategorie(fav.ziel)
            if (!zeigHilfe) toggleHilfe()
          },
        }
      case 'ort':
        return { kind: 'navigate', to: fav.ziel }
      case 'frage':
        return { kind: 'navigate', to: `/fragensammlung/${fav.ziel}` }
      case 'pruefung':
      case 'uebung':
        return { kind: 'navigate', to: `/${fav.typ}?id=${fav.ziel}` }
    }
  }, [zeigHilfe, toggleHilfe, setZeigEinstellungen])

  return { resolveFavorit, initialHilfeKategorie, setInitialHilfeKategorie }
}
