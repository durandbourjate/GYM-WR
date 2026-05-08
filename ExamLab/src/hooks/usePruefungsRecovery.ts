import { useState, useEffect, useRef, useMemo } from 'react'
import { usePruefungStore } from '../store/pruefungStore'
import { useAuthStore } from '../store/authStore'
import { apiService } from '../services/apiService'
import { resolveFragenFuerPruefung } from '../utils/fragenResolver'

export type PruefungsRecoveryStatus = 'idle' | 'loading' | 'failed'

export interface UsePruefungsRecoveryResult {
  status: PruefungsRecoveryStatus
}

const RECOVERY_TIMEOUT_MS = 10_000

/**
 * Recovery-State-Maschine für SuS-Prüfung: lädt config+fragen nach Reload nach,
 * wenn Store leer ist und URL+User die Wiederherstellung erlauben.
 *
 * Side-Effect-Aufteilung (Bundle-W.b-Pattern): Hook macht State + API + Store-Mutation.
 * Reset-Aktion (window.confirm + reset + reload) bleibt im Konsumenten.
 */
export function usePruefungsRecovery(): UsePruefungsRecoveryResult {
  const config = usePruefungStore((s) => s.config)
  const fragen = usePruefungStore((s) => s.fragen)
  const user = useAuthStore((s) => s.user)

  const pruefungIdAusUrl = useMemo(
    () => new URLSearchParams(window.location.search).get('id'),
    [],
  )

  const [status, setStatus] = useState<PruefungsRecoveryStatus>('idle')
  const recoveryAttempted = useRef(false)

  useEffect(() => {
    if (config && fragen.length > 0) return
    if (recoveryAttempted.current) return
    if (!pruefungIdAusUrl || !user?.email) {
      setStatus('failed')
      return
    }

    recoveryAttempted.current = true
    setStatus('loading')

    const timeout = setTimeout(() => {
      setStatus('failed')
    }, RECOVERY_TIMEOUT_MS)

    apiService.ladePruefung(pruefungIdAusUrl, user.email)
      .then((result) => {
        clearTimeout(timeout)
        if (result) {
          const { navigationsFragen, alleFragen: resolvedAlle } =
            resolveFragenFuerPruefung(result.config, result.fragen)
          usePruefungStore.getState().setConfigUndFragen(
            result.config,
            navigationsFragen,
            resolvedAlle,
          )
          if (result.config.durchfuehrungId) {
            usePruefungStore.getState().setDurchfuehrungId(result.config.durchfuehrungId)
          }
          console.log('[Layout] Recovery erfolgreich — config+fragen wiederhergestellt')
        } else {
          setStatus('failed')
        }
      })
      .catch((err) => {
        clearTimeout(timeout)
        console.error('[Layout] Recovery fehlgeschlagen:', err)
        setStatus('failed')
      })

    return () => clearTimeout(timeout)
  }, [config, fragen, pruefungIdAusUrl, user])

  return { status }
}
