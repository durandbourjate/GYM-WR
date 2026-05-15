/**
 * Selektions-Store für Cluster D Batch-Edit (Phase 1a, 15.05.2026).
 *
 * Hält die Frage-IDs in einem `Set<string>` (Cross-Filter-stabil — Plan §3 #2).
 * Toggle unterstützt Shift-Click für Range-Select via `sichtbareIds`-Reihenfolge.
 *
 * `useSelektierteIds` ist ein Selector-Hook mit `useShallow` (Memory-Lehre
 * `feedback_zustand_selector_useshallow.md`): liefert ein stabiles Array,
 * damit Konsumenten kein infinite re-render bekommen.
 */
import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'

interface FragenSelectionState {
  selektiert: Set<string>
  /** Anker-ID für Shift-Range. Bleibt bei `setzeSelektion`/`alleSichtbarenAuswaehlen`/`beschraenkeAufFilter` erhalten;
   *  wird nur durch `toggle` aktualisiert oder durch `leereSelektion` auf null gesetzt. */
  letzterKlick: string | null
  /** Toggle einer ID. Shift mit `sichtbareIds`: Range-Toggle (Add wenn target-ID nicht selektiert,
   *  sonst Delete für den ganzen Range — wie macOS Finder Shift-Click). Fallback bei letzterKlick
   *  nicht in sichtbareIds: regulärer Single-Toggle. */
  toggle: (id: string, opts?: { shift?: boolean; sichtbareIds?: string[] }) => void
  setzeSelektion: (ids: Set<string>) => void
  leereSelektion: () => void
  alleSichtbarenAuswaehlen: (sichtbareIds: string[]) => void
  beschraenkeAufFilter: (sichtbareIds: string[]) => void
}

export const useFragenSelectionStore = create<FragenSelectionState>((set, get) => ({
  selektiert: new Set(),
  letzterKlick: null,

  toggle: (id, opts) => {
    const { selektiert, letzterKlick } = get()
    const next = new Set(selektiert)
    if (opts?.shift && letzterKlick && opts.sichtbareIds) {
      const a = opts.sichtbareIds.indexOf(letzterKlick)
      const b = opts.sichtbareIds.indexOf(id)
      if (a >= 0 && b >= 0) {
        const [lo, hi] = a < b ? [a, b] : [b, a]
        const target = !selektiert.has(id)
        for (let i = lo; i <= hi; i++) {
          if (target) next.add(opts.sichtbareIds[i])
          else next.delete(opts.sichtbareIds[i])
        }
      } else {
        // Fallback bei IDs nicht in sichtbareIds: regulärer Toggle.
        if (next.has(id)) next.delete(id)
        else next.add(id)
      }
    } else {
      if (next.has(id)) next.delete(id)
      else next.add(id)
    }
    set({ selektiert: next, letzterKlick: id })
  },

  setzeSelektion: (ids) => set({ selektiert: new Set(ids) }),

  leereSelektion: () => set({ selektiert: new Set(), letzterKlick: null }),

  alleSichtbarenAuswaehlen: (sichtbareIds) => {
    const next = new Set(get().selektiert)
    sichtbareIds.forEach((id) => next.add(id))
    set({ selektiert: next })
  },

  beschraenkeAufFilter: (sichtbareIds) => {
    const sichtbareSet = new Set(sichtbareIds)
    const next = new Set<string>()
    get().selektiert.forEach((id) => {
      if (sichtbareSet.has(id)) next.add(id)
    })
    set({ selektiert: next })
  },
}))

/**
 * Selector-Hook für die Array-Variante der selektierten IDs.
 *
 * Nutzt `useShallow` (Memory `feedback_zustand_selector_useshallow.md`):
 * Selector-Output ist Array → ohne useShallow würde jeder Re-Render eine
 * neue Array-Referenz erzeugen, was Konsumenten in eine infinite-Render-Loop
 * zwingen würde (React Error #185).
 */
export function useSelektierteIds(): string[] {
  return useFragenSelectionStore(useShallow((s) => Array.from(s.selektiert)))
}
