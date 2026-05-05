import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useFocusTrap } from '../../../hooks/useFocusTrap.ts'
import { useEditorNeighborPrefetch } from '../../../hooks/useEditorNeighborPrefetch'
import { ResizableSidebar } from '@shared/ui/ResizableSidebar'
import { SaveStatusIndikator, SchliessenModal } from '@shared/index'
import type { SchliessenVariante } from '@shared/index'
import { useFragenFilter } from '../../../hooks/useFragenFilter.ts'
import { useAuthStore } from '../../../store/authStore.ts'
import { useFragenbankStore } from '../../../store/fragenbankStore.ts'
import { apiService } from '../../../services/apiService.ts'
import { demoFragen } from '../../../data/demoFragen.ts'
import { typLabel } from '../../../utils/fachUtils.ts'
import { erstelleDemoTrackerDaten, aggregiereFragenPerformance } from '../../../utils/trackerUtils.ts'
import type { Frage, FrageSummary } from '../../../types/fragen-storage'
import type { Frage as CoreFrage } from '@shared/types/fragen-core'
import type { SpeichernMeta, AutoSaveAdapter } from '@shared/editor/SharedFragenEditor'
import type { FragenPerformance } from '../../../types/tracker.ts'
import { useFragenAutoSave } from '../../../hooks/useFragenAutoSave'
import { tippeFrage as draftSyncTippe, cancelPending as draftSyncCancelPending } from '../../../services/draftSync'
import FragenListeSkeleton from '../skeletons/FragenListeSkeleton'
import FragenBrowserHeader from './fragenbrowser/FragenBrowserHeader.tsx'
import VirtualisierteFragenListe from './fragenbrowser/VirtualisierteFragenListe.tsx'
import DraftsSection from './DraftsSection'
import FragenEditor from '../frageneditor/FragenEditor.tsx'
import FragenImport from './FragenImport.tsx'
import ExcelImport from './ExcelImport.tsx'
import BatchExportDialog from '../korrektur/BatchExportDialog.tsx'

interface Props {
  onHinzufuegen: (frageIds: string[]) => void
  onEntfernen?: (frageId: string) => void
  onSchliessen: () => void
  bereitsVerwendet: string[]
  /** Wenn gesetzt, wird der Editor für diese Frage sofort geöffnet */
  initialEditFrageId?: string
  /** Titel der Ziel-Prüfung (für die Ziel-Leiste) */
  zielPruefungTitel?: string
  /** Titel des Ziel-Abschnitts (für die Ziel-Leiste) */
  zielAbschnittTitel?: string
  /** Callback wenn eine Frage erstellt/aktualisiert wird (für fragenMap-Sync) */
  onFrageAktualisiert?: (frage: Frage) => void
  /** Inline-Modus: als reguläre Seitenkomponente statt Overlay rendern */
  inline?: boolean
}

