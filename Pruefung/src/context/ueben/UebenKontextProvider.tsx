import { createContext, useEffect, type ReactNode } from 'react'
import { useUebenGruppenStore } from '../../store/ueben/gruppenStore'
import { useUebenSettingsStore } from '../../store/ueben/settingsStore'
import { uebenGruppenAdapter } from '../../adapters/ueben/appsScriptAdapter'
import { setzeFachFarben } from '../../utils/ueben/fachFarben'
import type { GruppenEinstellungen } from '../../types/ueben/settings'

export interface UebenKontext {
  typ: 'gym' | 'familie'
  anrede: 'sie' | 'du'
  feedbackStil: 'sachlich' | 'ermutigend'
  sichtbareFaecher: string[]
  sichtbareThemen: Record<string, string[]>
  fachFarben: Record<string, string>
  einstellungen: GruppenEinstellungen | null
}

const DEFAULT_KONTEXT: UebenKontext = {
  typ: 'gym', anrede: 'sie', feedbackStil: 'sachlich',
  sichtbareFaecher: [], sichtbareThemen: {}, fachFarben: {},
  einstellungen: null,
}

export const UebenKontextContext = createContext<UebenKontext>(DEFAULT_KONTEXT)

export function UebenKontextProvider({ children }: { children: ReactNode }) {
  const { aktiveGruppe } = useUebenGruppenStore()
  const { einstellungen, setzeEinstellungen, setzeDefaults } = useUebenSettingsStore()

  // Settings laden wenn Gruppe wechselt
  useEffect(() => {
    if (!aktiveGruppe) return
    let cancelled = false
    uebenGruppenAdapter.ladeEinstellungen(aktiveGruppe.id)
      .then(e => { if (!cancelled) setzeEinstellungen(e) })
      .catch(() => { if (!cancelled) setzeDefaults(aktiveGruppe.typ) })
    return () => { cancelled = true }
  }, [aktiveGruppe, setzeEinstellungen, setzeDefaults])

  // Fachfarben als CSS Custom Properties setzen
  useEffect(() => {
    if (einstellungen?.fachFarben) setzeFachFarben(einstellungen.fachFarben)
  }, [einstellungen?.fachFarben])

  const kontext: UebenKontext = einstellungen && aktiveGruppe
    ? {
        typ: aktiveGruppe.typ, anrede: einstellungen.anrede,
        feedbackStil: einstellungen.feedbackStil,
        sichtbareFaecher: einstellungen.sichtbareFaecher,
        sichtbareThemen: einstellungen.sichtbareThemen,
        fachFarben: einstellungen.fachFarben, einstellungen,
      }
    : DEFAULT_KONTEXT

  return <UebenKontextContext.Provider value={kontext}>{children}</UebenKontextContext.Provider>
}
