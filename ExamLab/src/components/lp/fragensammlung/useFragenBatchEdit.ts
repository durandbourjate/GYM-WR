/**
 * useFragenBatchEdit — Cluster D Cleanup SP-3 (16.05.2026).
 *
 * Hook kapselt den gesamten Batch-Edit-Workflow für FragenBrowser:
 *  - Pending-Patch + tagsModus (Editor → Confirm-Modal-Zwischenstand)
 *  - Open/Close-State für Batch-Editor, Confirm-Modal und Lösch-Confirm-Modal
 *  - Async-Callbacks für `bulkUpdateFragen` + `bulkLoescheFragen` inkl.
 *    Toast + Store-Reload + leereSelektion
 *
 * Hardening (SP-2 + SP-4):
 *  - `batchLaeuftRef = useRef(false)` als Double-Submit-Guard (statt useState —
 *    kein Re-Render bei Flag-Flip nötig, und Guard greift synchron).
 *  - `mountedRef` schützt vor `setState`-nach-unmount in den beiden async-Pfaden.
 *
 * Abhängigkeiten (alle als Module-Level-Imports, keine Args):
 *  - `useSelektierteIds()` mit useShallow (Memory `feedback_zustand_selector_useshallow.md`)
 *  - `bulkUpdateFragen` / `bulkLoescheFragen` mit Pflicht-email-Param
 *    (Memory `feedback_service_wrapper_email_pflicht.md`)
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { FragenBulkPatch, TagsModus } from '@shared/types/fragen-core'
import { bulkUpdateFragen, bulkLoescheFragen } from '../../../services/fragenBulkApi.ts'
import { useFragenSelectionStore, useSelektierteIds } from '../../../store/fragenSelectionStore.ts'
import { useFragensammlungStore } from '../../../store/fragensammlungStore.ts'
import { useToastStore } from '../../../store/toastStore.ts'

export interface UseFragenBatchEditArgs {
  /** LP-User-Email (Pflicht für Backend-Calls; undefined → Guard-Return). */
  email: string | undefined
  /** IDs der aktuell gefilterten Fragen für sichtbarCount-Memo. */
  gefilterteIds: readonly string[]
}

export interface UseFragenBatchEditResult {
  // ─── States ───
  /** Batch-Editor offen (Frage=null im batchMode). */
  batchEditorOffen: boolean
  setBatchEditorOffen: (v: boolean) => void
  /** Confirm-Modal nach Editor-Save offen. */
  batchConfirmOffen: boolean
  /** Lösch-Confirm-Modal offen. */
  loeschConfirmOffen: boolean
  setLoeschConfirmOffen: (v: boolean) => void
  /** Zwischengespeicherter Patch vom Editor — Input für Confirm-Modal. */
  pendingPatch: FragenBulkPatch | null
  /** Tag-Modus zum Patch — Input für Confirm-Modal. */
  pendingTagsModus: TagsModus

  // ─── Derived ───
  /** Liste der selektierten Frage-IDs (mit useShallow stabil). */
  selektierteIds: readonly string[]
  /** Schnittmenge selektiert ∩ gefilterterer Anzeige — yellow-Warnung-Count. */
  sichtbareSelektierteCount: number

  // ─── Callbacks ───
  /** Editor → onSpeichern via batchMode: Patch + Modus zwischenspeichern + Confirm öffnen. */
  onEditorBatchSave: (patch: FragenBulkPatch, modus: TagsModus) => void
  /** Confirm „Endgültig anwenden" → bulkUpdateFragen + toast + reload + leereSelektion. */
  onBatchUpdateBestaetigen: () => Promise<void>
  /** Lösch-Confirm „Endgültig löschen" → bulkLoescheFragen + toast + reload + leereSelektion. */
  onBatchLoeschen: () => Promise<void>
  /** Confirm „Abbrechen" → Confirm-Modal schliessen + pendingPatch löschen. */
  onAbbrechenConfirm: () => void
  /** Lösch-Confirm „Abbrechen" → loeschConfirm schliessen (Selektion bleibt). */
  onAbbrechenLoesch: () => void
}

/** Kapselt State + Callbacks für den Batch-Edit-Workflow in FragenBrowser.
 *  Siehe Cluster D Spec (Phase 4) für den vollen Flow. */
