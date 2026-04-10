import { create } from 'zustand'
import type { Stammdaten, LPProfil } from '../types/stammdaten'
import { DEFAULT_STAMMDATEN } from '../types/stammdaten'
import { postJson } from '../services/apiClient'

interface StammdatenState {
  stammdaten: Stammdaten
  lpProfil: LPProfil | null
  ladeStatus: 'idle' | 'laeuft' | 'fertig' | 'fehler'
  fehler: string | null

  // Actions
  ladeStammdaten: (callerEmail: string) => Promise<void>
  speichereStammdaten: (callerEmail: string, daten: Partial<Stammdaten>) => Promise<boolean>
  ladeLPProfil: (email: string) => Promise<void>
  speichereLPProfil: (profil: LPProfil) => Promise<boolean>
  istAdmin: (email: string | undefined) => boolean
}

export const useStammdatenStore = create<StammdatenState>((set, get) => ({
  stammdaten: DEFAULT_STAMMDATEN,
  lpProfil: null,
  ladeStatus: 'idle',
  fehler: null,

  ladeStammdaten: async (callerEmail: string) => {
    // Nicht doppelt laden
    if (get().ladeStatus === 'laeuft') return
    set({ ladeStatus: 'laeuft', fehler: null })

    try {
      const result = await postJson<{ stammdaten: Stammdaten }>('ladeStammdaten', { callerEmail })
      if (result?.stammdaten) {
        set({ stammdaten: result.stammdaten, ladeStatus: 'fertig' })
      } else {
        // Fallback: Default-Stammdaten verwenden
        set({ ladeStatus: 'fertig' })
      }
    } catch (error) {
      console.error('[Stammdaten] Fehler beim Laden:', error)
      set({ ladeStatus: 'fehler', fehler: 'Stammdaten konnten nicht geladen werden' })
    }
  },

  speichereStammdaten: async (callerEmail: string, daten: Partial<Stammdaten>) => {
    try {
      const result = await postJson<{ success: boolean }>('speichereStammdaten', {
        callerEmail,
        stammdaten: daten,
      })
      if (result?.success) {
        // Lokal aktualisieren
        set(state => ({
          stammdaten: { ...state.stammdaten, ...daten },
        }))
        return true
      }
      return false
    } catch (error) {
      console.error('[Stammdaten] Fehler beim Speichern:', error)
      return false
    }
  },

  ladeLPProfil: async (email: string) => {
    try {
      const result = await postJson<{ profil: LPProfil }>('ladeLPProfil', { callerEmail: email })
      if (result?.profil) {
        set({ lpProfil: result.profil })
      }
    } catch (error) {
      console.error('[Stammdaten] LP-Profil Fehler:', error)
    }
  },

  speichereLPProfil: async (profil: LPProfil) => {
    try {
      const result = await postJson<{ success: boolean }>('speichereLPProfil', {
        callerEmail: profil.email,
        profil,
      })
      if (result?.success) {
        set({ lpProfil: profil })
        return true
      }
      return false
    } catch (error) {
      console.error('[Stammdaten] LP-Profil speichern Fehler:', error)
      return false
    }
  },

  istAdmin: (email: string | undefined) => {
    if (!email) return false
    return get().stammdaten.admins.includes(email.toLowerCase())
  },
}))
