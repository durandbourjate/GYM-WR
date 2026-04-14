import { create } from 'zustand'
import type { ThemenFreischaltung, ThemenStatus, AktivierungsTyp } from '../../types/ueben/themenSichtbarkeit'
import { useUebenSettingsStore } from './settingsStore'
import { uebenThemenSichtbarkeitAdapter } from '../../adapters/ueben/appsScriptAdapter'

interface ThemenSichtbarkeitState {
  freischaltungen: ThemenFreischaltung[]
  ladeStatus: 'idle' | 'laden' | 'fertig' | 'fehler'

  // Laden
  ladeFreischaltungen: (gruppeId: string) => Promise<void>

  // Status setzen
  setzeStatus: (
    gruppeId: string,
    fach: string,
    thema: string,
    status: ThemenStatus,
    aktiviertVon: string,
    typ?: AktivierungsTyp
  ) => Promise<boolean>

  // Unterthemen granular steuern
  setzeUnterthemen: (
    gruppeId: string,
    fach: string,
    thema: string,
    unterthemen: string[] | undefined,
  ) => void

  // Abfragen
  getStatus: (fach: string, thema: string) => ThemenStatus
  getAktiveThemen: () => ThemenFreischaltung[]
  getAbgeschlosseneThemen: () => ThemenFreischaltung[]
  istThemaSichtbar: (fach: string, thema: string) => boolean
  /** Prüft ob ein Unterthema aktiv ist. Wenn keine unterthemen-Einschränkung → immer true */
  istUnterthemaAktiv: (fach: string, thema: string, unterthema: string) => boolean
  /** Gibt die aktiven Unterthemen zurück. undefined = alle */
  getAktiveUnterthemen: (fach: string, thema: string) => string[] | undefined
}

export const useThemenSichtbarkeitStore = create<ThemenSichtbarkeitState>((set, get) => ({
  freischaltungen: [],
  ladeStatus: 'idle',

  ladeFreischaltungen: async (gruppeId: string) => {
    set({ ladeStatus: 'laden' })
    try {
      const daten = await uebenThemenSichtbarkeitAdapter.ladeFreischaltungen(gruppeId)
      set({ freischaltungen: daten, ladeStatus: 'fertig' })
    } catch {
      set({ ladeStatus: 'fehler' })
    }
  },

  setzeStatus: async (gruppeId, fach, thema, status, aktiviertVon, typ = 'manuell') => {
    // Optimistisch: State SOFORT aktualisieren (UI reagiert instant)
    const jetzt = new Date().toISOString()
    set(state => {
      const bestehend = state.freischaltungen.filter(
        f => !(f.fach === fach && f.thema === thema)
      )
      const neuerEintrag: ThemenFreischaltung = {
        fach, thema, status, aktiviertAm: jetzt, aktiviertVon, typ,
      }
      let aktualisiert = [...bestehend, neuerEintrag]

      // FIFO: Überzählige aktive abschliessen
      if (status === 'aktiv') {
        const aktive = aktualisiert
          .filter(f => f.status === 'aktiv')
          .sort((a, b) => a.aktiviertAm.localeCompare(b.aktiviertAm))

        const maxAktive = useUebenSettingsStore.getState().einstellungen?.maxAktiveThemen ?? 5
        if (aktive.length > maxAktive) {
          const zuSchliessen = aktive.slice(0, aktive.length - maxAktive)
          aktualisiert = aktualisiert.map(f => {
            if (zuSchliessen.some(z => z.fach === f.fach && z.thema === f.thema)) {
              return { ...f, status: 'abgeschlossen' as const }
            }
            return f
          })
        }
      }

      return { freischaltungen: aktualisiert }
    })

    // Backend im Hintergrund aktualisieren (Fehler loggen, nicht blockieren)
    uebenThemenSichtbarkeitAdapter.setzeStatus(
      gruppeId, fach, thema, status, aktiviertVon, typ
    ).catch(err => console.warn('[ThemenSichtbarkeit] Backend-Update fehlgeschlagen:', err))

    return true
  },

  setzeUnterthemen: (gruppeId, fach, thema, unterthemen) => {
    set(state => ({
      freischaltungen: state.freischaltungen.map(f =>
        f.fach === fach && f.thema === thema
          ? { ...f, unterthemen }
          : f
      ),
    }))
    // Backend im Hintergrund
    uebenThemenSichtbarkeitAdapter.setzeStatus(
      gruppeId, fach, thema,
      get().getStatus(fach, thema),
      '', 'manuell',
      unterthemen,
    ).catch(err => console.warn('[ThemenSichtbarkeit] Backend-Update Unterthemen fehlgeschlagen:', err))
  },

  getStatus: (fach, thema) => {
    const eintrag = get().freischaltungen.find(
      f => f.fach === fach && f.thema === thema
    )
    return eintrag?.status ?? 'nicht_freigeschaltet'
  },

  getAktiveThemen: () => {
    return get().freischaltungen.filter(f => f.status === 'aktiv')
  },

  getAbgeschlosseneThemen: () => {
    return get().freischaltungen.filter(f => f.status === 'abgeschlossen')
  },

  istThemaSichtbar: (fach, thema) => {
    const status = get().getStatus(fach, thema)
    return status === 'aktiv' || status === 'abgeschlossen'
  },

  istUnterthemaAktiv: (fach, thema, unterthema) => {
    const eintrag = get().freischaltungen.find(f => f.fach === fach && f.thema === thema)
    if (!eintrag || eintrag.status === 'nicht_freigeschaltet') return false
    // Keine Unterthemen-Einschränkung → alle aktiv
    if (!eintrag.unterthemen || eintrag.unterthemen.length === 0) return true
    return eintrag.unterthemen.includes(unterthema)
  },

  getAktiveUnterthemen: (fach, thema) => {
    const eintrag = get().freischaltungen.find(f => f.fach === fach && f.thema === thema)
    return eintrag?.unterthemen
  },
}))
