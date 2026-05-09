import { useState, useCallback } from 'react'

export type SpeicherStatus = 'idle' | 'laeuft' | 'gespeichert' | 'fehler'

interface SpeicherStatusResult {
  status: SpeicherStatus
  /**
   * Führt `action` aus, setzt Status auf 'laeuft' davor, 'gespeichert' bei
   * Erfolg (auto-Reset nach 2s) oder 'fehler' bei Misserfolg.
   * Gibt das `boolean`-Ergebnis von `action` zurück.
   */
  speichern: (action: () => Promise<boolean>) => Promise<boolean>
}

/**
 * Shared Status-Hook für Save-Aktionen mit 4 Status-Varianten + 2s
 * Auto-Reset nach Success. Wird von ProfilTab + AdminTab genutzt.
 */
export function useSpeicherStatus(): SpeicherStatusResult {
  const [status, setStatus] = useState<SpeicherStatus>('idle')

  const speichern = useCallback(async (action: () => Promise<boolean>) => {
    setStatus('laeuft')
    const ok = await action()
    setStatus(ok ? 'gespeichert' : 'fehler')
    if (ok) setTimeout(() => setStatus('idle'), 2000)
    return ok
  }, [])

  return { status, speichern }
}
