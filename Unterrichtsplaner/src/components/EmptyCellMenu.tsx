import { useState, useRef, useEffect } from 'react';
import type { Course, SubjectArea, CollectionItem } from '../types';
import { usePlannerStore } from '../store/plannerStore';
import { CollectionPickerList, useHasImportableItems } from './CollectionPicker';

/* Empty cell context menu */
export function EmptyCellMenu({ week, course, onClose, selectedWeeks, position }: { week: string; course: Course; onClose: () => void; selectedWeeks?: string[]; position?: { x: number; y: number } }) {
  const { updateLesson, pushUndo, addSequence, setSidePanelOpen, setSidePanelTab, setSelection, setEditingSequenceId } = usePlannerStore();
  const menuRef = useRef<HTMLDivElement>(null);
  const [showCollection, setShowCollection] = useState(false);
  const hasImportable = useHasImportableItems(course.typ);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose();
    };
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', keyHandler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', keyHandler);
    };
  }, [onClose]);

  const handleNewLesson = () => {
    pushUndo();
    updateLesson(week, course.col, { title: 'Neue UE', type: 1 });
    // Set defaults: blockCategory=LESSON, duration=90 min
    usePlannerStore.getState().updateLessonDetail(week, course.col, { blockCategory: 'LESSON', duration: '90 min' });
    setSelection({ week, courseId: course.id, title: 'Neue UE', course });
    setSidePanelOpen(true);
    setSidePanelTab('details');
    onClose();
  };

  const handleNewSequence = () => {
    const weeks = selectedWeeks && selectedWeeks.length > 0 ? selectedWeeks : [week];
    pushUndo();
    // v3.78 #19: Inherit subjectArea from first available fachbereich for the course type
    const settings = usePlannerStore.getState().plannerSettings;
    const courseSubjects = settings?.subjects;
    const firstSA = courseSubjects?.length ? courseSubjects[0].id : undefined;
    const seqId = addSequence({
      courseId: course.id,
      title: `Neue Sequenz ${course.cls}`,
      subjectArea: firstSA as SubjectArea | undefined,
      blocks: [{ weeks, label: '', subjectArea: firstSA as SubjectArea | undefined }],
    });
    // Auto-create placeholder lessons for assigned weeks (v3.76 #9)
    // v3.78 #19: Also set blockCategory + inherited subjectArea on lessonDetails
    for (const w of weeks) {
      const existing = usePlannerStore.getState().weekData.find(wd => wd.w === w)?.lessons[course.col];
      if (!existing?.title) {
        updateLesson(w, course.col, { title: 'UE', type: 1 });
      }
      usePlannerStore.getState().updateLessonDetail(w, course.col, { blockCategory: 'LESSON', duration: '45 min' });
    }
    setEditingSequenceId(`${seqId}-0`); // flat format: seqId-blockIndex
    setSidePanelOpen(true);
    setSidePanelTab('sequences');
    onClose();
  };

  // T10: Import from collection with auto-assigned weeks (T11)
  const handleImportFromCollection = (item: CollectionItem) => {
    const weeks = selectedWeeks && selectedWeeks.length > 0 ? [...selectedWeeks].sort() : [week];
    pushUndo();
    const seqId = usePlannerStore.getState().importFromCollection(item.id, course.id, {
      includeNotes: true, includeMaterialLinks: true, targetWeeks: weeks,
    });
    if (seqId) {
      setEditingSequenceId(`${seqId}-0`);
      setSidePanelOpen(true);
      setSidePanelTab('sequences');
    }
    onClose();
  };

  // T10: Show collection picker instead of main menu
  if (showCollection) {
    return (
      <div ref={menuRef} className="absolute z-[80] bg-slate-800 border border-slate-600 rounded-lg shadow-xl py-1 w-48"
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        style={position
          ? { top: position.y, left: position.x, transform: 'translate(-25%, -25%)' }
          : { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
        }>
        <div className="px-3 py-1 text-[9px] text-gray-400 font-medium border-b border-slate-700/50 flex items-center justify-between">
          <span>📥 Aus Sammlung</span>
          <button onClick={() => setShowCollection(false)} className="text-gray-500 hover:text-gray-300 cursor-pointer text-[10px]">←</button>
        </div>
        <CollectionPickerList onSelect={handleImportFromCollection} courseType={course.typ} />
      </div>
    );
  }

  return (
    <div ref={menuRef} className="absolute z-[80] bg-slate-800 border border-slate-600 rounded-lg shadow-xl py-1 w-36"
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      style={position
        ? { top: position.y, left: position.x, transform: 'translate(-25%, -25%)' }
        : { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
      }>
      <button onClick={handleNewLesson}
        className="w-full px-3 py-1.5 text-left text-[10px] text-gray-200 hover:bg-slate-700 cursor-pointer flex items-center gap-2">
        <span>📖</span> Neue Unterrichtseinheit
      </button>
      <button onClick={handleNewSequence}
        className="w-full px-3 py-1.5 text-left text-[10px] text-gray-200 hover:bg-slate-700 cursor-pointer flex items-center gap-2">
        <span>▧</span> {selectedWeeks && selectedWeeks.length > 1 ? `Neue Sequenz (${selectedWeeks.length} KW)` : 'Neue Sequenz'}
      </button>
      {hasImportable && (
        <button onClick={() => setShowCollection(true)}
          className="w-full px-3 py-1.5 text-left text-[10px] text-gray-200 hover:bg-slate-700 cursor-pointer flex items-center gap-2">
          <span>📥</span> Aus Sammlung
        </button>
      )}
    </div>
  );
}
