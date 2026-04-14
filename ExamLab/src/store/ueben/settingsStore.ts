import { create } from 'zustand'
import type { GruppenEinstellungen } from '../../types/ueben/settings'
import { defaultEinstellungen } from '../../types/ueben/settings'
import { useUebenGruppenStore } from './gruppenStore'
import { useUebenAuthStore } from './authStore'
import { uebenGruppenAdapter } from '../../adapters/ueben/appsScriptAdapter'

interface UebenSettingsState {
  einstellungen: GruppenEinstellungen | null
  ladeStatus: 'idle' | 'laden' | 'fertig' | 'fehler'
  /** Fehler-Meldung vom letzten Backend-Save (wird in Settings-Tabs angezeigt). */
  saveFehler: string | null
  /** Läuft gerade ein Backend-Save? Für optionalen "Wird gespeichert…"-Indikator. */
  speichertGerade: boolean
  setzeDefaults: (typ: 'gym' | 'familie') => void
  /** Wird nach Backend-Load aufgerufen — persistiert NICHT zurück. */
  setzeEinstellungen: (e: GruppenEinstellungen) => void
  /** LP-Änderung: In-Memory sofort, Backend-Save debounced (500 ms). */
  aktualisiereEinstellungen: (partial: Partial<GruppenEinstellungen>) => void
  /** Bricht laufenden debounced Save ab (z. B. beim Gruppen-Wechsel). */
  abbrecheSave: () => void
  /** Dismisst den Fehler-Banner in den Settings-Tabs. */
  resetSaveFehler: () => void
}

// Modul-lokaler Debounce-State — bewusst ausserhalb des Zustand-States,
// um keine überflüssigen Re-Renders auszulösen.
let saveTimeout: ReturnType<typeof setTimeout> | null = null
const DEBOUNCE_MS = 500

export const useUebenSettingsStore = create<UebenSettingsState>((set, get) => ({
  einstellungen: null,
  ladeStatus: 'idle',
  saveFehler: null,
  speichertGerade: false,

  setzeDefaults: (typ) => {
    set({ einstellungen: defaultEinstellungen(typ), ladeStatus: 'fertig', saveFehler: null })
  },

  setzeEinstellungen: (e) => {
    // Load-Pfad: NICHT persistieren — sonst Endlosschleife.
    set({ einstellungen: e, ladeStatus: 'fertig', saveFehler: null })
  },

  aktualisiereEinstellungen: (partial) => {
    const aktuell = get().einstellungen
    if (!aktuell) return
    const neu = { ...aktuell, ...partial }
    // Optimistic Update — UI reagiert ohne Latenz.
    set({ einstellungen: neu })

    // Debounced Backend-Save: letzter Aufruf in einem 500-ms-Fenster gewinnt.
    if (saveTimeout) clearTimeout(saveTimeout)
    saveTimeout = setTimeout(() => {
      void persistiere(set, get)
    }, DEBOUNCE_MS)
  },

  abbrecheSave: () => {
    if (saveTimeout) {
      clearTimeout(saveTimeout)
      saveTimeout = null
    }
  },

  resetSaveFehler: () => set({ saveFehler: null }),
}))

/**
 * Schreibt den aktuellen Store-State an das Backend. Wird ausschliesslich
 * aus `aktualisiereEinstellungen` (debounced) aufgerufen.
 *
 * Liest Gruppe + User zum Ausführungszeitpunkt (nicht zum Planungszeitpunkt)
 * via `getState()`, damit beim Gruppen-Wechsel nicht die alte Gruppe
 * überschrieben wird (`abbrecheSave` verhindert das zusätzlich).
 */
async function persistiere(
  set: (partial: Partial<UebenSettingsState>) => void,
  get: () => UebenSettingsState,
): Promise<void> {
  const state = get()
  const einstellungen = state.einstellungen
  if (!einstellungen) return

  const { aktiveGruppe } = useUebenGruppenStore.getState()
  const { user } = useUebenAuthStore.getState()
  if (!aktiveGruppe || !user?.email) return

  set({ speichertGerade: true, saveFehler: null })
  try {
    await uebenGruppenAdapter.speichereEinstellungen(aktiveGruppe.id, einstellungen, user.email)
    set({ speichertGerade: false })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unbekannter Fehler'
    console.error('[UebenSettings] Speichern fehlgeschlagen:', err)
    set({ speichertGerade: false, saveFehler: msg })
  }
}
