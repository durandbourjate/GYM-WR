import { useState, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { apiService } from '../services/apiService'
import { erstelleDemoTrackerDaten, aggregiereFragenPerformance } from '../utils/trackerUtils'
import type { FragenPerformance } from '../types/tracker'

/**
 * Lädt aggregierte Fragen-Performance-Stats für den eingeloggten User.
 * Im Demo-Modus oder ohne API-Konfig liefert sofort Demo-Daten.
 *
 * Side-Effect-Aufteilung (Bundle-W.b/Y-Pattern): Hook kapselt State + API + Aggregation.
 */
export function useFragenStats(): Map<string, FragenPerformance> {
  const user = useAuthStore((s) => s.user)
  const istDemoModus = useAuthStore((s) => s.istDemoModus)

  const [fragenStats, setFragenStats] = useState<Map<string, FragenPerformance>>(new Map())

  useEffect(() => {
    async function ladeStats(): Promise<void> {
      if (istDemoModus || !apiService.istKonfiguriert()) {
        setFragenStats(aggregiereFragenPerformance(erstelleDemoTrackerDaten()))
        return
      }
      if (!user) return
      const tracker = await apiService.ladeTrackerDaten(user.email)
      if (tracker) {
        setFragenStats(aggregiereFragenPerformance(tracker))
      }
    }
    ladeStats()
  }, [user, istDemoModus])

  return fragenStats
}
