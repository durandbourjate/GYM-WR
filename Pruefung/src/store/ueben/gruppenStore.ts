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

export const useUebenGruppenStore = create<UebenGruppenState>((set, get) => ({
  gruppen: [],
  aktiveGruppe: null,
  mitglieder: [],
  ladeStatus: 'idle',

  ladeGruppen: async (email: string) => {
    set({ ladeStatus: 'laden' })

    try {
      const gruppen = await uebenGruppenAdapter.ladeGruppen(email)
      const aktiveGruppe = gruppen.length === 1 ? gruppen[0] : null

      set({ gruppen, aktiveGruppe, ladeStatus: 'fertig' })

      if (aktiveGruppe) {
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
