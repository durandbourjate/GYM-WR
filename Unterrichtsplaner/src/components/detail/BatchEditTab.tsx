import { useState, useEffect, useRef, useMemo } from 'react';
import { usePlannerStore } from '../../store/plannerStore';
import { usePlannerData } from '../../hooks/usePlannerData';
import type { Course, LessonDetail, CollectionItem } from '../../types';
import { CATEGORIES } from '../../data/blockCategories';
import { CollectionPickerList } from '../CollectionPicker';
import { getDurationPresets } from './shared';

// Batch editing for multiple selected cells
export function BatchEditTab() {
  const { multiSelection, updateLessonDetail, pushUndo, lessonDetails, sequences, addSequence, updateBlockInSequence, setEditingSequenceId, setSidePanelTab } = usePlannerStore();
  const { courses: COURSES, categories, settings } = usePlannerData();
  const [applied, setApplied] = useState<string | null>(null);
  const [showSeqMenu, setShowSeqMenu] = useState(false);
  const [showCollectionPicker, setShowCollectionPicker] = useState(false);
  const seqMenuRef = useRef<HTMLDivElement>(null);

  // Parse multi-selection keys to week-col pairs
  const cells = multiSelection.map(key => {
    const [week, courseId] = key.split('-');
    const course = COURSES.find(c => c.id === courseId);
    return course ? { week, col: course.col, courseId } : null;
  }).filter(Boolean) as { week: string; col: number; courseId: string }[];

  // Close seq menu on outside click
  useEffect(() => {
    if (!showSeqMenu) return;
    const handler = (e: MouseEvent) => {
      if (seqMenuRef.current && !seqMenuRef.current.contains(e.target as Node)) setShowSeqMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showSeqMenu]);

  // Determine shared course for sequence creation
  const sharedCourseId = useMemo(() => {
    const ids = new Set(cells.map(c => c.courseId));
    if (ids.size === 1) return [...ids][0];
    const courses = [...ids].map(id => COURSES.find(c => c.id === id)).filter(Boolean) as Course[];
    if (courses.length > 0 && courses.every(c => c.cls === courses[0].cls && c.typ === courses[0].typ)) {
      return courses[0].id;
    }
    return null;
  }, [cells, COURSES]);

  const matchingSequences = useMemo(() => {
    if (!sharedCourseId) return [];
    return sequences.filter(s =>
      s.courseId === sharedCourseId || (s.courseIds?.includes(sharedCourseId))
    );
  }, [sharedCourseId, sequences]);

  const selectedWeeks = useMemo(() => cells.map(c => c.week), [cells]);

  // Determine current values across selection (for highlighting active state)
  const currentValues = useMemo(() => {
    const areas = new Set<string>();
    const cats = new Set<string>();
    const durations = new Set<string>();
    const sols = new Set<boolean>();
    for (const cell of cells) {
      const d = lessonDetails[`${cell.week}-${cell.col}`];
      if (d?.subjectArea) areas.add(d.subjectArea);
      if (d?.blockCategory) cats.add(d.blockCategory);
      if (d?.duration) durations.add(d.duration);
      sols.add(!!d?.sol?.enabled);
    }
    return {
      subjectArea: areas.size === 1 ? [...areas][0] : null,
      blockCategory: cats.size === 1 ? [...cats][0] : null,
      duration: durations.size === 1 ? [...durations][0] : null,
      sol: sols.size === 1 ? [...sols][0] : null,
      mixedArea: areas.size > 1,
      mixedCat: cats.size > 1,
      mixedDur: durations.size > 1,
      mixedSol: sols.size > 1,
    };
  }, [cells, lessonDetails]);

  const handleNewSequence = () => {
    if (!sharedCourseId) return;
    const course = COURSES.find(c => c.id === sharedCourseId);
    pushUndo();
    const batchArea = currentValues.subjectArea as import('../../types').SubjectArea | null;
    const seqId = addSequence({
      courseId: sharedCourseId,
      title: `Neue Sequenz ${course?.cls || ''}`,
      blocks: [{ weeks: selectedWeeks, label: '', ...(batchArea ? { subjectArea: batchArea } : {}) }],
      ...(batchArea ? { subjectArea: batchArea } : {}),
    });
    setEditingSequenceId(`${seqId}-0`);
    setSidePanelTab('sequences');
    setShowSeqMenu(false);
  };

  const handleAddToBlock = (seqId: string, blockIdx: number) => {
    const seq = sequences.find(s => s.id === seqId);
    if (!seq) return;
    const block = seq.blocks[blockIdx];
    pushUndo();
    const newWeeks = [...new Set([...block.weeks, ...selectedWeeks])];
    updateBlockInSequence(seqId, blockIdx, { weeks: newWeeks });
    setEditingSequenceId(`${seqId}-${blockIdx}`);
    setShowSeqMenu(false);
  };

  // T10: Import from collection with selected weeks (T11)
  const handleImportFromCollection = (item: CollectionItem) => {
    if (!sharedCourseId) return;
    pushUndo();
    const seqId = usePlannerStore.getState().importFromCollection(item.id, sharedCourseId, {
      includeNotes: true, includeMaterialLinks: true, targetWeeks: [...selectedWeeks].sort(),
    });
    if (seqId) {
      setEditingSequenceId(`${seqId}-0`);
      setSidePanelTab('sequences');
    }
    setShowCollectionPicker(false);
  };
  const sharedCourse = sharedCourseId ? COURSES.find(c => c.id === sharedCourseId) : undefined;

  const applyToAll = (field: keyof LessonDetail, value: unknown) => {
    pushUndo();
    for (const cell of cells) {
      updateLessonDetail(cell.week, cell.col, { [field]: value });
    }
    setApplied(`${field}: Auf ${cells.length} Zellen angewandt`);
    setTimeout(() => setApplied(null), 2000);
  };

  return (
    <div className="p-3 pb-12 space-y-3 overflow-y-auto flex-1 min-h-0" style={{ overscrollBehavior: 'contain' }}>
      <div className="text-[13px] font-bold text-amber-300">
        ✏ Batch-Bearbeitung ({cells.length} Zellen)
      </div>
      {applied && (
        <div className="text-[11px] text-green-400 bg-green-900/20 rounded px-2 py-1">✅ {applied}</div>
      )}

      {/* Subject Area */}
      <div className="space-y-1">
        <label className="text-[11px] text-gray-400 font-medium">Fachbereich setzen {currentValues.mixedArea && <span className="text-amber-400">(gemischt)</span>}</label>
        <div className="flex gap-1 flex-wrap">
          {categories.map(sa => {
            const isActive = currentValues.subjectArea === sa.key;
            return (
              <button key={sa.key} onClick={() => applyToAll('subjectArea', sa.key)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium border cursor-pointer hover:opacity-80 ${isActive ? 'ring-1 ring-offset-1 ring-offset-slate-800' : ''}`}
                style={{ background: isActive ? sa.color + '40' : 'transparent', borderColor: isActive ? sa.color : '#4b5563', color: isActive ? sa.color : '#9ca3af' }}>
                {sa.label}
              </button>
            );
          })}
          <button onClick={() => applyToAll('subjectArea', undefined)}
            className="px-2 py-0.5 rounded text-[11px] border border-gray-600 text-gray-400 cursor-pointer hover:text-gray-300">✕</button>
        </div>
      </div>

      {/* Category */}
      <div className="space-y-1">
        <label className="text-[11px] text-gray-400 font-medium">Kategorie setzen {currentValues.mixedCat && <span className="text-amber-400">(gemischt)</span>}</label>
        <div className="flex gap-1 flex-wrap">
          {CATEGORIES.map(cat => {
            const isActive = currentValues.blockCategory === cat.key;
            return (
              <button key={cat.key} onClick={() => applyToAll('blockCategory', cat.key)}
                className={`px-2 py-0.5 rounded text-[11px] border cursor-pointer ${isActive ? 'bg-indigo-900/40 border-indigo-500 text-indigo-300 ring-1 ring-indigo-500/30' : 'border-gray-600 text-gray-300 hover:bg-slate-700'}`}>
                {cat.icon} {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Duration */}
      <div className="space-y-1">
        <label className="text-[11px] text-gray-400 font-medium">Dauer setzen {currentValues.mixedDur && <span className="text-amber-400">(gemischt)</span>}</label>
        <div className="flex gap-1 flex-wrap">
          {getDurationPresets(settings?.school?.lessonDurationMin).map(preset => {
            const isActive = currentValues.duration === preset.key;
            return (
              <button key={preset.key} onClick={() => applyToAll('duration', preset.key)}
                className={`px-2 py-0.5 rounded text-[11px] border cursor-pointer ${isActive ? 'bg-indigo-900/40 border-indigo-500 text-indigo-300 ring-1 ring-indigo-500/30' : 'border-gray-600 text-gray-300 hover:bg-slate-700'}`}>
                {preset.label}
              </button>
            );
          })}
          <button onClick={() => applyToAll('duration', undefined)}
            className="px-2 py-0.5 rounded text-[11px] border border-gray-600 text-gray-400 cursor-pointer hover:text-gray-300">✕</button>
        </div>
      </div>

      {/* SOL toggle */}
      <div className="space-y-1">
        <label className="text-[11px] text-gray-400 font-medium">SOL (Selbstorganisiertes Lernen) {currentValues.mixedSol && <span className="text-amber-400">(gemischt)</span>}</label>
        <div className="flex gap-1">
          <button onClick={() => applyToAll('sol', currentValues.sol === true ? { enabled: false } : { enabled: true })}
            className={`px-2 py-0.5 rounded text-[11px] border cursor-pointer transition-all ${
              currentValues.sol === true
                ? 'bg-green-900/40 border-green-500 text-green-300 ring-1 ring-green-500/30'
                : 'border-gray-600 text-gray-400 hover:border-green-600 hover:text-green-400'
            }`}>
            🎒 SOL{currentValues.sol === true ? ' ✓' : ''}{currentValues.mixedSol ? ' (gemischt)' : ''}
          </button>
        </div>
      </div>

      {/* Sequence actions */}
      {sharedCourseId && (
        <div className="space-y-1 pt-2 border-t border-slate-700">
          <label className="text-[11px] text-gray-400 font-medium">Sequenz</label>
          <div className="relative" ref={seqMenuRef}>
            <div className="flex gap-1 flex-wrap">
              <button
                onClick={handleNewSequence}
                className="px-2 py-1 rounded text-[11px] font-medium border border-dashed border-green-600 text-green-400 hover:bg-green-900/20 cursor-pointer"
              >✨ Neue Sequenz ({cells.length} UE)</button>
              <button
                onClick={() => setShowCollectionPicker(!showCollectionPicker)}
                className="px-2 py-1 rounded text-[11px] font-medium border border-dashed border-amber-600 text-amber-400 hover:bg-amber-900/20 cursor-pointer"
              >📥 Aus Sammlung</button>
              {matchingSequences.length > 0 && (
                <button
                  onClick={() => setShowSeqMenu(!showSeqMenu)}
                  className="px-2 py-1 rounded text-[11px] font-medium border border-dashed border-indigo-600 text-indigo-400 hover:bg-indigo-900/20 cursor-pointer"
                >+ Zu bestehender ({matchingSequences.length})</button>
              )}
            </div>
            {showCollectionPicker && (
              <div className="absolute left-0 top-full mt-1 z-[90] bg-slate-800 border border-slate-600 rounded-lg shadow-xl py-1 w-56 max-h-48 overflow-y-auto">
                <CollectionPickerList onSelect={handleImportFromCollection} courseType={sharedCourse?.typ} />
              </div>
            )}
            {showSeqMenu && matchingSequences.length > 0 && (
              <div className="absolute left-0 top-full mt-1 z-[90] bg-slate-800 border border-slate-600 rounded-lg shadow-xl py-1 w-56 max-h-48 overflow-y-auto">
                {matchingSequences.map(seq => (
                  seq.blocks.map((block, bi) => {
                    const allIncluded = selectedWeeks.every(w => block.weeks.includes(w));
                    return (
                      <button key={`${seq.id}-${bi}`}
                        onClick={() => handleAddToBlock(seq.id, bi)}
                        className="w-full px-3 py-1.5 text-left text-[12px] text-gray-300 hover:bg-slate-700 cursor-pointer flex items-center gap-1.5"
                        disabled={allIncluded}>
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: seq.color || '#16a34a' }} />
                        <span className="truncate">{seq.title} → {block.label}</span>
                        {allIncluded && <span className="text-[9px] text-gray-500 ml-auto shrink-0">bereits</span>}
                      </button>
                    );
                  })
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      {!sharedCourseId && cells.length > 0 && (
        <div className="text-[9px] text-amber-400/70 pt-2 border-t border-slate-700">
          ⚠ Sequenzen nur innerhalb desselben Kurses erstellbar. Auswahl enthält verschiedene Kurse.
        </div>
      )}

      <div className="text-[9px] text-gray-500 pt-2 border-t border-slate-700">
        Tipp: Wähle mehrere Zellen mit Shift+Klick oder Cmd+Klick, dann setze Eigenschaften hier.
      </div>
    </div>
  );
}
