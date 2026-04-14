import { useNavigate } from 'react-router-dom'
import { useCallback } from 'react'

/**
 * Navigation-Hook für LP-Bereich.
 * Ersetzt die store-basierten navigiereZuComposer/setModus/etc. Aufrufe
 * durch URL-basierte Navigation via React Router.
 */
export function useLPNavigation() {
  const navigate = useNavigate()

  const navigiereZuComposer = useCallback((_titel: string, configId?: string) => {
    // Modus aus URL ableiten (pruefung oder uebung)
    const istUebung = window.location.pathname.includes('/uebung')
    const prefix = istUebung ? '/uebung' : '/pruefung'
    if (configId) {
      navigate(`${prefix}/${configId}`)
    } else {
      // Neue Prüfung/Übung: configId = 'neu'
      navigate(`${prefix}/neu`)
    }
  }, [navigate])

  const zurueckZumDashboard = useCallback(() => {
    // Zum aktuellen Modus-Dashboard zurück (nicht navigate(-1), da Deep Links)
    const istUebung = window.location.pathname.includes('/uebung')
    navigate(istUebung ? '/uebung' : '/pruefung')
  }, [navigate])

  const setModus = useCallback((modus: 'pruefung' | 'uebung' | 'fragensammlung') => {
    const pfade: Record<string, string> = {
      pruefung: '/pruefung',
      uebung: '/uebung',
      fragensammlung: '/fragensammlung',
    }
    navigate(pfade[modus])
  }, [navigate])

  const setListenTab = useCallback((tab: 'pruefungen' | 'tracker') => {
    if (tab === 'tracker') {
      navigate('/pruefung/tracker')
    } else {
      navigate('/pruefung')
    }
  }, [navigate])

  const setUebungsTab = useCallback((tab: 'uebungen' | 'durchfuehren' | 'analyse') => {
    if (tab === 'durchfuehren') navigate('/uebung/durchfuehren')
    else if (tab === 'analyse') navigate('/uebung/analyse')
    else navigate('/uebung')
  }, [navigate])

  const navigiereZuEinstellungen = useCallback((tab?: string) => {
    navigate(tab ? `/einstellungen/${tab}` : '/einstellungen')
  }, [navigate])

  const navigiereZuKorrektur = useCallback((configId: string) => {
    navigate(`/pruefung/${configId}/korrektur`)
  }, [navigate])

  const navigiereZuMonitoring = useCallback((configId: string) => {
    navigate(`/pruefung/${configId}/monitoring`)
  }, [navigate])

  const navigiereZuFrageneditor = useCallback((frageId: string) => {
    navigate(`/fragensammlung/${frageId}`)
  }, [navigate])

  const navigiereZuFavoriten = useCallback(() => {
    navigate('/favoriten')
  }, [navigate])

  return {
    navigiereZuComposer,
    zurueckZumDashboard,
    setModus,
    setListenTab,
    setUebungsTab,
    navigiereZuEinstellungen,
    navigiereZuKorrektur,
    navigiereZuMonitoring,
    navigiereZuFrageneditor,
    navigiereZuFavoriten,
    navigate,
  }
}
