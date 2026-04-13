import { create } from 'zustand'
import type { AppOrt } from '../types/stammdaten'

export type LPModus = 'pruefung' | 'uebung' | 'fragensammlung'
export type LPAnsicht = 'dashboard' | 'composer'
export type ListenTab = 'pruefungen' | 'tracker'
export type UebungsTab = 'uebungen' | 'durchfuehren' | 'analyse'
export type EinstellungenTab = 'profil' | 'lernziele' | 'favoriten' | 'admin'

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

  // Favoriten (Account-verknüpfte App-Orte)
  favoriten: AppOrt[]

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
  clearDeepLinkFrageId: () => void
  clearDeepLinkComposerTab: () => void
  neuerComposerKey: () => void
  kannZurueck: () => boolean
  zurueck: () => void
  setBreadcrumbs: (crumbs: BreadcrumbEintrag[]) => void

  // Favoriten
  toggleFavorit: (ort: AppOrt) => void
  toggleFavoritById: (id: string, screen?: 'pruefung' | 'uebung' | 'fragensammlung') => void
  istFavorit: (id: string) => boolean
  setFavoriten: (favoriten: AppOrt[]) => void
  favoritenSyncMitBackend: () => void

  // Config-ID (wird per useLPRouteSync aus URL gesetzt)
  setAktiveConfigId: (id: string | null) => void

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

/** Lade Favoriten aus localStorage (Fallback / Offline) */
function gespeicherteFavoriten(): AppOrt[] {
  try {
    const val = localStorage.getItem(FAVORITEN_KEY)
    if (val) {
      const parsed = JSON.parse(val)
      if (Array.isArray(parsed)) {
        // Migration: alte string[] → AppOrt[]
        if (parsed.length > 0 && typeof parsed[0] === 'string') {
          return (parsed as string[]).map(id => ({
            id,
            titel: '',
            screen: 'pruefung' as const,
            params: { configId: id },
            erstelltAm: new Date().toISOString(),
          }))
        }
        return parsed as AppOrt[]
      }
    }
  } catch { /* ignore */ }
  return []
}

function speichereFavoriten(favoriten: AppOrt[]): void {
  try { localStorage.setItem(FAVORITEN_KEY, JSON.stringify(favoriten)) } catch { /* ignore */ }
}

/** Generiere eine kurze eindeutige ID */
function generiereId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

export const useLPNavigationStore = create<LPNavigationState>((set, get) => ({
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
  favoriten: gespeicherteFavoriten(),
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
    // Keine Hash-Aktualisierung mehr — URL wird via React Router gesetzt
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

  // --- Favoriten (AppOrt) ---

  toggleFavorit: (ort: AppOrt) => {
    const { favoriten } = get()
    const existiert = favoriten.find(f => f.id === ort.id || (
      f.screen === ort.screen && f.params.configId === ort.params.configId &&
      (f.params.tab ?? '') === (ort.params.tab ?? '')
    ))
    const neueFavoriten = existiert
      ? favoriten.filter(f => f.id !== (existiert.id))
      : [...favoriten, { ...ort, id: ort.id || generiereId() }]
    speichereFavoriten(neueFavoriten)
    set({ favoriten: neueFavoriten })
    get().favoritenSyncMitBackend()
  },

  toggleFavoritById: (configId: string, screen: 'pruefung' | 'uebung' | 'fragensammlung' = 'pruefung') => {
    const { favoriten } = get()
    const existiert = favoriten.find(f => f.params.configId === configId)
    if (existiert) {
      const neueFavoriten = favoriten.filter(f => f.id !== existiert.id)
      speichereFavoriten(neueFavoriten)
      set({ favoriten: neueFavoriten })
    } else {
      const neuerOrt: AppOrt = {
        id: generiereId(),
        titel: '',
        screen,
        params: { configId },
        erstelltAm: new Date().toISOString(),
      }
      const neueFavoriten = [...favoriten, neuerOrt]
      speichereFavoriten(neueFavoriten)
      set({ favoriten: neueFavoriten })
    }
    get().favoritenSyncMitBackend()
  },

  istFavorit: (configId: string) => get().favoriten.some(f => f.params.configId === configId),

  setFavoriten: (favoriten) => {
    speichereFavoriten(favoriten)
    set({ favoriten })
  },

  favoritenSyncMitBackend: () => {
    // Wird extern verdrahtet wenn LP-Profil geladen ist
  },

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
