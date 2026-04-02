import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../services/apiClient', () => ({
  apiClient: {
    post: vi.fn(),
    istKonfiguriert: () => true,
  },
}))

import { useAuthStore } from '../store/authStore'
import { apiClient } from '../services/apiClient'

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      istAngemeldet: false,
      ladeStatus: 'idle',
      fehler: null,
    })
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('hat initialen Zustand', () => {
    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.istAngemeldet).toBe(false)
    expect(state.ladeStatus).toBe('idle')
  })

  it('meldet User per Google OAuth an', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({
      success: true,
      data: { sessionToken: 'tok-123' },
    })

    await useAuthStore.getState().anmeldenMitGoogle({
      email: 'kind@gmail.com',
      name: 'Test Kind',
      given_name: 'Test',
      family_name: 'Kind',
      picture: 'https://example.com/pic.jpg',
    })

    const state = useAuthStore.getState()
    expect(state.istAngemeldet).toBe(true)
    expect(state.user?.email).toBe('kind@gmail.com')
    expect(state.user?.rolle).toBe('lernend')
    expect(state.user?.sessionToken).toBe('tok-123')
  })

  it('speichert Session in localStorage', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({
      success: true,
      data: { sessionToken: 'tok-789' },
    })

    await useAuthStore.getState().anmeldenMitGoogle({
      email: 'kind@gmail.com',
      name: 'Test Kind',
      given_name: 'Test',
      family_name: 'Kind',
    })

    const stored = localStorage.getItem('lernplattform-auth')
    expect(stored).toBeTruthy()
    const parsed = JSON.parse(stored!)
    expect(parsed.email).toBe('kind@gmail.com')
  })

  it('stellt Session aus localStorage wieder her', async () => {
    const storedUser = {
      email: 'kind@gmail.com',
      name: 'Test Kind',
      vorname: 'Test',
      nachname: 'Kind',
      rolle: 'lernend',
      sessionToken: 'tok-stored',
      loginMethode: 'google',
    }
    localStorage.setItem('lernplattform-auth', JSON.stringify(storedUser))

    vi.mocked(apiClient.post).mockResolvedValueOnce({
      success: true,
      data: { gueltig: true },
    })

    await useAuthStore.getState().sessionWiederherstellen()

    const state = useAuthStore.getState()
    expect(state.istAngemeldet).toBe(true)
    expect(state.user?.email).toBe('kind@gmail.com')
  })

  it('verwirft ungueltige Session', async () => {
    localStorage.setItem('lernplattform-auth', JSON.stringify({
      email: 'kind@gmail.com',
      sessionToken: 'abgelaufen',
    }))

    vi.mocked(apiClient.post).mockResolvedValueOnce({
      success: true,
      data: { gueltig: false },
    })

    await useAuthStore.getState().sessionWiederherstellen()

    const state = useAuthStore.getState()
    expect(state.istAngemeldet).toBe(false)
    expect(localStorage.getItem('lernplattform-auth')).toBeNull()
  })

  it('meldet User ab und raeumt auf', () => {
    useAuthStore.setState({
      user: { email: 'kind@gmail.com', name: 'Test', vorname: 'Test', nachname: 'Kind', rolle: 'lernend', loginMethode: 'google' },
      istAngemeldet: true,
    })
    localStorage.setItem('lernplattform-auth', '{}')

    useAuthStore.getState().abmelden()

    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.istAngemeldet).toBe(false)
    expect(localStorage.getItem('lernplattform-auth')).toBeNull()
  })
})
