/**
 * Bundle 3 Phase B.4 — useDirtyTracker
 *
 * Registriert eine Editor-Instanz beim draftStore + bietet
 * markiereDirty/markiereSauber-Wrapper. Beim Unmount wird abmelde() gerufen.
 *
 * StrictMode-safe: registriere/abmelde im draftStore (B.3) sind idempotent —
 * der Doppel-Mount in React-19-Dev wirkt sich nicht negativ aus.
 */
import { useEffect, useCallback } from 'react'
import { useDraftStore } from '../store/draftStore'

export interface UseDirtyTrackerResult {
  istDirty: boolean
  markiereDirty: () => void
  markiereSauber: () => void
}

export function useDirtyTracker(editorId: string): UseDirtyTrackerResult {
  const istDirty = useDraftStore(s => s.aktiveDrafts.get(editorId)?.istDirty ?? false)
  const registriere = useDraftStore(s => s.registriere)
  const abmelde = useDraftStore(s => s.abmelde)
  const setzeDirty = useDraftStore(s => s.setzeDirty)

  useEffect(() => {
    registriere(editorId)
    return () => {
      abmelde(editorId)
    }
  }, [editorId, registriere, abmelde])

  const markiereDirty = useCallback(() => {
    setzeDirty(editorId, true)
  }, [editorId, setzeDirty])

  const markiereSauber = useCallback(() => {
    setzeDirty(editorId, false)
  }, [editorId, setzeDirty])

  return { istDirty, markiereDirty, markiereSauber }
}
