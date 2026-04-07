import { create } from 'zustand'
import type { ThemenFreischaltung, ThemenStatus, AktivierungsTyp } from '../../types/ueben/themenSichtbarkeit'
import { MAX_AKTIVE_THEMEN } from '../../types/ueben/themenSichtbarkeit'
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

  // Abfragen
  getStatus: (fach: string, thema: string) => ThemenStatus
  getAktiveThemen: () => ThemenFreischaltung[]
  getAbgeschlosseneThemen: () => ThemenFreischaltung[]
  istThemaSichtbar: (fach: string, thema: string) => boolean
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

        if (aktive.length > MAX_AKTIVE_THEMEN) {
          const zuSchliessen = aktive.slice(0, aktive.length - MAX_AKTIVE_THEMEN)
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
}))
