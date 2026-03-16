import React, { useCallback, useState, useRef } from 'react';
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
import { useDragHandlers } from '../hooks/useDragHandlers';
import { getGymStufe } from '../utils/gradeRequirements';

interface Props {
  weeks: Week[];
  courses: Course[];
  allWeeks?: string[];
  currentRef?: React.RefObject<HTMLTableRowElement | null>;
}


export function WeekRows({ weeks, courses, allWeeks: allWeeksProp, currentRef }: Props) {
  const {
    selection, setSelection,
    multiSelection, toggleMultiSelect, clearMultiSelect, selectRange,
    editing, setEditing,
    weekData, updateLesson,
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

  const displayWeeks = weekData.length > 0
    ? weeks.map((w) => weekData.find((wd) => wd.w === w.w) || w)
    : weeks;

  const allWeekKeys = allWeeksProp || weeks.map(w => w.w);

  // Drag handling (extracted to custom hook)
  const drag = useDragHandlers(displayWeeks, courses, allWeeksProp, lessonDetails, sequences);

  // Pre-compute holiday/event spans for merged rows
  const visibleCols = React.useMemo(() => new Set(courses.map(c => c.col)), [courses]);

  // H2: Sonderwochen-Scope prüfen — bei aktivem Filter nur relevante Events anzeigen
  const validEventCols = React.useMemo(() => {
    if (filter === 'ALL' || !plannerSettings?.specialWeeks) return null;
    const courseIdToCol = new Map<string, number>();
    for (let i = 0; i < plannerSettings.courses.length; i++) {
      const c = plannerSettings.courses[i];
      const col = c.col ?? (100 + i);
      courseIdToCol.set(c.id, col);
    }
    const validMap = new Map<string, Set<number>>();
    for (const sw of plannerSettings.specialWeeks) {
      if (sw.type === 'holiday') continue;
      const hasCourseFilter = sw.courseFilter && sw.courseFilter.length > 0;
      const rawLevel = sw.gymLevel;
      const levels = !rawLevel ? [] : Array.isArray(rawLevel) ? rawLevel : [rawLevel];
      const hasGymLevel = levels.length > 0 && !(levels.length === 1 && levels[0] === 'alle');
      if (!hasCourseFilter && !hasGymLevel) continue;
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
          const col = c.col ?? (100 + i);
          const letters = c.cls.replace(/\d/g, '').toLowerCase();
          const isPureTaF = letters.length > 0 && /^[fs]+$/.test(letters);
          const isTaF = /[fs]/.test(letters);
          const derivedLevel = c.stufe || getGymStufe(c.cls);
          const matchesAny = levels.some(lv => {
            if (lv === 'TaF') return isTaF;
            if (lv === 'alle') return true;
            if (isPureTaF) return false;
            return derivedLevel === lv;
          });
          if (matchesAny) cols.add(col);
        }
      }
      if (!validMap.has(sw.week)) validMap.set(sw.week, new Set());
      for (const col of cols) validMap.get(sw.week)!.add(col);
    }
    return validMap;
  }, [filter, plannerSettings]);

  const eventWeeks = React.useMemo(() => {
    const events = new Map<string, { label: string; affectedCols: Set<number> }>();
    for (const wk of displayWeeks) {
      const entries = Object.entries(wk.lessons || {}).filter(([col]) => visibleCols.has(parseInt(col)));
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

  // Click handlers
  const handleClick = useCallback(
    (weekW: string, course: Course, title: string, e: React.MouseEvent) => {
      if (!title) return;
      if (e.shiftKey) {
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
      }
    },
    [selection, setSelection, toggleMultiSelect, clearMultiSelect, selectRange, allWeekKeys, courses]
  );

  const handleDoubleClick = useCallback(
    (weekW: string, course: Course, title: string) => {
      if (!title) return;
      setSelection({ week: weekW, courseId: course.id, title, course });
      setSidePanelOpen(true);
      setSidePanelTab('details');
    },
    [setSelection, setSidePanelOpen, setSidePanelTab]
  );

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

  return (
    <>
      {displayWeeks.map((week) => {
        const isCurrent = week.w === CURRENT_WEEK;
        const past = isPastWeek(week.w, CURRENT_WEEK);

        // U1: Ferien/Events — jede Woche einzeln als colspan-Balken
        const visEntries = Object.entries(week.lessons || {}).filter(([col]) => visibleCols.has(parseInt(col)));
        const isAllHoliday = visEntries.length > 0 && visEntries.every(([, e]) => (e as any).type === 6);
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
                  <span className="font-medium" style={{ fontSize: z(11), color: isAllHoliday ? 'var(--holiday-label)' : 'var(--event-label)' }}>
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
            {/* Week number */}
            <td
              className="sticky left-0 z-30 px-1 text-center border-b border-slate-900/60 cursor-pointer"
              style={{ background: isCurrent ? 'var(--current-week-bg)' : 'var(--holiday-bg)' }}
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
              const isDragOver = drag.dragMoveTarget?.week === week.w && drag.dragMoveTarget?.col === c.col;
              const isDragSrc = drag.dragMoveSource?.week === week.w && drag.dragMoveSource?.col === c.col;
              const hkGroup = c.hk ? getHKGroup(week.w, c.col, hkStartGroups[c.col] || 'A', hkOverrides) : null;
              const isHovered = hoverCell?.week === week.w && hoverCell?.col === c.col;
              const showPreview = isHovered && showHoverPreview && title && !isSelected;
              const showEmptyMenu = emptyCellMenu?.week === week.w && emptyCellMenu?.course.id === c.id;

              const cellDetail = lessonDetails[`${week.w}-${c.col}`];
              const parentBlock = seq ? (() => {
                const parentSeq = sequences.find(s => s.id === seq.sequenceId);
                return parentSeq?.blocks.find(b => b.weeks.includes(week.w));
              })() : null;

              const effectiveSubjectArea = cellDetail?.subjectArea || parentBlock?.subjectArea;
              const saColors = effectiveSubjectArea ? SUBJECT_AREA_COLORS[effectiveSubjectArea] : null;
              const cellColors = saColors || colors;

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

              const isAuftragUnterricht = lessonType === 5 && cellDetail?.blockCategory === 'LESSON';
              const isFixed = lessonType === 6 || (lessonType === 5 && !isAuftragUnterricht);

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
              const isTafCourse = tafPhases.length > 0 && /[fs]/.test(c.cls.replace(/\d/g, ''));
              const isPhaseFree = isTafCourse && !tafPhase;

              return (
                <React.Fragment key={c.id}>
                <td
                  data-cell-key={`${week.w}-${c.id}`}
                  className="p-0 border-b border-slate-900/40 relative week-cell-hover"
                  style={{
                    borderLeft: newDay ? `2px solid ${DAY_COLORS[c.day]}12` : 'none',
                    outline: isDragOver ? '2px solid #3b82f6'
                      : (drag.dragSelectCol === c.col && drag.dragSelectedWeeks.includes(week.w)) ? '2px solid #a855f7'
                      : isMulti ? '2px solid #6366f180' : 'none',
                    outlineOffset: '-2px',
                    background: isDragOver ? '#1e3a5f30'
                      : (drag.dragSelectCol === c.col && drag.dragSelectedWeeks.includes(week.w)) ? '#7c3aed20'
                      : isMulti ? '#312e8140' : undefined,
                    ...(autoFitZoom ? {} : { width: colW, minWidth: colW, maxWidth: colW }),
                    cursor: drag.dragMoveSource ? 'grabbing' : undefined,
                  }}
                  onMouseDown={(e) => {
                    if (!e.shiftKey && !e.metaKey && !e.ctrlKey && e.button === 0) {
                      drag.handleDragSelectStart(week.w, c, e);
                    }
                  }}
                  onMouseEnter={() => {
                    if (drag.isDragSelecting || drag.dragMoveSource) drag.handleDragSelectMove(week.w, c);
                    if (title && !drag.dragMoveSource) handleMouseEnter(week.w, c.col);
                  }}
                  onMouseLeave={() => {
                    if (drag.dragMoveSource) drag.setDragMoveTarget(null);
                    handleMouseLeave();
                  }}
                  onClick={(e) => {
                    if (drag.dragMoved.current) return;
                    if (e.shiftKey || e.metaKey || e.ctrlKey) {
                      if (title) {
                        if (e.shiftKey) {
                          selectRange(`${week.w}-${c.id}`, allWeekKeys, courses, false);
                          const linked = getLinkedCourseIds(c.id);
                          if (linked.length > 1) {
                            const otherIds = linked.filter(id => id !== c.id);
                            const currentMulti = usePlannerStore.getState().multiSelection;
                            const otherDayAlreadySelected = otherIds.some(oid =>
                              currentMulti.some(k => k.endsWith(`-${oid}`))
                            );
                            if (!otherDayAlreadySelected) {
                              const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                              drag.setMultiDayPrompt({ weekW: week.w, courseId: c.id, position: { x: rect.left + rect.width / 2, y: rect.top } });
                            }
                          }
                        } else {
                          toggleMultiSelect(`${week.w}-${c.id}`);
                        }
                      } else {
                        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                        setMenuPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
                        setEmptyCellMenu({ week: week.w, course: c });
                      }
                    } else if (title) {
                      handleClick(week.w, c, title, e);
                      drag.dragSelectedWeeks.length = 0;
                    } else {
                      clearMultiSelect();
                      setSelection({ week: week.w, courseId: c.id, title: '', course: c });
                      setEmptyCellMenu(null);
                      usePlannerStore.getState().setEditingSequenceId(null);
                      setSidePanelOpen(false);
                    }
                  }}
                  onDoubleClick={(e) => {
                    if (title) {
                      handleDoubleClick(week.w, c, title);
                    } else {
                      e.stopPropagation();
                      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                      setMenuPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
                      setEmptyCellMenu({ week: week.w, course: c });
                    }
                  }}
                >
                  {/* Sequence bar */}
                  {seq && !isFixed && (
                    <div
                      className="absolute left-0 w-[5px] opacity-80 cursor-pointer hover:opacity-100 hover:w-[7px] transition-all"
                      style={{
                        top: seq.isFirst ? 3 : 0,
                        bottom: seq.isLast ? 3 : 0,
                        background: (() => {
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
                        const parentSeq = sequences.find(s => s.id === seq.sequenceId);
                        if (parentSeq) {
                          const currentEditing = usePlannerStore.getState().editingSequenceId;
                          const isAlreadyEditing = currentEditing?.startsWith(parentSeq.id);
                          if (isAlreadyEditing) {
                            usePlannerStore.getState().setEditingSequenceId(null);
                          } else {
                            const blockIdx = parentSeq.blocks.findIndex(b => b.weeks.includes(week.w));
                            const blockKey = `${parentSeq.id}-${blockIdx >= 0 ? blockIdx : 0}`;
                            usePlannerStore.getState().setEditingSequenceId(blockKey);
                            setSidePanelOpen(true);
                            setSidePanelTab('sequences');
                          }
                        }
                      }}
                      onDoubleClick={(e) => { e.stopPropagation(); }}
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

                  {/* T4: Badges (HK + Custom) */}
                  {(() => {
                    if (!title) return null;
                    const cellBadges = lessonDetails[`${week.w}-${c.col}`]?.badges;
                    if (!hkGroup && !cellBadges?.length) return null;
                    return (
                      <div className="absolute right-0.5 top-0 flex gap-px z-10 items-center" style={{ fontSize: z(7) }}>
                        {cellBadges?.map((b: any, bi: number) => (
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

                  {/* Collision warning */}
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
                      <span className="font-medium leading-tight"
                        style={{ fontSize: z(9), color: 'var(--event-text)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
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
                        const findNextFree = (dir: -1 | 1): string | null => {
                          let i = weekIdx + dir;
                          while (i >= 0 && i < allWeekKeys.length) {
                            const kw = allWeekKeys[i];
                            const wk = weekData.find(w => w.w === kw);
                            if (wk) {
                              const entry = wk.lessons[c.col];
                              const t = (entry as any)?.type;
                              if (t !== 5 && t !== 6) return kw;
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
                            onClick={(e) => { e.stopPropagation(); if (prevFree) { pushUndo(); usePlannerStore.getState().swapLessons(c.col, week.w, prevFree); } }}
                            disabled={!prevFree}
                            className={`rounded bg-slate-700/90 flex items-center justify-center border border-slate-600 ${!prevFree ? 'text-gray-600 cursor-not-allowed' : 'text-gray-300 cursor-pointer hover:bg-blue-600 hover:text-white'}`}
                            style={{ width: z(16), height: z(16), fontSize: z(8) }}
                            title="Nach oben verschieben (überspringt Ferien)"
                          >↑</button>
                          <button
                            onClick={(e) => { e.stopPropagation(); if (nextFree) { pushUndo(); usePlannerStore.getState().swapLessons(c.col, week.w, nextFree); } }}
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
                      onClose={() => { setEmptyCellMenu(null); setMenuPosition(undefined); }}
                      selectedWeeks={drag.dragSelectedWeeks.length > 1 ? drag.dragSelectedWeeks : undefined}
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
      {drag.multiDayPrompt && (() => {
        const linked = getLinkedCourseIds(drag.multiDayPrompt.courseId);
        const otherIds = linked.filter(id => id !== drag.multiDayPrompt!.courseId);
        const otherCourses = otherIds.map(id => COURSES_CACHE.find(cc => cc.id === id)).filter(Boolean);
        const otherDays = otherCourses.map(cc => cc!.day).join('/');
        return (
          <tr>
            <td colSpan={courses.length + 1} className="p-0 relative">
              <div data-multiday-prompt className="fixed z-[90] bg-slate-800 border border-purple-500 rounded-lg shadow-2xl py-1 px-2 w-auto"
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                style={{ top: drag.multiDayPrompt.position.y - 40, left: drag.multiDayPrompt.position.x - 60 }}>
                <div className="text-[11px] text-gray-300 mb-1">Auch <span className="font-bold text-purple-300">{otherDays}</span> auswählen?</div>
                <div className="flex gap-1">
                  <button onClick={() => {
                    const currentMulti = usePlannerStore.getState().multiSelection;
                    const newKeys: string[] = [];
                    for (const key of currentMulti) {
                      const parts = key.split('-');
                      const cid = parts[parts.length - 1];
                      const wk = parts.slice(0, parts.length - 1).join('-');
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
                    drag.setMultiDayPrompt(null);
                  }} className="px-2 py-0.5 rounded text-[11px] bg-purple-600 text-white cursor-pointer hover:bg-purple-500">Ja, beide Tage</button>
                  <button onClick={() => drag.setMultiDayPrompt(null)}
                    className="px-2 py-0.5 rounded text-[11px] border border-gray-600 text-gray-400 cursor-pointer hover:text-gray-200">Nein</button>
                </div>
              </div>
            </td>
          </tr>
        );
      })()}

      {/* Rhythm warning toast */}
      {drag.rhythmWarning && (
        <tr>
          <td colSpan={courses.length + 1} className="p-0 relative">
            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[90] bg-amber-900/90 border border-amber-500/50 rounded-lg shadow-2xl px-4 py-2 flex items-center gap-2 max-w-md">
              <span className="text-amber-300 text-sm">⚠️</span>
              <span className="text-[12px] text-amber-200">{drag.rhythmWarning}</span>
              <button onClick={() => drag.setRhythmWarning(null)} className="text-amber-400 hover:text-amber-200 text-[12px] cursor-pointer ml-2">✕</button>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

import { COURSES as COURSES_CACHE, getLinkedCourseIds } from '../data/courses';
