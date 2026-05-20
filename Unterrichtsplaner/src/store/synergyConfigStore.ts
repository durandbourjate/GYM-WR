import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SynergyConfigState {
  appsScriptUrl: string
  lpEmail: string
  setConfig: (patch: Partial<{ appsScriptUrl: string; lpEmail: string }>) => void
}

export const useSynergyConfigStore = create<SynergyConfigState>()(
  persist(
    (set) => ({
      appsScriptUrl: '',
      lpEmail: '',
      setConfig: (patch) => set(patch),
    }),
    { name: 'synergy-config', version: 1 },
  ),
)

/** Reine Prüfung, ob die Synergy-Config vollständig gesetzt ist. */
export function istSynergyKonfiguriert(state: { appsScriptUrl: string; lpEmail: string }): boolean {
  return state.appsScriptUrl.trim() !== '' && state.lpEmail.trim() !== ''
}

/** Reaktiver Hook: true, sobald URL + E-Mail gesetzt sind. */
export function useSynergyKonfiguriert(): boolean {
  return useSynergyConfigStore(istSynergyKonfiguriert)
}
