// ExamLab/src/hooks/useFragenEditor.ts
import { useState, useEffect, useMemo, useCallback } from 'react'
import { apiService } from '../services/apiService.ts'
import { useFragensammlungStore } from '../store/fragensammlungStore.ts'
import { useFragenAutoSave } from './useFragenAutoSave'
import { useEditorNeighborPrefetch } from './useEditorNeighborPrefetch'
import { tippeFrage as draftSyncTippe, cancelPending as draftSyncCancelPending } from '../services/draftSync'
import { SaveStatusIndikator } from '@shared/index'
import type { Frage, FrageSummary } from '../types/fragen-storage'
import type { Frage as CoreFrage } from '@shared/types/fragen-core'
import type { SpeichernMeta, AutoSaveAdapter } from '@shared/editor/SharedFragenEditor'
import type { SchliessenVariante } from '@shared/index'

interface UseFragenEditorOptions {
  user: { email: string } | null
  istDemoModus: boolean
  alleFragen: (Frage | FrageSummary)[]
  sortierteFragen: (Frage | FrageSummary)[]
  ladeStatus: 'laden' | 'fertig'
  initialEditFrageId?: string
  onFrageAktualisiert?: (frage: Frage) => void
}

interface UseFragenEditorResult {
  zeigEditor: boolean
  editFrage: Frage | null
  detailLaden: boolean
  schliessenModal: SchliessenVariante | null
  autoSaveAdapter: AutoSaveAdapter | undefined
  nachbarCallbacks: { onVor?: () => void; onNach?: () => void }
  oeffnen: (frage: Frage | FrageSummary) => Promise<void>
  oeffnenNeu: () => void
  speichern: (neueFrage: Frage, meta?: SpeichernMeta) => Promise<void>
  abbrechen: () => void
  modalAbbrechen: () => void
  modalEntwurfBehalten: () => void
  modalVerwerfen: () => Promise<void>
}

