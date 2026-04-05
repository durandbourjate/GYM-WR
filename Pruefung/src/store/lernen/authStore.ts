import { create } from 'zustand'
import type { LernenAuthUser, GooglePayload, LernenRolle } from '../../types/lernen/auth'
import { lernenApiClient } from '../../services/lernen/apiClient'

const STORAGE_KEY = 'lernplattform-auth'

interface LernenAuthState {
  user: LernenAuthUser | null
  istAngemeldet: boolean
  ladeStatus: 'idle' | 'laden' | 'fertig' | 'fehler'
  fehler: string | null

  anmeldenMitGoogle: (payload: GooglePayload) => Promise<void>
  anmeldenMitCode: (code: string) => Promise<void>
  sessionWiederherstellen: () => Promise<void>
  abmelden: () => void
  setzeRolle: (rolle: LernenRolle) => void
}

export const useLernenAuthStore = create<LernenAuthState>((set, get) => ({
  user: null,
  istAngemeldet: false,
  ladeStatus: 'idle',
  fehler: null,

  anmeldenMitGoogle: async (payload: GooglePayload) => {
    set({ ladeStatus: 'laden', fehler: null })

    try {
      const response = await lernenApiClient.post<{ success: boolean; data: { sessionToken: string } }>(
        'lernplattformLogin',
        { email: payload.email, name: payload.name }
      )

      const sessionToken = response?.data?.sessionToken || undefined

      const user: LernenAuthUser = {
        email: payload.email,
        name: payload.name || payload.email,
        vorname: payload.given_name || '',
        nachname: payload.family_name || '',
        bild: payload.picture,
        rolle: 'lernend',
        sessionToken,
        loginMethode: 'google',
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
      set({ user, istAngemeldet: true, ladeStatus: 'fertig' })
    } catch {
      set({ ladeStatus: 'fehler', fehler: 'Anmeldung fehlgeschlagen' })
    }
  },

  anmeldenMitCode: async (code: string) => {
    set({ ladeStatus: 'laden', fehler: null })

    try {
      const response = await lernenApiClient.post<{
        success: boolean
        data: { email: string; name: string; sessionToken: string }
        error?: string
      }>('lernplattformCodeLogin', { code })

      if (!response?.success || !response.data) {
        set({ ladeStatus: 'fehler', fehler: response?.error || 'Ungueltiger Code' })
        return
      }

      const { email, name, sessionToken } = response.data
      const user: LernenAuthUser = {
        email,
        name,
        vorname: name.split(' ')[0] || '',
        nachname: name.split(' ').slice(1).join(' ') || '',
        rolle: 'lernend',
        sessionToken,
        loginMethode: 'code',
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
      set({ user, istAngemeldet: true, ladeStatus: 'fertig' })
    } catch {
      set({ ladeStatus: 'fehler', fehler: 'Code-Login fehlgeschlagen' })
    }
  },

  sessionWiederherstellen: async () => {
    const gespeichert = localStorage.getItem(STORAGE_KEY)
    if (!gespeichert) return

    try {
      const user = JSON.parse(gespeichert) as LernenAuthUser
      if (!user.email || !user.sessionToken) {
        localStorage.removeItem(STORAGE_KEY)
        return
      }

      const response = await lernenApiClient.post<{ success: boolean; data: { gueltig: boolean } }>(
        'lernplattformValidiereToken',
        { email: user.email, sessionToken: user.sessionToken }
      )

      if (response?.data?.gueltig) {
        set({ user, istAngemeldet: true, ladeStatus: 'fertig' })
      } else {
        localStorage.removeItem(STORAGE_KEY)
        set({ user: null, istAngemeldet: false })
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY)
    }
  },

  abmelden: () => {
    localStorage.removeItem(STORAGE_KEY)
    set({ user: null, istAngemeldet: false, ladeStatus: 'idle', fehler: null })
  },

  setzeRolle: (rolle: LernenRolle) => {
    const user = get().user
    if (!user) return
    const aktualisiert = { ...user, rolle }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(aktualisiert))
    set({ user: aktualisiert })
  },
}))
