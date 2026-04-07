import { useState, useCallback } from 'react'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, TouchSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core'
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Frage } from '../../../../types/fragen.ts'
import type { PruefungsConfig, PruefungsAbschnitt } from '../../../../types/pruefung.ts'
import type { BloomStufe } from '../../../../types/fragen.ts'
import type { FragenPerformance } from '../../../../types/tracker.ts'
import { fachbereichFarbe, typLabel } from '../../../../utils/fachUtils.ts'
import { berechneZeitbedarf } from '../../../../utils/zeitbedarf.ts'

interface Props {
  pruefung: PruefungsConfig
  fragenMap: Record<string, Frage>
  fragenGeladen?: boolean
  fragenStats?: Map<string, FragenPerformance>
  onAddAbschnitt: () => void
  onRemoveAbschnitt: (index: number) => void
  onMoveAbschnitt: (index: number, richtung: 'hoch' | 'runter') => void
  onUpdateAbschnitt: (index: number, partial: Partial<PruefungsAbschnitt>) => void
  onRemoveFrage: (abschnittIndex: number, frageId: string) => void
  onMoveFrage: (abschnittIndex: number, frageIndex: number, richtung: 'hoch' | 'runter') => void
  onReorderFragen: (abschnittIndex: number, neueFragenIds: string[]) => void
  onFragenBrowser: (abschnittIndex: number) => void
  onEditFrage: (frageId: string) => void
}

function DragHandleIcon(): React.ReactElement {
  return (<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><circle cx="5" cy="3" r="1.5" /><circle cx="11" cy="3" r="1.5" /><circle cx="5" cy="8" r="1.5" /><circle cx="11" cy="8" r="1.5" /><circle cx="5" cy="13" r="1.5" /><circle cx="11" cy="13" r="1.5" /></svg>)
}

interface SortableFrageItemProps {
  frageId: string; fIndex: number; abschnittIndex: number; abschnittLength: number
  frage: Frage | undefined; fragenGeladen: boolean; fragenStats?: Map<string, FragenPerformance>
  onMoveFrage: (ai: number, fi: number, r: 'hoch' | 'runter') => void
  onRemoveFrage: (ai: number, fid: string) => void
  onEditFrage: (fid: string) => void
}

