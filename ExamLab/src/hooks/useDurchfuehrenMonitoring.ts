import { useEffect, useState, useCallback, useRef } from 'react'
import { apiService } from '../services/apiService'
import { erstelleDemoMonitoring } from '../data/demoMonitoring'
import { mappeMonitoringResult } from '../utils/durchfuehrenMonitoringMapper'
import type { MonitoringDaten, PruefungsPhase } from '../types/monitoring'

export interface UseDurchfuehrenMonitoringResult {
  daten: MonitoringDaten | null
  ladeStatus: 'laden' | 'fertig' | 'fehler'
  autoRefresh: boolean
  setAutoRefresh: (v: boolean) => void
  zeigeVerbindungsBanner: boolean
  ladeDaten: () => Promise<void>
  resetFuerNeueDurchfuehrung: (pruefungId: string) => void
}

/**
 * Lädt Monitoring-Daten periodisch (5s in Live/Lobby, 15s sonst) per Apps-Script-API.
 * Schützt vor Overlap via AbortController, erkennt Verbindungsfehler nach 3 Misses,
 * mapt Raw-Result zu typisierten MonitoringDaten.
 *
 * Verhalts-Hinweis: Liest `ladeStatus` und `zeigeVerbindungsBanner` per Ref aus
 * `ladeDaten`-Callback heraus. Damit bleibt `ladeDaten` referenziell stabil
 * (Deps nur user/pruefungId/istDemoModus) und Effect E2/E3 re-laufen nicht
 * unnötig — gleichzeitig liest der Callback aktuelle Werte (nicht stale closure
 * wie im Original-Inline-Code, wo `ladeStatus !== 'laden'` permanent false war
 * und der 3-Fehler-Verbindungsbanner faktisch nie aufgepoppt ist).
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

  // Ref-Spiegel für ladeStatus + zeigeVerbindungsBanner, damit ladeDaten
  // referenziell stabil bleibt (Deps reduziert) UND aktuelle Werte sieht.
  const ladeStatusRef = useRef(ladeStatus)
  const zeigeVerbindungsBannerRef = useRef(zeigeVerbindungsBanner)
  useEffect(() => { ladeStatusRef.current = ladeStatus }, [ladeStatus])
  useEffect(() => { zeigeVerbindungsBannerRef.current = zeigeVerbindungsBanner }, [zeigeVerbindungsBanner])

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
    if (!result && !istDemoModus && ladeStatusRef.current !== 'laden') {
      fehlerCountRef.current++
      if (fehlerCountRef.current >= 3) {
        setZeigeVerbindungsBanner(true)
      }
      return
    }
    if (result) {
      fehlerCountRef.current = 0
      if (zeigeVerbindungsBannerRef.current) setZeigeVerbindungsBanner(false)
    }
    const mapped = mappeMonitoringResult(result)
    setDaten(mapped)
    setLadeStatus('fertig')
  }, [user, istDemoModus, pruefungId])

  // Initial-Trigger (E2)
  useEffect(() => { ladeDaten() }, [ladeDaten])

  // Auto-Refresh (E3): 5s in Live/Lobby, 15s sonst
  useEffect(() => {
    if (!autoRefresh || ladeStatus === 'fehler') return
    const intervallMs = (phase === 'aktiv' || phase === 'lobby') ? 5000 : 15000
    const interval = setInterval(ladeDaten, intervallMs)
    return () => clearInterval(interval)
  }, [autoRefresh, ladeStatus, ladeDaten, phase])

  // Reset für 'Neue Durchführung': leerer Snapshot mit neuer pruefungId,
  // bricht in-flight Monitoring-Fetch ab (verhindert Race mit Stale-Result).
  const resetFuerNeueDurchfuehrung = useCallback((pid: string) => {
    monitoringAbortRef.current?.abort()
    fehlerCountRef.current = 0
    setDaten({
      pruefungId: pid,
      pruefungTitel: '',
      gesamtSus: 0,
      schueler: [],
      aktualisiert: new Date().toISOString(),
    })
  }, [])

  return { daten, ladeStatus, autoRefresh, setAutoRefresh, zeigeVerbindungsBanner, ladeDaten, resetFuerNeueDurchfuehrung }
}
