import { useEffect, useState, useCallback, useRef } from 'react'
import { apiService } from '../services/apiService'
import { erstelleDemoMonitoring } from '../data/demoMonitoring'
import { mappeMonitoringResult } from '../utils/durchfuehrenMonitoringMapper'
import type { MonitoringDaten } from '../types/monitoring'
import type { PruefungsPhase } from '../types/monitoring'

export interface UseDurchfuehrenMonitoringResult {
  daten: MonitoringDaten | null
  ladeStatus: 'laden' | 'fertig' | 'fehler'
  autoRefresh: boolean
  setAutoRefresh: (v: boolean) => void
  zeigeVerbindungsBanner: boolean
  ladeDaten: () => Promise<void>
}

/**
 * Lädt Monitoring-Daten periodisch (5s in Live/Lobby, 15s sonst) per Apps-Script-API.
 * Schützt vor Overlap via AbortController, erkennt Verbindungsfehler nach 3 Misses,
 * mapt Raw-Result zu typisierten MonitoringDaten.
 *
 * Vorher: inline in DurchfuehrenDashboard.tsx (Z.101-150 + Z.169-241).
 */
export function useDurchfuehrenMonitoring(opts: {
  user: { email: string } | null
  pruefungId: string | null
  istDemoModus: boolean
  phase: PruefungsPhase
}): UseDurchfuehrenMonitoringResult {
  const { user, pruefungId, istDemoModus, phase } = opts

  const [daten, setDaten] = useState<MonitoringDaten | null>(null)
  const [ladeStatus, setLadeStatus] = useState<'laden' | 'fertig' | 'fehler'>('laden')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [zeigeVerbindungsBanner, setZeigeVerbindungsBanner] = useState(false)
  const monitoringAbortRef = useRef<AbortController | null>(null)
  const fehlerCountRef = useRef(0)

  const ladeDaten = useCallback(async () => {
    if (!user) return
    if (istDemoModus || !apiService.istKonfiguriert() || !pruefungId || pruefungId === 'demo') {
      setDaten(erstelleDemoMonitoring())
      setLadeStatus('fertig')
      return
    }
    monitoringAbortRef.current?.abort()
    const controller = new AbortController()
    monitoringAbortRef.current = controller
    const result = await apiService.ladeMonitoring(pruefungId, user.email, { signal: controller.signal })
    if (controller.signal.aborted) return
    if (!result && !istDemoModus && ladeStatus !== 'laden') {
      fehlerCountRef.current++
      if (fehlerCountRef.current >= 3) {
        setZeigeVerbindungsBanner(true)
      }
      return
    }
    if (result) {
      fehlerCountRef.current = 0
      if (zeigeVerbindungsBanner) setZeigeVerbindungsBanner(false)
    }
    const mapped = mappeMonitoringResult(result)
    setDaten(mapped)
    setLadeStatus('fertig')
  }, [user, istDemoModus, pruefungId, ladeStatus, zeigeVerbindungsBanner])

  // Initial-Trigger (E2)
  useEffect(() => { ladeDaten() }, [ladeDaten])

  // Auto-Refresh (E3): 5s in Live/Lobby, 15s sonst
  useEffect(() => {
    if (!autoRefresh || ladeStatus === 'fehler') return
    const intervallMs = (phase === 'aktiv' || phase === 'lobby') ? 5000 : 15000
    const interval = setInterval(ladeDaten, intervallMs)
    return () => clearInterval(interval)
  }, [autoRefresh, ladeStatus, ladeDaten, phase])

  return { daten, ladeStatus, autoRefresh, setAutoRefresh, zeigeVerbindungsBanner, ladeDaten }
}
