import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

interface AuthGuardProps {
  children: React.ReactNode
  erlaubteRolle: 'lp' | 'sus'
}

/**
 * Schützt Routes nach Authentifizierung und Rolle.
 * - Nicht eingeloggt → /login mit returnTo-URL
 * - Falsche Rolle → Redirect zur eigenen Home-Seite
 */
export function AuthGuard({ children, erlaubteRolle }: AuthGuardProps) {
  const user = useAuthStore(s => s.user)
  const location = useLocation()

  // Nicht eingeloggt → Login mit Return-URL
  if (!user) {
    const returnTo = location.pathname + location.search
    return <Navigate to={`/login?returnTo=${encodeURIComponent(returnTo)}`} replace />
  }

  // Rollen-Mismatch → zur eigenen Home
  if (user.rolle !== erlaubteRolle) {
    const home = user.rolle === 'lp' ? '/favoriten' : '/sus'
    return <Navigate to={home} replace />
  }

  return <>{children}</>
}
