import { create } from 'zustand'
import type { Gruppe, Mitglied } from '../../types/ueben/gruppen'
import { uebenGruppenAdapter } from '../../adapters/ueben/appsScriptAdapter'

interface UebenGruppenState {
  gruppen: Gruppe[]
  aktiveGruppe: Gruppe | null
  mitglieder: Mitglied[]
  ladeStatus: 'idle' | 'laden' | 'fertig' | 'fehler'

  ladeGruppen: (email: string) => Promise<void>
  waehleGruppe: (gruppeId: string) => Promise<void>
  gruppeAbwaehlen: () => void
  istAdmin: (email: string) => boolean
}

const LETZTE_GRUPPE_KEY = 'ueben-letzte-gruppe-id'

export const useUebenGruppenStore = create<UebenGruppenState>((set, get) => ({
  gruppen: [],
  aktiveGruppe: null,
  mitglieder: [],
  ladeStatus: 'idle',

  ladeGruppen: async (email: string) => {
    set({ ladeStatus: 'laden' })

    try {
      const gruppen = await uebenGruppenAdapter.ladeGruppen(email)

      // Auto-Select: 1 Gruppe → direkt aktiv, sonst letzte Gruppe aus localStorage
      let aktiveGruppe: Gruppe | null = null
      if (gruppen.length === 1) {
        aktiveGruppe = gruppen[0]
      } else if (gruppen.length > 1) {
        try {
          const letzteId = localStorage.getItem(LETZTE_GRUPPE_KEY)
          if (letzteId) {
            aktiveGruppe = gruppen.find(g => g.id === letzteId) || null
          }
        } catch { /* localStorage nicht verfügbar */ }
      }

      set({ gruppen, aktiveGruppe, ladeStatus: 'fertig' })

      if (aktiveGruppe) {
        // Letzte Gruppe merken
        try { localStorage.setItem(LETZTE_GRUPPE_KEY, aktiveGruppe.id) } catch { /* */ }
        try {
          const mitglieder = await uebenGruppenAdapter.ladeMitglieder(aktiveGruppe.id)
          set({ mitglieder })
        } catch (err) {
          console.error('[GruppenStore] Mitglieder laden fehlgeschlagen:', err)
        }
      }
    } catch (err) {
      console.error('[GruppenStore] Gruppen laden fehlgeschlagen:', err)
      set({ ladeStatus: 'fehler' })
    }
  },

  waehleGruppe: async (gruppeId: string) => {
    const gruppe = get().gruppen.find(g => g.id === gruppeId)
    if (!gruppe) return

    set({ aktiveGruppe: gruppe })
    // Letzte Gruppe merken
    try { localStorage.setItem(LETZTE_GRUPPE_KEY, gruppeId) } catch { /* */ }

    try {
      const mitglieder = await uebenGruppenAdapter.ladeMitglieder(gruppeId)
      set({ mitglieder })
    } catch (err) {
      console.error('[GruppenStore] Mitglieder laden bei Gruppenwahl fehlgeschlagen:', err)
    }
  },

  gruppeAbwaehlen: () => {
    set({ aktiveGruppe: null, mitglieder: [] })
  },

  istAdmin: (email: string) => {
    const gruppe = get().aktiveGruppe
    if (!gruppe) return false
    return gruppe.adminEmail.toLowerCase() === email.toLowerCase()
  },
}))
