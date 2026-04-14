import { create } from 'zustand'

/**
 * Screen-Typen für den SuS-Üben-Bereich.
 * Wird von useSuSRouteSync aus der URL abgeleitet und hier als
 * Übergangs-State gespeichert, bis alle Komponenten direkt
 * useLocation() nutzen.
 */
export type UebenScreenTyp =
  | 'login'
  | 'gruppenAuswahl'
  | 'dashboard'
  | 'uebung'
  | 'ergebnis'
  | 'admin'
  | 'adminFragenbank'

interface UebenNavigationState {
  /** Aktueller Screen — wird von useSuSRouteSync aus der URL gesetzt */
  aktuellerScreen: UebenScreenTyp
  /** Thema das vom Lernziele-Akkordeon als Deep Link gesetzt wurde */
  deepLinkThema: string | null

  setDeepLinkThema: (thema: string | null) => void
  reset: () => void
}

export const useUebenNavigationStore = create<UebenNavigationState>((set) => ({
  aktuellerScreen: 'dashboard',
  deepLinkThema: null,

  setDeepLinkThema: (thema) => set({ deepLinkThema: thema }),

  reset: () => set({ aktuellerScreen: 'dashboard', deepLinkThema: null }),
}))
