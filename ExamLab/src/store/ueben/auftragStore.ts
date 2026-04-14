import { create } from 'zustand'
import type { Auftrag } from '../../types/ueben/auftrag'
import { uebenApiClient } from '../../services/ueben/apiClient'

const STORAGE_KEY = 'ueben-auftraege'
const MIGRATION_KEY = 'ueben-auftraege-migriert'

interface UebenAuftragState {
  auftraege: Auftrag[]
  ladeStatus: 'idle' | 'laden' | 'fertig' | 'fehler'

  ladeAuftraege: (gruppeId: string) => Promise<void>
  erstelleAuftrag: (gruppeId: string, auftrag: Omit<Auftrag, 'id' | 'erstelltAm'>) => Promise<void>
  schliesseAuftrag: (gruppeId: string, id: string) => Promise<void>
  loescheAuftrag: (id: string) => void
  getAktiveAuftraege: (email: string) => Auftrag[]
}

function getToken(): string | undefined {
  try {
    const stored = localStorage.getItem('ueben-auth')
    if (!stored) return undefined
    return JSON.parse(stored).sessionToken
  } catch {
    return undefined
  }
}

/**
 * Einmalige Migration: localStorage-Aufträge → Backend.
 * Idempotent — läuft nur wenn der Guard-Key fehlt.
 */
async function migriereLokaleAuftraege(gruppeId: string): Promise<void> {
  try {
    if (localStorage.getItem(MIGRATION_KEY)) return
    const gespeichert = localStorage.getItem(STORAGE_KEY)
    if (!gespeichert) {
      localStorage.setItem(MIGRATION_KEY, 'true')
      return
    }

    const lokale: Auftrag[] = JSON.parse(gespeichert)
    if (lokale.length === 0) {
      localStorage.setItem(MIGRATION_KEY, 'true')
      localStorage.removeItem(STORAGE_KEY)
      return
    }

    console.log(`[Aufträge] Migration: ${lokale.length} lokale Aufträge → Backend`)
    for (const auftrag of lokale) {
      await uebenApiClient.post(
        'lernplattformSpeichereAuftrag',
        { gruppeId, auftrag },
        getToken()
      )
    }

    localStorage.removeItem(STORAGE_KEY)
    localStorage.setItem(MIGRATION_KEY, 'true')
    console.log('[Aufträge] Migration abgeschlossen')
  } catch (err) {
    console.warn('[Aufträge] Migration fehlgeschlagen:', err)
  }
}

export const useUebenAuftragStore = create<UebenAuftragState>((set, get) => ({
  auftraege: [],
  ladeStatus: 'idle',

  ladeAuftraege: async (gruppeId: string) => {
    set({ ladeStatus: 'laden' })

    // Einmalige Migration
    await migriereLokaleAuftraege(gruppeId)

    try {
      const response = await uebenApiClient.post<{ success: boolean; data: Auftrag[] }>(
        'lernplattformLadeAuftraege',
        { gruppeId },
        getToken()
      )
      set({ auftraege: response?.data || [], ladeStatus: 'fertig' })
    } catch {
      set({ ladeStatus: 'fehler' })
    }
  },

  erstelleAuftrag: async (gruppeId, daten) => {
    const auftrag: Auftrag = {
      ...daten,
      id: `a_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      erstelltAm: new Date().toISOString(),
    }

    // Optimistisch im State
    set(state => ({ auftraege: [...state.auftraege, auftrag] }))

    // Backend
    await uebenApiClient.post(
      'lernplattformSpeichereAuftrag',
      { gruppeId, auftrag },
      getToken()
    )
  },

  schliesseAuftrag: async (gruppeId, id) => {
    // Optimistisch
    set(state => ({
      auftraege: state.auftraege.map(a =>
        a.id === id ? { ...a, status: 'abgeschlossen' as const } : a
      ),
    }))

    // Backend
    const auftrag = get().auftraege.find(a => a.id === id)
    if (auftrag) {
      await uebenApiClient.post(
        'lernplattformSpeichereAuftrag',
        { gruppeId, auftrag: { ...auftrag, status: 'abgeschlossen' } },
        getToken()
      )
    }
  },

  loescheAuftrag: (id) => {
    // Nur lokal entfernen (Backend hat keinen Delete-Endpoint — Auftrag bleibt archiviert)
    set(state => ({
      auftraege: state.auftraege.filter(a => a.id !== id),
    }))
  },

  getAktiveAuftraege: (email) => {
    return get().auftraege.filter(a =>
      a.status === 'aktiv' && a.zielEmail.includes(email)
    )
  },
}))
