import { create } from 'zustand'
import type { PruefungsConfig } from '../types/pruefung'

/**
 * Cache-Store für die LP-Configs-Liste (Pruefungen + Uebungen).
 * Befuellt von `useLPDashboardData` nach `ladeAlleConfigs(email)`.
 * Konsumiert von `useSucheIndex` (Cluster C globale Suche) — vermeidet
 * doppelten API-Call gegenueber Hook-lokalem State in useLPDashboardData.
 */
interface ConfigsListState {
  configs: PruefungsConfig[]
  istGeladen: boolean
  setConfigs: (configs: PruefungsConfig[]) => void
  reset: () => void
}

export const useConfigsListStore = create<ConfigsListState>((set) => ({
  configs: [],
  istGeladen: false,
  setConfigs: (configs) => set({ configs, istGeladen: true }),
  reset: () => set({ configs: [], istGeladen: false }),
}))
