/**
 * Bundle 3 Phase B.4 — useDirtyTracker
 *
 * Registriert eine Editor-Instanz beim draftStore + bietet
 * markiereDirty/markiereSauber-Wrapper. Beim Unmount wird unregister() gerufen.
 *
 * StrictMode-safe: register/unregister im draftStore (B.3) sind idempotent —
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
  const register = useDraftStore(s => s.register)
  const unregister = useDraftStore(s => s.unregister)
  const setDirty = useDraftStore(s => s.setDirty)

  useEffect(() => {
    register(editorId)
    return () => {
      unregister(editorId)
    }
  }, [editorId, register, unregister])

  const markiereDirty = useCallback(() => {
    setDirty(editorId, true)
  }, [editorId, setDirty])

  const markiereSauber = useCallback(() => {
    setDirty(editorId, false)
  }, [editorId, setDirty])

  return { istDirty, markiereDirty, markiereSauber }
}
