import { useState, useCallback, useRef, useEffect } from 'react';
import type { Course, Week } from '../types';
import { getSequenceInfoFromStore } from '../utils/colors';
import { usePlannerStore } from '../store/plannerStore';
import { getLinkedKursIds } from '../data/courses';

interface DragState {
  // Drag-selection for cells (empty and filled)
  isDragSelecting: boolean;
  dragSelectCol: number | null;
  dragSelectedWeeks: string[];
  dragSelectCourse: Course | null;

  // Long-hold drag-move state
  dragMoveSource: { week: string; col: number } | null;
  dragMoveTarget: { week: string; col: number } | null;

  // Rhythm warning after push (1L↔2L)
  rhythmWarning: string | null;

  // Multi-day shift-click popup
  multiDayPrompt: { weekW: string; kursId: string; position: { x: number; y: number } } | null;
}

interface DragHandlers {
  handleDragSelectStart: (weekW: string, course: Course, e: React.MouseEvent) => void;
  handleDragSelectMove: (weekW: string, course: Course) => void;
  handleDragSelectEnd: () => void;
  setDragMoveTarget: (target: { week: string; col: number } | null) => void;
  setRhythmWarning: (msg: string | null) => void;
  setMultiDayPrompt: (prompt: DragState['multiDayPrompt']) => void;
  dragMoved: React.MutableRefObject<boolean>;
}

export function useDragHandlers(
  displayWeeks: Week[],
  courses: Course[],
  allWeeksProp: string[] | undefined,
  lessonDetails: Record<string, any>,
  sequences: any[],
): DragState & DragHandlers {
  const {
    swapLessons, moveLessonToEmpty, pushUndo,
    setSidePanelOpen, setSidePanelTab,
  } = usePlannerStore();

  const [isDragSelecting, setIsDragSelecting] = useState(false);
  const [dragSelectCol, setDragSelectCol] = useState<number | null>(null);
  const [dragSelectedWeeks, setDragSelectedWeeks] = useState<string[]>([]);
  const [dragSelectCourse, setDragSelectCourse] = useState<Course | null>(null);
  const dragMoved = useRef(false);

  const [multiDayPrompt, setMultiDayPrompt] = useState<DragState['multiDayPrompt']>(null);

  const [dragMoveSource, setDragMoveSource] = useState<{ week: string; col: number } | null>(null);
  const [dragMoveTarget, setDragMoveTarget] = useState<{ week: string; col: number } | null>(null);
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);
  const pendingDragCell = useRef<{ week: string; col: number } | null>(null);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [rhythmWarning, setRhythmWarning] = useState<string | null>(null);

  const checkRhythmAfterPush = useCallback((course: Course) => {
    const linked = getLinkedKursIds(course.id);
    if (linked.length <= 1) return;
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
    const timer = setTimeout(() => document.addEventListener('mousedown', handleClick), 50);
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.removeEventListener('mousedown', handleClick);
      clearTimeout(timer);
    };
  }, [multiDayPrompt]);

  const handleDragSelectStart = useCallback((weekW: string, course: Course, e: React.MouseEvent) => {
    if (e.shiftKey || e.metaKey || e.ctrlKey) return;
    if (e.button !== 0) return;
    const entry = displayWeeks.find(w => w.w === weekW);
    const lesson = entry?.lessons[course.col];
    if (lesson?.type === 6) return;
    if (holdTimerRef.current) { clearTimeout(holdTimerRef.current); holdTimerRef.current = null; }
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
    dragMoved.current = false;
  }, [displayWeeks, lessonDetails]);

  const handleDragSelectMove = useCallback((weekW: string, course: Course) => {
    if (dragMoveSource) {
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
    if (holdTimerRef.current) { clearTimeout(holdTimerRef.current); holdTimerRef.current = null; }
    if (!dragSelectCourse || course.cls !== dragSelectCourse.cls || course.typ !== dragSelectCourse.typ) return;
    const entry = displayWeeks.find(w => w.w === weekW);
    const lesson = entry?.lessons[course.col];
    if (lesson?.type === 6) return;
    if (!dragSelectedWeeks.includes(weekW)) {
      dragMoved.current = true;
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
          if (l?.type === 6) continue;
          if (!prev.includes(w.w)) toAdd.push(w.w);
        }
        return [...prev, ...toAdd];
      });
    }
  }, [isDragSelecting, dragMoveSource, dragSelectCourse, dragSelectCol, displayWeeks, dragSelectedWeeks, lessonDetails]);

  const handleDragSelectEnd = useCallback(() => {
    if (holdTimerRef.current) { clearTimeout(holdTimerRef.current); holdTimerRef.current = null; }
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
          const targetEntry = displayWeeks.find(w => w.w === dragMoveTarget.week);
          const targetLesson = targetEntry?.lessons[dragMoveTarget.col];
          if (targetLesson?.title) {
            swapLessons(dragMoveSource.col, dragMoveSource.week, dragMoveTarget.week);
          } else {
            moveLessonToEmpty(dragMoveSource.col, dragMoveSource.week, dragMoveTarget.week);
          }
        } else {
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
        dragMoved.current = false;
      }
      setDragMoveSource(null);
      setDragMoveTarget(null);
      return;
    }
    if (!isDragSelecting) return;
    setIsDragSelecting(false);
    if (dragMoved.current && dragSelectedWeeks.length > 1 && dragSelectCourse) {
      const keys = dragSelectedWeeks.map(w => `${w}-${dragSelectCourse.id}`);
      usePlannerStore.getState().setMultiSelectionDirect(keys);
      setSidePanelOpen(true);
      setSidePanelTab('details');
    }
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

  return {
    isDragSelecting,
    dragSelectCol,
    dragSelectedWeeks,
    dragSelectCourse,
    dragMoveSource,
    dragMoveTarget,
    rhythmWarning,
    multiDayPrompt,
    handleDragSelectStart,
    handleDragSelectMove,
    handleDragSelectEnd,
    setDragMoveTarget,
    setRhythmWarning,
    setMultiDayPrompt,
    dragMoved,
  };
}
