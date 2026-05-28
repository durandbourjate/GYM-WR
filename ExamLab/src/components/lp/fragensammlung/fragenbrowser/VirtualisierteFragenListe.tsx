/**
 * VirtualisierteFragenListe — virtualisierte Liste der Fragensammlung.
 *
 * Ersetzt die zwei `.map`-Blöcke in `FragenBrowser.tsx` (inline + overlay).
 * Statt 2'400+ DOM-Knoten rendert sie nur die sichtbaren Items + 10er-Overscan.
 *
 * Architektur:
 *   1. `baueFlatItems` plattet `gruppierteAnzeige` zu `FlatItem[]` (Header + Frage gemischt).
 *   2. `useVirtualizer` virtualisiert das flache Array.
 *   3. Pro Index render wir entweder einen Header (jetzt OHNE sticky — siehe Lane unten)
 *      oder eine Frage-Komponente (KompaktZeile / DetailKarte je nach kompaktModus).
 *   4. **Sticky-Header-Lane** (Variante A nach Spike): `position: sticky` greift nicht in
 *      virtualisierten Items (`position: absolute; transform`) — bekannte Limitation von
 *      @tanstack/react-virtual. Deshalb rendern wir EINEN zusätzlichen "Active Header" als
 *      Sibling (sticky am Scroll-Container), dessen Inhalt vom ersten sichtbaren Item
 *      abgeleitet wird (rückwärts gesucht bis zum letzten Header bei/vor `firstVisibleIndex`).
 *      Negativer margin-top am Total-Size-Container kompensiert die Lane-Höhe, sodass
 *      virtuelle Items ihre Position behalten.
 *
 * `scrollResetTrigger` (z.B. `${suchtext}|${gruppierung}|${count}`) führt bei Wechsel
 * zu einem `scrollToIndex(0)` — verhindert verlassen-im-Scroll bei Filter-Wechsel.
 */
import { useVirtualizer } from '@tanstack/react-virtual'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import KompaktZeile from './KompaktZeile.tsx'
import DetailKarte from './DetailKarte.tsx'
import DraftsSection from '../DraftsSection.tsx'
import { gruppenLabel as labelHelfer, gruppenLabelFarbe as farbeHelfer } from './gruppenHelfer.ts'
import type { Gruppierung } from './gruppenHelfer.ts'
import type { FragenPerformance } from '../../../../types/tracker.ts'
import type {
  FilterbareFrage,
  GruppierteAnzeige,
} from '../../../../hooks/useFragenFilter.ts'
import type { Frage } from '../../../../types/fragen-storage.ts'

import { baueFlatItems, type FlatItem } from './flatItems.ts'

/** Höhe der Sticky-Header-Lane in px (muss zur estimateSize-Headerhöhe passen). */
const LANE_HOEHE = 36

export interface Props {
  gruppierteAnzeige: GruppierteAnzeige[]
  gruppierung: Gruppierung
  aufgeklappteGruppen: Set<string>
  kompaktModus: boolean
  bereitsVerwendetSet: Set<string>
  fragenStats: Map<string, FragenPerformance>
  toggleGruppe: (key: string) => void
  toggleFrageInPruefung: (id: string) => void
  handleEditFrage: (frage: FilterbareFrage) => void
  handleFrageDuplizieren: (frage: FilterbareFrage) => void
  handleFrageLoeschen: (frage: FilterbareFrage) => void
  /** Trigger für Scroll-Reset (z.B. Suchtext, Gruppierung, Filter-Count). */
  scrollResetTrigger: unknown
  /** Optional: externer Ref auf den Scroll-Container (für Wheel-Forwarding aus dem Header). */
  scrollContainerRef?: React.RefObject<HTMLDivElement | null>
  /** Drafts als statisches Prefix-Element im selben Scroll-Container — scrollt natürlich
   *  zusammen mit den Fach-Gruppen (Bug-Report 15.05.2026: Drafts nicht mehr als sticky-Header).
   *  Matching DraftsSection-Props (Frage[]). */
  drafts?: Frage[]
  ownEmail?: string
  onClickDraft?: (frage: Frage) => void
  onLoeschenDraft?: (frage: Frage) => void
  /** IDs der aktuell gefilterten/sichtbaren Fragen — wird an KompaktZeile weitergereicht für
   *  Shift-Click-Range-Toggle. Cluster D Phase 2 (15.05.2026). Optional, default = [] für
   *  Tests/Callsites, die noch nicht migriert sind. */
  sichtbareIds?: string[]
}

