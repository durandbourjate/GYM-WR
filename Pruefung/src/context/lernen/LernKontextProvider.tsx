import { createContext, useEffect, type ReactNode } from 'react'
import { useLernenGruppenStore } from '../../store/lernen/gruppenStore'
import { useLernenSettingsStore } from '../../store/lernen/settingsStore'
import { lernenGruppenAdapter } from '../../adapters/lernen/appsScriptAdapter'
import type { GruppenEinstellungen } from '../../types/lernen/settings'

export interface LernKontext {
  typ: 'gym' | 'familie'
  anrede: 'sie' | 'du'
  feedbackStil: 'sachlich' | 'ermutigend'
  sichtbareFaecher: string[]
  sichtbareThemen: Record<string, string[]>
  fachFarben: Record<string, string>
  einstellungen: GruppenEinstellungen | null
}

const DEFAULT_KONTEXT: LernKontext = {
  typ: 'gym', anrede: 'sie', feedbackStil: 'sachlich',
  sichtbareFaecher: [], sichtbareThemen: {}, fachFarben: {},
  einstellungen: null,
}

export const LernKontextContext = createContext<LernKontext>(DEFAULT_KONTEXT)

export function LernKontextProvider({ children }: { children: ReactNode }) {
  const { aktiveGruppe } = useLernenGruppenStore()
  const { einstellungen, setzeEinstellungen, setzeDefaults } = useLernenSettingsStore()

  // Settings laden wenn Gruppe wechselt
  useEffect(() => {
    if (!aktiveGruppe) return
    let cancelled = false
    lernenGruppenAdapter.ladeEinstellungen(aktiveGruppe.id)
      .then(e => { if (!cancelled) setzeEinstellungen(e) })
      .catch(() => { if (!cancelled) setzeDefaults(aktiveGruppe.typ) })
    return () => { cancelled = true }
  }, [aktiveGruppe, setzeEinstellungen, setzeDefaults])

  const kontext: LernKontext = einstellungen && aktiveGruppe
    ? {
        typ: aktiveGruppe.typ, anrede: einstellungen.anrede,
        feedbackStil: einstellungen.feedbackStil,
        sichtbareFaecher: einstellungen.sichtbareFaecher,
        sichtbareThemen: einstellungen.sichtbareThemen,
        fachFarben: einstellungen.fachFarben, einstellungen,
      }
    : DEFAULT_KONTEXT

  return <LernKontextContext.Provider value={kontext}>{children}</LernKontextContext.Provider>
}
