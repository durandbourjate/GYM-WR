import React, { useCallback, useState, useRef, useEffect } from 'react';
import type { Course, Week } from '../types';
import { LESSON_COLORS, SUBJECT_AREA_COLORS, DAY_COLORS, getSequenceInfoFromStore, isPastWeek } from '../utils/colors';
import { CURRENT_WEEK } from '../data/weeks';
import { usePlannerStore } from '../store/plannerStore';
import { getHKGroup } from '../utils/hkRotation';
import { getEffectiveCategorySubtype, getCategoryLabel, getSubtypeLabel, CATEGORIES } from './DetailPanel';

interface Props {
  weeks: Week[];
  courses: Course[];
  allWeeks?: string[]; // All week keys across both semesters (for cross-semester shift-select)
  currentRef?: React.RefObject<HTMLTableRowElement | null>;
}

function InlineEdit({ value, onSave, onCancel }: { value: string; onSave: (v: string) => void; onCancel: () => void }) {
  const [text, setText] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { inputRef.current?.focus(); inputRef.current?.select(); }, []);
  return (
    <input
      ref={inputRef}
      value={text}
      onChange={(e) => setText(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onSave(text);
        if (e.key === 'Escape') onCancel();
      }}
      onBlur={() => onSave(text)}
      className="w-full bg-slate-700 text-slate-100 border border-blue-400 rounded px-1 py-0.5 text-[9px] outline-none"
      style={{ minHeight: 20 }}
    />
  );
}

/* Hover preview popover — enhanced v3.23 */
const SUBJECT_AREA_COLORS_PREVIEW: Record<string, string> = {
  BWL: '#3b82f6', VWL: '#f97316', RECHT: '#22c55e', IN: '#6b7280', INTERDISZ: '#a855f7',
};

