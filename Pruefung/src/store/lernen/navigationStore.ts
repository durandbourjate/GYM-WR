import { create } from 'zustand'

export type LernenScreenTyp =
  | 'login'
  | 'gruppenAuswahl'
  | 'dashboard'
  | 'uebung'
  | 'ergebnis'
  | 'admin'
  | 'adminFragenbank'

interface LernenNavigationState {
  aktuellerScreen: LernenScreenTyp
  screenHistory: LernenScreenTyp[]

  navigiere: (screen: LernenScreenTyp) => void
  zurueck: () => void
  kannZurueck: () => boolean
  reset: () => void
}

export const useLernenNavigationStore = create<LernenNavigationState>((set, get) => ({
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
