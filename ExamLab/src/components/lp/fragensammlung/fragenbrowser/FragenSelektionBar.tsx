/**
 * FragenSelektionBar — Floating-Action-Bar für Batch-Edit (Cluster D Phase 2, 15.05.2026).
 *
 * Zeigt sich nur wenn `useSelektierteIds().length > 0`.
 * Aktionen:
 *   - „Bearbeiten" → onOeffneEditor (Stub für Phase 3: SharedFragenEditor batchMode)
 *   - „Löschen" → onOeffneLoeschConfirm (Stub für Phase 4: BatchLoeschConfirmModal)
 *   - „Auf Filter beschränken" → beschraenkeAufFilter(sichtbareIds)
 *   - „X" → leereSelektion
 *
 * Hinweis: Floating-Bar mit Pill-Shape weicht vom Standard-Button-Layout ab (gewollt),
 * deshalb inline-Buttons statt der gemeinsamen Button-Komponente.
 */
import { Pencil, Trash2, X } from 'lucide-react'
import { useFragenSelectionStore, useSelektierteIds } from '../../../../store/fragenSelectionStore.ts'

interface Props {
  /** IDs der aktuell gefilterten Fragen — für „Auf Filter beschränken" + sichtbar-Diff-Anzeige. */
  sichtbareIds: string[]
  /** Öffnet Batch-Editor (Phase 3 Stub). */
  onOeffneEditor: () => void
  /** Öffnet Batch-Lösch-Confirm-Modal (Phase 4 Stub). */
  onOeffneLoeschConfirm: () => void
}

export default function FragenSelektionBar({ sichtbareIds, onOeffneEditor, onOeffneLoeschConfirm }: Props) {
  const selektierteIds = useSelektierteIds()
  const leereSelektion = useFragenSelectionStore((s) => s.leereSelektion)
  const beschraenkeAufFilter = useFragenSelectionStore((s) => s.beschraenkeAufFilter)

  if (selektierteIds.length === 0) return null

  const sichtbareSet = new Set(sichtbareIds)
  const sichtbarCount = selektierteIds.filter((id) => sichtbareSet.has(id)).length

  return (
    <div
      role="region"
      aria-label="Frage-Auswahl-Aktionen"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-800 dark:bg-slate-900 text-white shadow-lg rounded-full px-5 py-3 flex items-center gap-3 transition-all"
    >
      <span className="text-sm">
        <strong>{selektierteIds.length}</strong> Fragen ausgewählt
        {sichtbarCount < selektierteIds.length && (
          <span className="text-xs text-slate-300 ml-2">
            (davon {sichtbarCount} im Filter sichtbar)
          </span>
        )}
      </span>
      <button
        type="button"
        onClick={onOeffneEditor}
        className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-violet-600 hover:bg-violet-700 text-white text-sm transition-colors cursor-pointer"
      >
        <Pencil className="w-4 h-4" />
        Bearbeiten
      </button>
      <button
        type="button"
        onClick={onOeffneLoeschConfirm}
        className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-600 hover:bg-red-700 text-white text-sm transition-colors cursor-pointer"
      >
        <Trash2 className="w-4 h-4" />
        Löschen
      </button>
      <button
        type="button"
        onClick={() => { beschraenkeAufFilter(sichtbareIds) }}
        className="px-3 py-1 rounded-full text-slate-200 hover:bg-slate-700 text-sm transition-colors cursor-pointer"
      >
        Auf Filter beschränken
      </button>
      <button
        type="button"
        onClick={leereSelektion}
        aria-label="Auswahl aufheben"
        className="p-1 rounded-full text-slate-300 hover:bg-slate-700 transition-colors cursor-pointer"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
