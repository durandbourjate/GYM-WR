import { useRef, useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import BulkPasteModal from '../components/BulkPasteModal'
import type { FeldStatus } from '../pflichtfeldValidation'

interface Props {
  elemente: string[]
  setElemente: React.Dispatch<React.SetStateAction<string[]>>
  teilpunkte: boolean
  setTeilpunkte: (v: boolean) => void
  feldStatusElemente?: FeldStatus
}

function pflichtCls(status: FeldStatus | undefined): string {
  return status === 'pflicht-leer'
    ? 'border border-violet-400 dark:border-violet-500 ring-1 ring-violet-300 dark:ring-violet-600/40 rounded-lg p-3'
    : 'border border-slate-200 dark:border-slate-700 rounded-lg p-3'
}

// crypto.randomUUID-Fallback fuer aeltere Test-Umgebungen
function neueId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `id-${Math.random().toString(36).slice(2)}-${Date.now()}`
}

export default function SortierungEditor({
  elemente,
  setElemente,
  teilpunkte,
  setTeilpunkte,
  feldStatusElemente,
}: Props) {
  // Stabile Sortable-IDs unabhaengig vom Text (erlaubt Duplikate/leere Strings)
  const idsRef = useRef<string[]>(elemente.map(() => neueId()))
  // Wenn das Datenmodell von aussen die Anzahl-Aenderung verpasst (z.B. neue Frage geladen),
  // synchronisiere die ID-Liste auf die Laenge — Pattern fuer Re-Mounts via parent key.
  if (idsRef.current.length !== elemente.length) {
    idsRef.current = elemente.map((_, i) => idsRef.current[i] ?? neueId())
  }

  const [bulkOffen, setBulkOffen] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function handleChange(index: number, neuerText: string): void {
    const neu = [...elemente]
    neu[index] = neuerText
    setElemente(neu)
  }

  function handleLoeschen(index: number): void {
    const neu = elemente.filter((_, i) => i !== index)
    idsRef.current = idsRef.current.filter((_, i) => i !== index)
    setElemente(neu)
  }

  function handleHinzufuegen(): void {
    idsRef.current = [...idsRef.current, neueId()]
    setElemente([...elemente, ''])
  }

  function handleDragEnd(event: DragEndEvent): void {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const aktiv = String(active.id)
    const zielId = String(over.id)
    const fromIdx = idsRef.current.indexOf(aktiv)
    const toIdx = idsRef.current.indexOf(zielId)
    if (fromIdx < 0 || toIdx < 0) return
    idsRef.current = arrayMove(idsRef.current, fromIdx, toIdx)
    setElemente(arrayMove(elemente, fromIdx, toIdx))
  }

  function handleBulkUebernehmen(zeilen: string[], modus: 'append' | 'replace'): void {
    if (modus === 'replace') {
      idsRef.current = zeilen.map(() => neueId())
      setElemente(zeilen)
    } else {
      idsRef.current = [...idsRef.current, ...zeilen.map(() => neueId())]
      setElemente([...elemente, ...zeilen])
    }
    setBulkOffen(false)
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
            Elemente in korrekter Reihenfolge
          </label>
          <button
            type="button"
            onClick={() => setBulkOffen(true)}
            className="px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
          >
            📋 Bulk einfügen
          </button>
        </div>

        <div data-testid="sortierung-section" className={pflichtCls(feldStatusElemente)}>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={idsRef.current} strategy={verticalListSortingStrategy}>
              <div className="space-y-1.5">
                {elemente.map((el, i) => (
                  <SortableItem
                    key={idsRef.current[i]}
                    id={idsRef.current[i]}
                    index={i}
                    text={el}
                    onChange={(v) => handleChange(i, v)}
                    onLoeschen={() => handleLoeschen(i)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          <button
            type="button"
            onClick={handleHinzufuegen}
            className="mt-2 px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors cursor-pointer"
          >
            + Element hinzufügen
          </button>
        </div>
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={teilpunkte}
          onChange={(e) => setTeilpunkte(e.target.checked)}
          className="rounded border-slate-300 dark:border-slate-600"
        />
        <span className="text-sm text-slate-700 dark:text-slate-200">
          Teilpunkte erlauben (Punkte pro Element an korrekter Position)
        </span>
      </label>

      <BulkPasteModal
        open={bulkOffen}
        onClose={() => setBulkOffen(false)}
        onUebernehmen={handleBulkUebernehmen}
      />
    </div>
  )
}

interface SortableItemProps {
  id: string
  index: number
  text: string
  onChange: (v: string) => void
  onLoeschen: () => void
}

function SortableItem({ id, index, text, onChange, onLoeschen }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label="Verschieben"
        className="cursor-grab active:cursor-grabbing text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 select-none px-1"
      >
        ⠿
      </button>
      <span className="flex-shrink-0 w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-semibold text-slate-500 dark:text-slate-400">
        {index + 1}
      </span>
      <input
        type="text"
        value={text}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`Element ${index + 1}...`}
        className="flex-1 px-2 py-1 text-sm rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
      />
      <button
        type="button"
        onClick={onLoeschen}
        className="px-2 py-1 text-xs rounded bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 cursor-pointer"
        aria-label={`Element ${index + 1} entfernen`}
      >
        ✕
      </button>
    </div>
  )
}
