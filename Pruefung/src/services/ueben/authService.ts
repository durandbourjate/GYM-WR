import type { GooglePayload } from '../../types/ueben/auth'

export const LERNEN_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

// Window.google Typ-Deklaration kommt aus services/authService.ts (Pruefung)

/** Wartet bis Google Identity Services geladen ist (max 5 Sekunden) */
function warteAufGSI(): Promise<boolean> {
  if (window.google?.accounts?.id) return Promise.resolve(true)
  return new Promise((resolve) => {
    let versuche = 0
    const interval = setInterval(() => {
      versuche++
      if (window.google?.accounts?.id) {
        clearInterval(interval)
        resolve(true)
      } else if (versuche > 50) { // 50 × 100ms = 5s
        clearInterval(interval)
        resolve(false)
      }
    }, 100)
  })
}

export async function initializeLernenGoogleAuth(
  onSuccess: (payload: GooglePayload) => void,
  onError: (error: string) => void
): Promise<void> {
  if (!LERNEN_CLIENT_ID) {
    onError('VITE_GOOGLE_CLIENT_ID nicht konfiguriert')
    return
  }

  const geladen = await warteAufGSI()
  if (!geladen) {
    onError('Google Identity Services nicht geladen')
    return
  }

  window.google!.accounts.id.initialize({
    client_id: LERNEN_CLIENT_ID,
    callback: (response: { credential?: string }) => {
      if (!response.credential) {
        onError('Kein Credential erhalten')
        return
      }
      const payload = decodeLernenJwt(response.credential)
      if (!payload) {
        onError('JWT konnte nicht dekodiert werden')
        return
      }
      onSuccess(payload)
    },
    auto_select: false,
    cancel_on_tap_outside: true,
  })
}

export async function renderLernenGoogleButton(element: HTMLElement): Promise<void> {
  await warteAufGSI()
  if (!window.google?.accounts?.id) return

  window.google?.accounts.id.renderButton(element, {
    type: 'standard',
    theme: 'outline',
    size: 'large',
    text: 'signin_with',
    shape: 'rectangular',
    width: 320,
    locale: 'de',
  })
}

export function revokeLernenGoogleAuth(email: string): Promise<void> {
  return new Promise((resolve) => {
    if (!window.google?.accounts?.id) {
      resolve()
      return
    }
    window.google.accounts.id.revoke(email, () => resolve())
  })
}

export function decodeLernenJwt(token: string): GooglePayload | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
    return {
      email: payload.email,
      name: payload.name,
      given_name: payload.given_name,
      family_name: payload.family_name,
      picture: payload.picture,
    }
  } catch {
    return null
  }
}
