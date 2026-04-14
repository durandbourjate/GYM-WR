import { useNavigate } from 'react-router-dom'
import { useCallback } from 'react'

/**
 * Navigation-Hook für SuS-Üben-Bereich.
 * Ersetzt store-basiertes navigiere() durch URL-basierte Navigation via React Router.
 */
export function useSuSNavigation() {
  const navigate = useNavigate()

  const zuDashboard = useCallback(() => {
    navigate('/sus/ueben')
  }, [navigate])

  const zuUebung = useCallback((themaId: string) => {
    navigate(`/sus/ueben/${encodeURIComponent(themaId)}`)
  }, [navigate])

  const zuErgebnis = useCallback(() => {
    navigate('/sus/ueben/ergebnis')
  }, [navigate])

  const zuAdmin = useCallback(() => {
    navigate('/sus/admin')
  }, [navigate])

  const zuGruppenAuswahl = useCallback(() => {
    navigate('/sus/gruppen')
  }, [navigate])

  const zuPruefen = useCallback(() => {
    navigate('/sus/pruefen')
  }, [navigate])

  const zurueck = useCallback(() => {
    navigate(-1)
  }, [navigate])

  return {
    zuDashboard,
    zuUebung,
    zuErgebnis,
    zuAdmin,
    zuGruppenAuswahl,
    zuPruefen,
    zurueck,
    navigate,
  }
}
