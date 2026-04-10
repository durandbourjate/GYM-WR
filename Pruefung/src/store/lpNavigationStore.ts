import { create } from 'zustand'

export type LPModus = 'pruefung' | 'uebung' | 'fragensammlung'
export type LPAnsicht = 'dashboard' | 'composer'
export type ListenTab = 'pruefungen' | 'tracker'
export type UebungsTab = 'uebungen' | 'durchfuehren' | 'analyse'

export interface BreadcrumbEintrag {
  label: string
  aktion?: () => void
}

interface LPNavigationState {
  // Aktuelle Ansicht
  ansicht: LPAnsicht
  modus: LPModus
  vorherigerModus: 'pruefung' | 'uebung'

  // Sub-Tabs
  listenTab: ListenTab
  uebungsTab: UebungsTab

  // UI-Panels
  zeigHilfe: boolean
  zeigEinstellungen: boolean

  // Composer-State
  composerKey: number

  // History für Zurück-Navigation
  ansichtHistory: LPAnsicht[]

  // Breadcrumb-Daten
  breadcrumbs: BreadcrumbEintrag[]

  // Favoriten (Prüfungs-/Übungs-IDs)
  favoriten: string[]

  // Aktionen
  navigiereZuComposer: (titel: string) => void
  zurueckZumDashboard: () => void
  setModus: (m: LPModus) => void
  setListenTab: (tab: ListenTab) => void
  setUebungsTab: (tab: UebungsTab) => void
  toggleHilfe: () => void
  setZeigEinstellungen: (zeig: boolean) => void
  neuerComposerKey: () => void
  kannZurueck: () => boolean
  zurueck: () => void
  setBreadcrumbs: (crumbs: BreadcrumbEintrag[]) => void
  toggleFavorit: (id: string) => void
  istFavorit: (id: string) => boolean
  reset: () => void
}

const MODUS_KEY = 'lp-modus'
const FAVORITEN_KEY = 'lp-favoriten'

function gespeicherterModus(): LPModus {
  try {
    const val = sessionStorage.getItem(MODUS_KEY)
    if (val === 'pruefung' || val === 'uebung' || val === 'fragensammlung') return val
  } catch { /* ignore */ }
  return 'pruefung'
}

function gespeicherteFavoriten(): string[] {
  try {
    const val = localStorage.getItem(FAVORITEN_KEY)
    if (val) {
      const parsed = JSON.parse(val)
      if (Array.isArray(parsed)) return parsed
    }
  } catch { /* ignore */ }
  return []
}

function speichereFavoriten(favoriten: string[]): void {
  try { localStorage.setItem(FAVORITEN_KEY, JSON.stringify(favoriten)) } catch { /* ignore */ }
}

export const useLPNavigationStore = create<LPNavigationState>((set, get) => ({
  ansicht: 'dashboard',
  modus: gespeicherterModus(),
  vorherigerModus: 'pruefung',
  listenTab: 'pruefungen',
  uebungsTab: 'durchfuehren',
  zeigHilfe: false,
  zeigEinstellungen: false,
  composerKey: 0,
  ansichtHistory: [],
  breadcrumbs: [],
  favoriten: gespeicherteFavoriten(),

  navigiereZuComposer: (titel) => {
    set(state => ({
      ansichtHistory: [...state.ansichtHistory, state.ansicht],
      ansicht: 'composer',
      breadcrumbs: [
        { label: state.modus === 'uebung' ? 'Üben' : 'Prüfen', aktion: () => get().zurueckZumDashboard() },
        { label: titel },
      ],
    }))
  },

  zurueckZumDashboard: () => {
    set({ ansicht: 'dashboard', ansichtHistory: [], breadcrumbs: [] })
  },

  setModus: (m) => {
    const state = get()
    const vorherigerModus = m === 'fragensammlung'
      ? state.vorherigerModus
      : (m === 'pruefung' || m === 'uebung' ? m : state.vorherigerModus)
    try { sessionStorage.setItem(MODUS_KEY, m) } catch { /* ignore */ }
    set({
      modus: m,
      vorherigerModus,
      // Fragensammlung schliesst Composer
      ...(m === 'fragensammlung' && state.ansicht === 'composer' ? { ansicht: 'dashboard', ansichtHistory: [] } : {}),
    })
  },

  setListenTab: (tab) => set({ listenTab: tab }),
  setUebungsTab: (tab) => set({ uebungsTab: tab }),
  toggleHilfe: () => set(s => ({ zeigHilfe: !s.zeigHilfe })),
  setZeigEinstellungen: (zeig) => set({ zeigEinstellungen: zeig }),
  neuerComposerKey: () => set(s => ({ composerKey: s.composerKey + 1 })),

  kannZurueck: () => get().ansichtHistory.length > 0,

  zurueck: () => {
    const { ansichtHistory, modus, vorherigerModus } = get()
    // Fragensammlung: zurück zum vorherigen Modus
    if (modus === 'fragensammlung') {
      try { sessionStorage.setItem(MODUS_KEY, vorherigerModus) } catch { /* ignore */ }
      set({ modus: vorherigerModus })
      return
    }
    // Composer: zurück zum Dashboard
    if (ansichtHistory.length > 0) {
      const vorherige = ansichtHistory[ansichtHistory.length - 1]
      set({
        ansicht: vorherige,
        ansichtHistory: ansichtHistory.slice(0, -1),
        breadcrumbs: [],
      })
      return
    }
  },

  setBreadcrumbs: (crumbs) => set({ breadcrumbs: crumbs }),

  toggleFavorit: (id) => {
    const { favoriten } = get()
    const neueFavoriten = favoriten.includes(id)
      ? favoriten.filter(f => f !== id)
      : [...favoriten, id]
    speichereFavoriten(neueFavoriten)
    set({ favoriten: neueFavoriten })
  },

  istFavorit: (id) => get().favoriten.includes(id),

  reset: () => set({
    ansicht: 'dashboard',
    modus: 'pruefung',
    vorherigerModus: 'pruefung',
    listenTab: 'pruefungen',
    uebungsTab: 'durchfuehren',
    zeigHilfe: false,
    zeigEinstellungen: false,
    composerKey: 0,
    ansichtHistory: [],
    breadcrumbs: [],
  }),
}))
