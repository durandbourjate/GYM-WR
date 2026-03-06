import { useMemo, useCallback } from 'react';
import { usePlannerStore, ZOOM_LEVELS, zs } from '../store/plannerStore';
import { usePlannerData } from '../hooks/usePlannerData';
import { TYPE_BADGES, DAY_COLORS, isPastWeek } from '../utils/colors';
import { inferSubjectAreaFromLessonType, getBlockColors } from '../data/categories';
import type { Course, ManagedSequence, LessonType, SubjectArea } from '../types';

// Block colors are now in data/categories.ts (getBlockColors)

// inferSubjectArea is now inferSubjectAreaFromLessonType in data/categories.ts

/** Group courses by cls+typ. Each group has 1+ courses (1 per day). */
interface CourseGroup {
  key: string;      // "27abcd8f-SF"
  cls: string;
  typ: string;
  courses: Course[]; // sorted by day
  isMultiDay: boolean;
}

/** Block span within the year */
interface YearSpan {
  seq: ManagedSequence;
  blockIdx: number;
  label: string;
  topicMain?: string;
  subjectArea?: string;
  startIdx: number;
  spanLen: number;
  weeks: string[];
  courseId: string;    // specific course within group
  isShared: boolean;   // true if seq covers all courses in group (→ wide bar)
  isLoose?: boolean;   // true for lessons not in any sequence
}

