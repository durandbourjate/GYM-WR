import { create } from 'zustand'

export type ScreenTyp =
  | 'login'
  | 'gruppenAuswahl'
  | 'dashboard'
  | 'uebung'
  | 'ergebnis'
  | 'admin'
  | 'adminFragenbank'

interface NavigationState {
  aktuellerScreen: ScreenTyp
  screenHistory: ScreenTyp[]

  navigiere: (screen: ScreenTyp) => void
  zurueck: () => void
  kannZurueck: () => boolean
  reset: () => void
}

export const useNavigationStore = create<NavigationState>((set, get) => ({
  aktuellerScreen: 'login',
  screenHistory: [],

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

  reset: () => set({ aktuellerScreen: 'login', screenHistory: [] }),
}))
