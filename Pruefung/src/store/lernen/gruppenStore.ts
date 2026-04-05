import { create } from 'zustand'
import type { Gruppe, Mitglied } from '../../types/lernen/gruppen'
import { lernenGruppenAdapter } from '../../adapters/lernen/appsScriptAdapter'

interface LernenGruppenState {
  gruppen: Gruppe[]
  aktiveGruppe: Gruppe | null
  mitglieder: Mitglied[]
  ladeStatus: 'idle' | 'laden' | 'fertig' | 'fehler'

  ladeGruppen: (email: string) => Promise<void>
  waehleGruppe: (gruppeId: string) => Promise<void>
  gruppeAbwaehlen: () => void
  istAdmin: (email: string) => boolean
}

export const useLernenGruppenStore = create<LernenGruppenState>((set, get) => ({
  gruppen: [],
  aktiveGruppe: null,
  mitglieder: [],
  ladeStatus: 'idle',

  ladeGruppen: async (email: string) => {
    set({ ladeStatus: 'laden' })

    try {
      const gruppen = await lernenGruppenAdapter.ladeGruppen(email)
      const aktiveGruppe = gruppen.length === 1 ? gruppen[0] : null

      set({ gruppen, aktiveGruppe, ladeStatus: 'fertig' })

      if (aktiveGruppe) {
        try {
          const mitglieder = await lernenGruppenAdapter.ladeMitglieder(aktiveGruppe.id)
          set({ mitglieder })
        } catch { /* ignorieren */ }
      }
    } catch {
      set({ ladeStatus: 'fehler' })
    }
  },

  waehleGruppe: async (gruppeId: string) => {
    const gruppe = get().gruppen.find(g => g.id === gruppeId)
    if (!gruppe) return

    set({ aktiveGruppe: gruppe })

    const mitglieder = await lernenGruppenAdapter.ladeMitglieder(gruppeId)
    set({ mitglieder })
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