export function ZoomYearView() {
  const {
    filter, classFilter, sequences, weekData, lessonDetails,
    setZoomLevel, setEditingSequenceId,
    setSidePanelOpen, setSidePanelTab, setSelection,
    searchQuery, setClassFilter, setFilter,
    dimPastWeeks, columnZoom,
  } = usePlannerStore();

  // v3.91 N3: Zoom-abhängige Breiten + Skalierung
  const zoomCfg = ZOOM_LEVELS[columnZoom] || ZOOM_LEVELS[2];
  const GROUP_W = zoomCfg.colWidth;
  const SUBDAY_W = Math.round(zoomCfg.colWidth / 2);
  const z = (base: number) => zs(base, zoomCfg);
  const ROW_H = z(26);

  const { courses: allCourses, weeks: staticWeeks, s2StartIndex, currentWeek } = usePlannerData();

  // All weeks for the entire year
  const effectiveWeeks = useMemo(() =>
    weekData.length > 0 ? weekData : staticWeeks,
    [weekData, staticWeeks]);
  const allWeekKeys = useMemo(() => effectiveWeeks.map(w => w.w), [effectiveWeeks]);

  // Filter courses then group by cls+typ
  const groups = useMemo(() => {
    let c = [...allCourses];
    if (filter !== 'ALL') c = c.filter(co => co.typ === filter);
    if (classFilter) c = c.filter(co => co.cls === classFilter);

    const map = new Map<string, CourseGroup>();
    for (const course of c) {
      const key = `${course.cls}-${course.typ}`;
      if (!map.has(key)) {
        map.set(key, { key, cls: course.cls, typ: course.typ, courses: [], isMultiDay: false });
      }
      map.get(key)!.courses.push(course);
    }
    // Sort courses within groups by day, mark multi-day
    for (const g of map.values()) {
      const dayOrder: Record<string, number> = { Mo: 0, Di: 1, Mi: 2, Do: 3, Fr: 4 };
      g.courses.sort((a, b) => (dayOrder[a.day] ?? 9) - (dayOrder[b.day] ?? 9));
      g.isMultiDay = g.courses.length > 1;
    }
    return [...map.values()].sort((a, b) => a.key.localeCompare(b.key));
  }, [allCourses, filter, classFilter]);

  // Build YearSpans per group
  const { spanMap, skipSet } = useMemo(() => {
    const spanMap = new Map<string, YearSpan>();
    const skipSet = new Set<string>();

    for (const group of groups) {
      for (const course of group.courses) {
        const courseSeqs = sequences.filter(s =>
          s.courseId === course.id || (s.courseIds?.includes(course.id))
        );
        for (const seq of courseSeqs) {
          // Check if this seq is shared across all courses in group
          const isShared = group.isMultiDay && group.courses.every(gc =>
            seq.courseId === gc.id || seq.courseIds?.includes(gc.id)
          );

          for (let bi = 0; bi < seq.blocks.length; bi++) {
            const block = seq.blocks[bi];
            const weekIndices: number[] = [];
            for (const w of block.weeks) {
              const idx = allWeekKeys.indexOf(w);
              if (idx >= 0) weekIndices.push(idx);
            }
            if (weekIndices.length === 0) continue;
            weekIndices.sort((a, b) => a - b);

            // Determine subjectArea
            let area = block.subjectArea || seq.subjectArea;
            if (!area) {
              const firstWeek = allWeekKeys[weekIndices[0]];
              const wd = effectiveWeeks.find(w => w.w === firstWeek);
              const entry = wd?.lessons[course.col];
              if (entry) area = inferSubjectAreaFromLessonType(entry.type as LessonType) as SubjectArea | undefined;
            }

            // Group into contiguous runs
            let runStart = weekIndices[0];
            let prev = weekIndices[0];
            const runs: { start: number; end: number }[] = [];
            for (let i = 1; i < weekIndices.length; i++) {
              if (weekIndices[i] === prev + 1) { prev = weekIndices[i]; }
              else { runs.push({ start: runStart, end: prev }); runStart = weekIndices[i]; prev = weekIndices[i]; }
            }
            runs.push({ start: runStart, end: prev });

            for (const run of runs) {
              const spanLen = run.end - run.start + 1;
              const spanWeeks = allWeekKeys.slice(run.start, run.end + 1);
              // For shared seqs, only create span for first course in group to avoid duplicates
              const spanCourseId = isShared ? group.courses[0].id : course.id;
              const spanKey = `${run.start}:${spanCourseId}:${isShared ? 'shared' : course.id}`;
              if (spanMap.has(spanKey)) continue; // avoid duplicate shared spans
              spanMap.set(spanKey, {
                seq, blockIdx: bi, label: block.label, topicMain: block.topicMain,
                subjectArea: area, startIdx: run.start, spanLen, weeks: spanWeeks,
                courseId: spanCourseId, isShared,
              });
              for (let r = run.start + 1; r <= run.end; r++) {
                skipSet.add(`${r}:${spanCourseId}:${isShared ? 'shared' : course.id}`);
              }
            }
          }
        }
      }
    }

    // Second pass: find loose lessons (not covered by any sequence)
    const coveredSet = new Set<string>(); // "weekIdx:courseId"
    for (const [, span] of spanMap) {
      for (let i = span.startIdx; i < span.startIdx + span.spanLen; i++) {
        if (span.isShared) {
          const g = groups.find(g2 => g2.courses.some(c => c.id === span.courseId));
          if (g) g.courses.forEach(c => coveredSet.add(`${i}:${c.id}`));
        } else {
          coveredSet.add(`${i}:${span.courseId}`);
        }
      }
    }

    for (const group of groups) {
      for (const course of group.courses) {
        for (let wi = 0; wi < allWeekKeys.length; wi++) {
          if (coveredSet.has(`${wi}:${course.id}`)) continue;
          const weekW = allWeekKeys[wi];
          const wd = effectiveWeeks.find(w => w.w === weekW);
          const entry = wd?.lessons[course.col];
          if (!entry || !entry.title) continue;
          // Skip holidays and events — they're not loose lessons
          if (entry.type === 5 || entry.type === 6) continue;
          // This week has a lesson but no sequence → loose lesson
          const detail = lessonDetails[`${weekW}-${course.col}`];
          const area = (detail?.subjectArea || inferSubjectAreaFromLessonType(entry.type as LessonType)) as SubjectArea | undefined;
          const looseKey = `${wi}:${course.id}:loose`;
          if (spanMap.has(looseKey)) continue;
          // Create a dummy seq for type compatibility
          const dummySeq = { id: '__loose__', title: '', courseId: course.id, blocks: [], createdAt: '', updatedAt: '' } as ManagedSequence;
          spanMap.set(looseKey, {
            seq: dummySeq, blockIdx: 0, label: entry.title, topicMain: detail?.topicMain || entry.title,
            subjectArea: area, startIdx: wi, spanLen: 1, weeks: [weekW],
            courseId: course.id, isShared: false, isLoose: true,
          });
        }
      }
    }

    return { spanMap, skipSet };
  }, [groups, sequences, allWeekKeys, effectiveWeeks, lessonDetails]);

  const searchLower = searchQuery.toLowerCase();

  // Click handlers
  const handleBlockClick = useCallback((span: YearSpan) => {
    if (span.isLoose) {
      // Loose lesson: open DetailPanel
      const course = allCourses.find(c => c.id === span.courseId);
      if (course) {
        setSelection({ week: span.weeks[0], courseId: course.id, title: span.label, course });
        setSidePanelOpen(true);
        setSidePanelTab('details');
      }
      return;
    }
    setEditingSequenceId(`${span.seq.id}-${span.blockIdx}`);
    setSidePanelOpen(true);
    setSidePanelTab('sequences');
  }, [setEditingSequenceId, setSidePanelOpen, setSidePanelTab, allCourses, setSelection]);

  const handleBlockDblClick = useCallback((weekW: string, course: Course, span: YearSpan) => {
    setZoomLevel(3);
    setSelection({ week: weekW, courseId: course.id, title: span.label, course });
    setTimeout(() => {
      document.querySelector(`tr[data-week="${weekW}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  }, [setZoomLevel, setSelection]);

  const handleEmptyClick = useCallback((weekW: string, course: Course) => {
    setZoomLevel(3);
    setSelection({ week: weekW, courseId: course.id, title: '', course });
  }, [setZoomLevel, setSelection]);

  // Semester break line index
  const s2Idx = s2StartIndex;

  return (
    <div className="px-1 pt-0 pb-1">
      <table className="border-collapse w-max min-w-full">
        <thead className="sticky z-40" style={{ top: 0 }}>
          {/* Group header row */}
          <tr>
            <th className="w-12 bg-gray-900 sticky left-0 z-50 py-1 border-b border-gray-800">
              <span className="font-bold text-gray-400" style={{ fontSize: z(9) }}>Jahr</span>
            </th>
            {groups.map((g) => {
              const badge = (TYPE_BADGES as Record<string, { bg: string; fg: string }>)[g.typ];
              const totalW = g.isMultiDay ? g.courses.length * SUBDAY_W : GROUP_W;
              return (
                <th key={g.key} colSpan={g.isMultiDay ? g.courses.length : 1}
                  className="bg-gray-900 px-0.5 py-1 border-b-2 border-gray-700 text-center"
                  style={{ width: totalW, minWidth: totalW }}>
                  <div className={`font-bold cursor-pointer transition-colors ${
                    classFilter === g.cls ? 'text-blue-400' : 'text-gray-200 hover:text-blue-300'
                  }`} style={{ fontSize: z(11) }} onClick={() => setClassFilter(classFilter === g.cls ? null : g.cls)}>
                    {g.cls}
                  </div>
                  <div className="flex gap-0.5 justify-center mt-0.5">
                    <span className="px-1 rounded font-bold cursor-pointer hover:opacity-80"
                      style={{ fontSize: z(9), background: badge?.bg, color: badge?.fg }}
                      onClick={() => setFilter(g.typ as any)}>{g.typ}</span>
                  </div>
                  {g.isMultiDay && (
                    <div className="flex justify-center gap-0 mt-0.5">
                      {g.courses.map(c => (
                        <span key={c.id} className="px-1 text-gray-500" style={{ fontSize: z(9), color: DAY_COLORS[c.day] }}>
                          {c.day}
                        </span>
                      ))}
                    </div>
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {allWeekKeys.map((weekW, weekIdx) => {
            const past = isPastWeek(weekW, currentWeek);
            const isCurrent = weekW === currentWeek;
            const isSemBreak = weekIdx === s2Idx;
            const totalCols = groups.reduce((sum, g) => sum + (g.isMultiDay ? g.courses.length : 1), 0);

            // U1: Ferien/Events — jede Woche einzeln als colspan-Balken (kein rowSpan)
            const weekEntry = effectiveWeeks.find(w => w.w === weekW);
            const allEntries = weekEntry ? Object.values(weekEntry.lessons) : [];
            const isAllHoliday = allEntries.length > 0 && allEntries.every(e => (e as any).type === 6);
            // Nur mergen wenn alle denselben Titel haben (stufenspezifische Sonderwochen → verschiedene Titel → kein colspan)
            const isAllEvent = allEntries.length > 0
              && allEntries.every(e => (e as any).type === 5)
              && new Set(allEntries.map(e => (e as any).title)).size === 1;

            if (isAllHoliday || isAllEvent) {
              const label = (allEntries[0] as any)?.title || (isAllHoliday ? 'Ferien' : 'Sonderwoche');
              return (
                <tr key={weekW} data-week={weekW}
                  style={{
                    opacity: dimPastWeeks && past && !isCurrent ? 0.4 : 1,
                    height: ROW_H,
                    borderTop: isSemBreak ? '3px solid #f59e0b50' : undefined,
                  }}>
                  <td className="bg-gray-900 sticky left-0 z-10 text-center py-0 px-0.5 border-b border-slate-800/50">
                    <span className="font-mono text-gray-400" style={{ fontSize: z(9) }}>{weekW}</span>
                  </td>
                  <td colSpan={totalCols}
                    className="border-b border-slate-800/30 text-center align-middle"
                    style={{
                      background: isAllHoliday ? '#1e293b50' : '#78350f30',
                      height: ROW_H,
                    }}>
                    <div className="flex items-center justify-center gap-1.5">
                      <span style={{ fontSize: z(10) }}>{isAllHoliday ? '🏖' : '📅'}</span>
                      <span className={`font-medium ${isAllHoliday ? 'text-gray-300' : 'text-amber-100'}`} style={{ fontSize: z(11) }}>
                        {label}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            }

            return (
              <tr key={weekW} data-week={weekW}
                style={{
                  opacity: dimPastWeeks && past && !isCurrent ? 0.4 : 1,
                  height: ROW_H,
                  borderTop: isSemBreak ? '3px solid #f59e0b50' : undefined,
                }}>
                <td className={`bg-gray-900 sticky left-0 z-10 text-center border-b py-0 px-0.5 ${
                  isCurrent ? 'border-amber-500 bg-amber-950/30' : 'border-slate-800/50'
                }`}>
                  <span className={`font-mono font-bold ${isCurrent ? 'text-amber-400' : 'text-gray-400'}`} style={{ fontSize: z(9) }}>
                    {weekW}
                  </span>
                </td>

                {groups.map((group) => {
                    if (group.isMultiDay) {
                      // Render sub-columns per day
                      // Check for shared span first
                      const sharedKey = `${weekIdx}:${group.courses[0].id}:shared`;
                      const sharedSpan = spanMap.get(sharedKey);
                      const sharedSkip = skipSet.has(sharedKey);

                      if (sharedSkip) return null; // covered by rowSpan above

                      if (sharedSpan) {
                        // Wide bar spanning all sub-columns
                        const colors = getBlockColors(sharedSpan.subjectArea);
                        const spanHeight = sharedSpan.spanLen * ROW_H;
                        const displayLabel = sharedSpan.topicMain || sharedSpan.label;
                        const blockSearchMatch = searchLower.length >= 2 && (
                          sharedSpan.label.toLowerCase().includes(searchLower) ||
                          (sharedSpan.topicMain || '').toLowerCase().includes(searchLower) ||
                          sharedSpan.seq.title.toLowerCase().includes(searchLower)
                        );
                        return (
                          <td key={group.key} colSpan={group.courses.length}
                            rowSpan={sharedSpan.spanLen} className="p-0"
                            style={{ height: spanHeight, opacity: searchLower.length >= 2 && !blockSearchMatch ? 0.15 : 1 }}>
                            <div className={`h-full px-2 py-1 flex flex-col justify-center cursor-pointer transition-all hover:brightness-110 rounded-sm ${blockSearchMatch ? 'ring-1 ring-amber-400' : ''}`}
                              style={{ background: colors.bg, borderLeft: `4px solid ${colors.border}`, minHeight: spanHeight - 2 }}
                              title={`${sharedSpan.seq.title} → ${displayLabel}\n${sharedSpan.spanLen}W\nKlick: Sequenz · Doppelklick: Wochenansicht`}
                              onClick={() => handleBlockClick(sharedSpan)}
                              onDoubleClick={() => handleBlockDblClick(sharedSpan.weeks[0], group.courses[0], sharedSpan)}>
                              <span className="font-bold leading-tight" style={{ color: colors.fg, fontSize: z(zoomCfg.fontSize + 1), display: '-webkit-box', WebkitLineClamp: sharedSpan.spanLen >= 3 ? 3 : 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                {displayLabel}
                              </span>
                              {sharedSpan.spanLen >= 2 && (
                                <span className="mt-0.5 font-medium" style={{ fontSize: z(9), color: colors.fg, opacity: 0.7 }}>{sharedSpan.spanLen}W</span>
                              )}
                            </div>
                          </td>
                        );
                      }

                      // Separate sub-columns per day
                      return group.courses.map((course) => {
                        const daySpanKey = `${weekIdx}:${course.id}:${course.id}`;
                        const daySkip = skipSet.has(daySpanKey);
                        if (daySkip) return null;

                        const daySpan = spanMap.get(daySpanKey) || spanMap.get(`${weekIdx}:${course.id}:loose`);
                        if (!daySpan) {
                          // Check if this cell is an event/holiday
                          const cellEntry = weekEntry?.lessons[course.col];
                          const cellType = (cellEntry as any)?.type;
                          if (cellType === 5 || cellType === 6) {
                            return (
                              <td key={course.id} className="border-b border-slate-800/20 p-0"
                                style={{ width: SUBDAY_W, minWidth: SUBDAY_W, maxWidth: SUBDAY_W }}>
                                <div className="h-full flex items-center justify-center"
                                  style={{ background: cellType === 6 ? '#1e293b40' : '#78350f30', minHeight: ROW_H - 2 }}>
                                  <span className={`${cellType === 6 ? 'text-gray-400' : 'text-amber-200'}`} style={{ fontSize: z(8) }}>
                                    {cellType === 6 ? '🏖' : '📅'}
                                  </span>
                                </div>
                              </td>
                            );
                          }
                          return (
                            <td key={course.id} className="border-b border-slate-800/20 p-0 cursor-pointer hover:bg-slate-800/30"
                              style={{ width: SUBDAY_W, minWidth: SUBDAY_W, maxWidth: SUBDAY_W }}
                              onClick={() => handleEmptyClick(weekW, course)} />
                          );
                        }

                        const colors = getBlockColors(daySpan.subjectArea);
                        const spanHeight = daySpan.spanLen * ROW_H;
                        const displayLabel = daySpan.topicMain || daySpan.label;
                        const blockSearchMatch = searchLower.length >= 2 && (
                          daySpan.label.toLowerCase().includes(searchLower) ||
                          (daySpan.topicMain || '').toLowerCase().includes(searchLower) ||
                          daySpan.seq.title.toLowerCase().includes(searchLower)
                        );
                        return (
                          <td key={course.id} rowSpan={daySpan.spanLen} className="p-0"
                            style={{ width: SUBDAY_W, minWidth: SUBDAY_W, maxWidth: SUBDAY_W, height: spanHeight, opacity: searchLower.length >= 2 && !blockSearchMatch ? 0.15 : 1 }}>
                            <div className={`h-full px-1 py-0.5 flex flex-col justify-center cursor-pointer transition-all hover:brightness-110 rounded-sm ${blockSearchMatch ? 'ring-1 ring-amber-400' : ''}`}
                              style={{ background: colors.bg, borderLeft: `3px solid ${colors.border}`, minHeight: spanHeight - 2 }}
                              title={`${daySpan.seq.title} → ${displayLabel} (${course.day})\n${daySpan.spanLen}W`}
                              onClick={() => handleBlockClick(daySpan)}
                              onDoubleClick={() => handleBlockDblClick(daySpan.weeks[0], course, daySpan)}>
                              <span className="font-bold leading-tight" style={{ color: colors.fg, fontSize: zoomCfg.fontSize, display: '-webkit-box', WebkitLineClamp: daySpan.spanLen >= 3 ? 2 : 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                {displayLabel}
                              </span>
                            </div>
                          </td>
                        );
                      });
                    } else {
                      // Single-day course group
                      const course = group.courses[0];
                      // Try to find a span starting here
                      const spanKey = `${weekIdx}:${course.id}:${course.id}`;
                      const looseKey = `${weekIdx}:${course.id}:loose`;
                      const skip = skipSet.has(spanKey);
                      if (skip) return null;

                      const span = spanMap.get(spanKey) || spanMap.get(looseKey);
                      if (!span) {
                        // Check if this cell is an event/holiday
                        const cellEntry = weekEntry?.lessons[course.col];
                        const cellType = (cellEntry as any)?.type;
                        if (cellType === 5 || cellType === 6) {
                          const cellLabel = (cellEntry as any)?.title || (cellType === 6 ? 'Ferien' : 'Sonderwoche');
                          return (
                            <td key={group.key} className="border-b border-slate-800/20 p-0"
                              style={{ width: GROUP_W, minWidth: GROUP_W, maxWidth: GROUP_W }}>
                              <div className="h-full flex items-center justify-center px-1"
                                style={{ background: cellType === 6 ? '#1e293b40' : '#78350f30', minHeight: ROW_H - 2 }}>
                                <span className={cellType === 6 ? 'text-gray-400' : 'text-amber-200'} style={{ fontSize: z(9) }}>
                                  {cellType === 6 ? '🏖' : '📅'} {cellLabel}
                                </span>
                              </div>
                            </td>
                          );
                        }
                        return (
                          <td key={group.key} className="border-b border-slate-800/20 p-0 cursor-pointer hover:bg-slate-800/30"
                            style={{ width: GROUP_W, minWidth: GROUP_W, maxWidth: GROUP_W }}
                            onClick={() => handleEmptyClick(weekW, course)} />
                        );
                      }

                      const colors = getBlockColors(span.subjectArea);
                      const spanHeight = span.spanLen * ROW_H;
                      const displayLabel = span.topicMain || span.label;
                      const blockSearchMatch = searchLower.length >= 2 && (
                        span.label.toLowerCase().includes(searchLower) ||
                        (span.topicMain || '').toLowerCase().includes(searchLower) ||
                        (span.isLoose ? false : span.seq.title.toLowerCase().includes(searchLower))
                      );
                      return (
                        <td key={group.key} rowSpan={span.spanLen} className="p-0"
                          style={{ width: GROUP_W, minWidth: GROUP_W, maxWidth: GROUP_W, height: spanHeight, opacity: searchLower.length >= 2 && !blockSearchMatch ? 0.15 : 1 }}>
                          <div className={`h-full px-2 py-1 flex flex-col justify-center cursor-pointer transition-all hover:brightness-110 rounded-sm ${blockSearchMatch ? 'ring-1 ring-amber-400' : ''}`}
                            style={{
                              background: span.isLoose ? colors.bg + '80' : colors.bg,
                              borderLeft: span.isLoose ? `2px dashed ${colors.border}` : `4px solid ${colors.border}`,
                              minHeight: spanHeight - 2,
                            }}
                            title={span.isLoose
                              ? `${displayLabel}\nEinzellektion · Klick: Details · Doppelklick: Wochenansicht`
                              : `${span.seq.title} → ${displayLabel}\n${span.spanLen}W\nKlick: Sequenz · Doppelklick: Wochenansicht`}
                            onClick={() => handleBlockClick(span)}
                            onDoubleClick={() => handleBlockDblClick(span.weeks[0], course, span)}>
                            <span className="font-bold leading-tight" style={{ color: colors.fg, fontSize: z(zoomCfg.fontSize), display: '-webkit-box', WebkitLineClamp: span.spanLen >= 3 ? 3 : 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {displayLabel}
                            </span>
                            {span.spanLen >= 2 && (
                              <span className="mt-0.5 font-medium" style={{ color: colors.fg, opacity: 0.7, fontSize: z(8) }}>{span.spanLen}W</span>
                            )}
                          </div>
                        </td>
                      );
                    }
                  })
                }
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
