import { create } from 'zustand'
import type { Auftrag } from '../../types/ueben/auftrag'

const STORAGE_KEY = 'ueben-auftraege'

interface UebenAuftragState {
  auftraege: Auftrag[]

  ladeAuftraege: () => void
  erstelleAuftrag: (auftrag: Omit<Auftrag, 'id' | 'erstelltAm'>) => void
  schliesseAuftrag: (id: string) => void
  loescheAuftrag: (id: string) => void
  getAktiveAuftraege: (email: string) => Auftrag[]
}

function speichere(auftraege: Auftrag[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(auftraege))
  } catch { /* localStorage voll */ }
}

export const useUebenAuftragStore = create<UebenAuftragState>((set, get) => ({
  auftraege: [],

  ladeAuftraege: () => {
    try {
      const gespeichert = localStorage.getItem(STORAGE_KEY)
      if (gespeichert) {
        set({ auftraege: JSON.parse(gespeichert) })
      }
    } catch { /* korrupt */ }
  },

  erstelleAuftrag: (daten) => {
    const auftrag: Auftrag = {
      ...daten,
      id: `a_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      erstelltAm: new Date().toISOString(),
    }
    const neu = [...get().auftraege, auftrag]
    set({ auftraege: neu })
    speichere(neu)
  },

  schliesseAuftrag: (id) => {
    const aktualisiert = get().auftraege.map(a =>
      a.id === id ? { ...a, status: 'abgeschlossen' as const } : a
    )
    set({ auftraege: aktualisiert })
    speichere(aktualisiert)
  },

  loescheAuftrag: (id) => {
    const gefiltert = get().auftraege.filter(a => a.id !== id)
    set({ auftraege: gefiltert })
    speichere(gefiltert)
  },

  getAktiveAuftraege: (email) => {
    return get().auftraege.filter(a =>
      a.status === 'aktiv' && a.zielEmail.includes(email)
    )
  },
}))
