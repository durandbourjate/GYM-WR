import { useMemo, useCallback } from 'react';
import { usePlannerStore, ZOOM_LEVELS } from '../store/plannerStore';
import { usePlannerData } from '../hooks/usePlannerData';
import { TYPE_BADGES, DAY_COLORS, isPastWeek } from '../utils/colors';
import { inferSubjectAreaFromLessonType, getBlockColors } from '../data/categories';
import type { Course, ManagedSequence, LessonType, SubjectArea } from '../types';

const DAY_ORDER: Record<string, number> = { Mo: 0, Di: 1, Mi: 2, Do: 3, Fr: 4 };
const ROW_H = 24; // px per week row
const HOLIDAY_ROW_H = 18;

interface Props {
  semester: 1 | 2;
}

/** Contiguous span of weeks belonging to one block within a single semester */
interface BlockSpan {
  seq: ManagedSequence;
  blockIdx: number;
  label: string;
  topicMain?: string;
  subjectArea?: string;
  curriculumGoal?: string;
  /** The consecutive semWeeks indices this block covers */
  startIdx: number;
  spanLen: number;
  /** KW strings */
  weeks: string[];
}

// inferSubjectArea + getBlockColors now imported from data/categories.ts

/** Detect holiday/event from weekData for a specific course column */
function getWeekType(weekW: string, weekData: any[], col: number): 'holiday' | 'event' | 'normal' {
  const week = weekData.find((w: any) => w.w === weekW);
  if (!week) return 'normal';
  const entry = week.lessons[col];
  if (!entry) return 'normal';
  if (entry.type === 6) return 'holiday';
  if (entry.type === 5) return 'event';
  return 'normal';
}

// Block colors now imported from data/categories.ts (getBlockColors)

