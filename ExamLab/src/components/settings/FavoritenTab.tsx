import { useState, useMemo } from 'react'
import { ChevronDown, ChevronRight, GripVertical, Star, X } from 'lucide-react'
import { useFavoritenStore, type Favorit } from '../../store/favoritenStore'
import { APP_NAVIGATION, type NavigationsEintrag } from '../../config/appNavigation'
import { NavIcon } from '../ui/icons/NavIcon'
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

/** Favoriten verwalten: Sortierbare Liste + App-Struktur als Baum */
export default function FavoritenTab({ istAdmin }: { istAdmin: boolean }) {
  const rawFavoriten = useFavoritenStore(s => s.favoriten)
  const favoriten = useMemo(() =>
    [...rawFavoriten].sort((a, b) => a.sortierung - b.sortierung),
  [rawFavoriten])
  const { updateSortierung, entferneFavorit } = useFavoritenStore()

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

  return (
    <div className="space-y-6">
      {/* Aktive Favoriten (sortierbar) */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">Favoriten verwalten</h3>
        <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">
          Per Drag & Drop umsortieren. Favoriten erscheinen auf der Favoriten-Seite.
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

      {/* App-Struktur als Baum */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">App-Ort hinzufügen</h3>
        <NavigationsBaum istAdmin={istAdmin} />
      </div>
    </div>
  )
}

/** Baumansicht der App-Navigation mit Stern-Toggles */
function NavigationsBaum({ istAdmin }: { istAdmin: boolean }) {
  const { toggleFavorit, istFavorit } = useFavoritenStore()

  return (
    <div className="space-y-0.5">
      {APP_NAVIGATION.map(eintrag => (
        <BaumEintrag
          key={eintrag.pfad}
          eintrag={eintrag}
          istAdmin={istAdmin}
          toggleFavorit={toggleFavorit}
          istFavorit={istFavorit}
        />
      ))}
    </div>
  )
}

function BaumEintrag({ eintrag, istAdmin, toggleFavorit, istFavorit, tiefe = 0 }: {
  eintrag: NavigationsEintrag
  istAdmin: boolean
  toggleFavorit: (fav: Omit<Favorit, 'sortierung'> & { sortierung?: number }) => void
  istFavorit: (ziel: string) => boolean
  tiefe?: number
}) {
  const [offen, setOffen] = useState(false)
  const hatKinder = eintrag.kinder && eintrag.kinder.length > 0
  const istFav = istFavorit(eintrag.pfad)

  if (eintrag.nurAdmin && !istAdmin) return null

  return (
    <div>
      <div
        className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700/50"
        style={{ paddingLeft: `${8 + tiefe * 16}px` }}
      >
        {/* Aufklapp-Button oder Platzhalter */}
        {hatKinder ? (
          <button
            onClick={() => setOffen(!offen)}
            className="w-5 flex items-center justify-center text-slate-400 dark:text-slate-500 cursor-pointer"
            aria-label={offen ? 'Einklappen' : 'Ausklappen'}
          >
            {offen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
        ) : (
          <span className="w-5" />
        )}

        {/* Icon + Label */}
        <span className="text-sm inline-flex items-center"><NavIcon icon={eintrag.icon} className="w-4 h-4 text-slate-500 dark:text-slate-400" /></span>
        <span className="flex-1 text-sm text-slate-700 dark:text-slate-200">{eintrag.label}</span>

        {/* Stern-Toggle */}
        <button
          onClick={() => toggleFavorit({ typ: 'ort', ziel: eintrag.pfad, label: eintrag.label, icon: eintrag.icon })}
          className="cursor-pointer hover:scale-110 transition-transform"
          title={istFav ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}
          aria-label={istFav ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}
        >
          <Star className={`w-5 h-5 ${istFav ? 'fill-yellow-400 text-yellow-500' : 'text-slate-400'}`} />
        </button>
      </div>

      {hatKinder && offen && eintrag.kinder!.map(kind => (
        <BaumEintrag
          key={kind.pfad}
          eintrag={kind}
          istAdmin={istAdmin}
          toggleFavorit={toggleFavorit}
          istFavorit={istFavorit}
          tiefe={tiefe + 1}
        />
      ))}
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
      <button
        {...attributes}
        {...listeners}
        className="text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100 cursor-grab active:cursor-grabbing inline-flex items-center"
        title="Verschieben"
        aria-label="Verschieben"
      >
        <GripVertical className="w-4 h-4" />
      </button>

      <span className="text-sm inline-flex items-center"><NavIcon icon={fav.icon || typIcon(fav.typ)} className="w-4 h-4 text-slate-500 dark:text-slate-400" /></span>
      <span className="flex-1 text-sm text-slate-700 dark:text-slate-200 truncate">{fav.label || fav.ziel}</span>
      <span className="text-xs text-slate-400 dark:text-slate-500">{typLabel(fav.typ)}</span>

      <button
        onClick={onEntfernen}
        className="text-slate-600 hover:text-red-500 dark:text-slate-300 dark:hover:text-red-400 cursor-pointer inline-flex items-center"
        title="Favorit entfernen"
        aria-label="Favorit entfernen"
      >
        <X className="w-4 h-4" />
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
