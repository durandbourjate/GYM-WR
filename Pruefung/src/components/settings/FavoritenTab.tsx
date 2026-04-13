import { useState } from 'react'
import { useFavoritenStore, selectFavoritenSortiert, type Favorit } from '../../store/favoritenStore'
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
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

/** Vordefinierte App-Orte die als Favoriten gesetzt werden können */
const APP_ORTE: Array<{ ziel: string; label: string; icon: string }> = [
  { ziel: '/home', label: 'Home', icon: '🏠' },
  { ziel: '/pruefung', label: 'Prüfungsliste', icon: '📝' },
  { ziel: '/pruefung/tracker', label: 'Prüfungs-Tracker', icon: '📊' },
  { ziel: '/pruefung/monitoring', label: 'Multi-Monitoring', icon: '👁️' },
  { ziel: '/uebung', label: 'Übungsliste', icon: '🎯' },
  { ziel: '/uebung/durchfuehren', label: 'Übung durchführen', icon: '▶️' },
  { ziel: '/uebung/analyse', label: 'Analyse', icon: '📈' },
  { ziel: '/fragensammlung', label: 'Fragensammlung', icon: '📚' },
  { ziel: '/einstellungen/profil', label: 'Mein Profil', icon: '👤' },
  { ziel: '/einstellungen/lernziele', label: 'Lernziele', icon: '🎓' },
]

/** Favoriten verwalten: Sortierbare Liste + App-Orte hinzufügen */
export default function FavoritenTab() {
  const favoriten = useFavoritenStore(selectFavoritenSortiert)
  const { toggleFavorit, updateSortierung, entferneFavorit } = useFavoritenStore()
  const [ortDropdownOffen, setOrtDropdownOffen] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  function handleDragEnd(event: DragEndEvent): void {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const alteReihenfolge = favoriten.map(f => f.ziel)
    const activeIdx = alteReihenfolge.indexOf(active.id as string)
    const overIdx = alteReihenfolge.indexOf(over.id as string)

    const neueReihenfolge = [...alteReihenfolge]
    neueReihenfolge.splice(activeIdx, 1)
    neueReihenfolge.splice(overIdx, 0, active.id as string)
    updateSortierung(neueReihenfolge)
  }

  // Noch nicht als Favorit gesetzte App-Orte
  const verfuegbareOrte = APP_ORTE.filter(o => !favoriten.some(f => f.ziel === o.ziel))

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">Favoriten verwalten</h3>
        <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">
          Per Drag & Drop umsortieren. Favoriten erscheinen auf der Home-Seite.
        </p>

        {favoriten.length === 0 ? (
          <p className="text-sm text-slate-400 dark:text-slate-500 italic py-4">
            Noch keine Favoriten. Füge App-Orte unten hinzu oder markiere Prüfungen/Übungen mit dem Stern-Icon.
          </p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={favoriten.map(f => f.ziel)} strategy={verticalListSortingStrategy}>
              <div className="space-y-1">
                {favoriten.map(fav => (
                  <SortableFavoritItem key={fav.ziel} fav={fav} onEntfernen={() => entferneFavorit(fav.ziel)} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* App-Orte hinzufügen */}
      {verfuegbareOrte.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">App-Ort hinzufügen</h3>
          <div className="relative">
            <button
              onClick={() => setOrtDropdownOffen(!ortDropdownOffen)}
              className="w-full px-3 py-2 text-left text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:border-blue-300 dark:hover:border-blue-600 cursor-pointer"
            >
              + App-Ort auswählen...
            </button>
            {ortDropdownOffen && (
              <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                {verfuegbareOrte.map(ort => (
                  <button
                    key={ort.ziel}
                    onClick={() => {
                      toggleFavorit({ typ: 'ort', ziel: ort.ziel, label: ort.label, icon: ort.icon })
                      setOrtDropdownOffen(false)
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-600 flex items-center gap-2 cursor-pointer"
                  >
                    <span>{ort.icon}</span>
                    <span className="text-slate-700 dark:text-slate-200">{ort.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/** Einzelnes sortier-/löschbares Favoriten-Item */
function SortableFavoritItem({ fav, onEntfernen }: { fav: Favorit; onEntfernen: () => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: fav.ziel })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg"
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 cursor-grab active:cursor-grabbing"
        title="Verschieben"
      >
        ⠿
      </button>

      {/* Icon + Label */}
      <span className="text-sm">{fav.icon || typIcon(fav.typ)}</span>
      <span className="flex-1 text-sm text-slate-700 dark:text-slate-200 truncate">{fav.label || fav.ziel}</span>
      <span className="text-xs text-slate-400 dark:text-slate-500">{typLabel(fav.typ)}</span>

      {/* Entfernen */}
      <button
        onClick={onEntfernen}
        className="text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 cursor-pointer"
        title="Favorit entfernen"
      >
        ✕
      </button>
    </div>
  )
}

function typIcon(typ: string): string {
  switch (typ) {
    case 'ort': return '📍'
    case 'pruefung': return '📝'
    case 'uebung': return '🎯'
    case 'frage': return '❓'
    default: return '📄'
  }
}

function typLabel(typ: string): string {
  switch (typ) {
    case 'ort': return 'Ort'
    case 'pruefung': return 'Prüfung'
    case 'uebung': return 'Übung'
    case 'frage': return 'Frage'
    default: return ''
  }
}
