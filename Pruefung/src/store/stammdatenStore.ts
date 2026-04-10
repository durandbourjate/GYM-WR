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
        // Backend hat keine Stammdaten → Default-Stammdaten initial befüllen
        console.log('[Stammdaten] Backend leer — befülle mit Defaults')
        set({ ladeStatus: 'fertig' })
        // Fire-and-forget: Defaults ins Backend schreiben (Admins-Guard)
        if (DEFAULT_STAMMDATEN.admins.includes(callerEmail.toLowerCase())) {
          get().speichereStammdaten(callerEmail, DEFAULT_STAMMDATEN).then(ok => {
            if (ok) console.log('[Stammdaten] Defaults erfolgreich ins Backend geschrieben')
          }).catch(() => { /* silent */ })
        }
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
      const result = await postJson<{ success: boolean; error?: string }>('speichereLPProfil', {
        callerEmail: profil.email,
        profil,
      })
      if (result?.success) {
        set({ lpProfil: profil })
        return true
      }
      console.error('[Stammdaten] LP-Profil speichern fehlgeschlagen:', result?.error || 'Unbekannter Fehler')
      set({ fehler: result?.error || 'LP-Profil konnte nicht gespeichert werden' })
      return false
    } catch (error) {
      console.error('[Stammdaten] LP-Profil speichern Fehler:', error)
      set({ fehler: String(error) })
      return false
    }
  },

  istAdmin: (email: string | undefined) => {
    if (!email) return false
    return get().stammdaten.admins.includes(email.toLowerCase())
  },
}))
