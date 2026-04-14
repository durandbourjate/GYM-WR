import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useFocusTrap } from '../../../hooks/useFocusTrap.ts'
import { ResizableSidebar } from '@shared/ui/ResizableSidebar'
import { useFragenFilter } from '../../../hooks/useFragenFilter.ts'
import { useAuthStore } from '../../../store/authStore.ts'
import { useFragenbankStore } from '../../../store/fragenbankStore.ts'
import { apiService } from '../../../services/apiService.ts'
import { demoFragen } from '../../../data/demoFragen.ts'
import { typLabel } from '../../../utils/fachUtils.ts'
import { erstelleDemoTrackerDaten, aggregiereFragenPerformance } from '../../../utils/trackerUtils.ts'
import type { Frage, FrageSummary } from '../../../types/fragen.ts'
import type { FragenPerformance } from '../../../types/tracker.ts'
import { gruppenLabel, gruppenLabelFarbe } from './fragenbrowser/gruppenHelfer.ts'
import FragenBrowserHeader from './fragenbrowser/FragenBrowserHeader.tsx'
import KompaktZeile from './fragenbrowser/KompaktZeile.tsx'
import DetailKarte from './fragenbrowser/DetailKarte.tsx'
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
  const alleFragen = (istDemoModus || !apiService.istKonfiguriert())
    ? demoFragen
    : (storeSummaries.length > 0 ? storeSummaries : storeFragen)
  const ladeStatus = (istDemoModus || !apiService.istKonfiguriert())
    ? 'fertig' as const
    : (storeStatus === 'summary_fertig' || storeStatus === 'detail_laden' || storeStatus === 'fertig' ? 'fertig' as const : 'laden' as const)

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

  // Wenn initialEditFrageId gesetzt, Editor sofort öffnen sobald Fragen geladen
  useEffect(() => {
    if (ladeStatus === 'fertig' && initialEditFrageId) {
      const frage = alleFragen.find((f) => f.id === initialEditFrageId)
      if (frage) {
        handleEditFrage(frage)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps — Nur beim ersten Laden ausführen
  }, [ladeStatus])

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

  async function handleFrageGespeichert(neueFrage: Frage): Promise<void> {
    aktualisiereFrage(neueFrage)
    setZeigEditor(false)
    setEditFrage(null)

    // fragenMap im Composer synchronisieren
    onFrageAktualisiert?.(neueFrage)

    // Ans Backend senden (im Hintergrund)
    if (user && apiService.istKonfiguriert() && !istDemoModus) {
      const ok = await apiService.speichereFrage(user.email, neueFrage)
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
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">
        {/* Header mit Suche + Filter */}
        <FragenBrowserHeader
          ladeStatus={ladeStatus}
          gefilterteFragen={filter.gefilterteFragen}
          stats={filter.stats}
          alleStats={filter.alleStats}
          verfuegbareThemen={filter.verfuegbareThemen}
          verfuegbareUnterthemen={filter.verfuegbareUnterthemen}
          aktiveFilter={filter.aktiveFilter}
          seitenGroesse={filter.seitenGroesse}
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
          setAngezeigteMenge={filter.setAngezeigteMenge}
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

        {/* Fragen-Liste */}
        <div ref={listeRef} className="flex-1 overflow-auto relative">
          {ladeStatus === 'laden' && (
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">
              Fragensammlung wird geladen...
            </p>
          )}

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
            <div>
              {filter.gruppierteAnzeige.map((gruppe) => {
                const istAufgeklappt = filter.gruppierung === 'keine' || filter.aufgeklappteGruppen.has(gruppe.key)
                const inPruefungInGruppe = gruppe.fragen.filter((f) => bereitsVerwendetSet.has(f.id)).length

                return (
                  <div key={gruppe.key || '_alle'}>
                    {filter.gruppierung !== 'keine' && (
                      <div
                        className="sticky top-0 z-10 flex items-center gap-2 px-5 py-2 bg-slate-100 dark:bg-slate-700/80 border-b border-slate-200 dark:border-slate-600 cursor-pointer select-none"
                        onClick={() => toggleGruppe(gruppe.key)}
                      >
                        <span className="text-xs text-slate-500 dark:text-slate-400 w-4">
                          {istAufgeklappt ? '\u25BC' : '\u25B6'}
                        </span>
                        <span className={`text-sm font-semibold ${gruppenLabelFarbe(gruppe.key, filter.gruppierung)}`}>
                          {gruppenLabel(gruppe.key, filter.gruppierung)}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {gruppe.fragen.length}
                          {inPruefungInGruppe > 0 && (
                            <span className="ml-1 text-blue-600 dark:text-blue-400">({inPruefungInGruppe} in Prüfung)</span>
                          )}
                        </span>
                      </div>
                    )}

                    {istAufgeklappt && (
                      <div className={filter.kompaktModus ? '' : 'px-4 py-2 space-y-1.5'}>
                        {gruppe.fragen.map((frage) => (
                          filter.kompaktModus
                            ? <KompaktZeile
                                key={frage.id}
                                frage={frage}
                                istInPruefung={bereitsVerwendetSet.has(frage.id)}
                                onToggle={() => toggleFrageInPruefung(frage.id)}
                                onEdit={() => handleEditFrage(frage)}
                                onDuplizieren={() => handleFrageDuplizieren(frage)}
                                zeigeGruppierung={filter.gruppierung}
                                performance={fragenStats.get(frage.id)}
                              />
                            : <DetailKarte
                                key={frage.id}
                                frage={frage}
                                istInPruefung={bereitsVerwendetSet.has(frage.id)}
                                onToggle={() => toggleFrageInPruefung(frage.id)}
                                onEdit={() => handleEditFrage(frage)}
                                onLoeschen={() => setLoeschKandidat({ id: frage.id, fachbereich: frage.fachbereich, typ: frage.typ, fragetext: 'fragetext' in frage ? (frage as any).fragetext : '' })}
                                onDuplizieren={() => handleFrageDuplizieren(frage)}
                                performance={fragenStats.get(frage.id)}
                              />
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}

              {filter.gruppierung === 'keine' && filter.angezeigteMenge < filter.sortierteFragen.length && (
                <div className="px-5 py-4 text-center">
                  <button
                    onClick={() => filter.setAngezeigteMenge((p) => p + filter.seitenGroesse)}
                    className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer"
                  >
                    Weitere {Math.min(filter.seitenGroesse, filter.sortierteFragen.length - filter.angezeigteMenge)} von {filter.sortierteFragen.length} laden
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Fragen-Editor Overlay */}
        {zeigEditor && (
          <FragenEditor
            frage={editFrage}
            onSpeichern={handleFrageGespeichert}
            onAbbrechen={() => { setZeigEditor(false); setEditFrage(null) }}
            performance={editFrage ? fragenStats.get(editFrage.id) : undefined}
          />
        )}

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
      defaultWidth={1008}
      minWidth={600}
      maxWidth={2400}
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
          seitenGroesse={filter.seitenGroesse}
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
          setAngezeigteMenge={filter.setAngezeigteMenge}
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

        {/* Fragen-Liste */}
        <div ref={listeRef} className="flex-1 overflow-auto relative">
          {ladeStatus === 'laden' && (
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">
              Fragensammlung wird geladen...
            </p>
          )}

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
            <div>
              {filter.gruppierteAnzeige.map((gruppe) => {
                const istAufgeklappt = filter.gruppierung === 'keine' || filter.aufgeklappteGruppen.has(gruppe.key)
                const inPruefungInGruppe = gruppe.fragen.filter((f) => bereitsVerwendetSet.has(f.id)).length

                return (
                  <div key={gruppe.key || '_alle'}>
                    {/* Gruppen-Header */}
                    {filter.gruppierung !== 'keine' && (
                      <div
                        className="sticky top-0 z-10 flex items-center gap-2 px-5 py-2 bg-slate-100 dark:bg-slate-700/80 border-b border-slate-200 dark:border-slate-600 cursor-pointer select-none"
                        onClick={() => toggleGruppe(gruppe.key)}
                      >
                        <span className="text-xs text-slate-500 dark:text-slate-400 w-4">
                          {istAufgeklappt ? '\u25BC' : '\u25B6'}
                        </span>
                        <span className={`text-sm font-semibold ${gruppenLabelFarbe(gruppe.key, filter.gruppierung)}`}>
                          {gruppenLabel(gruppe.key, filter.gruppierung)}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {gruppe.fragen.length}
                          {inPruefungInGruppe > 0 && (
                            <span className="ml-1 text-blue-600 dark:text-blue-400">({inPruefungInGruppe} in Prüfung)</span>
                          )}
                        </span>
                      </div>
                    )}

                    {/* Fragen in Gruppe */}
                    {istAufgeklappt && (
                      <div className={filter.kompaktModus ? '' : 'px-4 py-2 space-y-1.5'}>
                        {gruppe.fragen.map((frage) => (
                          filter.kompaktModus
                            ? <KompaktZeile
                                key={frage.id}
                                frage={frage}
                                istInPruefung={bereitsVerwendetSet.has(frage.id)}
                                onToggle={() => toggleFrageInPruefung(frage.id)}
                                onEdit={() => handleEditFrage(frage)}
                                onDuplizieren={() => handleFrageDuplizieren(frage)}
                                zeigeGruppierung={filter.gruppierung}
                                performance={fragenStats.get(frage.id)}
                              />
                            : <DetailKarte
                                key={frage.id}
                                frage={frage}
                                istInPruefung={bereitsVerwendetSet.has(frage.id)}
                                onToggle={() => toggleFrageInPruefung(frage.id)}
                                onEdit={() => handleEditFrage(frage)}
                                onLoeschen={() => setLoeschKandidat({ id: frage.id, fachbereich: frage.fachbereich, typ: frage.typ, fragetext: 'fragetext' in frage ? (frage as any).fragetext : '' })}
                                onDuplizieren={() => handleFrageDuplizieren(frage)}
                                performance={fragenStats.get(frage.id)}
                              />
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}

              {/* "Mehr laden" wenn keine Gruppierung */}
              {filter.gruppierung === 'keine' && filter.angezeigteMenge < filter.sortierteFragen.length && (
                <div className="px-5 py-4 text-center">
                  <button
                    onClick={() => filter.setAngezeigteMenge((p) => p + filter.seitenGroesse)}
                    className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer"
                  >
                    Weitere {Math.min(filter.seitenGroesse, filter.sortierteFragen.length - filter.angezeigteMenge)} von {filter.sortierteFragen.length} laden
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </ResizableSidebar>

      {/* Fragen-Editor Overlay */}
      {zeigEditor && (
        <FragenEditor
          frage={editFrage}
          onSpeichern={handleFrageGespeichert}
          onAbbrechen={() => { setZeigEditor(false); setEditFrage(null) }}
          performance={editFrage ? fragenStats.get(editFrage.id) : undefined}
        />
      )}

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