export default function VirtualisierteFragenListe(p: Props) {
  const flatItems = useMemo(
    () => baueFlatItems(p.gruppierteAnzeige, p.gruppierung, p.aufgeklappteGruppen),
    [p.gruppierteAnzeige, p.gruppierung, p.aufgeklappteGruppen],
  )
  const internalScrollRef = useRef<HTMLDivElement>(null)
  const draftsRef = useRef<HTMLDivElement>(null)
  // Drafts-Section ist statisches Prefix-Element im selben Scroll-Container.
  // TanStack-Virtual berechnet Item-Positionen relativ zum Driver-Div — kennt das
  // Vor-Content nicht. `scrollMargin` korrigiert das (in Kompakt-Modus 36px-Items
  // wurde der Off-by-N-Bug am 15.05.2026 sichtbar). ResizeObserver hält das Maß
  // aktuell bei aufklapp/zuklapp der Drafts-Section.
  const [draftsHeight, setDraftsHeight] = useState(0)
  useLayoutEffect(() => {
    const el = draftsRef.current
    if (!el) { setDraftsHeight(0); return }
    const ro = new ResizeObserver(() => setDraftsHeight(el.offsetHeight))
    ro.observe(el)
    setDraftsHeight(el.offsetHeight) // initial
    return () => ro.disconnect()
  }, [p.drafts])

  // Callback-Ref, der die DOM-Node intern UND in einen optional übergebenen Container-Ref schreibt.
  // So bleibt `getScrollElement` zuverlässig (liest `internalScrollRef.current`) und der Aufrufer
  // (z.B. FragenBrowser) kann denselben Ref für externe Wheel-Forwarding-Logik nutzen.
  const setRef = (node: HTMLDivElement | null) => {
    internalScrollRef.current = node
    if (p.scrollContainerRef) {
      ;(p.scrollContainerRef as React.MutableRefObject<HTMLDivElement | null>).current = node
    }
  }
  const virtualizer = useVirtualizer({
    count: flatItems.length,
    getScrollElement: () => internalScrollRef.current,
    scrollMargin: draftsHeight,
    estimateSize: (i: number) => {
      const item = flatItems[i]
      if (!item) return 80
      if (item.typ === 'header') return 36
      return p.kompaktModus ? 36 : 220
    },
    overscan: 10,
  })

  useEffect(() => {
    virtualizer.scrollToIndex(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- absichtlich nur scrollResetTrigger
  }, [p.scrollResetTrigger])

  const virtualItems = virtualizer.getVirtualItems()
  const firstVisibleIndex = virtualItems.length > 0 ? virtualItems[0].index : null

  /**
   * "Aktiver" Lane-Header — der letzte Header-Eintrag, der bei oder vor dem ersten sichtbaren Item steht.
   * Bei `gruppierung === 'keine'` oder leerer Liste: null (kein Lane-Header).
   */
  const aktiverHeaderItem = useMemo<FlatItem | null>(() => {
    if (firstVisibleIndex == null) return null
    if (p.gruppierung === 'keine') return null
    for (let i = firstVisibleIndex; i >= 0; i--) {
      const it = flatItems[i]
      if (it && it.typ === 'header') return it
    }
    return null
  }, [flatItems, firstVisibleIndex, p.gruppierung])

  const drafts = p.drafts ?? []
  const hatDrafts = drafts.length > 0 && !!p.onClickDraft
  if (flatItems.length === 0 && !hatDrafts) return null

  return (
    <div ref={setRef} className="h-full min-h-0 overflow-y-auto relative" data-testid="virt-scroll">
      {/* Drafts als statisches Prefix im selben Scroll-Container — User-Konzept 15.05.2026:
          „die entwürfe sollten ja wie ein fach funktionieren bezüglich scrollen". */}
      {hatDrafts && p.onClickDraft && (
        <div ref={draftsRef}>
          <DraftsSection
            drafts={drafts}
            onClickDraft={p.onClickDraft}
            onLoeschen={p.onLoeschenDraft}
            ownEmail={p.ownEmail ?? ''}
          />
        </div>
      )}
      {/* Sticky-Header-Lane: rendert den aktiven Gruppenheader als sticky-Sibling, weil
          `position: sticky` innerhalb virtualisierter (absolute-positionierter) Items
          nicht greift. Negativer margin-top am Inner-Container darunter kompensiert die
          Lane-Höhe, sodass virtuelle Items ihre Soll-Positionen behalten. */}
      {aktiverHeaderItem && aktiverHeaderItem.typ === 'header' && (
        <button
          type="button"
          onClick={() => p.toggleGruppe(aktiverHeaderItem.gruppeKey)}
          data-testid="lane-header"
          style={{ height: LANE_HOEHE }}
          className={`sticky top-0 z-20 w-full text-left flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 cursor-pointer ${farbeHelfer(aktiverHeaderItem.gruppeKey, p.gruppierung)}`}
        >
          {aktiverHeaderItem.istAufgeklappt ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          <span className="font-semibold">
            {labelHelfer(aktiverHeaderItem.gruppeKey, p.gruppierung)}
          </span>
          <span className="ml-auto text-xs text-slate-500">
            {aktiverHeaderItem.fragenAnzahl}
          </span>
        </button>
      )}
      <div
        style={{
          height: virtualizer.getTotalSize(),
          position: 'relative',
          width: '100%',
          // Negativer Top-Offset = Lane-Höhe, damit virtuelle Items optisch dort beginnen,
          // wo der Scroll-Container-Top ist (Lane-Header überlagert via z-index).
          marginTop: aktiverHeaderItem ? -LANE_HOEHE : 0,
        }}
      >
        {virtualItems.map((vItem) => {
          const item = flatItems[vItem.index]
          if (!item) return null
          if (item.typ === 'header') {
            return (
              <div
                key={vItem.key}
                ref={virtualizer.measureElement}
                data-index={vItem.index}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  // scrollMargin subtrahieren: vItem.start ist scroll-relativ, transform muss
                  // driver-relativ sein. Driver liegt nach Drafts (= scrollMargin px).
                  transform: `translateY(${vItem.start - draftsHeight}px)`,
                }}
              >
                <button
                  type="button"
                  onClick={() => p.toggleGruppe(item.gruppeKey)}
                  className={`w-full text-left flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 cursor-pointer ${farbeHelfer(item.gruppeKey, p.gruppierung)}`}
                >
                  {item.istAufgeklappt ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  <span className="font-semibold">
                    {labelHelfer(item.gruppeKey, p.gruppierung)}
                  </span>
                  <span className="ml-auto text-xs text-slate-500">
                    {item.fragenAnzahl}
                  </span>
                </button>
              </div>
            )
          }
          // Frage-Item
          const frage = item.frage
          return (
            <div
              key={vItem.key}
              ref={virtualizer.measureElement}
              data-index={vItem.index}
              data-fragen-zeile
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                transform: `translateY(${vItem.start}px)`,
              }}
            >
              {p.kompaktModus ? (
                <KompaktZeile
                  frage={frage}
                  istInPruefung={p.bereitsVerwendetSet.has(frage.id)}
                  onToggle={() => p.toggleFrageInPruefung(frage.id)}
                  onEdit={() => p.handleEditFrage(frage)}
                  onDuplizieren={() => p.handleFrageDuplizieren(frage)}
                  onLoeschen={() => p.handleFrageLoeschen(frage)}
                  zeigeGruppierung={p.gruppierung}
                  performance={p.fragenStats.get(frage.id)}
                  sichtbareIds={p.sichtbareIds ?? []}
                />
              ) : (
                <div className="px-4 py-2">
                  <DetailKarte
                    frage={frage}
                    istInPruefung={p.bereitsVerwendetSet.has(frage.id)}
                    onToggle={() => p.toggleFrageInPruefung(frage.id)}
                    onEdit={() => p.handleEditFrage(frage)}
                    onLoeschen={() => p.handleFrageLoeschen(frage)}
                    onDuplizieren={() => p.handleFrageDuplizieren(frage)}
                    performance={p.fragenStats.get(frage.id)}
                    sichtbareIds={p.sichtbareIds ?? []}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
