import { create } from 'zustand'
import type { UebenAuthUser, GooglePayload, UebenRolle } from '../../types/ueben/auth'
import { uebenApiClient } from '../../services/ueben/apiClient'
import { migriereLernplattformKeys } from '../../utils/ueben/storageMigration'

const STORAGE_KEY = 'ueben-auth'

interface UebenAuthState {
  user: UebenAuthUser | null
  istAngemeldet: boolean
  ladeStatus: 'idle' | 'laden' | 'fertig' | 'fehler'
  fehler: string | null

  anmeldenMitGoogle: (payload: GooglePayload) => Promise<void>
  anmeldenMitCode: (code: string) => Promise<void>
  sessionWiederherstellen: () => Promise<void>
  abmelden: () => void
  setzeRolle: (rolle: UebenRolle) => void
}

export const useUebenAuthStore = create<UebenAuthState>((set, get) => ({
  user: null,
  istAngemeldet: false,
  ladeStatus: 'idle',
  fehler: null,

  anmeldenMitGoogle: async (payload: GooglePayload) => {
    set({ ladeStatus: 'laden', fehler: null })

    try {
      const response = await uebenApiClient.post<{ success: boolean; data: { sessionToken: string } }>(
        'lernplattformLogin',
        { email: payload.email, name: payload.name }
      )

      const sessionToken = response?.data?.sessionToken || undefined

      const user: UebenAuthUser = {
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

  // S157 (Bundle H, 2026-04-28): UI ausgeblendet — Schülercode-Login nicht mehr aktiv.
  // Code für mögliche Re-Aktivierung erhalten. Löschen frühestens nach 4-6 Wochen
  // ohne SuS-Anfragen — siehe Reminder-Plan-Task 12 (Trigger-Datum 2026-06-09).
  anmeldenMitCode: async (code: string) => {
    set({ ladeStatus: 'laden', fehler: null })

    try {
      const response = await uebenApiClient.post<{
        success: boolean
        data: { email: string; name: string; sessionToken: string }
        error?: string
      }>('lernplattformCodeLogin', { code })

      if (!response?.success || !response.data) {
        set({ ladeStatus: 'fehler', fehler: response?.error || 'Ungueltiger Code' })
        return
      }

      const { email, name, sessionToken } = response.data
      const user: UebenAuthUser = {
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
    // Migration: lernplattform-* → ueben-* (einmalig, idempotent)
    migriereLernplattformKeys()

    const gespeichert = localStorage.getItem(STORAGE_KEY)
    if (!gespeichert) return

    try {
      const user = JSON.parse(gespeichert) as UebenAuthUser
      if (!user.email || !user.sessionToken) {
        localStorage.removeItem(STORAGE_KEY)
        return
      }

      // Backend liefert `{success: boolean}` ohne data-Wrapper (apps-script-code.js
      // `lernplattformValidiereToken`). Früher las der Check `response.data.gueltig`
      // — das war IMMER undefined → User wurde bei jedem Session-Restore ausgeloggt.
      const response = await uebenApiClient.post<{ success: boolean }>(
        'lernplattformValidiereToken',
        { email: user.email, sessionToken: user.sessionToken }
      )

      if (response?.success) {
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
    // ladeStatus='fertig' (nicht 'idle'), damit embedded AppUeben korrekt zurücknavigiert
    set({ user: null, istAngemeldet: false, ladeStatus: 'fertig', fehler: null })
  },

  setzeRolle: (rolle: UebenRolle) => {
    const user = get().user
    if (!user) return
    const aktualisiert = { ...user, rolle }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(aktualisiert))
    set({ user: aktualisiert })
  },
}))
