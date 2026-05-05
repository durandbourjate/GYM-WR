/**
 * Bundle 3 Phase B.4 — useFragenAutoSave
 *
 * Kombiniert dirty-Tracking + draftSync + pflichtfeldValidation.
 * Jeder frage-Wechsel triggert tippeFrage. UI bekommt status für SaveStatusIndikator.
 * `finalisiereVorClose` für Schliessen-Modal (await Server-Sync).
 *
 * Hooks-Order: alle Hooks vor jeglichem early-return — Body-Guards (`if (!frage)`)
 * statt Deklarations-Guards (vgl. Memory-Lehre S130 React-Hooks-vor-Early-Returns).
 */
import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  tippeFrage,
  finalisiere,
  subscribe,
  type DraftSyncState,
} from '../services/draftSync'
import { useAuthStore } from '../store/authStore'
import { validierePflichtfelder } from '@shared/editor/pflichtfeldValidation'
import type { Frage as CoreFrage } from '@shared/types/fragen-core'
import type { Frage } from '../types/fragen-storage'

export type AutoSaveStatus =
  | 'sauber'
  | 'sync-läuft'
  | 'entwurf'
  | 'verbindungsproblem'
  | 'server-down'

export interface UseFragenAutoSaveResult {
  status: AutoSaveStatus
  fehlendePflichtfelder: string[]
  finalisiereVorClose: () => Promise<void>
}

export function useFragenAutoSave(
  _editorId: string,
  frage: Frage | null,
): UseFragenAutoSaveResult {
  const email = useAuthStore(s => s.user?.email ?? null)
  const [syncState, setSyncState] = useState<DraftSyncState>({ status: 'sauber' })

  // Subscribe pro frage.id — bei Wechsel re-subscriben
  useEffect(() => {
    if (!frage) return
    const unsubscribe = subscribe(frage.id, setSyncState)
    return () => {
      unsubscribe()
    }
  }, [frage])

  // Frage-Change → tippeFrage. Editor mutiert frage-Object → ref-equality reicht
  // als Trigger für jeden Tipp.
  useEffect(() => {
    if (!frage || !email) return
    tippeFrage(email, frage)
  }, [frage, email])

  // Pflichtfeld-Validation — null-safe (validierePflichtfelder akzeptiert null).
  // Storage→Core Layer-Boundary: tags ist `(string | Tag)[]` in Storage vs.
  // `string[]` in Core. Pflichtfeld-Validation liest tags nicht → struktur-kompatibel.
  const validation = useMemo(
    () => validierePflichtfelder(frage as unknown as CoreFrage | null /* Defensive: Storage→Core Layer-Boundary, validierePflichtfelder liest tags nicht */),
    [frage],
  )

  const fehlendePflichtfelder = useMemo(
    () => (frage ? validation.pflichtLeerFelder : []),
    [frage, validation.pflichtLeerFelder],
  )

  const status: AutoSaveStatus = useMemo(() => {
    if (!frage) return 'sauber'
    if (syncState.status === 'sync-läuft') return 'sync-läuft'
    if (syncState.status === 'verbindungsproblem') return 'verbindungsproblem'
    if (syncState.status === 'server-down') return 'server-down'
    // syncState.status === 'sauber' | 'entwurf'
    if (!validation.pflichtErfuellt) return 'entwurf'
    return 'sauber'
  }, [frage, syncState.status, validation.pflichtErfuellt])

  const finalisiereVorClose = useCallback((): Promise<void> => {
    if (!frage || !email) return Promise.resolve()
    return finalisiere(email, frage)
  }, [frage, email])

  return { status, fehlendePflichtfelder, finalisiereVorClose }
}
