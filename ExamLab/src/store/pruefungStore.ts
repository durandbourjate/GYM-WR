import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Frage } from '../types/fragen.ts'
import type { PruefungsConfig } from '../types/pruefung.ts'
import type { Antwort, Unterbrechung } from '../types/antworten.ts'

export type AppPhase = 'start' | 'pruefung' | 'uebersicht' | 'abgegeben'

interface PruefungState {
  // Prüfungsdaten
  config: PruefungsConfig | null
  fragen: Frage[]  // Navigierbare Fragen (ohne Teilaufgaben von Aufgabengruppen)
  alleFragen: Frage[]  // Alle Fragen inkl. Teilaufgaben (für Lookup in AufgabengruppeFrage)

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

  // Durchführungs-ID (erkennt Reset durch LP)
  durchfuehrungId: string | null

  // Multi-Tab-Schutz
  multiTabWarnung: boolean

  // Actions
  setAntwort: (frageId: string, antwort: Antwort) => void
  toggleMarkierung: (frageId: string) => void
  navigiere: (index: number) => void
  naechsteFrage: () => void
  vorherigeFrage: () => void
  setPhase: (phase: AppPhase) => void
  pruefungStarten: (config: PruefungsConfig, fragen: Frage[], alleFragen?: Frage[]) => void
  pruefungAbgeben: () => void
  setVerbindungsstatus: (status: 'online' | 'offline' | 'syncing') => void
  setLetzterSave: (timestamp: string) => void
  incrementAutoSaveCount: () => void
  incrementRemoteSaveVersion: () => void
  incrementHeartbeats: () => void
  incrementNetzwerkFehler: () => void
  addUnterbrechung: (unterbrechung: Unterbrechung) => void
  setBeendetUm: (beendetUm: string, restzeitMinuten?: number) => void
  setDurchfuehrungId: (id: string | null) => void
  setMultiTabWarnung: (warnung: boolean) => void
  setConfigUndFragen: (config: PruefungsConfig, fragen: Frage[], alleFragen?: Frage[]) => void
  zuruecksetzen: () => void
}

const initialState = {
  config: null,
  fragen: [],
  alleFragen: [],
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
  durchfuehrungId: null,
  multiTabWarnung: false,
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

      pruefungStarten: (config, fragen, alleFragen) =>
        set({
          config,
          fragen,
          alleFragen: alleFragen ?? fragen,
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

      setDurchfuehrungId: (id) => set({ durchfuehrungId: id }),

      setMultiTabWarnung: (warnung) => set({ multiTabWarnung: warnung }),

      // Recovery nach Reload: Setzt config+fragen OHNE antworten/markierungen/phase zurückzusetzen
      setConfigUndFragen: (config, fragen, alleFragen) =>
        set({ config, fragen, alleFragen: alleFragen ?? fragen }),

      zuruecksetzen: () => set(initialState),
    }),
    {
      name: 'pruefung-state-' + (new URLSearchParams(window.location.search).get('id') || 'default'),
      version: 4,
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
        if (version < 4) {
          // v3→v4: durchfuehrungId für Reset-Erkennung
          state.durchfuehrungId = null
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
        // heartbeats, netzwerkFehler, unterbrechungen: NICHT persistieren
        // (verhindert Manipulation via DevTools, Werte werden vom Server getrackt)
        beendetUm: state.beendetUm,
        restzeitMinuten: state.restzeitMinuten,
        durchfuehrungId: state.durchfuehrungId,
      }),
    }
  )
)
