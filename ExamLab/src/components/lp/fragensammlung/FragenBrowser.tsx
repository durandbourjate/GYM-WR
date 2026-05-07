// ExamLab/src/components/lp/fragensammlung/FragenBrowser.tsx
import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useFocusTrap } from '../../../hooks/useFocusTrap.ts'
import { ResizableSidebar } from '@shared/ui/ResizableSidebar'
import { SchliessenModal } from '@shared/index'
import { useFragenFilter } from '../../../hooks/useFragenFilter.ts'
import { useFragenEditor } from '../../../hooks/useFragenEditor'
import { useFragenAktionen } from '../../../hooks/useFragenAktionen'
import { useAuthStore } from '../../../store/authStore.ts'
import { useFragensammlungStore } from '../../../store/fragensammlungStore.ts'
import { apiService } from '../../../services/apiService.ts'
import { demoFragen } from '../../../data/demoFragen.ts'
import { erstelleDemoTrackerDaten, aggregiereFragenPerformance } from '../../../utils/trackerUtils.ts'
import type { Frage, FrageSummary } from '../../../types/fragen-storage'
import type { FragenPerformance } from '../../../types/tracker.ts'
import FragenBrowserBody from './fragenbrowser/FragenBrowserBody.tsx'
import LoeschBestaetigungsDialog from './fragenbrowser/LoeschBestaetigungsDialog.tsx'
import FragenEditor from '../frageneditor/FragenEditor.tsx'
import FragenImport from './FragenImport.tsx'
import ExcelImport from './ExcelImport.tsx'
import BatchExportDialog from '../korrektur/BatchExportDialog.tsx'

interface Props {
  onHinzufuegen: (frageIds: string[]) => void
  onEntfernen?: (frageId: string) => void
  onSchliessen: () => void
  bereitsVerwendet: string[]
  initialEditFrageId?: string
  zielPruefungTitel?: string
  zielAbschnittTitel?: string
  onFrageAktualisiert?: (frage: Frage) => void
  inline?: boolean
}

