import { useState, useEffect } from 'react'
import { apiService } from '../services/apiService.ts'
import type { PruefungsNachricht } from '../types/monitoring.ts'

interface UseLPNachrichtenOptions {
  pruefungId: string | undefined
  email: string | undefined
  enabled: boolean
}

/**
 * Pollt LP-Nachrichten für SuS (alle 10s).
 * Gibt die Nachrichten-Liste und eine Funktion zum Schliessen einzelner Nachrichten zurück.
 */
export function useLPNachrichten({ pruefungId, email, enabled }: UseLPNachrichtenOptions) {
  const [nachrichten, setNachrichten] = useState<PruefungsNachricht[]>([])
  const [geschlosseneIds, setGeschlosseneIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!enabled || !pruefungId || !email) return

    async function pollNachrichten() {
      const result = await apiService.ladeNachrichten(pruefungId!, email!)
      if (result.length > 0) {
        setNachrichten(result)
      }
    }

    pollNachrichten()
    const interval = setInterval(pollNachrichten, 10000)
    return () => clearInterval(interval)
  }, [pruefungId, email, enabled])

  const ungelesenNachrichten = nachrichten.filter((n) => !geschlosseneIds.has(n.id))

  const schliesseNachricht = (id: string) => {
    setGeschlosseneIds((prev) => new Set(prev).add(id))
  }

  return { nachrichten, ungelesenNachrichten, schliesseNachricht }
}
