import React, { useCallback, useState, useRef, useEffect } from 'react';
import type { Course, Week } from '../types';
import { LESSON_COLORS, SUBJECT_AREA_COLORS, DAY_COLORS, getSequenceInfoFromStore, isPastWeek } from '../utils/colors';
import { CURRENT_WEEK } from '../data/weeks';
import { usePlannerStore, ZOOM_LEVELS, zs } from '../store/plannerStore';
import { useGCalStore } from '../store/gcalStore';
import { getHKGroup } from '../utils/hkRotation';
import { InlineEdit, getCatColor, getCatBorder } from './InlineEdit';
import { HoverPreview } from './HoverPreview';
import { EmptyCellMenu } from './EmptyCellMenu';
import { NoteCell } from './NoteCell';

interface Props {
  weeks: Week[];
  courses: Course[];
  allWeeks?: string[]; // All week keys across both semesters (for cross-semester shift-select)
  currentRef?: React.RefObject<HTMLTableRowElement | null>;
}


export function WeekRows({ weeks, courses, allWeeks: allWeeksProp, currentRef }: Props) {
  const {
    selection, setSelection,
    multiSelection, toggleMultiSelect, clearMultiSelect, selectRange,
    editing, setEditing,
    weekData, updateLesson,
    swapLessons, moveLessonToEmpty,
    sequences, editingSequenceId,
    hkOverrides, hkStartGroups, setHKOverride,
    tafPhases,
    setSidePanelOpen, setSidePanelTab,
    lessonDetails,
    pushUndo,
    searchQuery,
    expandedNoteCols,
    dimPastWeeks,
    plannerSettings,
    filter,
    columnZoom,
    autoFitZoom,
  } = usePlannerStore();

  const zoomCfg = ZOOM_LEVELS[columnZoom] || ZOOM_LEVELS[2];
  const z = (base: number) => zs(base, zoomCfg);
  const colW = zoomCfg.colWidth;

  const gcalCollisions = useGCalStore(s => s.collisions);

  const [hoverCell, setHoverCell] = useState<{ week: string; col: number } | null>(null);
  const [showHoverPreview, setShowHoverPreview] = useState(false);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [emptyCellMenu, setEmptyCellMenu] = useState<{ week: string; course: Course } | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | undefined>(undefined);

  // Drag-selection for cells (empty and filled)
  const [isDragSelecting, setIsDragSelecting] = useState(false);
  const [dragSelectCol, setDragSelectCol] = useState<number | null>(null);
  const [dragSelectedWeeks, setDragSelectedWeeks] = useState<string[]>([]);
  const [dragSelectCourse, setDragSelectCourse] = useState<Course | null>(null);
  const dragMoved = useRef(false);
  // Multi-day shift-click popup
  const [multiDayPrompt, setMultiDayPrompt] = useState<{ weekW: string; courseId: string; position: { x: number; y: number } } | null>(null);

  // Long-hold drag-move state (v3.82 E4: reduced to 150ms, 5px threshold)
  const [dragMoveSource, setDragMoveSource] = useState<{ week: string; col: number } | null>(null);
  const [dragMoveTarget, setDragMoveTarget] = useState<{ week: string; col: number } | null>(null);
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);
  const pendingDragCell = useRef<{ week: string; col: number } | null>(null);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Rhythm warning after push (1L↔2L)
  const [rhythmWarning, setRhythmWarning] = useState<string | null>(null);
  const checkRhythmAfterPush = useCallback((course: Course) => {
    const linked = getLinkedCourseIds(course.id);
    if (linked.length <= 1) return; // Not a multi-day course
    const linkedCourses = courses.filter(c => linked.includes(c.id));
    const hasDifferentDurations = new Set(linkedCourses.map(c => c.les)).size > 1;
    if (hasDifferentDurations) {
      const courseName = `${course.cls} ${course.typ}`;
      const durations = linkedCourses.map(c => `${c.day}=${c.les}L`).join(', ');
      setRhythmWarning(`Achtung: Rhythmisierung ${durations} bei ${courseName} nach Verschiebung beachten.`);
      setTimeout(() => setRhythmWarning(null), 5000);
    }
  }, [courses]);

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
  // G3: Nur gefilterte Kurs-Spalten berücksichtigen
  const visibleCols = React.useMemo(() => new Set(courses.map(c => c.col)), [courses]);

  // H2: Sonderwochen-Scope prüfen — bei aktivem Filter nur relevante Events anzeigen
  const validEventCols = React.useMemo(() => {
    if (filter === 'ALL' || !plannerSettings?.specialWeeks) return null; // null = keine Filterung
    // Kurs-ID → col Mapping (K1: gleiche Logik wie configToCourses — c.col ?? 100+i)
    const courseIdToCol = new Map<string, number>();
    const colToCourseType = new Map<number, string>();
    for (let i = 0; i < plannerSettings.courses.length; i++) {
      const c = plannerSettings.courses[i];
      const col = c.col ?? (100 + i);
      courseIdToCol.set(c.id, col);
      colToCourseType.set(col, c.typ);
    }
    // Pro Woche: welche Cols dürfen type 5 zeigen?
    const validMap = new Map<string, Set<number>>();
    for (const sw of plannerSettings.specialWeeks) {
      if (sw.type === 'holiday') continue;
      const hasCourseFilter = sw.courseFilter && sw.courseFilter.length > 0;
      // J5: gymLevel Mehrfachauswahl — normalisieren zu Array
      const rawLevel = sw.gymLevel;
      const levels = !rawLevel ? [] : Array.isArray(rawLevel) ? rawLevel : [rawLevel];
      const hasGymLevel = levels.length > 0 && !(levels.length === 1 && levels[0] === 'alle');
      // Ohne jeglichen Filter → überall anzeigen (null = nicht filtern)
      if (!hasCourseFilter && !hasGymLevel) continue;
      // Betroffene Cols ermitteln
      const cols = new Set<number>();
      if (hasCourseFilter) {
        for (const id of sw.courseFilter!) {
          const col = courseIdToCol.get(id);
          if (col !== undefined) cols.add(col);
        }
      }
      if (hasGymLevel) {
        for (let i = 0; i < plannerSettings.courses.length; i++) {
          const c = plannerSettings.courses[i];
          const col = c.col ?? (100 + i); // K1: gleiche Logik wie configToCourses
          const isTaF = /[fs]/.test(c.cls.replace(/\d/g, ''));
          const matchesAny = levels.some(lv => {
            if (lv === 'TaF') return isTaF;
            if (lv === 'alle') return true;
            return c.stufe ? c.stufe === lv : true; // K1: ohne stufe → matcht alle
          });
          if (matchesAny) cols.add(col);
        }
      }
      if (!validMap.has(sw.week)) validMap.set(sw.week, new Set());
      for (const col of cols) validMap.get(sw.week)!.add(col);
    }
    return validMap;
  }, [filter, plannerSettings]);

  // U1: Nur noch eventWeeks berechnen (kein holidaySpans/holidaySkipSet/holidaySpanStart mehr)
  const eventWeeks = React.useMemo(() => {
    const events = new Map<string, { label: string; affectedCols: Set<number> }>();
    for (const wk of displayWeeks) {
      const entries = Object.entries(wk.lessons || {}).filter(([col]) => visibleCols.has(parseInt(col)));
      // H2: Bei aktivem Filter Sonderwochen-Scope berücksichtigen
      const scopedCols = validEventCols?.get(wk.w);
      const eventEntries = entries.filter(([col, e]) => {
        if ((e as any).type !== 5) return false;
        if (scopedCols && !scopedCols.has(parseInt(col))) return false;
        return true;
      });
      if (eventEntries.length > 0) {
        const label = (eventEntries[0][1] as any)?.title || 'Sonderwoche';
        const affectedCols = new Set(eventEntries.map(([col]) => parseInt(col)));
        events.set(wk.w, { label, affectedCols });
      }
    }
    return events;
  }, [displayWeeks, visibleCols, validEventCols]);

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

  // Double click on event/holiday cell: start inline edit
  const handleEventCellAction = useCallback(
    (weekW: string, col: number, _title: string, action: 'edit') => {
      if (action === 'edit') {
        setEditing({ week: weekW, col });
      }
    },
    [setEditing]
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


  // Drag-selection handlers (works on both empty and filled cells)
  const handleDragSelectStart = useCallback((weekW: string, course: Course, e: React.MouseEvent) => {
    if (e.shiftKey || e.metaKey || e.ctrlKey) return;
    if (e.button !== 0) return;
    const entry = displayWeeks.find(w => w.w === weekW);
    const lesson = entry?.lessons[course.col];
    if (lesson?.type === 6) return; // Holidays not draggable
    // Clear any previous hold timer
    if (holdTimerRef.current) { clearTimeout(holdTimerRef.current); holdTimerRef.current = null; }
    // v3.82 E4: 150ms timer OR 5px movement triggers drag-move for filled cells
    if (lesson?.title) {
      const isFixed = lesson.type === 5 && !(lessonDetails[`${weekW}-${course.col}`]?.blockCategory === 'LESSON');
      if (!isFixed) {
        dragStartPos.current = { x: e.clientX, y: e.clientY };
        pendingDragCell.current = { week: weekW, col: course.col };
        holdTimerRef.current = setTimeout(() => {
          holdTimerRef.current = null;
          setIsDragSelecting(false);
          setDragSelectedWeeks([]);
          setDragSelectCol(null);
          setDragSelectCourse(null);
          setDragMoveSource({ week: weekW, col: course.col });
          dragMoved.current = true;
          pendingDragCell.current = null;
        }, 150);
      }
    }
    setIsDragSelecting(true);
    setDragSelectCol(course.col);
    setDragSelectCourse(course);
    setDragSelectedWeeks([weekW]);
    setEmptyCellMenu(null);
    dragMoved.current = false;
  }, [displayWeeks, lessonDetails]);

  const handleDragSelectMove = useCallback((weekW: string, course: Course) => {
    // Move-drag mode (v3.82 E4: cross-column drag): track target cell
    if (dragMoveSource) {
      // Allow drag to any cell (same or different column), skip source cell
      if (weekW === dragMoveSource.week && course.col === dragMoveSource.col) {
        setDragMoveTarget(null);
        return;
      }
      const entry = displayWeeks.find(w => w.w === weekW);
      const lesson = entry?.lessons[course.col];
      const isFixed = lesson?.type === 6 || (lesson?.type === 5 && !(lessonDetails[`${weekW}-${course.col}`]?.blockCategory === 'LESSON'));
      if (!isFixed) {
        setDragMoveTarget({ week: weekW, col: course.col });
      } else {
        setDragMoveTarget(null);
      }
      return;
    }
    if (!isDragSelecting) return;
    // Mouse moved to another cell → cancel hold timer (it's a drag-select)
    if (holdTimerRef.current) { clearTimeout(holdTimerRef.current); holdTimerRef.current = null; }
    // Only within same course (cls+typ)
    if (!dragSelectCourse || course.cls !== dragSelectCourse.cls || course.typ !== dragSelectCourse.typ) return;
    const entry = displayWeeks.find(w => w.w === weekW);
    const lesson = entry?.lessons[course.col];
    if (lesson?.type === 6) return; // Skip holidays
    if (!dragSelectedWeeks.includes(weekW)) {
      dragMoved.current = true;
      // Interpolate: fill all weeks between the last selected and the current one
      // This prevents skipped cells when the mouse moves fast.
      setDragSelectedWeeks(prev => {
        const lastW = prev[prev.length - 1];
        const lastIdx = displayWeeks.findIndex(w => w.w === lastW);
        const curIdx = displayWeeks.findIndex(w => w.w === weekW);
        if (lastIdx === -1 || curIdx === -1 || Math.abs(curIdx - lastIdx) <= 1) {
          return [...prev, weekW];
        }
        const step = curIdx > lastIdx ? 1 : -1;
        const toAdd: string[] = [];
        for (let i = lastIdx + step; step > 0 ? i <= curIdx : i >= curIdx; i += step) {
          const w = displayWeeks[i];
          if (!w) continue;
          const l = w.lessons[dragSelectCol ?? -1];
          if (l?.type === 6) continue; // skip holidays
          if (!prev.includes(w.w)) toAdd.push(w.w);
        }
        return [...prev, ...toAdd];
      });
    }
  }, [isDragSelecting, dragMoveSource, dragSelectCourse, dragSelectCol, displayWeeks, dragSelectedWeeks, lessonDetails]);

  const handleDragSelectEnd = useCallback(() => {
    // Clear hold timer
    if (holdTimerRef.current) { clearTimeout(holdTimerRef.current); holdTimerRef.current = null; }
    // Handle move-drag drop (v3.82 E4: cross-column support)
    if (dragMoveSource) {
      if (dragMoveTarget && (dragMoveSource.week !== dragMoveTarget.week || dragMoveSource.col !== dragMoveTarget.col)) {
        // T5: Check if source is part of a sequence block → move entire block
        if (dragMoveSource.col === dragMoveTarget.col) {
          const srcCourse = courses.find(cc => cc.col === dragMoveSource.col);
          if (srcCourse) {
            const seqInfo = getSequenceInfoFromStore(srcCourse.id, dragMoveSource.week, sequences);
            if (seqInfo && seqInfo.total > 1) {
              const allWeeks = allWeeksProp || displayWeeks.map(w => w.w);
              usePlannerStore.getState().moveSequenceBlock(
                dragMoveSource.col, dragMoveSource.week, dragMoveTarget.week, allWeeks, srcCourse.id
              );
              checkRhythmAfterPush(srcCourse);
              dragMoved.current = true;
              setTimeout(() => { dragMoved.current = false; }, 50);
              setDragMoveSource(null);
              setDragMoveTarget(null);
              return;
            }
          }
        }
        pushUndo();
        if (dragMoveSource.col === dragMoveTarget.col) {
          // Same column: use existing swap/move logic
          const targetEntry = displayWeeks.find(w => w.w === dragMoveTarget.week);
          const targetLesson = targetEntry?.lessons[dragMoveTarget.col];
          if (targetLesson?.title) {
            swapLessons(dragMoveSource.col, dragMoveSource.week, dragMoveTarget.week);
          } else {
            moveLessonToEmpty(dragMoveSource.col, dragMoveSource.week, dragMoveTarget.week);
          }
        } else {
          // Cross-column: use moveLessonToColumn
          usePlannerStore.getState().moveLessonToColumn(
            dragMoveSource.col, dragMoveSource.week,
            dragMoveTarget.col, dragMoveTarget.week
          );
        }
        const course = courses.find(cc => cc.col === dragMoveSource.col);
        if (course) checkRhythmAfterPush(course);
        dragMoved.current = true;
        setTimeout(() => { dragMoved.current = false; }, 50);
      } else {
        dragMoved.current = false; // No target → allow click
      }
      setDragMoveSource(null);
      setDragMoveTarget(null);
      return;
    }
    if (!isDragSelecting) return;
    setIsDragSelecting(false);
    if (dragMoved.current && dragSelectedWeeks.length > 1 && dragSelectCourse) {
      // Multi-cell drag: set multiSelection directly and open SidePanel with batch tab
      const keys = dragSelectedWeeks.map(w => `${w}-${dragSelectCourse.id}`);
      usePlannerStore.getState().setMultiSelectionDirect(keys);
      setSidePanelOpen(true);
      setSidePanelTab('details'); // BatchOrDetailsTab auto-switches when multiSelection > 1
    } else if (!dragMoved.current && dragSelectedWeeks.length === 1 && dragSelectCourse) {
      // Single cell clicked (no drag): selection handled by onClick, menu by onDoubleClick (v3.77 #1)
    }
    // Reset dragMoved after a short delay so onClick can still check it
    setTimeout(() => { dragMoved.current = false; }, 50);
  }, [isDragSelecting, dragMoveSource, dragMoveTarget, dragSelectedWeeks, dragSelectCourse, displayWeeks, setSidePanelOpen, setSidePanelTab, pushUndo, swapLessons, moveLessonToEmpty, courses, checkRhythmAfterPush, sequences, allWeeksProp]);

  // Global mouseup listener for drag-selection and move-drag
  useEffect(() => {
    if (!isDragSelecting && !dragMoveSource) return;
    const handler = () => handleDragSelectEnd();
    window.addEventListener('mouseup', handler);
    return () => window.removeEventListener('mouseup', handler);
  }, [isDragSelecting, dragMoveSource, handleDragSelectEnd]);

  // v3.82 E4: 5px movement detection for early drag start
  useEffect(() => {
    if (!isDragSelecting || !pendingDragCell.current || !dragStartPos.current) return;
    const startPos = dragStartPos.current;
    const cell = pendingDragCell.current;
    const handler = (e: MouseEvent) => {
      const dx = e.clientX - startPos.x;
      const dy = e.clientY - startPos.y;
      if (Math.sqrt(dx * dx + dy * dy) >= 5) {
        // Movement threshold reached → start drag immediately
        if (holdTimerRef.current) { clearTimeout(holdTimerRef.current); holdTimerRef.current = null; }
        setIsDragSelecting(false);
        setDragSelectedWeeks([]);
        setDragSelectCol(null);
        setDragSelectCourse(null);
        setDragMoveSource({ week: cell.week, col: cell.col });
        dragMoved.current = true;
        pendingDragCell.current = null;
        dragStartPos.current = null;
      }
    };
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, [isDragSelecting]);

  return (
    <>
      {displayWeeks.map((week) => {
        const isCurrent = week.w === CURRENT_WEEK;
        const past = isPastWeek(week.w, CURRENT_WEEK);

        // U1: Ferien/Events — jede Woche einzeln als colspan-Balken (kein rowSpan)
        const visEntries = Object.entries(week.lessons || {}).filter(([col]) => visibleCols.has(parseInt(col)));
        const isAllHoliday = visEntries.length > 0 && visEntries.every(([, e]) => (e as any).type === 6);
        // Nur mergen wenn alle denselben Titel haben (stufenspezifische Sonderwochen → verschiedene Titel → kein colspan)
        const isAllEvent = visEntries.length > 0
          && visEntries.every(([, e]) => (e as any).type === 5)
          && new Set(visEntries.map(([, e]) => (e as any).title)).size === 1;

        if (isAllHoliday || isAllEvent) {
          const label = (visEntries[0]?.[1] as any)?.title || (isAllHoliday ? 'Ferien' : 'Sonderwoche');
          return (
            <tr key={week.w} ref={isCurrent ? currentRef : undefined} data-week={week.w} className="group"
              style={{ opacity: dimPastWeeks && past && !isCurrent ? 0.5 : 1 }}>
              <td className="sticky left-0 z-30 px-1 text-center border-b border-slate-900/60"
                style={{ background: 'var(--holiday-bg)' }}>
                <span className="font-mono font-medium text-gray-500" style={{ fontSize: z(9) }}>{week.w}</span>
              </td>
              <td colSpan={courses.length}
                className="border-b border-slate-800/30 text-center align-middle"
                style={{
                  background: isAllHoliday
                    ? 'color-mix(in srgb, var(--holiday-bar) 80%, transparent)'
                    : '#78350f30',
                  height: z(36),
                }}>
                <div className="flex items-center justify-center gap-1.5">
                  <span style={{ fontSize: z(11) }}>{isAllHoliday ? '🏖' : '📅'}</span>
                  <span className={`font-medium ${isAllHoliday ? 'text-gray-400' : 'text-amber-200'}`} style={{ fontSize: z(11) }}>
                    {label}
                  </span>
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
            {/* Week number — G6: Doppelklick öffnet Ferien-Dialog */}
            <td
              className="sticky left-0 z-30 px-1 text-center border-b border-slate-900/60 cursor-pointer"
              style={{ background: isCurrent ? '#172554' : 'var(--holiday-bg)' }}
              onDoubleClick={() => {
                usePlannerStore.getState().setPendingHolidayKw(week.w);
                setSidePanelOpen(true);
                setSidePanelTab('settings');
              }}
              title="Doppelklick: Ferien hinzufügen"
            >
              <div className={`font-mono ${isCurrent ? 'font-extrabold text-blue-400' : 'font-medium text-gray-500'}`} style={{ fontSize: z(9) }}>
                {week.w}
              </div>
              {isCurrent && <div className="w-1 h-1 rounded-full bg-blue-400 mx-auto mt-0.5 animate-pulse" />}
              {eventInfo && (
                <div className="text-amber-300 leading-tight mt-0.5 max-w-[48px] truncate font-medium" style={{ fontSize: z(6) }} title={eventInfo.label}>
                  📅 {eventInfo.label}
                </div>
              )}
            </td>

            {/* Lesson cells */}
            {courses.map((c, ci) => {
              const newDay = ci === 0 || c.day !== courses[ci - 1]?.day;
              const rawEntry = week.lessons[c.col];
              // H2: Bei aktivem Filter Sonderwoche-Scope prüfen — ausserhalb des Scopes als leer behandeln
              const scopedCols = validEventCols?.get(week.w);
              const isSuppressedEvent = rawEntry?.type === 5 && scopedCols && !scopedCols.has(c.col);
              const entry = isSuppressedEvent ? undefined : rawEntry;
              const title = entry?.title || '';
              const lessonType = entry?.type ?? -1;
              const colors = lessonType >= 0 ? LESSON_COLORS[lessonType as keyof typeof LESSON_COLORS] : null;
              const isSelected = selection?.week === week.w && selection?.courseId === c.id;
              const isMulti = multiSelection.includes(`${week.w}-${c.id}`);
              const isEditing = editing?.week === week.w && editing?.col === c.col;
              const seq = getSequenceInfoFromStore(c.id, week.w, sequences);
              const cellHeight = c.les >= 2 ? z(36) : z(26);
              const isDragOver = dragMoveTarget?.week === week.w && dragMoveTarget?.col === c.col;
              const isDragSrc = dragMoveSource?.week === week.w && dragMoveSource?.col === c.col;
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

              // Fixed cells: holidays (type 6) always fixed, events (type 5) fixed unless they have a LESSON category (Auftrag = Unterricht)
              const isAuftragUnterricht = lessonType === 5 && cellDetail?.blockCategory === 'LESSON';
              const isFixed = lessonType === 6 || (lessonType === 5 && !isAuftragUnterricht);

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
              // K6: TaF-Kurs ohne aktive Phase → phasenfreie Woche
              const isTafCourse = tafPhases.length > 0 && /[fs]/.test(c.cls.replace(/\d/g, ''));
              const isPhaseFree = isTafCourse && !tafPhase;

              return (
                <React.Fragment key={c.id}>
                <td
                  data-cell-key={`${week.w}-${c.id}`}
                  className="p-0 border-b border-slate-900/40 relative group-hover:bg-slate-950/40"
                  style={{
                    borderLeft: newDay ? `2px solid ${DAY_COLORS[c.day]}12` : 'none',
                    outline: isDragOver ? '2px solid #3b82f6'
                      : (dragSelectCol === c.col && dragSelectedWeeks.includes(week.w)) ? '2px solid #a855f7'
                      : isMulti ? '2px solid #6366f180' : 'none',
                    outlineOffset: '-2px',
                    background: isDragOver ? '#1e3a5f30'
                      : (dragSelectCol === c.col && dragSelectedWeeks.includes(week.w)) ? '#7c3aed20'
                      : isMulti ? '#312e8140' : undefined,
                    ...(autoFitZoom ? {} : { width: colW, minWidth: colW, maxWidth: colW }),
                    cursor: dragMoveSource ? 'grabbing' : undefined,
                  }}
                  onMouseDown={(e) => {
                    if (!e.shiftKey && !e.metaKey && !e.ctrlKey && e.button === 0) {
                      handleDragSelectStart(week.w, c, e);
                    }
                  }}
                  onMouseEnter={() => {
                    if (isDragSelecting || dragMoveSource) handleDragSelectMove(week.w, c);
                    if (title && !dragMoveSource) handleMouseEnter(week.w, c.col);
                  }}
                  onMouseLeave={() => {
                    if (dragMoveSource) setDragMoveTarget(null);
                    handleMouseLeave();
                  }}
                  onClick={(e) => {
                    // If a drag just happened, ignore this click
                    if (dragMoved.current) return;
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
                      // Single click on empty cell: just select, no menu (v3.77 #1)
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
                      // Double-click on empty cell: show Neue UE / Neue Sequenz menu (v3.77 #1)
                      e.stopPropagation();
                      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                      setMenuPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
                      setEmptyCellMenu({ week: week.w, course: c });
                    }
                  }}
                >
                  {/* Sequence bar — color from subject area, visible even on empty cells */}
                  {/* Don't show sequence bar for holidays (type 6) and events (type 5) */}
                  {seq && !isFixed && (
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
                          return seqBarSA ? getCatColor(seqBarSA) : (seq.color || '#16a34a');
                        })(),
                        borderRadius: seq.isFirst ? '2px 0 0 0' : seq.isLast ? '0 0 0 2px' : '0',
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        // Single click: highlight + open sequences panel with correct block
                        const parentSeq = sequences.find(s => s.id === seq.sequenceId);
                        if (parentSeq) {
                          const currentEditing = usePlannerStore.getState().editingSequenceId;
                          const isAlreadyEditing = currentEditing?.startsWith(parentSeq.id);
                          if (isAlreadyEditing) {
                            usePlannerStore.getState().setEditingSequenceId(null);
                          } else {
                            // v3.83 F3: Block-Index für aktuelle Woche bestimmen
                            const blockIdx = parentSeq.blocks.findIndex(b => b.weeks.includes(week.w));
                            const blockKey = `${parentSeq.id}-${blockIdx >= 0 ? blockIdx : 0}`;
                            usePlannerStore.getState().setEditingSequenceId(blockKey);
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
                  {seq?.isFirst && !isFixed && (
                    <div className="absolute left-1.5 -top-0.5 font-bold z-10 px-0.5 rounded whitespace-nowrap cursor-pointer"
                      style={{ fontSize: z(6), background: 'var(--holiday-bg)', color: (() => {
                        const seqLabelSA = effectiveSubjectArea || (() => {
                          const parentSeq = sequences.find(s => s.id === seq.sequenceId);
                          const block = parentSeq?.blocks.find(b => b.weeks.includes(week.w));
                          return block?.subjectArea || parentSeq?.subjectArea;
                        })();
                        return seqLabelSA ? getCatBorder(seqLabelSA) : (seq.color || '#4ade80');
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
                            // v3.83 F3: Block-Index für aktuelle Woche bestimmen
                            const blockIdx = parentSeq.blocks.findIndex(b => b.weeks.includes(week.w));
                            const blockKey = `${parentSeq.id}-${blockIdx >= 0 ? blockIdx : 0}`;
                            usePlannerStore.getState().setEditingSequenceId(blockKey);
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

                  {/* T4: Badges (HK + Custom) — horizontal, vivid colors */}
                  {(() => {
                    if (!title) return null;
                    const cellBadges = lessonDetails[`${week.w}-${c.col}`]?.badges;
                    if (!hkGroup && !cellBadges?.length) return null;
                    return (
                      <div className="absolute right-0.5 top-0 flex gap-px z-10 items-center" style={{ fontSize: z(7) }}>
                        {cellBadges?.map((b, bi) => (
                          <div key={bi}
                            className="font-bold px-1 py-px rounded-sm select-none pointer-events-none"
                            style={{ background: b.color, color: '#fff' }}>
                            {b.label}
                          </div>
                        ))}
                        {hkGroup && (
                          <div
                            className="font-bold px-1 py-px rounded-sm cursor-pointer select-none"
                            style={{
                              background: hkGroup === 'A' ? '#f97316' : '#06b6d4',
                              color: '#fff',
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
                      </div>
                    );
                  })()}

                  {/* Collision warning (v3.63) */}
                  {(() => {
                    const collisionKey = `${week.w}-${c.col}`;
                    const collidingEvents = gcalCollisions[collisionKey];
                    if (!collidingEvents?.length || !title) return null;
                    return (
                      <div
                        className="absolute left-0.5 bottom-0.5 z-10 cursor-help select-none"
                        style={{ fontSize: z(8) }}
                        title={`⚠️ Zeitkonflikt mit: ${collidingEvents.join(', ')}`}
                      >
                        ⚠️
                      </div>
                    );
                  })()}

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
                    /* Holiday cells: grau, Doppelklick → Kontextmenü */
                    <div
                      className="mx-0.5 ml-1.5 px-1.5 py-1 rounded flex items-center justify-center cursor-pointer hover:brightness-110 transition-all"
                      style={{
                        minHeight: Math.max(cellHeight, z(32)),
                        opacity: isSearchDimmed ? 0.2 : 1,
                        background: 'color-mix(in srgb, var(--holiday-bar) 60%, transparent)',
                        border: '1px solid var(--border)',
                      }}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        handleEventCellAction(week.w, c.col, title, 'edit');
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        pushUndo();
                        updateLesson(week.w, c.col, { title: '', type: 0 });
                      }}
                      title="Doppelklick: Bearbeiten · Rechtsklick: Aufheben"
                    >
                      <span className="mr-1" style={{ fontSize: z(9) }}>🏖</span>
                      <span className="font-medium leading-tight text-gray-400"
                        style={{ fontSize: z(9), display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {displayTitle}
                      </span>
                    </div>
                  ) : title && lessonType === 5 && !isAuftragUnterricht ? (
                    /* Event/Sonderwoche cells: amber, klickbar (Studienreisen etc. brauchen Planung) */
                    <div
                      className="mx-0.5 ml-1.5 px-1.5 py-1 rounded flex items-center justify-center cursor-pointer hover:brightness-110 transition-all"
                      style={{
                        minHeight: Math.max(cellHeight, z(32)),
                        opacity: isSearchDimmed ? 0.2 : isSelected ? 1 : 0.9,
                        background: isSelected ? '#78350f' : '#78350f50',
                        border: `1px solid ${isSelected ? '#f59e0b' : '#92400e80'}`,
                        boxShadow: isSelected ? '0 0 0 2px #f59e0b40' : 'none',
                      }}
                      onClick={(e) => { e.stopPropagation(); handleClick(week.w, c, title, e); }}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        handleEventCellAction(week.w, c.col, title, 'edit');
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        pushUndo();
                        updateLesson(week.w, c.col, { title: '', type: 0 });
                      }}
                      title="Klick: Auswählen · Doppelklick: Bearbeiten · Rechtsklick: Aufheben"
                    >
                      <span className="mr-1" style={{ fontSize: z(9) }}>📅</span>
                      <span className="font-medium leading-tight text-amber-100"
                        style={{ fontSize: z(9), display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {displayTitle}
                      </span>
                    </div>
                  ) : title ? (
                    <div
                      className={`mx-0.5 ml-1.5 px-1 py-0.5 rounded transition-all duration-100 flex items-center hover:shadow-md hover:z-10 relative ${isFixed ? 'cursor-default' : isDragSrc ? 'cursor-grabbing' : 'cursor-grab hover:scale-[1.02]'} ${isSearchMatch ? 'search-highlight' : ''}`}
                      style={{
                        minHeight: isFixed ? Math.max(cellHeight, z(32)) : cellHeight,
                        opacity: isDragSrc ? 0.35 : isSeqDimmed ? 0.3 : isSearchDimmed ? 0.2 : 1,
                        background: isInEditingSeq ? '#1e3a5f' : isMulti ? '#312e81' : isSelected ? '#1e3a5f' : cellColors?.bg || '#eef2f7',
                        border: `1px solid ${isInEditingSeq ? '#60a5fa' : isMulti ? '#6366f1' : isSelected ? '#3b82f6' : cellColors?.border || '#cbd5e1'}`,
                        boxShadow: isInEditingSeq ? '0 0 0 2px #3b82f640' : isMulti ? '0 0 0 2px #6366f150' : isSelected ? '0 0 0 2px #3b82f650' : 'none',
                      }}
                    >
                      {lessonType === 4 && <span className="mr-0.5" style={{ fontSize: z(8) }}>📝</span>}
                      {isFixed && <span className="mr-0.5" style={{ fontSize: z(8) }}>{lessonType === 6 ? '🏖' : '📅'}</span>}
                      {isAuftragUnterricht && <span className="mr-0.5" style={{ fontSize: z(8) }} title="Auftrag (kein Präsenzunterricht)">📋</span>}
                      {cellDetail?.sol?.enabled && <span className="mr-0.5" style={{ fontSize: z(8) }} title="SOL">📚</span>}
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
                          fontSize: c.les >= 2 ? z(zoomCfg.fontSize) : z(zoomCfg.fontSize - 1),
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
                      {isSelected && (() => {
                        const weekIdx = allWeekKeys.indexOf(week.w);
                        // L6: Nächste freie Woche finden (Ferien/Sonderwochen überspringen)
                        const findNextFree = (dir: -1 | 1): string | null => {
                          let i = weekIdx + dir;
                          while (i >= 0 && i < allWeekKeys.length) {
                            const kw = allWeekKeys[i];
                            const wk = weekData.find(w => w.w === kw);
                            if (wk) {
                              const entry = wk.lessons[c.col];
                              const t = (entry as any)?.type;
                              if (t !== 5 && t !== 6) return kw; // Weder Sonderwoche noch Ferien
                            }
                            i += dir;
                          }
                          return null;
                        };
                        const prevFree = findNextFree(-1);
                        const nextFree = findNextFree(1);
                        return (
                        <div className="absolute right-0.5 bottom-0.5 flex gap-px z-20">
                          <button
                            onClick={(e) => { e.stopPropagation(); if (prevFree) { pushUndo(); swapLessons(c.col, week.w, prevFree); } }}
                            disabled={!prevFree}
                            className={`rounded bg-slate-700/90 flex items-center justify-center border border-slate-600 ${!prevFree ? 'text-gray-600 cursor-not-allowed' : 'text-gray-300 cursor-pointer hover:bg-blue-600 hover:text-white'}`}
                            style={{ width: z(16), height: z(16), fontSize: z(8) }}
                            title="Nach oben verschieben (überspringt Ferien)"
                          >↑</button>
                          <button
                            onClick={(e) => { e.stopPropagation(); if (nextFree) { pushUndo(); swapLessons(c.col, week.w, nextFree); } }}
                            disabled={!nextFree}
                            className={`rounded bg-slate-700/90 flex items-center justify-center border border-slate-600 ${!nextFree ? 'text-gray-600 cursor-not-allowed' : 'text-gray-300 cursor-pointer hover:bg-blue-600 hover:text-white'}`}
                            style={{ width: z(16), height: z(16), fontSize: z(8) }}
                            title="Nach unten verschieben (überspringt Ferien)"
                          >↓</button>
                        </div>
                        );
                      })()}
                    </div>
                  ) : isPhaseFree ? (
                    /* K6: TaF phasenfreie Woche — grau wie Ferien */
                    <div
                      className="mx-0.5 ml-1.5 px-1.5 py-1 rounded flex items-center justify-center"
                      style={{ minHeight: Math.max(cellHeight, z(32)), background: 'color-mix(in srgb, var(--holiday-bar) 60%, transparent)', border: '1px solid var(--border)' }}
                    >
                      <span className="text-gray-600 italic" style={{ fontSize: z(8) }}>— keine Phase —</span>
                    </div>
                  ) : (
                    <div
                      className={`cursor-pointer rounded mx-0.5 transition-all ${isSelected ? 'bg-blue-900/30 border border-blue-500/50 shadow-[0_0_0_1px_#3b82f640]' : 'hover:bg-slate-800/40'}`}
                      style={{ minHeight: cellHeight }}
                      title="Doppelklick: Neue Unterrichtseinheit oder Sequenz"
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
                <div className="text-[11px] text-gray-300 mb-1">Auch <span className="font-bold text-purple-300">{otherDays}</span> auswählen?</div>
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
                  }} className="px-2 py-0.5 rounded text-[11px] bg-purple-600 text-white cursor-pointer hover:bg-purple-500">Ja, beide Tage</button>
                  <button onClick={() => setMultiDayPrompt(null)}
                    className="px-2 py-0.5 rounded text-[11px] border border-gray-600 text-gray-400 cursor-pointer hover:text-gray-200">Nein</button>
                </div>
              </div>
            </td>
          </tr>
        );
      })()}

      {/* Rhythm warning toast */}
      {rhythmWarning && (
        <tr>
          <td colSpan={courses.length + 1} className="p-0 relative">
            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[90] bg-amber-900/90 border border-amber-500/50 rounded-lg shadow-2xl px-4 py-2 flex items-center gap-2 max-w-md">
              <span className="text-amber-300 text-sm">⚠️</span>
              <span className="text-[12px] text-amber-200">{rhythmWarning}</span>
              <button onClick={() => setRhythmWarning(null)} className="text-amber-400 hover:text-amber-200 text-[12px] cursor-pointer ml-2">✕</button>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// We need courses for paired detection in mini-buttons
import { COURSES as COURSES_CACHE, getLinkedCourseIds } from '../data/courses';