/** Panel zum Durchsuchen und Auswählen von Fragen aus der Fragensammlung (Overlay oder Inline) */
export default function FragenBrowser({ onHinzufuegen, onEntfernen, onSchliessen, bereitsVerwendet, initialEditFrageId, zielPruefungTitel, zielAbschnittTitel, onFrageAktualisiert, inline }: Props) {
  const user = useAuthStore((s) => s.user)
  const istDemoModus = useAuthStore((s) => s.istDemoModus)

  const panelRef = useRef<HTMLDivElement>(null)
  const listeRef = useRef<HTMLDivElement>(null)
  useFocusTrap(panelRef)

  // Header-Höhe messen
  const [headerH, setHeaderH] = useState(0)
  useEffect(() => {
    const h = document.querySelector('header')?.getBoundingClientRect()?.height ?? 0
    setHeaderH(h)
  }, [])

  // Store-Selectors + Demo-Modus-Mux
  const storeSummaries = useFragensammlungStore(s => s.summaries)
  const storeFragen = useFragensammlungStore(s => s.fragen)
  const storeStatus = useFragensammlungStore(s => s.status)
  const alleFragenMitDrafts: (Frage | FrageSummary)[] = (istDemoModus || !apiService.istKonfiguriert())
    ? demoFragen
    : (storeSummaries.length > 0 ? storeSummaries : storeFragen)
  const ladeStatus = (istDemoModus || !apiService.istKonfiguriert())
    ? 'fertig' as const
    : (storeStatus === 'summary_fertig' || storeStatus === 'detail_laden' || storeStatus === 'fertig' ? 'fertig' as const : 'laden' as const)

  const drafts = useMemo<Frage[]>(
    () => alleFragenMitDrafts.filter((f) => (f as { status?: string }).status === 'draft') as Frage[],
    [alleFragenMitDrafts]
  )
  const alleFragen = useMemo(
    () => alleFragenMitDrafts.filter((f) => (f as { status?: string }).status !== 'draft'),
    [alleFragenMitDrafts]
  )

  // Tracker-Stats
  const [fragenStats, setFragenStats] = useState<Map<string, FragenPerformance>>(new Map())
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

  // Falls Store noch nicht geladen: Lade-Fallback
  useEffect(() => {
    if (!istDemoModus && apiService.istKonfiguriert() && user && storeStatus === 'idle') {
      useFragensammlungStore.getState().lade(user.email)
    }
  }, [istDemoModus, user, storeStatus])

  const bereitsVerwendetSet = useMemo(() => new Set(bereitsVerwendet), [bereitsVerwendet])

  // Filter-Engine
  const filter = useFragenFilter(alleFragen, user?.email, ladeStatus, istDemoModus)

  // T.c-Hooks
  const editor = useFragenEditor({
    user, istDemoModus, alleFragen, sortierteFragen: filter.sortierteFragen,
    ladeStatus, initialEditFrageId, onFrageAktualisiert,
  })
  const aktionen = useFragenAktionen({ user, istDemoModus, onFrageAktualisiert })

  // Modal-Toggles (UI-State, bleibt im Caller — Brainstorming-Beschluss B)
  const [zeigImport, setZeigImport] = useState(false)
  const [zeigExcelImport, setZeigExcelImport] = useState(false)
  const [zeigBatchExport, setZeigBatchExport] = useState(false)

  const toggleFrageInPruefung = useCallback((frageId: string): void => {
    if (bereitsVerwendetSet.has(frageId)) {
      onEntfernen?.(frageId)
    } else {
      onHinzufuegen([frageId])
    }
  }, [bereitsVerwendetSet, onEntfernen, onHinzufuegen])

  const toggleGruppe = useCallback((key: string): void => {
    filter.setAufgeklappteGruppen((prev) => {
      const neu = new Set(prev)
      if (neu.has(key)) neu.delete(key)
      else neu.add(key)
      return neu
    })
  }, [filter])

  // Body-Element gemeinsam für inline + overlay
  const body = (
    <FragenBrowserBody
      ladeStatus={ladeStatus}
      detailLaden={editor.detailLaden}
      filter={filter}
      drafts={drafts}
      bereitsVerwendetSet={bereitsVerwendetSet}
      fragenStats={fragenStats}
      ownEmail={user?.email ?? ''}
      toggleFrageInPruefung={toggleFrageInPruefung}
      toggleGruppe={toggleGruppe}
      handleEditFrage={editor.oeffnen}
      handleFrageDuplizieren={aktionen.duplizieren}
      handleFrageLoeschen={aktionen.setLoeschKandidat}
      onNeueFrageErstellen={editor.oeffnenNeu}
      onBatchExport={() => setZeigBatchExport(true)}
      onImport={() => setZeigImport(true)}
      onExcelImport={() => setZeigExcelImport(true)}
      onSchliessen={onSchliessen}
      zielPruefungTitel={zielPruefungTitel}
      zielAbschnittTitel={zielAbschnittTitel}
      inline={inline}
      listeRef={listeRef}
    />
  )

  // Modals gemeinsam für inline + overlay
  const modals = (
    <>
      {editor.zeigEditor && (
        <FragenEditor
          key={editor.editFrage?.id ?? 'neu'}
          frage={editor.editFrage}
          onSpeichern={editor.speichern}
          onAbbrechen={editor.abbrechen}
          performance={editor.editFrage ? fragenStats.get(editor.editFrage.id) : undefined}
          onVorherigeFrage={editor.nachbarCallbacks.onVor}
          onNaechsteFrage={editor.nachbarCallbacks.onNach}
          autoSave={editor.autoSaveAdapter}
        />
      )}

      <SchliessenModal
        open={editor.schliessenModal !== null}
        variante={editor.schliessenModal ?? 'unvollstaendig'}
        onAbbrechen={editor.modalAbbrechen}
        onVerwerfen={() => { void editor.modalVerwerfen() }}
        onAlsEntwurfBehalten={editor.schliessenModal === 'unvollstaendig' ? editor.modalEntwurfBehalten : undefined}
      />

      <LoeschBestaetigungsDialog
        kandidat={aktionen.loeschKandidat}
        onAbbrechen={aktionen.abbrechenLoeschen}
        onBestaetigen={aktionen.bestaetigenLoeschen}
      />

      {zeigImport && (
        <FragenImport
          onImportiert={(fragen) => {
            // Modal close-first: heutige Source schliesst Modal SYNCHRON vor Backend-Loop (Z. 329-347).
            // Plan-Reviewer-Iteration-Lehre: `await aktionen.importieren(...)` würde Modal bis nach allen Backend-Roundtrips offenhalten = UX-Regression.
            setZeigImport(false)
            void aktionen.importieren(fragen)
          }}
          onSchliessen={() => setZeigImport(false)}
        />
      )}

      {zeigExcelImport && (
        <ExcelImport
          onImportiert={(fragen) => {
            setZeigExcelImport(false)
            void aktionen.importieren(fragen)
          }}
          onSchliessen={() => setZeigExcelImport(false)}
          bestehendeIds={new Set(alleFragen.map(f => f.id))}
        />
      )}

      {zeigBatchExport && (
        <BatchExportDialog
          fragen={filter.gefilterteFragen as Frage[]}
          onSchliessen={() => setZeigBatchExport(false)}
          onErfolg={(updates) => {
            const aktuell = useFragensammlungStore.getState().fragen
            useFragensammlungStore.getState().setFragen(aktuell.map(f => {
              const upd = updates.find(u => u.frageId === f.id)
              if (!upd) return f
              return { ...f, poolId: upd.poolId, quelle: 'pool' as const, poolContentHash: upd.poolContentHash }
            }))
          }}
        />
      )}
    </>
  )

  // Inline-Modus
  if (inline) {
    return (
      <div className="flex-1 min-h-0 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">
        {body}
        {modals}
      </div>
    )
  }

  // Overlay-Modus
  return (
    <>
      <ResizableSidebar
        mode="overlay"
        onClose={onSchliessen}
        topOffset={headerH}
        storageKey="fragensammlung-breite"
      >
        <div ref={panelRef} className="flex flex-col h-full">
          {body}
        </div>
      </ResizableSidebar>
      {modals}
    </>
  )
}