function SortableFrageItem({ frageId, fIndex, abschnittIndex, abschnittLength, frage, fragenGeladen, fragenStats, onMoveFrage, onRemoveFrage, onEditFrage }: SortableFrageItemProps): React.ReactElement {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: frageId })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }
  const fragetext = frage && 'fragetext' in frage ? (frage as { fragetext: string }).fragetext : ''
  const vorschau = fragetext ? fragetext.replace(/\*\*/g, '').replace(/\n/g, ' ').slice(0, 150) : ''
  const zeit = frage ? frage.zeitbedarf ?? berechneZeitbedarf(frage.typ as 'mc' | 'freitext' | 'lueckentext' | 'zuordnung' | 'richtigfalsch' | 'berechnung' | 'visualisierung', frage.bloom as BloomStufe) : undefined
  return (
    <div ref={setNodeRef} style={style} className="px-3 py-2.5 bg-slate-50 dark:bg-slate-700/30 rounded-lg text-sm hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors">
      <div className="flex items-center gap-2">
        <button {...attributes} {...listeners} className="w-7 h-11 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 cursor-grab active:cursor-grabbing touch-none shrink-0" title="Ziehen zum Sortieren" aria-label={`Frage ${fIndex + 1} verschieben`}><DragHandleIcon /></button>
        <span className="flex-1 min-w-0 cursor-pointer" onClick={() => onEditFrage(frageId)} title="Klicken zum Bearbeiten">
          <span className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-400 dark:text-slate-500 w-5 text-center tabular-nums shrink-0">{fIndex + 1}.</span>
            {frage?.fachbereich && <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${fachbereichFarbe(frage.fachbereich)}`}>{frage.fachbereich}</span>}
            {frage && <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-slate-100 text-slate-600 dark:bg-slate-600 dark:text-slate-300">{typLabel(frage.typ)}</span>}
            {frage && <span className="text-[10px] text-slate-500 dark:text-slate-400">{frage.bloom} · {frage.punkte}P.</span>}
            {zeit !== undefined && <span className="text-[10px] text-slate-400 dark:text-slate-500">~{zeit} Min.</span>}
            {frage && fragenStats?.get(frage.id) && (() => { const perf = fragenStats.get(frage.id)!; const lq = perf.durchschnittLoesungsquote; const farbe = lq > 70 ? 'text-green-600 dark:text-green-400' : lq >= 40 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'; return (<span className="inline-flex items-center gap-1"><span className={`text-[10px] font-medium ${farbe}`} title={`${perf.anzahlVerwendungen}× verwendet, ${perf.gesamtN} SuS`}>∅ {Math.round(lq)}%{perf.durchschnittTrennschaerfe != null && ` · TS ${perf.durchschnittTrennschaerfe.toFixed(2)}`}</span>{lq > 90 && <span className="text-[10px] text-amber-500 dark:text-amber-400" title="Fast alle SuS lösen diese Frage richtig">⚠ Sehr leicht</span>}{lq < 20 && <span className="text-[10px] text-red-500 dark:text-red-400" title="Wenige SuS lösen diese Frage">⚠ Sehr schwer</span>}{perf.durchschnittTrennschaerfe != null && perf.durchschnittTrennschaerfe < 0.2 && <span className="text-[10px] text-red-500 dark:text-red-400" title="Frage trennt nicht zwischen starken und schwachen SuS">⚠ Schlechte TS</span>}</span>) })()}
            {!frage && !fragenGeladen && <span className="font-mono text-xs text-slate-400 dark:text-slate-500 italic">{frageId} (laden...)</span>}
            {!frage && fragenGeladen && <span className="font-mono text-xs text-red-400 dark:text-red-500 italic">{frageId} (nicht gefunden)</span>}
          </span>
        </span>
        <div className="flex gap-0.5 shrink-0">
          <button onClick={() => onMoveFrage(abschnittIndex, fIndex, 'hoch')} disabled={fIndex === 0} className="w-6 h-6 text-xs text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 rounded disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed" title="Nach oben">↑</button>
          <button onClick={() => onMoveFrage(abschnittIndex, fIndex, 'runter')} disabled={fIndex === abschnittLength - 1} className="w-6 h-6 text-xs text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 rounded disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed" title="Nach unten">↓</button>
          <button onClick={() => onRemoveFrage(abschnittIndex, frageId)} className="w-6 h-6 text-xs text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded cursor-pointer" title="Frage entfernen">×</button>
        </div>
      </div>
      {vorschau && <p className="text-xs text-slate-700 dark:text-slate-300 mt-1.5 ml-9 line-clamp-2 cursor-pointer" onClick={() => onEditFrage(frageId)}>{vorschau}</p>}
      {frage?.thema && (<div className="flex items-center gap-2 mt-1 ml-9 flex-wrap"><span className="text-[10px] text-slate-400 dark:text-slate-500">{frage.thema}{frage.unterthema ? ` › ${frage.unterthema}` : ''}</span>{frage.tags && frage.tags.length > 0 && <>{frage.tags.slice(0, 3).map((tag) => { const tagName = typeof tag === 'string' ? tag : tag.name; return <span key={tagName} className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-600 rounded text-[10px] text-slate-500 dark:text-slate-400">{tagName}</span> })}</>}</div>)}
    </div>
  )
}

function DragOverlayContent({ frage, fIndex }: { frage: Frage | undefined; fIndex: number }): React.ReactElement {
  const fragetext = frage && 'fragetext' in frage ? (frage as { fragetext: string }).fragetext : ''
  const vorschau = fragetext ? fragetext.replace(/\*\*/g, '').replace(/\n/g, ' ').slice(0, 80) : ''
  return (
    <div className="px-3 py-2.5 bg-white dark:bg-slate-700 rounded-lg text-sm shadow-xl border border-slate-300 dark:border-slate-500 max-w-md">
      <div className="flex items-center gap-2">
        <span className="text-slate-400 dark:text-slate-500"><DragHandleIcon /></span>
        <span className="text-xs text-slate-400 dark:text-slate-500 tabular-nums">{fIndex + 1}.</span>
        {frage?.fachbereich && <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${fachbereichFarbe(frage.fachbereich)}`}>{frage.fachbereich}</span>}
        {frage && <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-slate-100 text-slate-600 dark:bg-slate-600 dark:text-slate-300">{typLabel(frage.typ)}</span>}
      </div>
      {vorschau && <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 ml-9 line-clamp-1">{vorschau}</p>}
    </div>
  )
}

