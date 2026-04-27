/**
 * VirtualisierteFragenListe — virtualisierte Liste der Fragenbank.
 *
 * Ersetzt die zwei `.map`-Blöcke in `FragenBrowser.tsx` (inline + overlay).
 * Statt 2'400+ DOM-Knoten rendert sie nur die sichtbaren Items + 10er-Overscan.
 *
 * Architektur:
 *   1. `baueFlatItems` plattet `gruppierteAnzeige` zu `FlatItem[]` (Header + Frage gemischt).
 *   2. `useVirtualizer` virtualisiert das flache Array.
 *   3. Pro Index render wir entweder einen Header (sticky) oder eine Frage-Komponente
 *      (KompaktZeile / DetailKarte je nach kompaktModus).
 *
 * `scrollResetTrigger` (z.B. `${suchtext}|${gruppierung}|${count}`) führt bei Wechsel
 * zu einem `scrollToIndex(0)` — verhindert verlassen-im-Scroll bei Filter-Wechsel.
 */
import { useVirtualizer } from '@tanstack/react-virtual'
import { useEffect, useMemo, useRef } from 'react'
import KompaktZeile from './KompaktZeile.tsx'
import DetailKarte from './DetailKarte.tsx'
import { gruppenLabel as labelHelfer, gruppenLabelFarbe as farbeHelfer } from './gruppenHelfer.ts'
import type { Gruppierung } from './gruppenHelfer.ts'
import type { FragenPerformance } from '../../../../types/tracker.ts'
import type {
  FilterbareFrage,
  GruppierteAnzeige,
} from '../../../../hooks/useFragenFilter.ts'

export type FlatItem =
  | {
      typ: 'header'
      gruppeKey: string
      gruppeLabel: string
      fragenAnzahl: number
      istAufgeklappt: boolean
    }
  | { typ: 'frage'; frage: FilterbareFrage; gruppeKey: string }

/**
 * Plattet die gruppierte Anzeige zu einem flachen Item-Array.
 * - Bei `gruppierung === 'keine'`: nur Frage-Items, keine Header.
 * - Bei aktiver Gruppierung: Header pro Gruppe + Fragen nur wenn aufgeklappt.
 */
export function baueFlatItems(
  gruppierteAnzeige: GruppierteAnzeige[],
  gruppierung: Gruppierung,
  aufgeklappteGruppen: Set<string>,
): FlatItem[] {
  const items: FlatItem[] = []
  if (gruppierung === 'keine') {
    for (const gruppe of gruppierteAnzeige) {
      for (const frage of gruppe.fragen) {
        items.push({ typ: 'frage', frage, gruppeKey: gruppe.key })
      }
    }
    return items
  }
  for (const gruppe of gruppierteAnzeige) {
    const istAufgeklappt = aufgeklappteGruppen.has(gruppe.key)
    items.push({
      typ: 'header',
      gruppeKey: gruppe.key,
      gruppeLabel: gruppe.label,
      fragenAnzahl: gruppe.fragen.length,
      istAufgeklappt,
    })
    if (istAufgeklappt) {
      for (const frage of gruppe.fragen) {
        items.push({ typ: 'frage', frage, gruppeKey: gruppe.key })
      }
    }
  }
  return items
}

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
}

export default function VirtualisierteFragenListe(p: Props) {
  const flatItems = useMemo(
    () => baueFlatItems(p.gruppierteAnzeige, p.gruppierung, p.aufgeklappteGruppen),
    [p.gruppierteAnzeige, p.gruppierung, p.aufgeklappteGruppen],
  )
  const scrollRef = useRef<HTMLDivElement>(null)
  const virtualizer = useVirtualizer({
    count: flatItems.length,
    getScrollElement: () => scrollRef.current,
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

  if (flatItems.length === 0) return null

  return (
    <div ref={scrollRef} className="h-full overflow-y-auto" data-testid="virt-scroll">
      <div
        style={{
          height: virtualizer.getTotalSize(),
          position: 'relative',
          width: '100%',
        }}
      >
        {virtualizer.getVirtualItems().map((vItem) => {
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
                  transform: `translateY(${vItem.start}px)`,
                }}
              >
                <button
                  type="button"
                  onClick={() => p.toggleGruppe(item.gruppeKey)}
                  className={`sticky top-0 z-10 w-full text-left flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 cursor-pointer ${farbeHelfer(item.gruppeKey, p.gruppierung)}`}
                >
                  <span>{item.istAufgeklappt ? '▼' : '▶'}</span>
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
                  zeigeGruppierung={p.gruppierung}
                  performance={p.fragenStats.get(frage.id)}
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