function HoverPreview({ week, col, courses, courseIndex, totalCourses }: { week: string; col: number; courses: Course[]; courseIndex: number; totalCourses: number }) {
  const { lessonDetails, weekData, sequences } = usePlannerStore();
  const previewRef = useRef<HTMLDivElement>(null);
  const [showAbove, setShowAbove] = useState(false);
  const key = `${week}-${col}`;
  const detail = lessonDetails[key];
  const weekEntry = weekData.find(w => w.w === week);
  const entry = weekEntry?.lessons[col];
  const course = courses.find(c => c.col === col);
  if (!entry || !course) return null;

  const seq = getSequenceInfoFromStore(course.id, week, sequences);
  const parentBlock = seq ? (() => {
    const parentSeq = sequences.find(s => s.id === seq.sequenceId);
    return parentSeq?.blocks.find(b => b.weeks.includes(week));
  })() : null;

  // Inherited values
  const effectiveSubjectArea = detail?.subjectArea || parentBlock?.subjectArea;
  const effectiveTopicMain = detail?.topicMain || parentBlock?.topicMain;
  const effectiveTopicSub = detail?.topicSub || parentBlock?.topicSub;
  const accentColor = effectiveSubjectArea ? SUBJECT_AREA_COLORS_PREVIEW[effectiveSubjectArea] || '#64748b' : '#64748b';

  // Smart positioning: show left if course is in the right third of columns
  const showLeft = courseIndex > totalCourses * 0.6;

  // Vertical positioning: check on mount if parent cell is near viewport bottom
  useEffect(() => {
    if (previewRef.current?.parentElement) {
      const rect = previewRef.current.parentElement.getBoundingClientRect();
      setShowAbove(rect.bottom > window.innerHeight * 0.65);
    }
  }, []);

  // Check if there's meaningful content beyond title/topic
  const hasNotes = !!(detail?.notes);
  const hasDescription = !!(detail?.description);
  const hasMaterialLinks = !!(detail?.materialLinks && detail.materialLinks.length > 0);
  const hasSol = !!(detail?.sol?.enabled);
  const hasCurriculumGoal = !!(detail?.curriculumGoal);
  const hasExtras = hasNotes || hasDescription || hasMaterialLinks || hasSol || hasCurriculumGoal;

  return (
    <div
      ref={previewRef}
      className="absolute bg-slate-800 border border-slate-600 rounded-lg shadow-2xl z-[80] pointer-events-none"
      style={{
        width: hasExtras ? 280 : 224,
        ...(showAbove
          ? { bottom: '100%', top: 'auto', marginBottom: 4 }
          : { top: 0 }),
        ...(showLeft
          ? { right: '100%', left: 'auto', marginRight: 4 }
          : { left: '100%', right: 'auto', marginLeft: 4 }),
      }}
    >
      {/* Colored header bar */}
      <div className="rounded-t-lg px-2.5 py-1.5" style={{ background: accentColor + '20', borderBottom: `2px solid ${accentColor}40` }}>
        <div className="text-[10px] font-bold text-gray-200 leading-tight">{entry.title}</div>
        {effectiveTopicMain && (
          <div className="text-[9px] text-gray-400 mt-0.5">
            📌 {effectiveTopicMain}{effectiveTopicSub ? ` › ${effectiveTopicSub}` : ''}
          </div>
        )}
      </div>

      <div className="px-2.5 py-1.5">
        {/* Badges row */}
        <div className="flex flex-wrap gap-1 mb-1">
          {effectiveSubjectArea && (
            <span className="text-[8px] px-1 py-px rounded border text-gray-300 font-medium"
              style={{ borderColor: accentColor + '60', background: accentColor + '15' }}>
              {effectiveSubjectArea}
            </span>
          )}
          {(() => {
            const { category, subtype } = getEffectiveCategorySubtype(detail || {});
            const catDef = category ? CATEGORIES.find(c => c.key === category) : null;
            return <>
              {catDef && catDef.key !== 'LESSON' && (
                <span className="text-[8px] px-1 py-px rounded border border-gray-600 text-gray-400">{catDef.icon} {getCategoryLabel(catDef.key, false)}</span>
              )}
              {subtype && category && (
                <span className="text-[8px] px-1 py-px rounded border border-gray-600 text-gray-400">{getSubtypeLabel(category, subtype, false)}</span>
              )}
            </>;
          })()}
          {detail?.duration && (
            <span className="text-[8px] px-1 py-px rounded border border-gray-600 text-gray-400">⏱ {detail.duration}</span>
          )}
        </div>

        {/* Sequence info */}
        {seq && (() => {
          const parentSeq = sequences.find(s => s.id === seq.sequenceId);
          return (
            <div className="text-[8px] text-gray-500 mb-1">
              ▧ {seq.label} ({seq.index + 1}/{seq.total})
              {parentSeq?.sol?.enabled && <span className="text-emerald-500 ml-1" title={`SOL: ${parentSeq.sol.topic || ''} ${parentSeq.sol.duration || ''}`}>📚 SOL</span>}
            </div>
          );
        })()}

        {/* Curriculum goal */}
        {hasCurriculumGoal && (
          <div className="text-[8px] text-gray-500 mb-1 leading-relaxed" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            🎯 {detail!.curriculumGoal}
          </div>
        )}

        {/* Description */}
        {hasDescription && (
          <div className="text-[8px] text-gray-400 mb-1 leading-relaxed" style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {detail!.description}
          </div>
        )}

        {/* Notes — the main value-add, shown prominently */}
        {hasNotes && (
          <div className="mt-1 pt-1 border-t border-slate-700">
            <div className="text-[7px] font-semibold text-gray-500 uppercase tracking-wide mb-0.5">Notizen</div>
            <div className="text-[9px] text-gray-300 leading-relaxed whitespace-pre-line" style={{ display: '-webkit-box', WebkitLineClamp: 6, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {detail!.notes}
            </div>
          </div>
        )}

        {/* SOL details */}
        {hasSol && (
          <div className="text-[8px] text-gray-500 mt-1">
            📚 SOL{detail!.sol!.topic ? `: ${detail!.sol!.topic}` : ''}{detail!.sol!.duration ? ` (${detail!.sol!.duration})` : ''}
          </div>
        )}

        {/* Material links */}
        {hasMaterialLinks && (
          <div className="mt-1 pt-1 border-t border-slate-700 flex flex-wrap gap-1">
            {detail!.materialLinks!.slice(0, 4).map((link, i) => {
              const isLV = link.includes('learningview');
              const label = isLV ? 'LV' : link.replace(/^https?:\/\//, '').split('/')[0].slice(0, 20);
              return (
                <span key={i} className="text-[7px] px-1 py-px rounded bg-slate-700 text-gray-400">
                  📎 {label}
                </span>
              );
            })}
            {detail!.materialLinks!.length > 4 && (
              <span className="text-[7px] px-1 py-px text-gray-500">+{detail!.materialLinks!.length - 4}</span>
            )}
          </div>
        )}

        {/* Hint if no extras */}
        {!hasExtras && !seq && (
          <div className="text-[8px] text-gray-600 italic">Doppelklick für Details</div>
        )}
      </div>
    </div>
  );
}

/* Empty cell context menu */
function EmptyCellMenu({ week, course, onClose, selectedWeeks, position }: { week: string; course: Course; onClose: () => void; selectedWeeks?: string[]; position?: { x: number; y: number } }) {
  const { updateLesson, pushUndo, addSequence, setSidePanelOpen, setSidePanelTab, setSelection, setEditingSequenceId } = usePlannerStore();
  const menuRef = useRef<HTMLDivElement>(null);

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
    updateLesson(week, course.col, { title: 'Neue Lektion', type: 1 });
    // Set default blockCategory to LESSON
    usePlannerStore.getState().updateLessonDetail(week, course.col, { blockCategory: 'LESSON' });
    setSelection({ week, courseId: course.id, title: 'Neue Lektion', course });
    setSidePanelOpen(true);
    setSidePanelTab('details');
    onClose();
  };

  const handleNewSequence = () => {
    const weeks = selectedWeeks && selectedWeeks.length > 0 ? selectedWeeks : [week];
    const seqId = addSequence({ courseId: course.id, title: `Neue Sequenz ${course.cls}`, blocks: [{ weeks, label: 'Neuer Block' }] });
    setEditingSequenceId(`${seqId}-0`); // flat format: seqId-blockIndex
    setSidePanelOpen(true);
    setSidePanelTab('sequences');
    onClose();
  };

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
        <span>📖</span> Neue Kachel
      </button>
      <button onClick={handleNewSequence}
        className="w-full px-3 py-1.5 text-left text-[10px] text-gray-200 hover:bg-slate-700 cursor-pointer flex items-center gap-2">
        <span>▧</span> {selectedWeeks && selectedWeeks.length > 1 ? `Neue Sequenz (${selectedWeeks.length} KW)` : 'Neue Sequenz'}
      </button>
    </div>
  );
}

/* Inline editable note cell for expanded note column */

function NoteCell({ weekW, col, cellHeight }: { weekW: string; col: number; cellHeight: number }) {
  const { lessonDetails, updateLessonDetail, weekData, noteColWidth: ncw } = usePlannerStore();
  const detail = lessonDetails[`${weekW}-${col}`];
  const notes = detail?.notes || '';
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(notes);
  const ref = useRef<HTMLTextAreaElement>(null);

  // Check if this week has an entry at all
  const weekEntry = weekData.find(w => w.w === weekW);
  const entry = weekEntry?.lessons[col];
  if (!entry) return <td className="border-b border-slate-900/40 bg-slate-950/30" style={{ width: ncw, minWidth: ncw, maxWidth: ncw, height: cellHeight }} />;

  const displayNotes = notes;

  useEffect(() => { setText(notes); }, [notes]);
  useEffect(() => { if (editing && ref.current) { ref.current.focus(); ref.current.select(); } }, [editing]);

  if (editing) {
    return (
      <td className="border-b border-slate-900/40 bg-slate-900/60 p-0 border-l border-gray-800/50"
        style={{ width: ncw, minWidth: ncw, maxWidth: ncw, height: cellHeight, verticalAlign: 'top' }}>
        <textarea
          ref={ref}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={() => {
            setEditing(false);
            if (text !== notes) updateLessonDetail(weekW, col, { notes: text || undefined });
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') { setEditing(false); setText(notes); }
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault(); setEditing(false);
              if (text !== notes) updateLessonDetail(weekW, col, { notes: text || undefined });
            }
          }}
          className="w-full h-full bg-transparent text-slate-300 text-[8px] leading-tight p-1 outline-none resize-none border border-blue-500/50 rounded-sm"
        />
      </td>
    );
  }

  return (
    <td
      className="border-b border-slate-900/40 bg-slate-950/30 p-0 cursor-text border-l border-gray-800/50"
      style={{ width: ncw, minWidth: ncw, maxWidth: ncw, height: cellHeight, verticalAlign: 'top' }}
      onClick={() => setEditing(true)}
      title={displayNotes || 'Klick für Notiz'}
    >
      {displayNotes ? (
        <div className="text-[8px] text-gray-300 leading-tight p-1 overflow-hidden whitespace-pre-line" style={{ maxHeight: cellHeight }}>
          {displayNotes}
        </div>
      ) : (
        <div className="text-[7px] text-gray-700 p-1 italic">…</div>
      )}
    </td>
  );
}