export function useFragenBatchEdit({
  email,
  gefilterteIds,
}: UseFragenBatchEditArgs): UseFragenBatchEditResult {
  const [batchEditorOffen, setBatchEditorOffen] = useState(false)
  const [loeschConfirmOffen, setLoeschConfirmOffen] = useState(false)
  const [batchConfirmOffen, setBatchConfirmOffen] = useState(false)
  const [pendingPatch, setPendingPatch] = useState<FragenBulkPatch | null>(null)
  const [pendingTagsModus, setPendingTagsModus] = useState<TagsModus>('hinzufuegen')

  const selektierteIds = useSelektierteIds()
  const leereSelektion = useFragenSelectionStore((s) => s.leereSelektion)
  const toastAdd = useToastStore((s) => s.add)

  /** SP-2 (16.05.2026): useRef statt useState — Guard greift synchron im selben Tick,
   *  und Re-Render bei Flag-Flip ist nicht nötig (kein UI-Hook abhängig vom Wert). */
  const batchLaeuftRef = useRef(false)

  /** SP-4 (16.05.2026): mountedRef schützt async-Pfade vor setState-nach-unmount.
   *  AbortController nicht nötig, weil bulkUpdateFragen/bulkLoescheFragen Service-Wrapper sind
   *  (keine direkten fetch-Calls, die wir abbrechen könnten). */
  const mountedRef = useRef(true)
  useEffect(() => () => { mountedRef.current = false }, [])

  // Schnittmenge selektierte ∩ aktueller Filter — für die yellow-Warnung in den Confirm-Modals.
  const sichtbareSelektierteCount = useMemo(() => {
    const setSichtbar = new Set(gefilterteIds)
    return selektierteIds.filter((id) => setSichtbar.has(id)).length
  }, [selektierteIds, gefilterteIds])

  // Editor → Confirm: Patch + Modus zwischenspeichern, Editor schliessen, Confirm öffnen.
  const onEditorBatchSave = useCallback((patch: FragenBulkPatch, modus: TagsModus): void => {
    setPendingPatch(patch)
    setPendingTagsModus(modus)
    setBatchEditorOffen(false)
    setBatchConfirmOffen(true)
  }, [])

  // Confirm-Bestätigt → bulkUpdateFragen + Store-Reload + Toast + Selektion leeren.
  const onBatchUpdateBestaetigen = useCallback(async (): Promise<void> => {
    if (!email || !pendingPatch || batchLaeuftRef.current) return
    batchLaeuftRef.current = true
    try {
      const r = await bulkUpdateFragen([...selektierteIds], pendingPatch, email)
      if (!mountedRef.current) return // SP-4: setState-nach-unmount-Schutz
      // Backend-Return-Shape: { erfolgreich: number, affectedIds: string[], fehlgeschlagen: string[] }
      const fehlText = r.fehlgeschlagen.length > 0 ? `, ${r.fehlgeschlagen.length} fehlgeschlagen` : ''
      toastAdd(r.fehlgeschlagen.length > 0 ? 'warning' : 'success', `${r.erfolgreich} Fragen aktualisiert${fehlText}.`)
      leereSelektion()
      setBatchConfirmOffen(false)
      setPendingPatch(null)
      // force=true erzwingt Reload trotz status='fertig' — ladeAlleDetails-Guard
      // würde sonst skippen und Frontend zeigt Stale-Daten (Bug: 18.05.2026 E2E
      // Cluster E.4.0.5 Item-4-Verifikation).
      await useFragensammlungStore.getState().lade(email, true)
    } catch (e) {
      if (!mountedRef.current) return
      console.error('[useFragenBatchEdit] bulkUpdateFragen failed', e)
      toastAdd('error', `Batch-Update fehlgeschlagen: ${String(e)}`)
    } finally {
      batchLaeuftRef.current = false
    }
  }, [email, pendingPatch, selektierteIds, leereSelektion, toastAdd])

  // Lösch-Confirm-Bestätigt → bulkLoescheFragen + Store-Reload + Toast + Selektion leeren.
  const onBatchLoeschen = useCallback(async (): Promise<void> => {
    if (!email || batchLaeuftRef.current) return
    batchLaeuftRef.current = true
    try {
      const r = await bulkLoescheFragen([...selektierteIds], email)
      if (!mountedRef.current) return // SP-4
      const fehlText = r.fehlgeschlagen.length > 0 ? `, ${r.fehlgeschlagen.length} fehlgeschlagen` : ''
      toastAdd(r.fehlgeschlagen.length > 0 ? 'warning' : 'success', `${r.erfolgreich} Fragen in den Papierkorb verschoben${fehlText}.`)
      leereSelektion()
      setLoeschConfirmOffen(false)
      // force=true: analog onBatchUpdateBestaetigen, sonst zeigt Frontend
      // gelöschte Fragen weiter (ladeAlleDetails-Guard skipt bei status='fertig').
      await useFragensammlungStore.getState().lade(email, true)
    } catch (e) {
      if (!mountedRef.current) return
      console.error('[useFragenBatchEdit] bulkLoescheFragen failed', e)
      toastAdd('error', `Batch-Löschen fehlgeschlagen: ${String(e)}`)
    } finally {
      batchLaeuftRef.current = false
    }
  }, [email, selektierteIds, leereSelektion, toastAdd])

  const onAbbrechenConfirm = useCallback((): void => {
    setBatchConfirmOffen(false)
    setPendingPatch(null)
  }, [])

  const onAbbrechenLoesch = useCallback((): void => {
    setLoeschConfirmOffen(false)
  }, [])

  return {
    batchEditorOffen,
    setBatchEditorOffen,
    batchConfirmOffen,
    loeschConfirmOffen,
    setLoeschConfirmOffen,
    pendingPatch,
    pendingTagsModus,
    selektierteIds,
    sichtbareSelektierteCount,
    onEditorBatchSave,
    onBatchUpdateBestaetigen,
    onBatchLoeschen,
    onAbbrechenConfirm,
    onAbbrechenLoesch,
  }
}
