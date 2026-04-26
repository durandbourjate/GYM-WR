import { useEffect, useRef } from 'react'

const NETWORK_TIMEOUT_MS = 5_000

/**
 * Bundle G.a — Generischer fire-and-forget Pre-Warm-Hook.
 *
 * Feuert `apiCall(signal)` bei Mount und bei jedem Dep-Change.
 * Bei Unmount oder Dep-Change: AbortController feuert auf den vorherigen Call.
 * Network-Timeout: 5 s (eigener `setTimeout`, der signal abortet).
 *
 * Verwendung:
 *   usePreWarm(
 *     (signal) => preWarmFragen(fragenIds, gruppeId, 'BWL', signal),
 *     [aktivesFach, lastUsedThema]
 *   )
 */
export function usePreWarm(
  apiCall: (signal: AbortSignal) => Promise<void>,
  deps: React.DependencyList,
): void {
  // Vermeide Stale-Closure: apiCall in Ref halten
  const apiCallRef = useRef(apiCall)
  apiCallRef.current = apiCall

  useEffect(() => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), NETWORK_TIMEOUT_MS)

    void apiCallRef.current(controller.signal).finally(() => {
      clearTimeout(timeoutId)
    })

    return () => {
      clearTimeout(timeoutId)
      controller.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}
