import { create } from 'zustand'

export type LPModus = 'pruefung' | 'uebung' | 'fragensammlung'
export type LPAnsicht = 'dashboard' | 'composer'
export type ListenTab = 'pruefungen' | 'tracker'
export type UebungsTab = 'uebungen' | 'durchfuehren' | 'analyse'
export type EinstellungenTab = 'profil' | 'lernziele' | 'favoriten' | 'uebungen' | 'admin' | 'kiKalibrierung' | 'problemmeldungen'

export interface BreadcrumbEintrag {
  label: string
  aktion?: () => void
}

interface LPUIState {
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
  einstellungenTab: EinstellungenTab | null

  // Deep-Link-Targets
  deepLinkFrageId: string | null
  deepLinkComposerTab: string | null

  // Composer-State
  composerKey: number

  // History für Zurück-Navigation
  ansichtHistory: LPAnsicht[]

  // Breadcrumb-Daten
  breadcrumbs: BreadcrumbEintrag[]

  // Aktuelle Config-ID (gesetzt per URL-Sync)
  aktiveConfigId: string | null

  // Aktionen
  navigiereZuComposer: (titel: string, configId?: string) => void
  zurueckZumDashboard: () => void
  setModus: (m: LPModus) => void
  setListenTab: (tab: ListenTab) => void
  setUebungsTab: (tab: UebungsTab) => void
  toggleHilfe: () => void
  setZeigEinstellungen: (zeig: boolean, tab?: EinstellungenTab) => void
  toggleEinstellungen: (tab?: EinstellungenTab) => void
  clearDeepLinkFrageId: () => void
  clearDeepLinkComposerTab: () => void
  neuerComposerKey: () => void
  kannZurueck: () => boolean
  zurueck: () => void
  setBreadcrumbs: (crumbs: BreadcrumbEintrag[]) => void

  // Config-ID (wird per useLPRouteSync aus URL gesetzt)
  setAktiveConfigId: (id: string | null) => void

  reset: () => void
}

const MODUS_KEY = 'lp-modus'

function gespeicherterModus(): LPModus {
  try {
    const val = sessionStorage.getItem(MODUS_KEY)
    if (val === 'pruefung' || val === 'uebung' || val === 'fragensammlung') return val
  } catch { /* ignore */ }
  return 'pruefung'
}

export const useLPUIStore = create<LPUIState>((set, get) => ({
  ansicht: 'dashboard',
  modus: gespeicherterModus(),
  vorherigerModus: 'pruefung',
  listenTab: 'pruefungen',
  uebungsTab: 'durchfuehren',
  zeigHilfe: false,
  zeigEinstellungen: false,
  einstellungenTab: null,
  deepLinkFrageId: null,
  deepLinkComposerTab: null,
  composerKey: 0,
  ansichtHistory: [],
  breadcrumbs: [],
  aktiveConfigId: null,

  navigiereZuComposer: (titel, configId) => {
    set(state => ({
      ansichtHistory: [...state.ansichtHistory, state.ansicht],
      ansicht: 'composer',
      aktiveConfigId: configId ?? null,
      breadcrumbs: [
        { label: state.modus === 'uebung' ? 'Üben' : 'Prüfen', aktion: () => get().zurueckZumDashboard() },
        { label: titel },
      ],
    }))
  },

  zurueckZumDashboard: () => {
    set({ ansicht: 'dashboard', ansichtHistory: [], breadcrumbs: [], aktiveConfigId: null })
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
      ...(m === 'fragensammlung' && state.ansicht === 'composer' ? { ansicht: 'dashboard', ansichtHistory: [] } : {}),
    })
  },

  setListenTab: (tab) => set({ listenTab: tab }),
  setUebungsTab: (tab) => set({ uebungsTab: tab }),
  toggleHilfe: () => set(s => ({ zeigHilfe: !s.zeigHilfe })),
  setZeigEinstellungen: (zeig, tab) => set({
    zeigEinstellungen: zeig,
    einstellungenTab: zeig && tab ? tab : null,
  }),
  toggleEinstellungen: (tab) => set(s => ({
    zeigEinstellungen: !s.zeigEinstellungen,
    einstellungenTab: !s.zeigEinstellungen && tab ? tab : null,
  })),
  clearDeepLinkFrageId: () => set({ deepLinkFrageId: null }),
  clearDeepLinkComposerTab: () => set({ deepLinkComposerTab: null }),
  neuerComposerKey: () => set(s => ({ composerKey: s.composerKey + 1 })),

  kannZurueck: () => get().ansichtHistory.length > 0,

  zurueck: () => {
    const { ansichtHistory, modus, vorherigerModus } = get()
    if (modus === 'fragensammlung') {
      try { sessionStorage.setItem(MODUS_KEY, vorherigerModus) } catch { /* ignore */ }
      set({ modus: vorherigerModus })
      return
    }
    if (ansichtHistory.length > 0) {
      const vorherige = ansichtHistory[ansichtHistory.length - 1]
      set({
        ansicht: vorherige,
        ansichtHistory: ansichtHistory.slice(0, -1),
        breadcrumbs: [],
        aktiveConfigId: null,
      })
      return
    }
  },

  setBreadcrumbs: (crumbs) => set({ breadcrumbs: crumbs }),

  setAktiveConfigId: (id) => set({ aktiveConfigId: id }),

  reset: () => set({
    ansicht: 'dashboard',
    modus: 'pruefung',
    vorherigerModus: 'pruefung',
    listenTab: 'pruefungen',
    uebungsTab: 'durchfuehren',
    zeigHilfe: false,
    zeigEinstellungen: false,
    einstellungenTab: null,
    deepLinkFrageId: null,
    deepLinkComposerTab: null,
    composerKey: 0,
    ansichtHistory: [],
    breadcrumbs: [],
    aktiveConfigId: null,
  }),
}))

// Rückwärts-kompatibler Re-Export (Übergang)
export const useLPNavigationStore = useLPUIStore