export function WeekRows({ weeks, courses, allWeeks: allWeeksProp, currentRef }: Props) {
  const {
    selection, setSelection,
    multiSelection, toggleMultiSelect, clearMultiSelect, selectRange,
    editing, setEditing,
    weekData, updateLesson,
    dragSource, setDragSource, swapLessons, moveLessonToEmpty, moveGroup,
    sequences, editingSequenceId,
    hkOverrides, hkStartGroups, setHKOverride,
    tafPhases,
    setSidePanelOpen, setSidePanelTab,
    lessonDetails,
    setInsertDialog, pushLessons, pushUndo,
    searchQuery,
    expandedNoteCols,
    dimPastWeeks,
  } = usePlannerStore();

  const [dropTarget, setDropTarget] = useState<{ week: string; col: number } | null>(null);
  const [hoverCell, setHoverCell] = useState<{ week: string; col: number } | null>(null);
  const [showHoverPreview, setShowHoverPreview] = useState(false);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [emptyCellMenu, setEmptyCellMenu] = useState<{ week: string; course: Course } | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | undefined>(undefined);

  // Drag-selection for empty cells
  const [isDragSelecting, setIsDragSelecting] = useState(false);
  const [dragSelectCol, setDragSelectCol] = useState<number | null>(null);
  const [dragSelectedWeeks, setDragSelectedWeeks] = useState<string[]>([]);
  const [dragSelectCourse, setDragSelectCourse] = useState<Course | null>(null);
  // Multi-day shift-click popup
  const [multiDayPrompt, setMultiDayPrompt] = useState<{ weekW: string; courseId: string; position: { x: number; y: number } } | null>(null);

  // Close multi-day prompt on click outside or Escape
  useEffect(() => {
    if (!multiDayPrompt) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMultiDayPrompt(null);
    };
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-multiday-prompt]')) setMultiDayPrompt(null);
    };
    document.addEventListener('keydown', handleKey);
    // Delay click listener to avoid catching the triggering click
    const timer = setTimeout(() => document.addEventListener('mousedown', handleClick), 50);
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.removeEventListener('mousedown', handleClick);
      clearTimeout(timer);
    };
  }, [multiDayPrompt]);

  const displayWeeks = weekData.length > 0
    ? weeks.map((w) => weekData.find((wd) => wd.w === w.w) || w)
    : weeks;

  const allWeekKeys = allWeeksProp || weeks.map(w => w.w);

  // Pre-compute holiday/event spans for merged rows (like ZoomYearView)
  const { holidaySkipSet, holidaySpanStart, eventWeeks } = React.useMemo(() => {
    const spans: { startIdx: number; len: number; label: string; type: 'holiday'; weekKeys: string[] }[] = [];
    const events = new Map<string, { label: string; affectedCols: Set<number> }>();
    let i = 0;
    const dwKeys = displayWeeks.map(w => w.w);
    while (i < displayWeeks.length) {
      const wk = displayWeeks[i];
      const entries = Object.entries(wk.lessons || {});
      const allHoliday = entries.length > 0 && entries.every(([, e]) => (e as any).type === 6);

      if (allHoliday) {
        const label = (entries[0]?.[1] as any)?.title || 'Ferien';
        const startIdx = i;
        const weekKeys: string[] = [];
        while (i < displayWeeks.length) {
          const nwk = displayWeeks[i];
          const ne = Object.entries(nwk.lessons || {});
          if (!(ne.length > 0 && ne.every(([, e]) => (e as any).type === 6))) break;
          weekKeys.push(nwk.w);
          i++;
        }
        spans.push({ startIdx, len: i - startIdx, label, type: 'holiday', weekKeys });
      } else {
        // Check for event/sonderwoche: any course has type 5
        const eventEntries = entries.filter(([, e]) => (e as any).type === 5);
        if (eventEntries.length > 0) {
          const label = (eventEntries[0][1] as any)?.title || 'Sonderwoche';
          const affectedCols = new Set(eventEntries.map(([col]) => parseInt(col)));
          events.set(wk.w, { label, affectedCols });
        }
        i++;
      }
    }

    const skipSet = new Set<string>();
    const spanStart = new Map<string, typeof spans[0]>();
    for (const span of spans) {
      spanStart.set(dwKeys[span.startIdx], span);
      for (let j = 1; j < span.len; j++) {
        skipSet.add(dwKeys[span.startIdx + j]);
      }
    }
    return { holidaySkipSet: skipSet, holidaySpanStart: spanStart, eventWeeks: events };
  }, [displayWeeks]);

  // Single click: select + show mini-buttons (no detail panel)
  const handleClick = useCallback(
    (weekW: string, course: Course, title: string, e: React.MouseEvent) => {
      if (!title) return;
      if (e.shiftKey) {
        // Shift+Click: range select. Alt+Shift = both days, Shift only = single day
        selectRange(`${weekW}-${course.id}`, allWeekKeys, courses, e.altKey ? true : false);
        setSidePanelOpen(true);
        setSidePanelTab('details');
      } else if (e.metaKey || e.ctrlKey) {
        toggleMultiSelect(`${weekW}-${course.id}`);
        setSidePanelOpen(true);
        setSidePanelTab('details');
      } else {
        clearMultiSelect();
        const isSame = selection?.week === weekW && selection?.courseId === course.id;
        setSelection(isSame ? null : { week: weekW, courseId: course.id, title, course });
        if (isSame) {
          setSidePanelOpen(false);
          usePlannerStore.getState().setEditingSequenceId(null);
        }
        // Don't open side panel on single click
      }
    },
    [selection, setSelection, toggleMultiSelect, clearMultiSelect, selectRange, allWeekKeys, courses]
  );

  // Double click: open side panel with details tab
  const handleDoubleClick = useCallback(
    (weekW: string, course: Course, title: string) => {
      if (!title) return;
      setSelection({ week: weekW, courseId: course.id, title, course });
      setSidePanelOpen(true);
      setSidePanelTab('details');
    },
    [setSelection, setSidePanelOpen, setSidePanelTab]
  );

  // Empty cell click
  const handleEmptyCellClick = useCallback(
    (weekW: string, course: Course) => {
      setEmptyCellMenu({ week: weekW, course });
    },
    []
  );

  const handleSaveEdit = useCallback(
    (weekW: string, col: number, newTitle: string) => {
      const week = displayWeeks.find((w) => w.w === weekW);
      const existing = week?.lessons[col];
      if (existing) { updateLesson(weekW, col, { ...existing, title: newTitle }); }
      setEditing(null);
    },
    [displayWeeks, updateLesson, setEditing]
  );

  // Hover preview logic
  const handleMouseEnter = useCallback((weekW: string, col: number) => {
    setHoverCell({ week: weekW, col });
    setShowHoverPreview(false);
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => setShowHoverPreview(true), 800);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoverCell(null);
    setShowHoverPreview(false);
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
  }, []);

  // Mini action buttons for selected cell
  const handleMiniInsert = useCallback((e: React.MouseEvent, course: Course, weekW: string) => {
    e.stopPropagation();
    const paired = COURSES_CACHE.filter(c => c.id !== course.id && c.cls === course.cls && c.typ === course.typ && c.les !== course.les);
    setInsertDialog({ week: weekW, course, hasMismatch: paired.length > 0, pairedCourses: paired });
  }, [setInsertDialog]);

  const handleMiniPush = useCallback((e: React.MouseEvent, course: Course, weekW: string) => {
    e.stopPropagation();
    pushUndo();
    pushLessons(course.col, weekW, allWeekKeys);
  }, [pushUndo, pushLessons, allWeekKeys]);

  const handleMiniDetails = useCallback((e: React.MouseEvent, course: Course, weekW: string, title: string) => {
    e.stopPropagation();
    setSelection({ week: weekW, courseId: course.id, title, course });
    setSidePanelOpen(true);
    setSidePanelTab('details');
  }, [setSelection, setSidePanelOpen, setSidePanelTab]);

  // Drag-selection handlers for empty cells
  const handleDragSelectStart = useCallback((weekW: string, course: Course) => {
    const entry = displayWeeks.find(w => w.w === weekW);
    const title = entry?.lessons[course.col]?.title;
    if (title) return; // Only on empty cells
    setIsDragSelecting(true);
    setDragSelectCol(course.col);
    setDragSelectCourse(course);
    setDragSelectedWeeks([weekW]);
    setEmptyCellMenu(null);
  }, [displayWeeks]);

  const handleDragSelectMove = useCallback((weekW: string, col: number) => {
    if (!isDragSelecting || col !== dragSelectCol) return;
    const entry = displayWeeks.find(w => w.w === weekW);
    const title = entry?.lessons[col]?.title;
    if (title) return; // Skip filled cells
    setDragSelectedWeeks(prev => prev.includes(weekW) ? prev : [...prev, weekW]);
  }, [isDragSelecting, dragSelectCol, displayWeeks]);

  const handleDragSelectEnd = useCallback(() => {
    if (!isDragSelecting) return;
    setIsDragSelecting(false);
    if (dragSelectedWeeks.length > 0 && dragSelectCourse) {
      // Show context menu at the last selected cell
      setEmptyCellMenu({ week: dragSelectedWeeks[dragSelectedWeeks.length - 1], course: dragSelectCourse });
    }
  }, [isDragSelecting, dragSelectedWeeks, dragSelectCourse]);

  // Global mouseup listener for drag-selection
  useEffect(() => {
    if (!isDragSelecting) return;
    const handler = () => handleDragSelectEnd();
    window.addEventListener('mouseup', handler);
    return () => window.removeEventListener('mouseup', handler);
  }, [isDragSelecting, handleDragSelectEnd]);

  return (
    <>
      {displayWeeks.map((week) => {
        const isCurrent = week.w === CURRENT_WEEK;
        const past = isPastWeek(week.w, CURRENT_WEEK);

        // Skip weeks that are covered by a holiday/event rowSpan
        if (holidaySkipSet.has(week.w)) return null;

        // Check if this is the start of a holiday span
        const hSpan = holidaySpanStart.get(week.w);
        if (hSpan) {
          const ROW_H = 36;
          const spanH = hSpan.len * ROW_H;
          return (
            <tr
              key={week.w}
              ref={isCurrent ? currentRef : undefined}
              data-week={week.w}
              className="group"
              style={{ opacity: dimPastWeeks && past && !isCurrent ? 0.5 : 1 }}
            >
              {/* Week number(s) */}
              <td
                className="sticky left-0 z-30 px-1 text-center border-b border-slate-900/60"
                style={{ background: '#0c0f1a' }}
                rowSpan={hSpan.len}
              >
                <div className="flex flex-col items-center">
                  <span className="text-[9px] font-mono font-medium text-gray-500">{hSpan.weekKeys[0]}</span>
                  {hSpan.len > 1 && (
                    <span className="text-[8px] font-mono text-gray-600">–{hSpan.weekKeys[hSpan.len - 1]}</span>
                  )}
                </div>
              </td>
              {/* Merged cell spanning all course columns */}
              <td
                colSpan={courses.length}
                rowSpan={hSpan.len}
                className="border-b border-slate-800/30 text-center align-middle"
                style={{
                  background: '#1e293b50',
                  height: spanH,
                }}
              >
                <div className="flex items-center justify-center gap-1.5">
                  <span className="text-[11px]">🏖</span>
                  <span className="text-[11px] font-medium text-gray-400">
                    {hSpan.label}
                  </span>
                  {hSpan.len > 1 && (
                    <span className="text-[9px] text-gray-500">({hSpan.len}W)</span>
                  )}
                </div>
              </td>
            </tr>
          );
        }

        const eventInfo = eventWeeks.get(week.w);

        return (
          <tr
            key={week.w}
            ref={isCurrent ? currentRef : undefined}
            data-week={week.w}
            className="group"
            style={{
              opacity: dimPastWeeks && past && !isCurrent ? 0.6 : 1,
              background: eventInfo ? '#78350f18' : undefined,
            }}
          >
            {/* Week number */}
            <td
              className="sticky left-0 z-30 px-1 text-center border-b border-slate-900/60"
              style={{ background: isCurrent ? '#172554' : '#0c0f1a' }}
            >
              <div className={`text-[9px] font-mono ${isCurrent ? 'font-extrabold text-blue-400' : 'font-medium text-gray-500'}`}>
                {week.w}
              </div>
              {isCurrent && <div className="w-1 h-1 rounded-full bg-blue-400 mx-auto mt-0.5 animate-pulse" />}
              {eventInfo && <div className="text-[7px] text-amber-500/70 leading-tight mt-0.5 max-w-[40px] overflow-hidden" title={eventInfo.label}>📅</div>}
            </td>

            {/* Lesson cells */}
            {courses.map((c, ci) => {
              const newDay = ci === 0 || c.day !== courses[ci - 1]?.day;
              const entry = week.lessons[c.col];
              const title = entry?.title || '';
              const lessonType = entry?.type ?? -1;
              const colors = lessonType >= 0 ? LESSON_COLORS[lessonType as keyof typeof LESSON_COLORS] : null;
              const isSelected = selection?.week === week.w && selection?.courseId === c.id;
              const isMulti = multiSelection.includes(`${week.w}-${c.id}`);
              const isEditing = editing?.week === week.w && editing?.col === c.col;
              const seq = getSequenceInfoFromStore(c.id, week.w, sequences);
              const cellHeight = c.les >= 2 ? 36 : 26;
              const isDragOver = dropTarget?.week === week.w && dropTarget?.col === c.col;
              const isDragSrc = dragSource?.week === week.w && dragSource?.col === c.col;
              const hkGroup = c.hk ? getHKGroup(week.w, c.col, hkStartGroups[c.col] || 'A', hkOverrides) : null;
              const isHovered = hoverCell?.week === week.w && hoverCell?.col === c.col;
              const showPreview = isHovered && showHoverPreview && title && !isSelected;
              const showEmptyMenu = emptyCellMenu?.week === week.w && emptyCellMenu?.course.id === c.id;

              // Lesson detail for display (with block inheritance)
              const cellDetail = lessonDetails[`${week.w}-${c.col}`];
              const parentBlock = seq ? (() => {
                const parentSeq = sequences.find(s => s.id === seq.sequenceId);
                return parentSeq?.blocks.find(b => b.weeks.includes(week.w));
              })() : null;

              // Use SubjectArea color if available (more precise than LessonType)
              const effectiveSubjectArea = cellDetail?.subjectArea || parentBlock?.subjectArea;
              const saColors = effectiveSubjectArea ? SUBJECT_AREA_COLORS[effectiveSubjectArea] : null;
              const cellColors = saColors || colors;

              // Sequence highlight: is this cell part of the currently edited sequence/block?
              const editingParts = editingSequenceId?.match(/^(.+)-(\d+)$/);
              const editingSeqId = editingParts ? editingParts[1] : editingSequenceId;
              const editingBlockIdx = editingParts ? parseInt(editingParts[2]) : null;
              const editingSeq = editingSeqId ? sequences.find(s => s.id === editingSeqId) : null;
              const editingSeqMatchesCourse = editingSeq && (
                editingSeq.courseId === c.id ||
                (editingSeq.courseIds && editingSeq.courseIds.includes(c.id))
              );
              const editingBlock = editingSeq && editingBlockIdx !== null ? editingSeq.blocks[editingBlockIdx] : null;
              const isInEditingSeq = editingSeqMatchesCourse && (
                editingBlock ? editingBlock.weeks.includes(week.w) : editingSeq?.blocks.some(b => b.weeks.includes(week.w))
              );
              const isSeqDimmed = editingSeqMatchesCourse && !isInEditingSeq && !!title;
              const effectiveTopicMain = cellDetail?.topicMain || parentBlock?.topicMain;
              const effectiveTopicSub = cellDetail?.topicSub || parentBlock?.topicSub;
              const displayTitle = effectiveTopicMain
                ? (effectiveTopicSub ? `${effectiveTopicMain} › ${effectiveTopicSub}` : effectiveTopicMain)
                : title;

              // Fixed cells: holidays (type 6) and events (type 5) should not be draggable
              const isFixed = lessonType === 6 || lessonType === 5;

              // Search match
              const searchLower = searchQuery.toLowerCase();
              const isSearchMatch = searchQuery.length >= 2 && (
                displayTitle.toLowerCase().includes(searchLower) ||
                title.toLowerCase().includes(searchLower) ||
                (cellDetail?.notes || '').toLowerCase().includes(searchLower) ||
                (cellDetail?.curriculumGoal || '').toLowerCase().includes(searchLower) ||
                (seq?.label || '').toLowerCase().includes(searchLower)
              );
              const isSearchDimmed = searchQuery.length >= 2 && !isSearchMatch && !!title;

              const tafPhase = tafPhases.find(p => {
                const allW = weeks.map(w => w.w);
                const si = allW.indexOf(p.startWeek);
                const ei = allW.indexOf(p.endWeek);
                const wi = allW.indexOf(week.w);
                return si >= 0 && ei >= 0 && wi >= si && wi <= ei;
              });

              return (
                <React.Fragment key={c.id}>
                <td
                  className="p-0 border-b border-slate-900/40 relative group-hover:bg-slate-950/40"
                  style={{
                    borderLeft: newDay ? `2px solid ${DAY_COLORS[c.day]}12` : 'none',
                    outline: isDragOver ? '2px solid #3b82f6'
                      : (dragSelectCol === c.col && dragSelectedWeeks.includes(week.w)) ? '2px solid #a855f7'
                      : isMulti && !title ? '2px solid #6366f180' : 'none',
                    outlineOffset: '-2px',
                    background: isDragOver ? '#1e3a5f30'
                      : (dragSelectCol === c.col && dragSelectedWeeks.includes(week.w)) ? '#7c3aed20'
                      : isMulti && !title ? '#312e8140' : undefined,
                    width: 110,
                    minWidth: 110,
                    maxWidth: 110,
                  }}
                  onMouseDown={(e) => {
                    if (!title && !e.shiftKey && !e.metaKey && !e.ctrlKey && e.button === 0) {
                      handleDragSelectStart(week.w, c);
                    }
                  }}
                  onMouseEnter={() => {
                    if (isDragSelecting) handleDragSelectMove(week.w, c.col);
                    if (title) handleMouseEnter(week.w, c.col);
                  }}
                  onMouseLeave={handleMouseLeave}
                  onClick={(e) => {
                    if (e.shiftKey || e.metaKey || e.ctrlKey) {
                      if (title) {
                        if (e.shiftKey) {
                          // Always select just this day first
                          selectRange(`${week.w}-${c.id}`, allWeekKeys, courses, false);
                          // Check if multi-day course → show prompt (unless other day already selected)
                          const linked = getLinkedCourseIds(c.id);
                          if (linked.length > 1) {
                            const otherIds = linked.filter(id => id !== c.id);
                            // Check if any other day is already in multiSelection (user manually selected both)
                            const currentMulti = usePlannerStore.getState().multiSelection;
                            const otherDayAlreadySelected = otherIds.some(oid =>
                              currentMulti.some(k => k.endsWith(`-${oid}`))
                            );
                            if (!otherDayAlreadySelected) {
                              const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                              setMultiDayPrompt({ weekW: week.w, courseId: c.id, position: { x: rect.left + rect.width / 2, y: rect.top } });
                            }
                          }
                        } else {
                          toggleMultiSelect(`${week.w}-${c.id}`);
                        }
                      } else {
                        // Cmd/Ctrl+Click on empty cell: show context menu at cursor position
                        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                        setMenuPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
                        setEmptyCellMenu({ week: week.w, course: c });
                      }
                    } else if (title) {
                      handleClick(week.w, c, title, e);
                      // Clear drag selection when clicking filled cell
                      setDragSelectedWeeks([]); setDragSelectCol(null); setDragSelectCourse(null);
                    } else {
                      // Click on empty cell: select it (mark visually) and close panel
                      clearMultiSelect();
                      setSelection({ week: week.w, courseId: c.id, title: '', course: c });
                      setEmptyCellMenu(null);
                      setDragSelectedWeeks([]); setDragSelectCol(null); setDragSelectCourse(null);
                      usePlannerStore.getState().setEditingSequenceId(null);
                      setSidePanelOpen(false);
                    }
                  }}
                  onDoubleClick={(e) => {
                    if (title) {
                      handleDoubleClick(week.w, c, title);
                    } else {
                      // Double-click on empty cell: show new tile/sequence menu at cursor
                      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                      setMenuPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
                      handleEmptyCellClick(week.w, c);
                    }
                  }}
                  onDragOver={(e) => {
                    if (dragSource) {
                      const dragCourse = courses.find(cc => cc.col === dragSource.col);
                      const dragKey = dragCourse ? `${dragSource.week}-${dragCourse.id}` : '';
                      const isGroupDrag = multiSelection.length > 1 && multiSelection.includes(dragKey);
                      if (isGroupDrag || dragSource.col === c.col) {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                        setDropTarget({ week: week.w, col: c.col });
                      }
                    }
                  }}
                  onDragLeave={() => setDropTarget(null)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDropTarget(null);
                    if (!dragSource) return;
                    if (dragSource.week === week.w && dragSource.col === c.col) return;
                    // Don't allow dropping onto fixed cells
                    if (isFixed) return;

                    // Check if dragging a multi-selected group
                    const dragCourse = courses.find(cc => cc.col === dragSource.col);
                    const dragKey = dragCourse ? `${dragSource.week}-${dragCourse.id}` : '';
                    const isGroupDrag = multiSelection.length > 1 && multiSelection.includes(dragKey);

                    if (isGroupDrag) {
                      // Group drag: move all selected cells by column to target position
                      // Group selections by column (col)
                      const byCol = new Map<number, string[]>();
                      for (const key of multiSelection) {
                        const parts = key.split('-');
                        const cid = parts[parts.length - 1];
                        const wk = parts.slice(0, parts.length - 1).join('-');
                        const course = courses.find(cc => cc.id === cid);
                        if (course) {
                          if (!byCol.has(course.col)) byCol.set(course.col, []);
                          byCol.get(course.col)!.push(wk);
                        }
                      }
                      // Calculate week offset from dragSource to drop target
                      const fromIdx = allWeekKeys.indexOf(dragSource.week);
                      const toIdx = allWeekKeys.indexOf(week.w);
                      if (fromIdx >= 0 && toIdx >= 0) {
                        const offset = toIdx - fromIdx;
                        // Move each column's group by the same offset
                        for (const [col, weeks] of byCol) {
                          const sorted = [...weeks].sort((a, b) => allWeekKeys.indexOf(a) - allWeekKeys.indexOf(b));
                          const targetWeek = allWeekKeys[allWeekKeys.indexOf(sorted[0]) + offset];
                          if (targetWeek) {
                            moveGroup(col, sorted, targetWeek, allWeekKeys);
                          }
                        }
                      }
                    } else if (dragSource.col === c.col) {
                      if (title) {
                        swapLessons(c.col, dragSource.week, week.w);
                      } else {
                        moveLessonToEmpty(c.col, dragSource.week, week.w);
                      }
                    }
                    setDragSource(null);
                  }}
                >
                  {/* Sequence bar — color from subject area (VWL=orange, BWL=blue, Recht=green) */}
                  {/* Don't show sequence bar for holidays (type 6) and events (type 5) */}
                  {seq && title && !isFixed && (
                    <div
                      className="absolute left-0 w-[5px] opacity-80 cursor-pointer hover:opacity-100 hover:w-[7px] transition-all"
                      style={{
                        top: seq.isFirst ? 3 : 0,
                        bottom: seq.isLast ? 3 : 0,
                        background: (() => {
                          // Use subject area color for the bar
                          const seqBarSA = effectiveSubjectArea || (() => {
                            const parentSeq = sequences.find(s => s.id === seq.sequenceId);
                            const block = parentSeq?.blocks.find(b => b.weeks.includes(week.w));
                            return block?.subjectArea || parentSeq?.subjectArea;
                          })();
                          const SA_BAR_COLORS: Record<string, string> = {
                            VWL: '#f97316', BWL: '#3b82f6', RECHT: '#22c55e', IN: '#6b7280', INTERDISZ: '#a855f7'
                          };
                          return (seqBarSA && SA_BAR_COLORS[seqBarSA]) || seq.color || '#16a34a';
                        })(),
                        borderRadius: seq.isFirst ? '2px 0 0 0' : seq.isLast ? '0 0 0 2px' : '0',
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        // Single click: highlight + open sequences panel
                        const parentSeq = sequences.find(s => s.id === seq.sequenceId);
                        if (parentSeq) {
                          const currentEditing = usePlannerStore.getState().editingSequenceId;
                          const isAlreadyEditing = currentEditing?.startsWith(parentSeq.id);
                          if (isAlreadyEditing) {
                            usePlannerStore.getState().setEditingSequenceId(null);
                          } else {
                            usePlannerStore.getState().setEditingSequenceId(parentSeq.id);
                            setSidePanelOpen(true);
                            setSidePanelTab('sequences');
                          }
                        }
                      }}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                      }}
                      title={`Klick: Sequenz hervorheben · Doppelklick: Sequenz bearbeiten`}
                    />
                  )}
                  {seq?.isFirst && title && !isFixed && (
                    <div className="absolute left-1.5 -top-0.5 text-[6px] font-bold z-10 bg-[#0c0f1a] px-0.5 rounded whitespace-nowrap cursor-pointer"
                      style={{ color: (() => {
                        const seqLabelSA = effectiveSubjectArea || (() => {
                          const parentSeq = sequences.find(s => s.id === seq.sequenceId);
                          const block = parentSeq?.blocks.find(b => b.weeks.includes(week.w));
                          return block?.subjectArea || parentSeq?.subjectArea;
                        })();
                        const SA_LABEL_COLORS: Record<string, string> = {
                          VWL: '#fb923c', BWL: '#60a5fa', RECHT: '#4ade80', IN: '#9ca3af', INTERDISZ: '#c084fc'
                        };
                        return (seqLabelSA && SA_LABEL_COLORS[seqLabelSA]) || seq.color || '#4ade80';
                      })() }}
                      onClick={(e) => {
                        e.stopPropagation();
                        const parentSeq = sequences.find(s => s.id === seq.sequenceId);
                        if (parentSeq) {
                          const currentEditing = usePlannerStore.getState().editingSequenceId;
                          const isAlreadyEditing = currentEditing?.startsWith(parentSeq.id);
                          if (isAlreadyEditing) {
                            usePlannerStore.getState().setEditingSequenceId(null);
                          } else {
                            usePlannerStore.getState().setEditingSequenceId(parentSeq.id);
                            setSidePanelOpen(true);
                            setSidePanelTab('sequences');
                          }
                        }
                      }}
                      onDoubleClick={(e) => e.stopPropagation()}
                      title="Klick: Sequenz anzeigen/bearbeiten"
                    >
                      {seq.label}
                      {(() => { const s = sequences.find(x => x.id === seq.sequenceId); return s?.sol?.enabled ? ' 📚' : ''; })()}
                    </div>
                  )}

                  {/* HK Rotation Badge */}
                  {hkGroup && title && (
                    <div
                      className="absolute right-0.5 top-0 text-[7px] font-bold z-10 px-1 py-px rounded-bl cursor-pointer select-none"
                      style={{
                        background: hkGroup === 'A' ? '#7c3aed40' : '#0ea5e940',
                        color: hkGroup === 'A' ? '#a78bfa' : '#67e8f9',
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setHKOverride(week.w, c.col, hkGroup === 'A' ? 'B' : 'A');
                      }}
                      title={`HK ${hkGroup} – Klick zum Wechseln`}
                    >
                      {hkGroup}
                    </div>
                  )}

                  {/* TaF Phase indicator */}
                  {tafPhase && ci === 0 && (
                    <div
                      className="absolute left-0 top-0 bottom-0 w-[2px]"
                      style={{ background: tafPhase.color }}
                      title={tafPhase.name}
                    />
                  )}

                  {isEditing ? (
                    <div className="mx-0.5 ml-1.5" style={{ minHeight: cellHeight }}>
                      <InlineEdit
                        value={title}
                        onSave={(v) => handleSaveEdit(week.w, c.col, v)}
                        onCancel={() => setEditing(null)}
                      />
                    </div>
                  ) : title && lessonType === 6 ? (
                    /* Holiday cells: grau, nicht klickbar/draggable */
                    <div
                      className="mx-0.5 ml-1.5 px-1.5 py-1 rounded flex items-center justify-center cursor-default"
                      style={{
                        minHeight: Math.max(cellHeight, 32),
                        opacity: isSearchDimmed ? 0.2 : 1,
                        background: '#1e293b60',
                        border: '1px solid #334155',
                      }}
                    >
                      <span className="mr-1 text-[9px]">🏖</span>
                      <span className="text-[9px] font-medium leading-tight text-gray-400"
                        style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {displayTitle}
                      </span>
                    </div>
                  ) : title && lessonType === 5 ? (
                    /* Event/Sonderwoche cells: amber, klickbar (Studienreisen etc. brauchen Planung) */
                    <div
                      className="mx-0.5 ml-1.5 px-1.5 py-1 rounded flex items-center justify-center cursor-pointer hover:brightness-110 transition-all"
                      style={{
                        minHeight: Math.max(cellHeight, 32),
                        opacity: isSearchDimmed ? 0.2 : isSelected ? 1 : 0.9,
                        background: isSelected ? '#78350f' : '#451a0340',
                        border: `1px solid ${isSelected ? '#f59e0b' : '#92400e60'}`,
                        boxShadow: isSelected ? '0 0 0 2px #f59e0b40' : 'none',
                      }}
                      onClick={(e) => { e.stopPropagation(); handleClick(week.w, c, title, e); }}
                      onDoubleClick={() => handleDoubleClick(week.w, c, title)}
                    >
                      <span className="mr-1 text-[9px]">📅</span>
                      <span className="text-[9px] font-medium leading-tight text-amber-400/80"
                        style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {displayTitle}
                      </span>
                    </div>
                  ) : title ? (
                    <div
                      draggable={!isFixed}
                      onDragStart={(e) => {
                        if (isFixed) { e.preventDefault(); return; }
                        setDragSource({ week: week.w, col: c.col });
                        e.dataTransfer.effectAllowed = 'move';
                        const isGroupDrag = multiSelection.length > 1 && multiSelection.includes(`${week.w}-${c.id}`);
                        e.dataTransfer.setData('text/plain', isGroupDrag ? `group:${c.col}` : `${week.w}:${c.col}`);
                      }}
                      onDragEnd={() => { setDragSource(null); setDropTarget(null); }}
                      className={`mx-0.5 ml-1.5 px-1 py-0.5 rounded transition-all duration-100 flex items-center hover:shadow-md hover:z-10 relative ${isFixed ? 'cursor-default' : 'cursor-grab hover:scale-[1.02]'} ${isSearchMatch ? 'search-highlight' : ''}`}
                      style={{
                        minHeight: isFixed ? Math.max(cellHeight, 32) : cellHeight,
                        opacity: isDragSrc ? 0.35 : isSeqDimmed ? 0.3 : isSearchDimmed ? 0.2 : 1,
                        background: isInEditingSeq ? '#1e3a5f' : isMulti ? '#312e81' : isSelected ? '#1e3a5f' : cellColors?.bg || '#eef2f7',
                        border: `1px solid ${isInEditingSeq ? '#60a5fa' : isMulti ? '#6366f1' : isSelected ? '#3b82f6' : cellColors?.border || '#cbd5e1'}`,
                        boxShadow: isInEditingSeq ? '0 0 0 2px #3b82f640' : isMulti ? '0 0 0 2px #6366f150' : isSelected ? '0 0 0 2px #3b82f650' : 'none',
                      }}
                    >
                      {lessonType === 4 && <span className="mr-0.5 text-[8px]">📝</span>}
                      {isFixed && <span className="mr-0.5 text-[8px]">{lessonType === 6 ? '🏖' : '📅'}</span>}
                      {cellDetail?.sol?.enabled && <span className="mr-0.5 text-[8px]" title="SOL">📚</span>}
                      <div
                        className="leading-tight overflow-hidden flex-1 cursor-pointer"
                        onClick={(e) => {
                          // Let Cmd/Shift clicks propagate to td for multi-select handling
                          if (e.metaKey || e.ctrlKey || e.shiftKey) return;
                          e.stopPropagation();
                          setSelection({ week: week.w, courseId: c.id, title, course: c });
                          setSidePanelOpen(true);
                          setSidePanelTab('details');
                        }}
                        title="Klick: Details öffnen"
                        style={{
                          fontSize: c.les >= 2 ? 9 : 8,
                          fontWeight: lessonType === 4 || isFixed ? 700 : 500,
                          color: isInEditingSeq ? '#93c5fd' : isMulti ? '#c7d2fe' : isSelected ? '#e2e8f0' : cellColors?.fg || '#475569',
                          display: '-webkit-box',
                          WebkitLineClamp: c.les >= 2 ? 3 : 2,
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        {displayTitle}
                      </div>

                      {/* Mini action buttons on selection */}
                      {isSelected && (
                        <div className="absolute right-0.5 bottom-0.5 flex gap-px z-20">
                          <button
                            onClick={(e) => handleMiniInsert(e, c, week.w)}
                            className="w-4 h-4 rounded bg-slate-700/90 text-gray-300 text-[8px] flex items-center justify-center cursor-pointer hover:bg-blue-600 hover:text-white border border-slate-600"
                            title="Einfügen (leere Zeile davor)"
                          >+</button>
                          <button
                            onClick={(e) => handleMiniPush(e, c, week.w)}
                            className="w-4 h-4 rounded bg-slate-700/90 text-gray-300 text-[8px] flex items-center justify-center cursor-pointer hover:bg-blue-600 hover:text-white border border-slate-600"
                            title="Push (nach unten verschieben)"
                          >↓</button>
                          <button
                            onClick={(e) => handleMiniDetails(e, c, week.w, title)}
                            className="w-4 h-4 rounded bg-slate-700/90 text-gray-300 text-[8px] flex items-center justify-center cursor-pointer hover:bg-blue-600 hover:text-white border border-slate-600"
                            title="Details öffnen"
                          >i</button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div
                      className={`cursor-pointer rounded mx-0.5 transition-all ${isSelected ? 'bg-blue-900/30 border border-blue-500/50 shadow-[0_0_0_1px_#3b82f640]' : 'hover:bg-slate-800/40'}`}
                      style={{ minHeight: cellHeight }}
                      title="Doppelklick: Neue Kachel oder Sequenz"
                    />
                  )}

                  {/* Hover preview popover */}
                  {showPreview && <HoverPreview week={week.w} col={c.col} courses={courses} courseIndex={ci} totalCourses={courses.length} />}

                  {/* Empty cell context menu */}
                  {showEmptyMenu && (
                    <EmptyCellMenu
                      week={week.w}
                      course={c}
                      onClose={() => { setEmptyCellMenu(null); setMenuPosition(undefined); setDragSelectedWeeks([]); setDragSelectCol(null); setDragSelectCourse(null); }}
                      selectedWeeks={dragSelectedWeeks.length > 1 ? dragSelectedWeeks : undefined}
                      position={menuPosition}
                    />
                  )}
                </td>
                {expandedNoteCols[c.id] && (
                  <NoteCell weekW={week.w} col={c.col} cellHeight={cellHeight} />
                )}
                </React.Fragment>
              );
            })}
          </tr>
        );
      })}

      {/* Multi-day shift-click prompt */}
      {multiDayPrompt && (() => {
        const linked = getLinkedCourseIds(multiDayPrompt.courseId);
        const otherIds = linked.filter(id => id !== multiDayPrompt.courseId);
        const otherCourses = otherIds.map(id => COURSES_CACHE.find(cc => cc.id === id)).filter(Boolean);
        const otherDays = otherCourses.map(cc => cc!.day).join('/');
        return (
          <tr>
            <td colSpan={courses.length + 1} className="p-0 relative">
              <div data-multiday-prompt className="fixed z-[90] bg-slate-800 border border-purple-500 rounded-lg shadow-2xl py-1 px-2 w-auto"
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                style={{ top: multiDayPrompt.position.y - 40, left: multiDayPrompt.position.x - 60 }}>
                <div className="text-[9px] text-gray-300 mb-1">Auch <span className="font-bold text-purple-300">{otherDays}</span> auswählen?</div>
                <div className="flex gap-1">
                  <button onClick={() => {
                    // Expand entire current multiSelection to include other days
                    const currentMulti = usePlannerStore.getState().multiSelection;
                    const newKeys: string[] = [];
                    for (const key of currentMulti) {
                      const parts = key.split('-');
                      const cid = parts[parts.length - 1];
                      const wk = parts.slice(0, parts.length - 1).join('-');
                      // If this key belongs to a linked course, also add the other day(s)
                      const keyLinked = getLinkedCourseIds(cid);
                      if (keyLinked.length > 1) {
                        for (const otherId of keyLinked) {
                          if (otherId !== cid) {
                            const otherKey = `${wk}-${otherId}`;
                            if (!currentMulti.includes(otherKey)) newKeys.push(otherKey);
                          }
                        }
                      }
                    }
                    if (newKeys.length > 0) {
                      usePlannerStore.setState((s) => ({
                        multiSelection: Array.from(new Set([...s.multiSelection, ...newKeys])),
                      }));
                    }
                    setMultiDayPrompt(null);
                  }} className="px-2 py-0.5 rounded text-[9px] bg-purple-600 text-white cursor-pointer hover:bg-purple-500">Ja, beide Tage</button>
                  <button onClick={() => setMultiDayPrompt(null)}
                    className="px-2 py-0.5 rounded text-[9px] border border-gray-600 text-gray-400 cursor-pointer hover:text-gray-200">Nein</button>
                </div>
              </div>
            </td>
          </tr>
        );
      })()}
    </>
  );
}

// We need courses for paired detection in mini-buttons
import { COURSES as COURSES_CACHE, getLinkedCourseIds } from '../data/courses';
