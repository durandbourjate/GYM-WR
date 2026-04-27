import { create } from 'zustand'
import type { KlassenlistenEintrag } from '../services/klassenlistenApi'
import { apiService } from '../services/apiService'
import {
  getCachedKlassenlisten,
  setCachedKlassenlisten,
  clearKlassenlistenCache,
} from '../services/klassenlistenCache'

type LadeStatus = 'idle' | 'laden' | 'fertig' | 'fehler'

interface KlassenlistenState {
  daten: KlassenlistenEintrag[] | null
  ladeStatus: LadeStatus

  /** Cache-First Laden. opts.force=true bypasst Cache. */
  lade: (email: string, opts?: { force?: boolean }) => Promise<void>
  /** Logout-Cleanup: leert State + IDB-Cache (await wegen Hard-Nav, S149). */
  reset: () => Promise<void>
}

export const useKlassenlistenStore = create<KlassenlistenState>((set) => ({
  daten: null,
  ladeStatus: 'idle',

  lade: async (email, opts) => {
    set({ ladeStatus: 'laden' })
    try {
      let daten: KlassenlistenEintrag[] | null = null
      if (!opts?.force) {
        daten = await getCachedKlassenlisten()
      }
      if (!daten) {
        daten = await apiService.ladeKlassenlisten(email)
        await setCachedKlassenlisten(daten)
      }
      set({ daten, ladeStatus: 'fertig' })
    } catch (err) {
      console.warn('[G.d.2] klassenlistenStore.lade fehlgeschlagen:', err)
      set({ ladeStatus: 'fehler' })
    }
  },

  reset: async () => {
    set({ daten: null, ladeStatus: 'idle' })
    await clearKlassenlistenCache()
  },
}))
