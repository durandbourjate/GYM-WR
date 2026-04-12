import { create } from 'zustand'

export type UebenScreenTyp =
  | 'login'
  | 'gruppenAuswahl'
  | 'dashboard'
  | 'uebung'
  | 'ergebnis'
  | 'admin'
  | 'adminFragenbank'

interface UebenNavigationState {
  aktuellerScreen: UebenScreenTyp
  screenHistory: UebenScreenTyp[]
  /** Thema das vom Lernziele-Akkordeon als Deep Link gesetzt wurde */
  deepLinkThema: string | null

  navigiere: (screen: UebenScreenTyp) => void
  zurueck: () => void
  kannZurueck: () => boolean
  reset: () => void
  setDeepLinkThema: (thema: string | null) => void
}

export const useUebenNavigationStore = create<UebenNavigationState>((set, get) => ({
  aktuellerScreen: 'login',
  screenHistory: [],
  deepLinkThema: null,

  navigiere: (screen) => {
    const { aktuellerScreen } = get()
    if (screen === aktuellerScreen) return
    set(state => ({
      screenHistory: [...state.screenHistory, state.aktuellerScreen],
      aktuellerScreen: screen,
    }))
  },

  zurueck: () => {
    const { screenHistory } = get()
    if (screenHistory.length === 0) return
    const vorheriger = screenHistory[screenHistory.length - 1]
    set({
      aktuellerScreen: vorheriger,
      screenHistory: screenHistory.slice(0, -1),
    })
  },

  kannZurueck: () => get().screenHistory.length > 0,

  reset: () => set({ aktuellerScreen: 'login', screenHistory: [], deepLinkThema: null }),

  setDeepLinkThema: (thema) => set({ deepLinkThema: thema }),
}))
