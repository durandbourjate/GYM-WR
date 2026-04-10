import { create } from 'zustand'
import type { AppOrt } from '../types/stammdaten'

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

  // Favoriten (Account-verknüpfte App-Orte)
  favoriten: AppOrt[]

  // Aktuelle Config-ID (für Hash-Router)
  aktiveConfigId: string | null

  // Aktionen
  navigiereZuComposer: (titel: string, configId?: string) => void
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

  // Favoriten — erweitert
  toggleFavorit: (ort: AppOrt) => void
  toggleFavoritById: (id: string) => void
  istFavorit: (id: string) => boolean
  setFavoriten: (favoriten: AppOrt[]) => void
  favoritenSyncMitBackend: () => void

  // Hash-Router
  navigiereZuHash: (hash: string) => void
  aktualisiereHash: () => void
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

/** Hash aus aktuellem Navigations-State bauen */
function bauHash(state: { modus: LPModus; ansicht: LPAnsicht; aktiveConfigId: string | null; listenTab: ListenTab; uebungsTab: UebungsTab }): string {
  if (state.ansicht === 'composer' && state.aktiveConfigId) {
    return `#/${state.modus === 'uebung' ? 'uebung' : 'pruefung'}/${state.aktiveConfigId}`
  }
  if (state.modus === 'fragensammlung') return '#/fragensammlung'
  if (state.modus === 'uebung') {
    if (state.uebungsTab !== 'uebungen') return `#/uebung/${state.uebungsTab}`
    return '#/uebung'
  }
  if (state.modus === 'pruefung') {
    if (state.listenTab === 'tracker') return '#/pruefung/tracker'
    return '#/pruefung'
  }
  return ''
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
    // Hash aktualisieren
    setTimeout(() => get().aktualisiereHash(), 0)
  },

  zurueckZumDashboard: () => {
    set({ ansicht: 'dashboard', ansichtHistory: [], breadcrumbs: [], aktiveConfigId: null })
    setTimeout(() => get().aktualisiereHash(), 0)
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
    setTimeout(() => get().aktualisiereHash(), 0)
  },

  setListenTab: (tab) => {
    set({ listenTab: tab })
    setTimeout(() => get().aktualisiereHash(), 0)
  },
  setUebungsTab: (tab) => {
    set({ uebungsTab: tab })
    setTimeout(() => get().aktualisiereHash(), 0)
  },
  toggleHilfe: () => set(s => ({ zeigHilfe: !s.zeigHilfe })),
  setZeigEinstellungen: (zeig) => set({ zeigEinstellungen: zeig }),
  neuerComposerKey: () => set(s => ({ composerKey: s.composerKey + 1 })),

  kannZurueck: () => get().ansichtHistory.length > 0,

  zurueck: () => {
    const { ansichtHistory, modus, vorherigerModus } = get()
    if (modus === 'fragensammlung') {
      try { sessionStorage.setItem(MODUS_KEY, vorherigerModus) } catch { /* ignore */ }
      set({ modus: vorherigerModus })
      setTimeout(() => get().aktualisiereHash(), 0)
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
      setTimeout(() => get().aktualisiereHash(), 0)
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
    // Backend-Sync async (fire-and-forget)
    get().favoritenSyncMitBackend()
  },

  toggleFavoritById: (configId: string) => {
    const { favoriten } = get()
    const existiert = favoriten.find(f => f.params.configId === configId)
    if (existiert) {
      const neueFavoriten = favoriten.filter(f => f.id !== existiert.id)
      speichereFavoriten(neueFavoriten)
      set({ favoriten: neueFavoriten })
    } else {
      // Vereinfachter AppOrt — Titel wird beim Rendering ergänzt
      const neuerOrt: AppOrt = {
        id: generiereId(),
        titel: '',
        screen: 'pruefung',
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
    // Wird von LPStartseite aufgerufen wenn LP-Profil geladen ist
    // Lazy import vermeiden — wird extern verdrahtet
  },

  // --- Hash-Router ---

  aktualisiereHash: () => {
    const state = get()
    const hash = bauHash(state)
    if (hash && window.location.hash !== hash) {
      window.history.replaceState(null, '', hash)
    } else if (!hash && window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search)
    }
  },

  navigiereZuHash: (hash: string) => {
    const teile = hash.replace('#/', '').split('/')
    if (teile.length === 0 || !teile[0]) return

    const screen = teile[0]
    if (screen === 'fragensammlung') {
      set({ modus: 'fragensammlung' })
      try { sessionStorage.setItem(MODUS_KEY, 'fragensammlung') } catch { /* ignore */ }
      return
    }
    if (screen === 'pruefung') {
      set({ modus: 'pruefung' })
      try { sessionStorage.setItem(MODUS_KEY, 'pruefung') } catch { /* ignore */ }
      if (teile[1] === 'tracker') {
        set({ listenTab: 'tracker' })
      } else if (teile[1]) {
        // Config-ID → wird von LPStartseite aufgelöst
        set({ aktiveConfigId: teile[1] })
      }
      return
    }
    if (screen === 'uebung') {
      set({ modus: 'uebung' })
      try { sessionStorage.setItem(MODUS_KEY, 'uebung') } catch { /* ignore */ }
      if (teile[1] === 'durchfuehren') set({ uebungsTab: 'durchfuehren' })
      else if (teile[1] === 'analyse') set({ uebungsTab: 'analyse' })
      else if (teile[1]) {
        // Config-ID
        set({ aktiveConfigId: teile[1] })
      }
      return
    }
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
    composerKey: 0,
    ansichtHistory: [],
    breadcrumbs: [],
    aktiveConfigId: null,
  }),
}))
