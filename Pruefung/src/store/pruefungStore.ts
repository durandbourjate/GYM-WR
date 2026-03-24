import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Frage } from '../types/fragen.ts'
import type { PruefungsConfig } from '../types/pruefung.ts'
import type { Antwort, Unterbrechung } from '../types/antworten.ts'

export type AppPhase = 'start' | 'pruefung' | 'uebersicht' | 'abgegeben'

interface PruefungState {
  // Prüfungsdaten
  config: PruefungsConfig | null
  fragen: Frage[]

  // Navigation
  aktuelleFrageIndex: number
  phase: AppPhase

  // Antworten
  antworten: Record<string, Antwort>
  markierungen: Record<string, boolean>

  // Status
  startzeit: string | null
  abgegeben: boolean
  verbindungsstatus: 'online' | 'offline' | 'syncing'
  letzterSave: string | null
  autoSaveCount: number

  // Monitoring
  remoteSaveVersion: number
  heartbeats: number
  netzwerkFehler: number
  unterbrechungen: Unterbrechung[]

  // LP-Beenden
  beendetUm: string | null
  restzeitMinuten: number | null

  // Actions
  setAntwort: (frageId: string, antwort: Antwort) => void
  toggleMarkierung: (frageId: string) => void
  navigiere: (index: number) => void
  naechsteFrage: () => void
  vorherigeFrage: () => void
  setPhase: (phase: AppPhase) => void
  pruefungStarten: (config: PruefungsConfig, fragen: Frage[]) => void
  pruefungAbgeben: () => void
  setVerbindungsstatus: (status: 'online' | 'offline' | 'syncing') => void
  setLetzterSave: (timestamp: string) => void
  incrementAutoSaveCount: () => void
  incrementRemoteSaveVersion: () => void
  incrementHeartbeats: () => void
  incrementNetzwerkFehler: () => void
  addUnterbrechung: (unterbrechung: Unterbrechung) => void
  setBeendetUm: (beendetUm: string, restzeitMinuten?: number) => void
  zuruecksetzen: () => void
}

const initialState = {
  config: null,
  fragen: [],
  aktuelleFrageIndex: 0,
  phase: 'start' as AppPhase,
  antworten: {},
  markierungen: {},
  startzeit: null,
  abgegeben: false,
  verbindungsstatus: 'online' as const,
  letzterSave: null,
  autoSaveCount: 0,
  remoteSaveVersion: 0,
  heartbeats: 0,
  netzwerkFehler: 0,
  unterbrechungen: [] as Unterbrechung[],
  beendetUm: null,
  restzeitMinuten: null,
}

export const usePruefungStore = create<PruefungState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setAntwort: (frageId, antwort) =>
        set((state) => ({
          antworten: { ...state.antworten, [frageId]: antwort },
        })),

      toggleMarkierung: (frageId) =>
        set((state) => ({
          markierungen: {
            ...state.markierungen,
            [frageId]: !state.markierungen[frageId],
          },
        })),

      navigiere: (index) => {
        const { fragen } = get()
        if (index >= 0 && index < fragen.length) {
          set({ aktuelleFrageIndex: index })
        }
      },

      naechsteFrage: () => {
        const { aktuelleFrageIndex, fragen } = get()
        if (aktuelleFrageIndex < fragen.length - 1) {
          set({ aktuelleFrageIndex: aktuelleFrageIndex + 1 })
        }
      },

      vorherigeFrage: () => {
        const { aktuelleFrageIndex } = get()
        if (aktuelleFrageIndex > 0) {
          set({ aktuelleFrageIndex: aktuelleFrageIndex - 1 })
        }
      },

      setPhase: (phase) => set({ phase }),

      pruefungStarten: (config, fragen) =>
        set({
          config,
          fragen,
          aktuelleFrageIndex: 0,
          phase: 'pruefung',
          antworten: {},
          markierungen: {},
          startzeit: new Date().toISOString(),
          abgegeben: false,
          autoSaveCount: 0,
          remoteSaveVersion: 0,
          heartbeats: 0,
          netzwerkFehler: 0,
          unterbrechungen: [],
          beendetUm: null,
          restzeitMinuten: null,
        }),

      pruefungAbgeben: () =>
        set({
          abgegeben: true,
          phase: 'abgegeben',
        }),

      setVerbindungsstatus: (status) => set({ verbindungsstatus: status }),
      setLetzterSave: (timestamp) => set({ letzterSave: timestamp }),
      incrementAutoSaveCount: () =>
        set((state) => ({ autoSaveCount: state.autoSaveCount + 1 })),
      incrementRemoteSaveVersion: () =>
        set((state) => ({ remoteSaveVersion: state.remoteSaveVersion + 1 })),
      incrementHeartbeats: () =>
        set((state) => ({ heartbeats: state.heartbeats + 1 })),
      incrementNetzwerkFehler: () =>
        set((state) => ({ netzwerkFehler: state.netzwerkFehler + 1 })),
      addUnterbrechung: (unterbrechung) =>
        set((state) => ({ unterbrechungen: [...state.unterbrechungen, unterbrechung] })),

      setBeendetUm: (beendetUm, restzeitMinuten) =>
        set({ beendetUm, restzeitMinuten: restzeitMinuten ?? null }),

      zuruecksetzen: () => set(initialState),
    }),
    {
      name: 'pruefung-state-' + (new URLSearchParams(window.location.search).get('id') || 'default'),
      version: 3,
      migrate: (persisted, version) => {
        const state = persisted as Record<string, unknown>
        if (version < 2) {
          // v1→v2: config und fragen nicht mehr persistieren (werden vom Backend geladen)
          delete state.config
          delete state.fragen
        }
        if (version < 3) {
          // v2→v3: LP-Beenden Felder
          state.beendetUm = null
          state.restzeitMinuten = null
        }
        return persisted as PruefungState
      },
      partialize: (state) => ({
        aktuelleFrageIndex: state.aktuelleFrageIndex,
        phase: state.phase,
        antworten: state.antworten,
        markierungen: state.markierungen,
        startzeit: state.startzeit,
        abgegeben: state.abgegeben,
        letzterSave: state.letzterSave,
        autoSaveCount: state.autoSaveCount,
        remoteSaveVersion: state.remoteSaveVersion,
        heartbeats: state.heartbeats,
        netzwerkFehler: state.netzwerkFehler,
        unterbrechungen: state.unterbrechungen,
        beendetUm: state.beendetUm,
        restzeitMinuten: state.restzeitMinuten,
      }),
    }
  )
)