export function ZoomBlockView({ semester }: Props) {
  const {
    filter, classFilter, sequences, weekData,
    setZoomLevel, setEditingSequenceId,
    setSidePanelOpen, setSidePanelTab, setSelection,
    searchQuery, setClassFilter, setFilter,
    columnZoom,
  } = usePlannerStore();

  const zoomCfg = ZOOM_LEVELS[columnZoom] || ZOOM_LEVELS[2];
  const COL_W = zoomCfg.colWidth;

  const { courses: allCourses, weeks: staticWeeks, s2StartIndex, currentWeek } = usePlannerData();

  const courses = useMemo(() => {
    let c = allCourses.filter(co => co.semesters.includes(semester));
    if (filter !== 'ALL') c = c.filter(co => co.typ === filter);
    if (classFilter) c = c.filter(co => co.cls === classFilter);
    return [...c].sort((a, b) => {
      const dayDiff = (DAY_ORDER[a.day] ?? 9) - (DAY_ORDER[b.day] ?? 9);
      if (dayDiff !== 0) return dayDiff;
      return a.from.localeCompare(b.from);
    });
  }, [filter, classFilter, semester, allCourses]);

  const effectiveWeeks = useMemo(() =>
    weekData.length > 0 ? weekData : staticWeeks,
    [weekData, staticWeeks]);

  const semWeeks = useMemo(() => {
    const all = effectiveWeeks.map(w => w.w);
    if (semester === 1) return all.slice(0, s2StartIndex);
    return all.slice(s2StartIndex);
  }, [effectiveWeeks, semester, s2StartIndex]);

  // Build BlockSpans per course — contiguous runs of a block within the semester
  // Also build a skip set: cells covered by a rowSpan that shouldn't render a <td>
  const { spanMap, skipSet } = useMemo(() => {
    const spanMap = new Map<string, BlockSpan>(); // key: "startIdx:courseId"
    const skipSet = new Set<string>(); // keys: "weekIdx:courseId" for rows 2..n of a span

    for (const course of courses) {
      const courseSeqs = sequences.filter(s =>
        s.courseId === course.id || (s.courseIds?.includes(course.id))
      );
      for (const seq of courseSeqs) {
        for (let bi = 0; bi < seq.blocks.length; bi++) {
          const block = seq.blocks[bi];
          // Find contiguous run of weeks within semWeeks
          const weekIndices: number[] = [];
          for (const w of block.weeks) {
            const idx = semWeeks.indexOf(w);
            if (idx >= 0) weekIndices.push(idx);
          }
          if (weekIndices.length === 0) continue;

          // Group into contiguous runs (handle blocks that span across holidays)
          weekIndices.sort((a, b) => a - b);
          let runStart = weekIndices[0];
          let prev = weekIndices[0];
          const runs: { start: number; end: number }[] = [];
          for (let i = 1; i < weekIndices.length; i++) {
            if (weekIndices[i] === prev + 1) {
              prev = weekIndices[i];
            } else {
              runs.push({ start: runStart, end: prev });
              runStart = weekIndices[i];
              prev = weekIndices[i];
            }
          }
          runs.push({ start: runStart, end: prev });

          // Determine subjectArea: block → seq → infer from weekData
          let area = block.subjectArea || seq.subjectArea;
          if (!area) {
            const firstWeek = semWeeks[weekIndices[0]];
            const wd = effectiveWeeks.find(w => w.w === firstWeek);
            const entry = wd?.lessons[course.col];
            if (entry) area = inferSubjectAreaFromLessonType(entry.type as LessonType) as SubjectArea | undefined;
          }

          for (const run of runs) {
            const spanLen = run.end - run.start + 1;
            const spanWeeks = semWeeks.slice(run.start, run.end + 1);
            const spanKey = `${run.start}:${course.id}`;
            spanMap.set(spanKey, {
              seq, blockIdx: bi,
              label: block.label,
              topicMain: block.topicMain,
              subjectArea: area,
              curriculumGoal: block.curriculumGoal,
              startIdx: run.start,
              spanLen,
              weeks: spanWeeks,
            });
            // Mark rows 2..n as skipped
            for (let r = run.start + 1; r <= run.end; r++) {
              skipSet.add(`${r}:${course.id}`);
            }
          }
        }
      }
    }
    return { spanMap, skipSet };
  }, [courses, sequences, semWeeks, effectiveWeeks]);

  const searchLower = searchQuery.toLowerCase();

  // Click handlers
  const handleBlockClick = useCallback((span: BlockSpan) => {
    setEditingSequenceId(`${span.seq.id}-${span.blockIdx}`);
    setSidePanelOpen(true);
    setSidePanelTab('sequences');
  }, [setEditingSequenceId, setSidePanelOpen, setSidePanelTab]);

  const handleBlockDblClick = useCallback((weekW: string, course: Course, span: BlockSpan) => {
    setZoomLevel(3);
    setSelection({ week: weekW, courseId: course.id, title: span.label, course });
    setTimeout(() => {
      document.querySelector(`tr[data-week="${weekW}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  }, [setZoomLevel, setSelection]);

  const handleEmptyClick = useCallback((weekW: string, course: Course) => {
    setZoomLevel(3);
    setSelection({ week: weekW, courseId: course.id, title: '', course });
    setTimeout(() => {
      document.querySelector(`tr[data-week="${weekW}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  }, [setZoomLevel, setSelection]);

  return (
    <div className="px-1 py-1">
      <table className="border-collapse w-max min-w-full">
        <thead className="sticky z-40" style={{ top: 0 }}>
          <tr>
            <th className="w-10 bg-gray-900 sticky left-0 z-50 py-0.5 border-b border-gray-800">
              <span className={`text-[8px] font-bold ${semester === 1 ? 'text-blue-400' : 'text-amber-400'}`}>
                {semester === 1 ? 'S1' : 'S2'}
              </span>
            </th>
            {courses.map((c, i) => {
              const newDay = i === 0 || c.day !== courses[i - 1]?.day;
              return (
                <th key={`${c.id}-day`} className="bg-gray-900 px-0 pt-0.5 border-b border-gray-800 text-center"
                  style={{ borderLeft: newDay ? `2px solid ${DAY_COLORS[c.day]}40` : 'none', fontSize: 9, fontWeight: 700, color: DAY_COLORS[c.day] }}>
                  {newDay ? c.day : ''}
                </th>
              );
            })}
          </tr>
          <tr>
            <th className="w-10 bg-gray-900 sticky left-0 z-50 px-0.5 pb-0.5 border-b-2 border-gray-700">
              <span className="text-[7px] text-gray-500 font-semibold">KW</span>
            </th>
            {courses.map((c, i) => {
              const newDay = i === 0 || c.day !== courses[i - 1]?.day;
              const badge = TYPE_BADGES[c.typ];
              return (
                <th key={`${c.id}-info`} className="bg-gray-900 px-0.5 pb-0.5 border-b-2 border-gray-700 text-center"
                  style={{ borderLeft: newDay ? `2px solid ${DAY_COLORS[c.day]}40` : 'none', width: COL_W, minWidth: COL_W, maxWidth: COL_W }}>
                  <div className={`text-[9px] font-bold cursor-pointer transition-colors ${classFilter === c.cls ? 'text-blue-400' : 'text-gray-200 hover:text-blue-300'}`}
                    onClick={() => setClassFilter(classFilter === c.cls ? null : c.cls)}>
                    {c.cls}
                  </div>
                  <div className="flex gap-0.5 justify-center mt-0.5">
                    <span className="text-[7px] px-1 rounded font-bold cursor-pointer hover:opacity-80"
                      style={{ background: badge?.bg, color: badge?.fg }}
                      onClick={() => setFilter(c.typ as any)}>{c.typ}</span>
                    <span className="text-[7px] px-0.5 rounded bg-slate-800 text-slate-400">{c.les}L</span>
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {semWeeks.map((weekW, weekIdx) => {
            const past = isPastWeek(weekW, currentWeek);
            const isCurrent = weekW === currentWeek;

            // Full-week holiday check
            const weekEntry = effectiveWeeks.find(w => w.w === weekW);
            const allEntries = weekEntry ? Object.values(weekEntry.lessons) : [];
            const isHolidayWeek = allEntries.length > 0 && allEntries.every(e => (e as any).type === 6);
            const holidayLabel = isHolidayWeek ? (allEntries[0] as any)?.title : null;
            const isEventWeek = !isHolidayWeek && allEntries.length > 0 && allEntries.every(e => (e as any).type === 5);
            const eventLabel = isEventWeek ? (allEntries[0] as any)?.title : null;

            return (
              <tr key={weekW} data-week={weekW}
                style={{ opacity: past && !isCurrent ? 0.5 : 1, height: isHolidayWeek ? HOLIDAY_ROW_H : ROW_H }}>
                {/* KW label — always present */}
                <td className={`bg-gray-900 sticky left-0 z-10 text-center border-b py-0 px-0.5 ${
                  isCurrent ? 'border-amber-500 bg-amber-950/30' : 'border-slate-800/50'
                }`}>
                  <span className={`text-[8px] font-mono font-bold ${isCurrent ? 'text-amber-400' : 'text-gray-500'}`}>
                    {weekW}
                  </span>
                </td>

                {/* Full-width holiday/event */}
                {isHolidayWeek ? (
                  <td colSpan={courses.length} className="border-b border-slate-800/30 text-center py-0"
                    style={{ background: '#ffffff06' }}>
                    <span className="text-[7px] text-gray-600 italic">{holidayLabel || 'Ferien'}</span>
                  </td>
                ) : isEventWeek ? (
                  <td colSpan={courses.length} className="border-b border-slate-800/30 text-center py-0"
                    style={{ background: '#4b556312' }}>
                    <span className="text-[8px] text-gray-400 font-semibold">{eventLabel || 'Sonderwoche'}</span>
                  </td>
                ) : (
                  /* Normal week — per course cells */
                  courses.map((c, ci) => {
                    const newDay = ci === 0 || c.day !== courses[ci - 1]?.day;
                    const cellStyle = {
                      borderLeft: newDay ? `2px solid ${DAY_COLORS[c.day]}12` : 'none' as string,
                      width: COL_W, minWidth: COL_W, maxWidth: COL_W,
                    };

                    // Skip cells covered by a rowSpan from above
                    const skipKey = `${weekIdx}:${c.id}`;
                    if (skipSet.has(skipKey)) return null;

                    // Check if a BlockSpan starts here
                    const spanKey = `${weekIdx}:${c.id}`;
                    const span = spanMap.get(spanKey);

                    // Per-cell holiday/event
                    const wType = getWeekType(weekW, effectiveWeeks, c.col);

                    if (wType === 'holiday' && !span) {
                      return (
                        <td key={c.id} className="border-b border-slate-800/20 p-0" style={cellStyle}>
                          <div className="h-full flex items-center justify-center">
                            <span className="text-[6px] text-gray-600 italic">—</span>
                          </div>
                        </td>
                      );
                    }

                    if (wType === 'event' && !span) {
                      const evTitle = weekEntry?.lessons[c.col]?.title || '';
                      return (
                        <td key={c.id} className="border-b border-slate-800/20 p-0" style={cellStyle}>
                          <div className="h-full flex items-center px-1" style={{ background: '#4b556312' }}>
                            <span className="text-[7px] text-gray-500 truncate">{evTitle}</span>
                          </div>
                        </td>
                      );
                    }

                    // Empty cell
                    if (!span) {
                      return (
                        <td key={c.id} className="border-b border-slate-800/20 p-0 cursor-pointer hover:bg-slate-800/30"
                          style={cellStyle}
                          onClick={() => handleEmptyClick(weekW, c)}>
                        </td>
                      );
                    }

                    // Merged block span — rowSpan cell
                    const colors = getBlockColors(span.subjectArea);
                    const spanHeight = span.spanLen * ROW_H;

                    // Search
                    const blockSearchMatch = searchLower.length >= 2 && (
                      span.label.toLowerCase().includes(searchLower) ||
                      (span.topicMain || '').toLowerCase().includes(searchLower) ||
                      (span.curriculumGoal || '').toLowerCase().includes(searchLower) ||
                      span.seq.title.toLowerCase().includes(searchLower)
                    );
                    const blockSearchDimmed = searchLower.length >= 2 && !blockSearchMatch;

                    const displayLabel = span.topicMain || span.label;
                    const kwRange = `KW ${span.weeks[0]}–${span.weeks[span.weeks.length - 1]}`;

                    return (
                      <td key={c.id}
                        rowSpan={span.spanLen}
                        className="p-0 align-stretch"
                        style={{
                          ...cellStyle,
                          height: spanHeight,
                          opacity: blockSearchDimmed ? 0.15 : 1,
                          verticalAlign: 'stretch',
                        }}>
                        <div
                          className={`h-full px-2 py-1.5 flex flex-col justify-center cursor-pointer transition-all hover:brightness-110 rounded-sm ${blockSearchMatch ? 'ring-1 ring-amber-400' : ''}`}
                          style={{
                            background: colors.bg,
                            borderLeft: `4px solid ${colors.border || colors.bg}`,
                            minHeight: spanHeight - 2,
                          }}
                          title={`${span.seq.title} → ${span.label}${span.topicMain ? ' (' + span.topicMain + ')' : ''}\n${kwRange} (${span.spanLen}W)\nKlick: Sequenz öffnen · Doppelklick: Zur Wochenansicht`}
                          onClick={() => handleBlockClick(span)}
                          onDoubleClick={() => handleBlockDblClick(span.weeks[0], c, span)}
                        >
                          <span className="text-[10px] font-bold leading-tight" style={{ color: colors.fg, display: '-webkit-box', WebkitLineClamp: span.spanLen >= 3 ? 3 : 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {displayLabel}
                          </span>
                          {span.spanLen >= 2 && (
                            <span className="text-[8px] mt-0.5 font-medium" style={{ color: colors.fg, opacity: 0.7 }}>
                              {span.spanLen}W
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
