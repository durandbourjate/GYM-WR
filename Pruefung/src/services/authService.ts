// Google Identity Services (GIS) — Typen für globales google-Objekt
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: GsiConfig) => void
          renderButton: (element: HTMLElement, config: GsiButtonConfig) => void
          prompt: () => void
          revoke: (email: string, callback: () => void) => void
          disableAutoSelect: () => void
        }
      }
    }
  }
}

interface GsiConfig {
  client_id: string
  callback: (response: { credential: string }) => void
  auto_select?: boolean
  cancel_on_tap_outside?: boolean
}

interface GsiButtonConfig {
  type: 'standard' | 'icon'
  theme: 'outline' | 'filled_blue' | 'filled_black'
  size: 'large' | 'medium' | 'small'
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin'
  shape?: 'rectangular' | 'pill' | 'circle' | 'square'
  logo_alignment?: 'left' | 'center'
  width?: number
  locale?: string
}

/** Payload aus dem dekodierten Google-JWT */
export interface GooglePayload {
  email: string
  name: string
  given_name?: string
  family_name?: string
  picture?: string
}

/** Client-ID aus Environment-Variable (öffentlich, kein Geheimnis) */
export const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

/** JWT Base64-Payload dekodieren (Signatur wird von Google bereits geprüft) */
function decodeJwt(token: string): Record<string, string> {
  const base64 = token.split('.')[1]
  const json = atob(base64.replace(/-/g, '+').replace(/_/g, '/'))
  return JSON.parse(json)
}

/** Google Identity Services initialisieren */
export function initializeGoogleAuth(
  onSuccess: (payload: GooglePayload) => void,
  onError: (error: string) => void,
): void {
  if (!window.google?.accounts?.id) {
    onError('Google Identity Services nicht geladen. Bitte Seite neu laden.')
    return
  }

  if (!CLIENT_ID) {
    onError('Google Client-ID nicht konfiguriert.')
    return
  }

  window.google.accounts.id.initialize({
    client_id: CLIENT_ID,
    callback: (response) => {
      try {
        const payload = decodeJwt(response.credential)
        onSuccess({
          email: payload.email,
          name: payload.name,
          given_name: payload.given_name,
          family_name: payload.family_name,
          picture: payload.picture,
        })
      } catch {
        onError('Login fehlgeschlagen. Bitte erneut versuchen.')
      }
    },
    auto_select: false,
    cancel_on_tap_outside: true,
  })
}

/** Google Sign-In Button in ein DOM-Element rendern */
export function renderGoogleButton(element: HTMLElement): void {
  if (!window.google?.accounts?.id) return

  window.google.accounts.id.renderButton(element, {
    type: 'standard',
    theme: 'outline',
    size: 'large',
    text: 'signin_with',
    shape: 'rectangular',
    logo_alignment: 'left',
    width: 320,
    locale: 'de',
  })
}

/** Google-Session widerrufen (Logout) */
export function revokeGoogleAuth(email: string): void {
  window.google?.accounts?.id?.revoke(email, () => {
    // Revoked
  })
}
