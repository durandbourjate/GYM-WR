import { create } from 'zustand'
import { type SchulConfig, DEFAULT_SCHUL_CONFIG } from '../types/schulConfig'

interface SchulConfigState {
  config: SchulConfig
  geladen: boolean
  fehler: string | null
  ladeSchulConfig: () => Promise<void>
}

export const useSchulConfig = create<SchulConfigState>((set) => ({
  config: DEFAULT_SCHUL_CONFIG,
  geladen: false,
  fehler: null,

  ladeSchulConfig: async () => {
    try {
      // Vorläufig: Standard-Config direkt verwenden (Backend-Endpoint folgt in Task 7)
      // Zukünftig: fetch vom API-Endpoint
      set({ config: DEFAULT_SCHUL_CONFIG, geladen: true, fehler: null })
    } catch (e) {
      console.warn('SchulConfig Fallback aktiv:', e)
      set({ geladen: true, fehler: String(e) })
    }
  },
}))
