import { create } from 'zustand'
import type { FragenFortschritt, MasteryStufe, ThemenFortschritt } from '../types/fortschritt'
import type { Frage } from '../types/fragen'
import { aktualisiereFortschritt } from '../utils/mastery'
import { db } from '../utils/indexedDB'

const STORAGE_KEY = 'lernplattform-fortschritt'

interface FortschrittState {
  fortschritte: Record<string, FragenFortschritt>

  antwortVerarbeiten: (fragenId: string, email: string, korrekt: boolean, sessionId: string) => void
  ladeFortschritt: () => Promise<void>
  getMastery: (fragenId: string) => MasteryStufe
  getFortschritt: (fragenId: string) => FragenFortschritt | null
  getThemenFortschritt: (fragen: Frage[]) => ThemenFortschritt
}

function speichereInLocalStorage(fortschritte: Record<string, FragenFortschritt>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fortschritte))
  } catch {
    // localStorage voll — graceful degradation
  }
  // Zusätzlich in IndexedDB speichern (fire-and-forget)
  db.setFortschritt(fortschritte).catch(() => {})
}

export const useFortschrittStore = create<FortschrittState>((set, get) => ({
  fortschritte: {},

  antwortVerarbeiten: (fragenId, email, korrekt, sessionId) => {
    const aktuell = get().fortschritte[fragenId] || {
      fragenId,
      email,
      versuche: 0,
      richtig: 0,
      richtigInFolge: 0,
      sessionIds: [],
      letzterVersuch: '',
      mastery: 'neu' as MasteryStufe,
    }

    const aktualisiert = aktualisiereFortschritt(aktuell, korrekt, sessionId)
    const neueFortschritte = { ...get().fortschritte, [fragenId]: aktualisiert }

    set({ fortschritte: neueFortschritte })
    speichereInLocalStorage(neueFortschritte)
  },

  ladeFortschritt: async () => {
    // IndexedDB zuerst versuchen
    try {
      const idbData = await db.getFortschritt()
      if (idbData && Object.keys(idbData).length > 0) {
        set({ fortschritte: idbData })
        return
      }
    } catch { /* Fallback auf localStorage */ }

    // Fallback: localStorage
    try {
      const gespeichert = localStorage.getItem(STORAGE_KEY)
      if (!gespeichert) return
      const parsed = JSON.parse(gespeichert) as Record<string, FragenFortschritt>
      set({ fortschritte: parsed })
      // Migration zu IndexedDB
      db.setFortschritt(parsed).catch(() => {})
    } catch { /* Korrupte Daten — ignorieren */ }
  },

  getMastery: (fragenId) => {
    return get().fortschritte[fragenId]?.mastery || 'neu'
  },

  getFortschritt: (fragenId) => {
    return get().fortschritte[fragenId] || null
  },

  getThemenFortschritt: (fragen) => {
    if (fragen.length === 0) return { fach: '', thema: '', gesamt: 0, neu: 0, ueben: 0, gefestigt: 0, gemeistert: 0, quote: 0 }

    const fortschritte = get().fortschritte
    let neu = 0, ueben = 0, gefestigt = 0, gemeistert = 0

    for (const f of fragen) {
      const mastery = fortschritte[f.id]?.mastery || 'neu'
      switch (mastery) {
        case 'neu': neu++; break
        case 'ueben': ueben++; break
        case 'gefestigt': gefestigt++; break
        case 'gemeistert': gemeistert++; break
      }
    }

    const gesamt = fragen.length
    const quote = gesamt > 0 ? ((gefestigt + gemeistert) / gesamt) * 100 : 0

    return {
      fach: fragen[0].fach,
      thema: fragen[0].thema,
      gesamt,
      neu,
      ueben,
      gefestigt,
      gemeistert,
      quote,
    }
  },
}))
