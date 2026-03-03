import { Fragment } from 'react';
import type { Course, Week } from '../types';
import { DAY_COLORS, TYPE_BADGES } from '../utils/colors';
import { usePlannerStore } from '../store/plannerStore';

interface Props {
  courses: Course[];
  semester: 1 | 2;
  weeks?: Week[];
}

export function SemesterHeader({ courses, semester, weeks }: Props) {
  const { classFilter, setClassFilter, courseFilter, setCourseFilter, setFilter, expandedNoteCols, toggleNoteCol, noteColWidth, setNoteColWidth, setSidePanelOpen, setSidePanelTab, setSettingsEditCourseId } = usePlannerStore();
  const ncw = noteColWidth;

  // Drag resize for note column
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startW = ncw;
    const onMove = (ev: MouseEvent) => {
      setNoteColWidth(startW + ev.clientX - startX);
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  return (
    <thead className="sticky z-40" style={{ top: 0 }}>
      {/* Day row */}
      <tr>
        <th className="w-12 bg-gray-900 sticky left-0 z-50 py-1 border-b border-gray-800">
          <span className={`text-[9px] font-bold ${semester === 1 ? 'text-blue-400' : 'text-amber-400'}`}>
            {semester === 1 ? 'S1' : 'S2'}
          </span>
        </th>
        {courses.map((c, i) => {
          const newDay = i === 0 || c.day !== courses[i - 1]?.day;
          const expanded = !!expandedNoteCols[c.id];
          return (
            <Fragment key={`${c.id}-day`}>
              <th
                className="bg-gray-900 px-0 pt-0.5 border-b border-gray-800 text-center"
                style={{
                  borderLeft: newDay ? `2px solid ${DAY_COLORS[c.day]}40` : 'none',
                  fontSize: 10, fontWeight: 700, color: DAY_COLORS[c.day],
                }}
              >
                {newDay ? c.day : ''}
              </th>
              {expanded && (
                <th className="bg-gray-900 border-b border-gray-800"
                  style={{ width: ncw, minWidth: ncw, maxWidth: ncw }} />
              )}
            </Fragment>
          );
        })}
      </tr>
      {/* Course info row */}
      <tr>
        <th className="w-12 bg-gray-900 sticky left-0 z-50 px-1 pb-1 border-b-2 border-gray-700">
          <span className="text-[7px] text-gray-500 font-semibold">KW</span>
        </th>
        {courses.map((c, i) => {
          const newDay = i === 0 || c.day !== courses[i - 1]?.day;
          const badge = TYPE_BADGES[c.typ];
          const expanded = !!expandedNoteCols[c.id];
          return (
            <Fragment key={`${c.id}-info`}>
              <th
                className={`bg-gray-900 px-0.5 pb-1 border-b-2 text-center ${courseFilter === `${c.cls}|${c.typ}` ? 'border-blue-500' : 'border-gray-700'}`}
                style={{
                  borderLeft: newDay ? `2px solid ${DAY_COLORS[c.day]}40` : 'none',
                  width: 110, minWidth: 110, maxWidth: 110,
                }}
                onDoubleClick={() => setCourseFilter(courseFilter === `${c.cls}|${c.typ}` ? null : `${c.cls}|${c.typ}`)}
              >
                <div className="flex items-center justify-center gap-0.5">
                  <div
                    className={`text-[10px] font-bold cursor-pointer transition-colors ${
                      classFilter === c.cls ? 'text-blue-400' : 'text-gray-200 hover:text-blue-300'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSettingsEditCourseId(c.id);
                      setSidePanelOpen(true);
                      setSidePanelTab('settings');
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setClassFilter(classFilter === c.cls ? null : c.cls);
                    }}
                    title={`Klick: Kurs bearbeiten | Rechtsklick: Nur ${c.cls} filtern`}
                  >
                    {c.cls}
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleNoteCol(c.id); }}
                    className={`text-[9px] px-1 py-0.5 rounded cursor-pointer transition-all ${
                      expanded ? 'text-blue-400 bg-blue-900/40 border border-blue-700/50' : 'text-gray-500 hover:text-gray-300 bg-slate-800/60 hover:bg-slate-700/60'
                    }`}
                    title={expanded ? 'Notizen-Spalte ausblenden' : 'Notizen-Spalte einblenden'}
                  >
                    {expanded ? '📝◂' : '📝▸'}
                  </button>
                </div>
                <div className="flex gap-0.5 justify-center mt-0.5 flex-wrap">
                  <span
                    className="text-[7px] px-1 rounded font-bold cursor-pointer hover:opacity-80 transition-opacity"
                    style={{ background: badge?.bg, color: badge?.fg }}
                    onClick={() => setFilter(c.typ as any)}
                    title={`Filter: Nur ${c.typ}`}
                  >
                    {c.typ}
                  </span>
                  <span className={`text-[7px] px-1 rounded font-semibold ${
                    c.hk ? 'bg-orange-900/60 text-orange-200' : 'bg-gray-700 text-gray-400'
                  }`}>
                    {c.hk ? 'HK' : 'GK'}
                  </span>
                  <span className="text-[7px] px-0.5 rounded bg-slate-800 text-slate-400">{c.les}L</span>
                  {weeks && (() => {
                    const planned = weeks.filter(w => { const e = w.lessons[c.col]; return e && e.type !== 6; }).length;
                    const free = weeks.filter(w => !w.lessons[c.col]).length;
                    return free > 0 ? (
                      <span className="text-[6px] px-0.5 rounded bg-slate-800/60 text-gray-500" title={`${planned} geplant, ${free} frei`}>
                        {free}✎
                      </span>
                    ) : null;
                  })()}
                </div>
                <div className="text-[7px] text-gray-500 font-mono mt-0.5">{c.from}–{c.to}</div>
                {c.note && <div className="text-[6px] text-amber-600 mt-0.5">{c.note}</div>}
              </th>
              {expanded && (
                <th
                  className="bg-gray-900/80 px-1 pb-1 border-b-2 border-gray-700 text-center border-l border-gray-800 relative"
                  style={{ width: ncw, minWidth: ncw, maxWidth: ncw }}>
                  <div className="text-[8px] text-gray-500">📝 Notizen</div>
                  {/* Resize handle */}
                  <div
                    className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-blue-500/40 transition-colors"
                    onMouseDown={handleResizeStart}
                  />
                </th>
              )}
            </Fragment>
          );
        })}
      </tr>
    </thead>
  );
}
