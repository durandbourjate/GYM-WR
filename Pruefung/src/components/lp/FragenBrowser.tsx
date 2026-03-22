import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useFocusTrap } from '../../hooks/useFocusTrap.ts'
import { usePanelResize } from '../../hooks/usePanelResize.ts'
import { useFragenFilter } from '../../hooks/useFragenFilter.ts'
import { useAuthStore } from '../../store/authStore.ts'
import { apiService } from '../../services/apiService.ts'
import { demoFragen } from '../../data/demoFragen.ts'
import { typLabel } from '../../utils/fachbereich.ts'
import type { Frage } from '../../types/fragen.ts'
import { gruppenLabel, gruppenLabelFarbe } from './fragenbrowser/gruppenHelfer.ts'
import FragenBrowserHeader from './fragenbrowser/FragenBrowserHeader.tsx'
import KompaktZeile from './fragenbrowser/KompaktZeile.tsx'
import DetailKarte from './fragenbrowser/DetailKarte.tsx'
import FragenEditor from './frageneditor/FragenEditor.tsx'
import FragenImport from './FragenImport.tsx'
import BatchExportDialog from './BatchExportDialog.tsx'

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
}

/** Overlay-Panel zum Durchsuchen und Auswählen von Fragen aus der Fragenbank */
export default function FragenBrowser({ onHinzufuegen, onEntfernen, onSchliessen, bereitsVerwendet, initialEditFrageId, zielPruefungTitel, zielAbschnittTitel }: Props) {
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

  // Resizable Panel (wiederverwendbarer Hook)
  const { panelBreite, handleZiehStart } = usePanelResize(1008, 600, 0.9)

  const [alleFragen, setAlleFragen] = useState<Frage[]>([])
  const [ladeStatus, setLadeStatus] = useState<'laden' | 'fertig'>('laden')

  // Set für schnellen Lookup der bereits verwendeten Fragen
  const bereitsVerwendetSet = useMemo(() => new Set(bereitsVerwendet), [bereitsVerwendet])

  // Editor / Import State
  const [zeigEditor, setZeigEditor] = useState(false)
  const [editFrage, setEditFrage] = useState<Frage | null>(null)
  const [zeigImport, setZeigImport] = useState(false)
  const [zeigBatchExport, setZeigBatchExport] = useState(false)
  const [loeschKandidat, setLoeschKandidat] = useState<Frage | null>(null)

  // Filter/Sort/Gruppierungs-Hook
  const filter = useFragenFilter(alleFragen, user?.email, ladeStatus)

  // Fragen laden
  useEffect(() => {
    async function lade(): Promise<void> {
      if (istDemoModus || !apiService.istKonfiguriert()) {
        setAlleFragen(demoFragen)
        setLadeStatus('fertig')
        return
      }

      if (!user) return
      const result = await apiService.ladeFragenbank(user.email)
      if (result && result.length > 0) {
        // Duplikate entfernen (Backend könnte gleiche ID mehrfach liefern)
        const gesehen = new Set<string>()
        const eindeutig = result.filter((f) => {
          if (gesehen.has(f.id)) {
            console.warn(`[FragenBrowser] Duplikat-ID übersprungen: ${f.id}`)
            return false
          }
          gesehen.add(f.id)
          return true
        })
        setAlleFragen(eindeutig)
      } else {
        console.warn('[FragenBrowser] Backend-Fragen nicht ladbar — zeige Demo-Fragen')
        setAlleFragen(demoFragen)
      }
      setLadeStatus('fertig')
    }
    lade()
  }, [user, istDemoModus])

  // Wenn initialEditFrageId gesetzt, Editor sofort öffnen sobald Fragen geladen
  useEffect(() => {
    if (ladeStatus === 'fertig' && initialEditFrageId) {
      const frage = alleFragen.find((f) => f.id === initialEditFrageId)
      if (frage) {
        setEditFrage(frage)
        setZeigEditor(true)
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
    setAlleFragen((prev) => {
      const ohneAlt = prev.filter((f) => f.id !== neueFrage.id)
      return [...ohneAlt, neueFrage]
    })
    setZeigEditor(false)
    setEditFrage(null)

    // Ans Backend senden (im Hintergrund)
    if (user && apiService.istKonfiguriert() && !istDemoModus) {
      const ok = await apiService.speichereFrage(user.email, neueFrage)
      if (!ok) {
        console.warn('[FragenBrowser] Frage lokal hinzugefügt, aber Backend-Speichern fehlgeschlagen')
      }
    }
  }

  async function handleImportFragen(importierteFragen: Frage[]): Promise<void> {
    setAlleFragen((prev) => [...prev, ...importierteFragen])
    setZeigImport(false)

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

  async function handleFrageLoeschen(): Promise<void> {
    if (!loeschKandidat) return
    setAlleFragen(prev => prev.filter(f => f.id !== loeschKandidat.id))
    const frage = loeschKandidat
    setLoeschKandidat(null)
    if (user && apiService.istKonfiguriert() && !istDemoModus) {
      const ok = await apiService.loescheFrage(user.email, frage.id, frage.fachbereich)
      if (!ok) {
        console.warn('[FragenBrowser] Frage lokal gelöscht, aber Backend-Löschen fehlgeschlagen')
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex pointer-events-none">
      {/* Backdrop */}
      <div className="absolute left-0 right-0 bottom-0 bg-black/40 pointer-events-auto" style={{ top: headerH }} onClick={onSchliessen} />

      {/* Panel (rechts) */}
      <div ref={panelRef} className="absolute right-0 bottom-0 bg-white dark:bg-slate-800 shadow-2xl flex flex-col pointer-events-auto overflow-hidden" style={{ top: headerH, width: panelBreite, maxWidth: '90vw' }} onWheel={(e) => e.stopPropagation()}>
        {/* Drag-Handle zum Resize */}
        <div
          onMouseDown={handleZiehStart}
          className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize z-10 hover:bg-slate-400/50 active:bg-slate-400/70 transition-colors"
          title="Breite anpassen"
        />

        {/* Header mit Suche + Filter */}
        <FragenBrowserHeader
          ladeStatus={ladeStatus}
          gefilterteFragen={filter.gefilterteFragen}
          stats={filter.stats}
          verfuegbareThemen={filter.verfuegbareThemen}
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
          filterQuelle={filter.filterQuelle}
          setFilterQuelle={filter.setFilterQuelle}
          filterPoolStatus={filter.filterPoolStatus}
          setFilterPoolStatus={filter.setFilterPoolStatus}
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
          onSchliessen={onSchliessen}
          zielPruefungTitel={zielPruefungTitel}
          zielAbschnittTitel={zielAbschnittTitel}
          listeRef={listeRef}
        />

        {/* Fragen-Liste */}
        <div ref={listeRef} className="flex-1 overflow-auto">
          {ladeStatus === 'laden' && (
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">
              Fragenbank wird geladen...
            </p>
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
                                onEdit={() => { setEditFrage(frage); setZeigEditor(true) }}
                                zeigeGruppierung={filter.gruppierung}
                              />
                            : <DetailKarte
                                key={frage.id}
                                frage={frage}
                                istInPruefung={bereitsVerwendetSet.has(frage.id)}
                                onToggle={() => toggleFrageInPruefung(frage.id)}
                                onEdit={() => { setEditFrage(frage); setZeigEditor(true) }}
                                onLoeschen={() => setLoeschKandidat(frage)}
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

      {/* Fragen-Editor Overlay */}
      {zeigEditor && (
        <FragenEditor
          frage={editFrage}
          onSpeichern={handleFrageGespeichert}
          onAbbrechen={() => { setZeigEditor(false); setEditFrage(null) }}
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
              {'fragetext' in loeschKandidat
                ? (loeschKandidat as { fragetext: string }).fragetext?.replace(/\*\*/g, '').replace(/\n/g, ' ').slice(0, 120)
                : ''}
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

      {/* Batch-Export Overlay */}
      {zeigBatchExport && (
        <BatchExportDialog
          fragen={filter.gefilterteFragen}
          onSchliessen={() => setZeigBatchExport(false)}
          onErfolg={(updates) => {
            setAlleFragen(prev => prev.map(f => {
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
