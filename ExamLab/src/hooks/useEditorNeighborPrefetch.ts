import { useEffect, useRef } from 'react'
import { useFragenbankStore } from '../store/fragenbankStore'
import { PRE_WARM_ENABLED } from '../services/preWarmApi'

const DEBOUNCE_MS = 300

interface NeighborInfo {
  id: string
  fachbereich: string
}

interface Options {
  currentFrageId: string | null
  previous: NeighborInfo | null
  next: NeighborInfo | null
  email: string
}

/**
 * Bundle G.b — Lädt nach 300 ms Debounce die ±1 Nachbar-Fragen ins
 * fragenbankStore.detailCache. Fire-and-forget, fail-silent.
 *
 * Skipping-Bedingungen: PRE_WARM_ENABLED=false, currentFrageId=null, email leer.
 */
export function useEditorNeighborPrefetch({
  currentFrageId,
  previous,
  next,
  email,
}: Options): void {
  const aktuellRef = useRef({ previous, next, email })
  aktuellRef.current = { previous, next, email }

  useEffect(() => {
    if (!PRE_WARM_ENABLED) return
    if (!currentFrageId) return
    if (!email) return

    const timer = setTimeout(() => {
      // previous/next werden aus Ref gelesen, NICHT aus den Effect-Deps:
      // Debounce löst über Zeit aus, nicht über jeden Prop-Wechsel.
      // Das ist Absicht — die useMemo-stabilisierten Werte sind beim Timer-Fire aktuell.
      const { previous: p, next: n, email: e } = aktuellRef.current
      const ladeDetail = useFragenbankStore.getState().ladeDetail
      if (p) void ladeDetail(e, p.id, p.fachbereich)
      if (n) void ladeDetail(e, n.id, n.fachbereich)
    }, DEBOUNCE_MS)

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- previous/next absichtlich via Ref
  }, [currentFrageId, email])
}