/** Panel zum Durchsuchen und Auswählen von Fragen aus der Fragensammlung (Overlay oder Inline) */
export default function FragenBrowser({ onHinzufuegen, onEntfernen, onSchliessen, bereitsVerwendet, initialEditFrageId, zielPruefungTitel, zielAbschnittTitel, onFrageAktualisiert, inline }: Props) {
  const user = useAuthStore((s) => s.user)
  const istDemoModus = useAuthStore((s) => s.istDemoModus)

  const panelRef = useRef<HTMLDivElement>(null)
  const listeRef = useRef<HTMLDivElement>(null)
  useFocusTrap(panelRef)

  // Header-Höhe messen, damit Overlay unterhalb des Headers beginnt
  const [headerH, setHeaderH] = useState(0)
  useEffect(() => {
    const h = document.querySelector('header')?.getBoundingClientRect()?.height ?? 0
    setHeaderH(h)
  }, [])

  // Fragen aus Store (wird beim Login parallel geladen)
  // Summaries für Listenansicht (schnell geladen), Details on-demand
  const storeSummaries = useFragenbankStore(s => s.summaries)
  const storeFragen = useFragenbankStore(s => s.fragen)
  const storeStatus = useFragenbankStore(s => s.status)

  // Im Demo-Modus Demo-Fragen, sonst Summaries (oder volle Fragen als Fallback)
  const alleFragenMitDrafts = (istDemoModus || !apiService.istKonfiguriert())
    ? demoFragen
    : (storeSummaries.length > 0 ? storeSummaries : storeFragen)
  const ladeStatus = (istDemoModus || !apiService.istKonfiguriert())
    ? 'fertig' as const
    : (storeStatus === 'summary_fertig' || storeStatus === 'detail_laden' || storeStatus === 'fertig' ? 'fertig' as const : 'laden' as const)

  // Bundle 3 P-D — Drafts oben in eigener Sektion, Sammlung getrennt darunter.
  // FrageSummary deklariert `status` nicht statisch; Backend liefert es trotzdem
  // mit (Phase A.4). Defensive Cast: `f as { status?: string }` ist schmal genug.
  const drafts = useMemo<Frage[]>(
    () => alleFragenMitDrafts.filter((f) => (f as { status?: string }).status === 'draft') as Frage[] /* Defensive: Summary hat status zur Laufzeit, Type aber nicht */,
    [alleFragenMitDrafts]
  )
  const alleFragen = useMemo(
    () => alleFragenMitDrafts.filter((f) => (f as { status?: string }).status !== 'draft'),
    [alleFragenMitDrafts]
  )

  // Store-Mutationen
  const { setFragen: setAlleFragen, aktualisiereFrage, entferneFrage, fuegeFragenHinzu } = useFragenbankStore.getState()

  const [fragenStats, setFragenStats] = useState<Map<string, FragenPerformance>>(new Map())

  // Set für schnellen Lookup der bereits verwendeten Fragen
  const bereitsVerwendetSet = useMemo(() => new Set(bereitsVerwendet), [bereitsVerwendet])

  // Editor / Import State
  const [zeigEditor, setZeigEditor] = useState(false)
  const [editFrage, setEditFrage] = useState<Frage | null>(null)
  const [zeigImport, setZeigImport] = useState(false)
  const [zeigExcelImport, setZeigExcelImport] = useState(false)
  const [zeigBatchExport, setZeigBatchExport] = useState(false)
  const [loeschKandidat, setLoeschKandidat] = useState<{ id: string; fachbereich: string; typ: string; fragetext?: string } | null>(null)
  const [detailLaden, setDetailLaden] = useState(false)

  // Bundle 3 P-C.3 — Auto-Save: Status-Hook + Schliessen-Modal-State
  const [schliessenModal, setSchliessenModal] = useState<SchliessenVariante | null>(null)
  // Bundle 3 P-C.3 hotfix#2 — `liveFrage` ist die LIVE-Editor-State-Frage (von onTippe
  // gepflegt), im Gegensatz zu `editFrage` (persistierte Frage beim Open). Hook subscribed
  // auf `liveFrage.id` damit Status-Indikator + Schliessen-Modal-Logik auch bei "Neue
  // Frage" (editFrage=null) funktionieren.
  const [liveFrage, setLiveFrage] = useState<Frage | null>(null)
  useEffect(() => { setLiveFrage(editFrage) }, [editFrage])
  const editorId = `fragenbrowser-${liveFrage?.id ?? 'neu'}`
  const autoSaveState = useFragenAutoSave(editorId, liveFrage)

  // Filter/Sort/Gruppierungs-Hook
  const filter = useFragenFilter(alleFragen, user?.email, ladeStatus, istDemoModus)

  /** Detail on-demand laden und Editor öffnen */
  async function handleEditFrage(frage: Frage | FrageSummary): Promise<void> {
    // Prüfe ob Detail schon im Cache
    const detail = useFragenbankStore.getState().getDetail(frage.id)
    if (detail) {
      setEditFrage(detail)
      setZeigEditor(true)
      return
    }
    // Detail vom Backend laden
    if (user && apiService.istKonfiguriert() && !istDemoModus) {
      setDetailLaden(true)
      const geladen = await useFragenbankStore.getState().ladeDetail(user.email, frage.id, frage.fachbereich)
      setDetailLaden(false)
      if (geladen) {
        setEditFrage(geladen)
        setZeigEditor(true)
      }
    } else {
      // Demo-Modus: Frage ist bereits vollständig
      setEditFrage(frage as Frage)
      setZeigEditor(true)
    }
  }

  // Falls Store noch nicht geladen: Laden anstossen (Fallback)
  useEffect(() => {
    if (!istDemoModus && apiService.istKonfiguriert() && user && storeStatus === 'idle') {
      useFragenbankStore.getState().lade(user.email)
    }
  }, [istDemoModus, user, storeStatus])

  // Tracker-Daten laden für Fragen-Statistiken
  useEffect(() => {
    async function ladeStats(): Promise<void> {
      if (istDemoModus || !apiService.istKonfiguriert()) {
        const demo = erstelleDemoTrackerDaten()
        setFragenStats(aggregiereFragenPerformance(demo))
        return
      }
      if (!user) return
      const tracker = await apiService.ladeTrackerDaten(user.email)
      if (tracker) {
        setFragenStats(aggregiereFragenPerformance(tracker))
      }
    }
    ladeStats()
  }, [user, istDemoModus])

  // Wenn initialEditFrageId gesetzt, Editor öffnen sobald Fragen geladen.
  // Reagiert auch auf nachträglichen Wechsel (z.B. URL-Sync via Globale Suche).
  // Idempotenz-Guard verhindert Reopen wenn Editor schon dieselbe Frage zeigt.
  useEffect(() => {
    if (ladeStatus !== 'fertig' || !initialEditFrageId) return
    if (editFrage?.id === initialEditFrageId) return
    const frage = alleFragen.find((f) => f.id === initialEditFrageId)
    if (frage) {
      handleEditFrage(frage)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps — handleEditFrage / alleFragen / editFrage sind Snapshot-Reads, deps bleiben minimal
  }, [ladeStatus, initialEditFrageId])

  /** Ein Klick: Frage hinzufügen oder entfernen */
  const toggleFrageInPruefung = useCallback((frageId: string): void => {
    if (bereitsVerwendetSet.has(frageId)) {
      onEntfernen?.(frageId)
    } else {
      onHinzufuegen([frageId])
    }
  }, [bereitsVerwendetSet, onEntfernen, onHinzufuegen])

  function toggleGruppe(key: string): void {
    filter.setAufgeklappteGruppen((prev) => {
      const neu = new Set(prev)
      if (neu.has(key)) neu.delete(key)
      else neu.add(key)
      return neu
    })
  }

  // Nachbar-Fragen (vorherige/nächste) für Editor-Navigation
  const nachbarCallbacks = useMemo(() => {
    if (!editFrage) return { onVor: undefined, onNach: undefined }
    const idx = filter.sortierteFragen.findIndex(f => f.id === editFrage.id)
    if (idx < 0) return { onVor: undefined, onNach: undefined }
    const vor = idx > 0 ? filter.sortierteFragen[idx - 1] : null
    const nach = idx < filter.sortierteFragen.length - 1 ? filter.sortierteFragen[idx + 1] : null
    return {
      onVor: vor ? () => handleEditFrage(vor as Frage | FrageSummary) : undefined,
      onNach: nach ? () => handleEditFrage(nach as Frage | FrageSummary) : undefined,
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps — handleEditFrage ist stabil genug
  }, [editFrage, filter.sortierteFragen])

  // Bundle G.b — ±1 Nachbar-Fragen ins detailCache prefetchen
  const nachbarFuerPrefetch = useMemo(() => {
    if (!editFrage) return { previous: null, next: null }
    const idx = filter.sortierteFragen.findIndex((f) => f.id === editFrage.id)
    if (idx < 0) return { previous: null, next: null }
    const prev = idx > 0 ? filter.sortierteFragen[idx - 1] : null
    const nxt = idx < filter.sortierteFragen.length - 1 ? filter.sortierteFragen[idx + 1] : null
    return {
      previous: prev ? { id: prev.id, fachbereich: prev.fachbereich } : null,
      next: nxt ? { id: nxt.id, fachbereich: nxt.fachbereich } : null,
    }
  }, [editFrage, filter.sortierteFragen])

  useEditorNeighborPrefetch({
    currentFrageId: editFrage?.id ?? null,
    previous: nachbarFuerPrefetch.previous,
    next: nachbarFuerPrefetch.next,
    email: user?.email ?? '',
  })

  // Bundle 3 P-C.3 — Auto-Save-Adapter für SharedFragenEditor
  // - statusSlot: SaveStatusIndikator mit live-Status aus useFragenAutoSave
  // - onTippe: Editor-Preview an draftSync weitergeben (Hook-Bridge: Editor lebt in shared, Hook + draftSync in ExamLab)
  // - onSchliessenVersuch: Pflichtfeld-leer ODER sync pending → Modal öffnen, sonst silent close
  const autoSaveAdapter: AutoSaveAdapter | undefined = useMemo(() => {
    // Demo-Modus: kein Auto-Save, klassischer Save-Flow (Backend nicht erreichbar)
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
        // Core→Storage Layer-Boundary: tippeFrage akzeptiert Storage.Frage; Core ist
        // strukturell kompatibel (tippeFrage liest nur id/fachbereich/typ + speichert volles Objekt).
        const storageFrage = frage as unknown as Frage /* Defensive: Core→Storage Layer-Boundary, draftSync-tippe behandelt Frage opaque */
        // Bundle 3 P-C.3 hotfix#2 — liveFrage updaten: useFragenAutoSave subscribed auf
        // liveFrage.id, daher MUSS jeder Tipp den Hook-Input synchronisieren (sonst
        // bleibt Status-Indikator auf 'sauber'-Default).
        setLiveFrage(storageFrage)
        draftSyncTippe(user.email, storageFrage)
      },
      onSchliessenVersuch: async () => {
        // Sync läuft / Verbindungsproblem / Server-down → Modal "sync-pending"
        if (
          autoSaveState.status === 'sync-läuft' ||
          autoSaveState.status === 'verbindungsproblem' ||
          autoSaveState.status === 'server-down'
        ) {
          setSchliessenModal('sync-pending')
          return { darfSchliessen: false }
        }
        // Pflichtfelder leer → Modal "unvollstaendig"
        if (autoSaveState.fehlendePflichtfelder.length > 0) {
          setSchliessenModal('unvollstaendig')
          return { darfSchliessen: false }
        }
        // Sauber → silent close
        return { darfSchliessen: true }
      },
    }
  }, [istDemoModus, autoSaveState.status, autoSaveState.fehlendePflichtfelder, user?.email])

  /** Bundle 3 P-C.3 — Schliessen-Modal-Handler */
  const schliessenModalAbschliessen = useCallback((): void => {
    setSchliessenModal(null)
    setZeigEditor(false)
    setEditFrage(null)
  }, [])

  const schliessenModalEntwurfBehalten = useCallback((): void => {
    // "Als Entwurf behalten" = Frage bleibt im draftStore, Editor schliesst
    schliessenModalAbschliessen()
  }, [schliessenModalAbschliessen])

  const schliessenModalVerwerfen = useCallback(async (): Promise<void> => {
    // Bundle 3 P-C.3 hotfix#3+5 — Verwerfen-Semantik je nach Variante:
    // - 'unvollstaendig' → soft-delete (Frage in Papierkorb verschieben, Plan F.4#6)
    // - 'sync-pending'  → einfach schliessen (User akzeptiert Datenverlust)
    if (schliessenModal === 'unvollstaendig' && liveFrage && user?.email) {
      // hotfix#5 — cancel pending IDB+Server-Timer VOR loescheFrage. Ohne diesen Cancel
      // räumt der pending 10s-Server-Sync nach loescheFrage die geloescht_am-Spalte
      // wieder leer (un-delete-Race). 2. Cancel NACH await: falls während des Server-
      // Roundtrips eine neue tippeFrage einen frischen Timer scheduled hat.
      draftSyncCancelPending(liveFrage.id)
      try {
        await apiService.loescheFrage(user.email, liveFrage.id, liveFrage.fachbereich)
      } catch {
        // Fehler hier nicht-blockierend — User schliesst trotzdem; Frage bleibt
        // im Backend (sammlung/draft), kann später manuell gelöscht werden.
      }
      draftSyncCancelPending(liveFrage.id)
    }
    schliessenModalAbschliessen()
  }, [schliessenModal, liveFrage, user?.email, schliessenModalAbschliessen])

  async function handleFrageGespeichert(neueFrage: Frage, meta?: SpeichernMeta): Promise<void> {
    aktualisiereFrage(neueFrage)
    setZeigEditor(false)
    setEditFrage(null)

    // fragenMap im Composer synchronisieren
    onFrageAktualisiert?.(neueFrage)

    // Ans Backend senden (im Hintergrund) — offeneKIFeedbacks für Kalibrierungs-Loop mitschicken
    if (user && apiService.istKonfiguriert() && !istDemoModus) {
      const ok = await apiService.speichereFrage(user.email, neueFrage, meta?.offeneKIFeedbacks)
      if (!ok) {
        console.warn('[FragenBrowser] Frage lokal hinzugefügt, aber Backend-Speichern fehlgeschlagen')
      }
    }
  }

  async function handleImportFragen(importierteFragen: Frage[]): Promise<void> {
    fuegeFragenHinzu(importierteFragen)
    setZeigImport(false)

    // fragenMap im Composer synchronisieren
    for (const frage of importierteFragen) {
      onFrageAktualisiert?.(frage)
    }

    // Ans Backend senden (im Hintergrund)
    if (user && apiService.istKonfiguriert() && !istDemoModus) {
      for (const frage of importierteFragen) {
        const ok = await apiService.speichereFrage(user.email, frage)
        if (!ok) {
          console.warn(`[FragenBrowser] Import: Backend-Speichern fehlgeschlagen für ${frage.id}`)
        }
      }
    }
  }

  async function handleFrageDuplizieren(frage: Frage | FrageSummary): Promise<void> {
    if (!user) return

    if (istDemoModus || !apiService.istKonfiguriert()) {
      // Demo: Lokale Kopie erstellen — braucht volle Frage
      const detail = useFragenbankStore.getState().getDetail(frage.id)
      if (detail) {
        const kopie = { ...structuredClone(detail), id: `kopie-${Date.now()}`, autor: user.email } as Frage
        fuegeFragenHinzu([kopie])
      }
      return
    }

    const neueId = await apiService.dupliziereFrage(user.email, frage.id)
    if (neueId) {
      // Fragenbank neu laden um die Kopie anzuzeigen
      await useFragenbankStore.getState().lade(user.email, true)
    }
  }

  /** Öffnet Lösch-Dialog für eine Frage (DetailKarte-Trash-Klick). */
  const handleFrageLoeschKandidat = useCallback((frage: Frage | FrageSummary): void => {
    setLoeschKandidat({
      id: frage.id,
      fachbereich: frage.fachbereich,
      typ: frage.typ,
      fragetext: 'fragetext' in frage ? (frage as { fragetext: string }).fragetext : '',
    })
  }, [])

  async function handleFrageLoeschen(): Promise<void> {
    if (!loeschKandidat) return
    entferneFrage(loeschKandidat.id)
    const frage = loeschKandidat
    setLoeschKandidat(null)
    if (user && apiService.istKonfiguriert() && !istDemoModus) {
      const ok = await apiService.loescheFrage(user.email, frage.id, frage.fachbereich)
      if (!ok) {
        console.warn('[FragenBrowser] Frage lokal gelöscht, aber Backend-Löschen fehlgeschlagen')
      }
    }
  }

  // Inline-Modus: als reguläre Seitenkomponente rendern (kein Overlay)
  if (inline) {
    return (
      // flex-1 + min-h-0: Container wächst auf verfügbare Höhe im flex-column-Parent
      // → die virtualisierte Liste bekommt eine endliche Höhe und scrollt selbst.
      <div className="flex-1 min-h-0 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">
        {/* Header mit Suche + Filter */}
        <FragenBrowserHeader
          ladeStatus={ladeStatus}
          gefilterteFragen={filter.gefilterteFragen}
          stats={filter.stats}
          alleStats={filter.alleStats}
          verfuegbareThemen={filter.verfuegbareThemen}
          verfuegbareUnterthemen={filter.verfuegbareUnterthemen}
          aktiveFilter={filter.aktiveFilter}
          suchtext={filter.suchtext}
          setSuchtext={filter.setSuchtext}
          filterFachbereich={filter.filterFachbereich}
          setFilterFachbereich={filter.setFilterFachbereich}
          filterTyp={filter.filterTyp}
          setFilterTyp={filter.setFilterTyp}
          filterBloom={filter.filterBloom}
          setFilterBloom={filter.setFilterBloom}
          filterThema={filter.filterThema}
          setFilterThema={filter.setFilterThema}
          filterUnterthema={filter.filterUnterthema}
          setFilterUnterthema={filter.setFilterUnterthema}
          filterPoolStatus={filter.filterPoolStatus}
          setFilterPoolStatus={filter.setFilterPoolStatus}
          filterMitAnhang={filter.filterMitAnhang}
          setFilterMitAnhang={filter.setFilterMitAnhang}
          filterKontext={filter.filterKontext}
          setFilterKontext={filter.setFilterKontext}
          filterZuruecksetzen={filter.filterZuruecksetzen}
          sortierung={filter.sortierung}
          setSortierung={filter.setSortierung}
          gruppierung={filter.gruppierung}
          setGruppierung={filter.setGruppierung}
          setAufgeklappteGruppen={filter.setAufgeklappteGruppen}
          kompaktModus={filter.kompaktModus}
          setKompaktModus={filter.setKompaktModus}
          onNeueFrageErstellen={() => { setEditFrage(null); setZeigEditor(true) }}
          onBatchExport={() => setZeigBatchExport(true)}
          onImport={() => setZeigImport(true)}
          onExcelImport={() => setZeigExcelImport(true)}
          onSchliessen={onSchliessen}
          inline
          listeRef={listeRef}
        />

        {/* Bundle 3 P-D — Drafts-Sektion oberhalb der Sammlung */}
        {ladeStatus === 'fertig' && (
          <DraftsSection
            drafts={drafts}
            onClickDraft={(frage) => handleEditFrage(frage)}
            ownEmail={user?.email ?? ''}
          />
        )}

        {/* Fragen-Liste — Wrapper ohne eigenen Scroll; virtualisierte Liste scrollt selbst und teilt ihren Container per `scrollContainerRef={listeRef}` für Wheel-Forwarding aus dem Header. min-h-0 erlaubt flex-1 zu schrumpfen, damit die innere h-full-Liste eine endliche Höhe bekommt. */}
        <div className="flex-1 min-h-0 relative overflow-hidden">
          {ladeStatus === 'laden' && <FragenListeSkeleton />}

          {/* Detail-Lade-Overlay */}
          {detailLaden && (
            <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 z-10 flex items-center justify-center">
              <p className="text-sm text-slate-500 dark:text-slate-400">Frage wird geladen...</p>
            </div>
          )}

          {ladeStatus === 'fertig' && filter.gefilterteFragen.length === 0 && (
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">
              Keine Fragen gefunden.
            </p>
          )}

          {ladeStatus === 'fertig' && filter.gefilterteFragen.length > 0 && (
            <VirtualisierteFragenListe
              gruppierteAnzeige={filter.gruppierteAnzeige}
              gruppierung={filter.gruppierung}
              aufgeklappteGruppen={filter.aufgeklappteGruppen}
              kompaktModus={filter.kompaktModus}
              bereitsVerwendetSet={bereitsVerwendetSet}
              fragenStats={fragenStats}
              toggleGruppe={toggleGruppe}
              toggleFrageInPruefung={toggleFrageInPruefung}
              handleEditFrage={handleEditFrage}
              handleFrageDuplizieren={handleFrageDuplizieren}
              handleFrageLoeschen={handleFrageLoeschKandidat}
              scrollResetTrigger={`${filter.suchtext}|${filter.gruppierung}|${filter.gefilterteFragen.length}`}
              scrollContainerRef={listeRef}
            />
          )}
        </div>

        {/* Fragen-Editor Overlay */}
        {zeigEditor && (
          <FragenEditor
            key={editFrage?.id ?? 'neu'}
            frage={editFrage}
            onSpeichern={handleFrageGespeichert}
            onAbbrechen={() => { setZeigEditor(false); setEditFrage(null) }}
            performance={editFrage ? fragenStats.get(editFrage.id) : undefined}
            onVorherigeFrage={nachbarCallbacks.onVor}
            onNaechsteFrage={nachbarCallbacks.onNach}
            autoSave={autoSaveAdapter}
          />
        )}

        {/* Bundle 3 P-C.3 — Schliessen-Modal */}
        <SchliessenModal
          open={schliessenModal !== null}
          variante={schliessenModal ?? 'unvollstaendig'}
          onAbbrechen={() => setSchliessenModal(null)}
          onVerwerfen={() => { void schliessenModalVerwerfen() }}
          onAlsEntwurfBehalten={schliessenModal === 'unvollstaendig' ? schliessenModalEntwurfBehalten : undefined}
        />

        {/* Lösch-Bestätigung */}
        {loeschKandidat && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 pointer-events-auto" onClick={() => setLoeschKandidat(null)}>
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl p-6 max-w-md" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-bold dark:text-white mb-2">Frage löschen?</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                <strong>{loeschKandidat.id}</strong> · {loeschKandidat.fachbereich} · {typLabel(loeschKandidat.typ)}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {loeschKandidat.fragetext?.replace(/\*\*/g, '').replace(/\n/g, ' ').slice(0, 120) || ''}
              </p>
              <p className="text-xs text-red-600 dark:text-red-400 mb-4">
                Diese Aktion kann nicht rückgängig gemacht werden.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setLoeschKandidat(null)}
                  className="px-4 py-2 text-sm rounded border dark:border-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleFrageLoeschen}
                  className="px-4 py-2 text-sm rounded bg-red-600 text-white hover:bg-red-700 cursor-pointer"
                >
                  Endgültig löschen
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Import Overlay */}
        {zeigImport && (
          <FragenImport
            onImportiert={handleImportFragen}
            onSchliessen={() => setZeigImport(false)}
          />
        )}

        {/* Excel-Import Overlay */}
        {zeigExcelImport && (
          <ExcelImport
            onImportiert={(fragen) => { handleImportFragen(fragen); setZeigExcelImport(false) }}
            onSchliessen={() => setZeigExcelImport(false)}
            bestehendeIds={new Set(alleFragen.map(f => f.id))}
          />
        )}

        {/* Batch-Export Overlay */}
        {zeigBatchExport && (
          <BatchExportDialog
            fragen={filter.gefilterteFragen as Frage[]}
            onSchliessen={() => setZeigBatchExport(false)}
            onErfolg={(updates) => {
              const aktuell = useFragenbankStore.getState().fragen
              setAlleFragen(aktuell.map(f => {
                const upd = updates.find(u => u.frageId === f.id)
                if (!upd) return f
                return { ...f, poolId: upd.poolId, quelle: 'pool' as const, poolContentHash: upd.poolContentHash }
              }))
            }}
          />
        )}
      </div>
    )
  }

  return (
    <>
    <ResizableSidebar
      mode="overlay"
      onClose={onSchliessen}
      topOffset={headerH}
      storageKey="fragensammlung-breite"
    >
      <div ref={panelRef} className="flex flex-col h-full">
        {/* Header mit Suche + Filter */}
        <FragenBrowserHeader
          ladeStatus={ladeStatus}
          gefilterteFragen={filter.gefilterteFragen}
          stats={filter.stats}
          alleStats={filter.alleStats}
          verfuegbareThemen={filter.verfuegbareThemen}
          verfuegbareUnterthemen={filter.verfuegbareUnterthemen}
          aktiveFilter={filter.aktiveFilter}
          suchtext={filter.suchtext}
          setSuchtext={filter.setSuchtext}
          filterFachbereich={filter.filterFachbereich}
          setFilterFachbereich={filter.setFilterFachbereich}
          filterTyp={filter.filterTyp}
          setFilterTyp={filter.setFilterTyp}
          filterBloom={filter.filterBloom}
          setFilterBloom={filter.setFilterBloom}
          filterThema={filter.filterThema}
          setFilterThema={filter.setFilterThema}
          filterUnterthema={filter.filterUnterthema}
          setFilterUnterthema={filter.setFilterUnterthema}
          filterPoolStatus={filter.filterPoolStatus}
          setFilterPoolStatus={filter.setFilterPoolStatus}
          filterMitAnhang={filter.filterMitAnhang}
          setFilterMitAnhang={filter.setFilterMitAnhang}
          filterKontext={filter.filterKontext}
          setFilterKontext={filter.setFilterKontext}
          filterZuruecksetzen={filter.filterZuruecksetzen}
          sortierung={filter.sortierung}
          setSortierung={filter.setSortierung}
          gruppierung={filter.gruppierung}
          setGruppierung={filter.setGruppierung}
          setAufgeklappteGruppen={filter.setAufgeklappteGruppen}
          kompaktModus={filter.kompaktModus}
          setKompaktModus={filter.setKompaktModus}
          onNeueFrageErstellen={() => { setEditFrage(null); setZeigEditor(true) }}
          onBatchExport={() => setZeigBatchExport(true)}
          onImport={() => setZeigImport(true)}
          onExcelImport={() => setZeigExcelImport(true)}
          onSchliessen={onSchliessen}
          zielPruefungTitel={zielPruefungTitel}
          zielAbschnittTitel={zielAbschnittTitel}
          listeRef={listeRef}
        />

        {/* Bundle 3 P-D — Drafts-Sektion oberhalb der Sammlung */}
        {ladeStatus === 'fertig' && (
          <DraftsSection
            drafts={drafts}
            onClickDraft={(frage) => handleEditFrage(frage)}
            ownEmail={user?.email ?? ''}
          />
        )}

        {/* Fragen-Liste — Wrapper ohne eigenen Scroll; virtualisierte Liste scrollt selbst und teilt ihren Container per `scrollContainerRef={listeRef}` für Wheel-Forwarding aus dem Header. min-h-0 erlaubt flex-1 zu schrumpfen, damit die innere h-full-Liste eine endliche Höhe bekommt. */}
        <div className="flex-1 min-h-0 relative overflow-hidden">
          {ladeStatus === 'laden' && <FragenListeSkeleton />}

          {/* Detail-Lade-Overlay */}
          {detailLaden && (
            <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 z-10 flex items-center justify-center">
              <p className="text-sm text-slate-500 dark:text-slate-400">Frage wird geladen...</p>
            </div>
          )}

          {ladeStatus === 'fertig' && filter.gefilterteFragen.length === 0 && (
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">
              Keine Fragen gefunden.
            </p>
          )}

          {ladeStatus === 'fertig' && filter.gefilterteFragen.length > 0 && (
            <VirtualisierteFragenListe
              gruppierteAnzeige={filter.gruppierteAnzeige}
              gruppierung={filter.gruppierung}
              aufgeklappteGruppen={filter.aufgeklappteGruppen}
              kompaktModus={filter.kompaktModus}
              bereitsVerwendetSet={bereitsVerwendetSet}
              fragenStats={fragenStats}
              toggleGruppe={toggleGruppe}
              toggleFrageInPruefung={toggleFrageInPruefung}
              handleEditFrage={handleEditFrage}
              handleFrageDuplizieren={handleFrageDuplizieren}
              handleFrageLoeschen={handleFrageLoeschKandidat}
              scrollResetTrigger={`${filter.suchtext}|${filter.gruppierung}|${filter.gefilterteFragen.length}`}
              scrollContainerRef={listeRef}
            />
          )}
        </div>
      </div>
    </ResizableSidebar>

      {/* Fragen-Editor Overlay */}
      {zeigEditor && (
        <FragenEditor
          key={editFrage?.id ?? 'neu'}
          frage={editFrage}
          onSpeichern={handleFrageGespeichert}
          onAbbrechen={() => { setZeigEditor(false); setEditFrage(null) }}
          performance={editFrage ? fragenStats.get(editFrage.id) : undefined}
          onVorherigeFrage={nachbarCallbacks.onVor}
          onNaechsteFrage={nachbarCallbacks.onNach}
          autoSave={autoSaveAdapter}
        />
      )}

      {/* Bundle 3 P-C.3 — Schliessen-Modal */}
      <SchliessenModal
        open={schliessenModal !== null}
        variante={schliessenModal ?? 'unvollstaendig'}
        onAbbrechen={() => setSchliessenModal(null)}
        onVerwerfen={() => { void schliessenModalVerwerfen() }}
        onAlsEntwurfBehalten={schliessenModal === 'unvollstaendig' ? schliessenModalEntwurfBehalten : undefined}
      />

      {/* Lösch-Bestätigung */}
      {loeschKandidat && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 pointer-events-auto" onClick={() => setLoeschKandidat(null)}>
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl p-6 max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold dark:text-white mb-2">Frage löschen?</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              <strong>{loeschKandidat.id}</strong> · {loeschKandidat.fachbereich} · {typLabel(loeschKandidat.typ)}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {loeschKandidat.fragetext?.replace(/\*\*/g, '').replace(/\n/g, ' ').slice(0, 120) || ''}
            </p>
            <p className="text-xs text-red-600 dark:text-red-400 mb-4">
              Diese Aktion kann nicht rückgängig gemacht werden.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setLoeschKandidat(null)}
                className="px-4 py-2 text-sm rounded border dark:border-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
              >
                Abbrechen
              </button>
              <button
                onClick={handleFrageLoeschen}
                className="px-4 py-2 text-sm rounded bg-red-600 text-white hover:bg-red-700 cursor-pointer"
              >
                Endgültig löschen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Overlay */}
      {zeigImport && (
        <FragenImport
          onImportiert={handleImportFragen}
          onSchliessen={() => setZeigImport(false)}
        />
      )}

      {/* Excel-Import Overlay */}
      {zeigExcelImport && (
        <ExcelImport
          onImportiert={(fragen) => { handleImportFragen(fragen); setZeigExcelImport(false) }}
          onSchliessen={() => setZeigExcelImport(false)}
          bestehendeIds={new Set(alleFragen.map(f => f.id))}
        />
      )}

      {/* Batch-Export Overlay */}
      {zeigBatchExport && (
        <BatchExportDialog
          fragen={filter.gefilterteFragen as Frage[]}
          onSchliessen={() => setZeigBatchExport(false)}
          onErfolg={(updates) => {
            const aktuell = useFragenbankStore.getState().fragen
            setAlleFragen(aktuell.map(f => {
              const upd = updates.find(u => u.frageId === f.id)
              if (!upd) return f
              return { ...f, poolId: upd.poolId, quelle: 'pool' as const, poolContentHash: upd.poolContentHash }
            }))
          }}
        />
      )}
    </>
  )
}