export default function AbschnitteTab({ pruefung, fragenMap, fragenGeladen = true, fragenStats, onAddAbschnitt, onRemoveAbschnitt, onMoveAbschnitt, onUpdateAbschnitt, onRemoveFrage, onMoveFrage, onReorderFragen, onFragenBrowser, onEditFrage }: Props) {
  const [aktiveDragId, setAktiveDragId] = useState<string | null>(null)
  const [aktiverAbschnittIndex, setAktiverAbschnittIndex] = useState<number | null>(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }))
  const handleDragStart = useCallback((event: DragStartEvent) => { const dragId = String(event.active.id); setAktiveDragId(dragId); const aIdx = pruefung.abschnitte.findIndex(a => a.fragenIds.includes(dragId)); setAktiverAbschnittIndex(aIdx >= 0 ? aIdx : null) }, [pruefung.abschnitte])
  const handleDragEnd = useCallback((event: DragEndEvent) => { const { active, over } = event; setAktiveDragId(null); setAktiverAbschnittIndex(null); if (!over || active.id === over.id) return; const aIdx = pruefung.abschnitte.findIndex(a => a.fragenIds.includes(String(active.id))); if (aIdx < 0) return; const alteIds = pruefung.abschnitte[aIdx].fragenIds; const ai = alteIds.indexOf(String(active.id)); const ni = alteIds.indexOf(String(over.id)); if (ai < 0 || ni < 0) return; const neueIds = [...alteIds]; neueIds.splice(ai, 1); neueIds.splice(ni, 0, String(active.id)); onReorderFragen(aIdx, neueIds) }, [pruefung.abschnitte, onReorderFragen])
  const aktiveFrage = aktiveDragId ? fragenMap[aktiveDragId] : undefined
  const aktiverFrageIndex = aktiveDragId && aktiverAbschnittIndex != null ? pruefung.abschnitte[aktiverAbschnittIndex]?.fragenIds.indexOf(aktiveDragId) ?? -1 : -1

  if (pruefung.abschnitte.length === 0) {
    return (<div className="text-center py-12"><p className="text-slate-500 dark:text-slate-400 mb-4">Noch keine Abschnitte. Fügen Sie mindestens einen Abschnitt hinzu, um Fragen zuzuordnen.</p><button onClick={onAddAbschnitt} className="px-4 py-2 text-sm font-semibold text-white bg-slate-800 dark:bg-slate-200 dark:text-slate-800 rounded-lg hover:bg-slate-900 dark:hover:bg-slate-100 transition-colors cursor-pointer">+ Abschnitt hinzufügen</button></div>)
  }
  return (
    <div className="space-y-4">
      {pruefung.abschnitte.map((abschnitt, aIndex) => (
        <div key={aIndex} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-3 bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
            <div className="flex gap-1">
              <button onClick={() => onMoveAbschnitt(aIndex, 'hoch')} disabled={aIndex === 0} className="w-7 h-7 text-xs text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 rounded disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed transition-colors" title="Nach oben">↑</button>
              <button onClick={() => onMoveAbschnitt(aIndex, 'runter')} disabled={aIndex === pruefung.abschnitte.length - 1} className="w-7 h-7 text-xs text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 rounded disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed transition-colors" title="Nach unten">↓</button>
            </div>
            <input type="text" value={abschnitt.titel} onChange={(e) => onUpdateAbschnitt(aIndex, { titel: e.target.value })} className="flex-1 font-semibold text-slate-800 dark:text-slate-100 bg-transparent border-none outline-none focus:ring-2 focus:ring-slate-400 rounded px-2 py-1" />
            <span className="text-xs text-slate-500 dark:text-slate-400">{abschnitt.fragenIds.length} {abschnitt.fragenIds.length === 1 ? 'Frage' : 'Fragen'}</span>
            <button onClick={() => onRemoveAbschnitt(aIndex)} className="w-7 h-7 text-xs text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded cursor-pointer transition-colors" title="Abschnitt löschen">×</button>
          </div>
          <div className="px-5 pt-3"><input type="text" value={abschnitt.beschreibung || ''} onChange={(e) => onUpdateAbschnitt(aIndex, { beschreibung: e.target.value || undefined })} placeholder="Optionale Beschreibung für die SuS..." className="w-full text-sm text-slate-600 dark:text-slate-300 bg-transparent border-none outline-none placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-slate-400 rounded px-2 py-1" /></div>
          <div className="px-5 py-3">
            {abschnitt.fragenIds.length === 0 ? (<p className="text-sm text-slate-400 dark:text-slate-500 italic py-2">Noch keine Fragen in diesem Abschnitt.</p>) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                <SortableContext items={abschnitt.fragenIds} strategy={verticalListSortingStrategy}>
                  <div className="space-y-1.5">{abschnitt.fragenIds.map((frageId, fIndex) => (<SortableFrageItem key={frageId} frageId={frageId} fIndex={fIndex} abschnittIndex={aIndex} abschnittLength={abschnitt.fragenIds.length} frage={fragenMap[frageId]} fragenGeladen={fragenGeladen} fragenStats={fragenStats} onMoveFrage={onMoveFrage} onRemoveFrage={onRemoveFrage} onEditFrage={onEditFrage} />))}</div>
                </SortableContext>
                <DragOverlay>{aktiveDragId ? <DragOverlayContent frage={aktiveFrage} fIndex={aktiverFrageIndex} /> : null}</DragOverlay>
              </DndContext>
            )}
            <button onClick={() => onFragenBrowser(aIndex)} className="mt-3 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer">+ Fragen hinzufügen</button>
          </div>
        </div>
      ))}
      <button onClick={onAddAbschnitt} className="w-full py-3 text-sm font-medium text-slate-500 dark:text-slate-400 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">+ Neuen Abschnitt hinzufügen</button>
    </div>
  )
}