export function useFragenEditor({ user, istDemoModus, alleFragen, sortierteFragen, ladeStatus, initialEditFrageId, onFrageAktualisiert }: UseFragenEditorOptions): UseFragenEditorResult {
  const [zeigEditor, setZeigEditor] = useState(false)
  const [editFrage, setEditFrage] = useState<Frage | null>(null)
  const [liveFrage, setLiveFrage] = useState<Frage | null>(null)
  const [schliessenModal, setSchliessenModal] = useState<SchliessenVariante | null>(null)
  const [detailLaden, setDetailLaden] = useState(false)

  // liveFrage = editFrage Sync (Bundle 3 P-C.3 hotfix#2)
  useEffect(() => { setLiveFrage(editFrage) }, [editFrage])

  const editorId = `fragenbrowser-${liveFrage?.id ?? 'neu'}`
  const autoSaveState = useFragenAutoSave(editorId, liveFrage)

  /** Detail on-demand laden und Editor öffnen */
  const oeffnen = useCallback(async (frage: Frage | FrageSummary): Promise<void> => {
    const detail = useFragensammlungStore.getState().getDetail(frage.id)
    if (detail) {
      setEditFrage(detail)
      setZeigEditor(true)
      return
    }
    if (user && apiService.istKonfiguriert() && !istDemoModus) {
      setDetailLaden(true)
      const geladen = await useFragensammlungStore.getState().ladeDetail(user.email, frage.id, frage.fachbereich)
      setDetailLaden(false)
      if (geladen) {
        setEditFrage(geladen)
        setZeigEditor(true)
      }
    } else {
      setEditFrage(frage as Frage)
      setZeigEditor(true)
    }
  }, [user, istDemoModus])

  const oeffnenNeu = useCallback((): void => {
    setEditFrage(null)
    setZeigEditor(true)
  }, [])

  const abbrechen = useCallback((): void => {
    setZeigEditor(false)
    setEditFrage(null)
  }, [])

  const speichern = useCallback(async (neueFrage: Frage, meta?: SpeichernMeta): Promise<void> => {
    useFragensammlungStore.getState().aktualisiereFrage(neueFrage)
    setZeigEditor(false)
    setEditFrage(null)

    onFrageAktualisiert?.(neueFrage)

    if (user && apiService.istKonfiguriert() && !istDemoModus) {
      const ok = await apiService.speichereFrage(user.email, neueFrage, meta?.offeneKIFeedbacks)
      if (!ok) {
        console.warn('[useFragenEditor] Frage lokal hinzugefügt, aber Backend-Speichern fehlgeschlagen')
      }
    }
  }, [user, istDemoModus, onFrageAktualisiert])

  // initialEditFrageId-Trigger (heute Z. 168-179)
  useEffect(() => {
    if (ladeStatus !== 'fertig' || !initialEditFrageId) return
    if (editFrage?.id === initialEditFrageId) return
    const frage = alleFragen.find((f) => f.id === initialEditFrageId)
    if (frage) {
      void oeffnen(frage)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps — oeffnen / alleFragen / editFrage sind Snapshot-Reads, deps bleiben minimal
  }, [ladeStatus, initialEditFrageId])

  // Nachbar-Fragen für Editor-Navigation (heute Z. 199-211)
  const nachbarCallbacks = useMemo(() => {
    if (!editFrage) return { onVor: undefined, onNach: undefined }
    const idx = sortierteFragen.findIndex(f => f.id === editFrage.id)
    if (idx < 0) return { onVor: undefined, onNach: undefined }
    const vor = idx > 0 ? sortierteFragen[idx - 1] : null
    const nach = idx < sortierteFragen.length - 1 ? sortierteFragen[idx + 1] : null
    return {
      onVor: vor ? () => void oeffnen(vor as Frage | FrageSummary) : undefined,
      onNach: nach ? () => void oeffnen(nach as Frage | FrageSummary) : undefined,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps — oeffnen ist stabil genug
  }, [editFrage, sortierteFragen])

  // Bundle G.b — ±1 Nachbar-Fragen ins detailCache prefetchen (heute Z. 213-224)
  const nachbarFuerPrefetch = useMemo(() => {
    if (!editFrage) return { previous: null, next: null }
    const idx = sortierteFragen.findIndex((f) => f.id === editFrage.id)
    if (idx < 0) return { previous: null, next: null }
    const prev = idx > 0 ? sortierteFragen[idx - 1] : null
    const nxt = idx < sortierteFragen.length - 1 ? sortierteFragen[idx + 1] : null
    return {
      previous: prev ? { id: prev.id, fachbereich: prev.fachbereich } : null,
      next: nxt ? { id: nxt.id, fachbereich: nxt.fachbereich } : null,
    }
  }, [editFrage, sortierteFragen])

  useEditorNeighborPrefetch({
    currentFrageId: editFrage?.id ?? null,
    previous: nachbarFuerPrefetch.previous,
    next: nachbarFuerPrefetch.next,
    email: user?.email ?? '',
  })

  // Auto-Save-Adapter für SharedFragenEditor (heute Z. 233-277)
  const autoSaveAdapter: AutoSaveAdapter | undefined = useMemo(() => {
    if (istDemoModus || !apiService.istKonfiguriert()) return undefined
    return {
      statusSlot: (
        <SaveStatusIndikator
          status={autoSaveState.status}
          fehlendePflichtfelder={autoSaveState.fehlendePflichtfelder}
        />
      ),
      onTippe: (frage: CoreFrage) => {
        if (!user?.email) return
        const storageFrage = frage as unknown as Frage /* Defensive: Core→Storage Layer-Boundary, draftSync-tippe behandelt Frage opaque */
        // hotfix#2 — liveFrage updaten: useFragenAutoSave subscribed auf liveFrage.id
        setLiveFrage(storageFrage)
        draftSyncTippe(user.email, storageFrage)
      },
      onSchliessenVersuch: async () => {
        if (
          autoSaveState.status === 'sync-läuft' ||
          autoSaveState.status === 'verbindungsproblem' ||
          autoSaveState.status === 'server-down'
        ) {
          setSchliessenModal('sync-pending')
          return { darfSchliessen: false }
        }
        if (autoSaveState.fehlendePflichtfelder.length > 0) {
          setSchliessenModal('unvollstaendig')
          return { darfSchliessen: false }
        }
        return { darfSchliessen: true }
      },
    }
  }, [istDemoModus, autoSaveState.status, autoSaveState.fehlendePflichtfelder, user?.email])

  /** Schliessen-Modal-Handlers */
  const schliessenModalAbschliessen = useCallback((): void => {
    setSchliessenModal(null)
    setZeigEditor(false)
    setEditFrage(null)
  }, [])

  const modalAbbrechen = useCallback((): void => {
    setSchliessenModal(null)
  }, [])

  const modalEntwurfBehalten = useCallback((): void => {
    schliessenModalAbschliessen()
  }, [schliessenModalAbschliessen])

  /** un-delete-Race-Mitigation (Bundle 3 P-C.3 hotfix#5):
   *  draftSyncCancelPending VOR loescheFrage + 2. Cancel NACH (gegen Race mit fresher tippeFrage).
   *  Byte-identisch zu heutiger FragenBrowser.tsx Z. 295-308. */
  const modalVerwerfen = useCallback(async (): Promise<void> => {
    if (schliessenModal === 'unvollstaendig' && liveFrage && user?.email) {
      draftSyncCancelPending(liveFrage.id)
      try {
        await apiService.loescheFrage(user.email, liveFrage.id, liveFrage.fachbereich)
      } catch {
        // Fehler hier nicht-blockierend
      }
      draftSyncCancelPending(liveFrage.id)
    }
    schliessenModalAbschliessen()
  }, [schliessenModal, liveFrage, user?.email, schliessenModalAbschliessen])

  return {
    zeigEditor,
    editFrage,
    detailLaden,
    schliessenModal,
    autoSaveAdapter,
    nachbarCallbacks,
    oeffnen,
    oeffnenNeu,
    speichern,
    abbrechen,
    modalAbbrechen,
    modalEntwurfBehalten,
    modalVerwerfen,
  }
}
