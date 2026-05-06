import { useNavigate } from 'react-router-dom'
import { useCallback } from 'react'

/**
 * Navigation-Hook für SuS-Üben-Bereich.
 * Ersetzt store-basiertes navigate() durch URL-basierte Navigation via React Router.
 */
export function useSuSNavigation() {
  const navigate = useNavigate()

  const openDashboard = useCallback(() => {
    navigate('/sus/ueben')
  }, [navigate])

  const openUebung = useCallback((themaId: string) => {
    navigate(`/sus/ueben/${encodeURIComponent(themaId)}`)
  }, [navigate])

  const openErgebnis = useCallback(() => {
    navigate('/sus/ueben/ergebnis')
  }, [navigate])

  const openAdmin = useCallback(() => {
    navigate('/sus/admin')
  }, [navigate])

  const openGruppenAuswahl = useCallback(() => {
    navigate('/sus/gruppen')
  }, [navigate])

  const openPruefen = useCallback(() => {
    navigate('/sus/pruefen')
  }, [navigate])

  const back = useCallback(() => {
    navigate(-1)
  }, [navigate])

  return {
    openDashboard,
    openUebung,
    openErgebnis,
    openAdmin,
    openGruppenAuswahl,
    openPruefen,
    back,
    navigate,
  }
}
