import { create } from 'zustand'
import type { Gruppe, Mitglied } from '../../types/ueben/gruppen'
import { uebenGruppenAdapter } from '../../adapters/ueben/appsScriptAdapter'
import {
  getCachedGruppen, setCachedGruppen,
  getCachedMitglieder, setCachedMitglieder,
  clearGruppenCache,
} from '../../services/gruppenCache'

interface UebenGruppenState {
  gruppen: Gruppe[]
  aktiveGruppe: Gruppe | null
  mitglieder: Mitglied[]
  ladeStatus: 'idle' | 'laden' | 'fertig' | 'fehler'

  ladeGruppen: (email: string, opts?: { force?: boolean }) => Promise<void>
  waehleGruppe: (gruppeId: string) => Promise<void>
  gruppeAbwaehlen: () => void
  istAdmin: (email: string) => boolean
  /** Logout-Cleanup: State leeren + IDB-Cache leeren (await wegen Hard-Nav, S149). */
  reset: () => Promise<void>
}

const LETZTE_GRUPPE_KEY = 'ueben-letzte-gruppe-id'

export const useUebenGruppenStore = create<UebenGruppenState>((set, get) => ({
  gruppen: [],
  aktiveGruppe: null,
  mitglieder: [],
  ladeStatus: 'idle',

  ladeGruppen: async (email: string, opts?: { force?: boolean }) => {
    set({ ladeStatus: 'laden' })

    try {
      // G.d.2 — Cache-First (sofern nicht force)
      let gruppen: Gruppe[] | null = null
      if (!opts?.force) gruppen = await getCachedGruppen()
      if (!gruppen) {
        gruppen = await uebenGruppenAdapter.ladeGruppen(email)
        await setCachedGruppen(gruppen)
      }

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
        try { localStorage.setItem(LETZTE_GRUPPE_KEY, aktiveGruppe.id) } catch { /* */ }
        try {
          // G.d.2 — Cache-First für Mitglieder
          let mitglieder: Mitglied[] | null = null
          if (!opts?.force) mitglieder = await getCachedMitglieder(aktiveGruppe.id)
          if (!mitglieder) {
            mitglieder = await uebenGruppenAdapter.ladeMitglieder(aktiveGruppe.id)
            await setCachedMitglieder(aktiveGruppe.id, mitglieder)
          }
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
    try { localStorage.setItem(LETZTE_GRUPPE_KEY, gruppeId) } catch { /* */ }

    try {
      // G.d.2 — Cache-First für Mitglieder bei Gruppen-Wechsel
      let mitglieder = await getCachedMitglieder(gruppeId)
      if (!mitglieder) {
        mitglieder = await uebenGruppenAdapter.ladeMitglieder(gruppeId)
        await setCachedMitglieder(gruppeId, mitglieder)
      }
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

  reset: async () => {
    set({ gruppen: [], aktiveGruppe: null, mitglieder: [], ladeStatus: 'idle' })
    await clearGruppenCache()
  },
}))
