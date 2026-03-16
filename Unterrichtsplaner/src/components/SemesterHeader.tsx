import { Fragment } from 'react';
import type { Course, Week } from '../types';
import { DAY_COLORS, TYPE_BADGES } from '../utils/colors';
import { usePlannerStore, ZOOM_LEVELS, zs } from '../store/plannerStore';

interface Props {
  courses: Course[];
  semester: 1 | 2;
  weeks?: Week[];
}

export function SemesterHeader({ courses, semester, weeks }: Props) {
  const { classFilter, setClassFilter, courseFilter, setCourseFilter, setFilter, expandedNoteCols, toggleNoteCol, noteColWidth, setNoteColWidth, setSidePanelOpen, setSidePanelTab, setSettingsEditCourseId, columnZoom, autoFitZoom } = usePlannerStore();
  const ncw = noteColWidth;
  const zoomCfg = ZOOM_LEVELS[columnZoom] || ZOOM_LEVELS[2];
  const colW = zoomCfg.colWidth;
  const z = (base: number) => zs(base, zoomCfg);

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
          <span className={`font-bold ${semester === 1 ? 'text-blue-400' : 'text-amber-400'}`} style={{ fontSize: z(9) }}>
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
                  fontSize: z(10), fontWeight: 700, color: DAY_COLORS[c.day],
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
          <span className="text-gray-500 font-semibold" style={{ fontSize: z(7) }}>KW</span>
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
                  ...(autoFitZoom ? {} : { width: colW, minWidth: colW, maxWidth: colW }),
                }}
                onDoubleClick={() => setCourseFilter(courseFilter === `${c.cls}|${c.typ}` ? null : `${c.cls}|${c.typ}`)}
              >
                <div className="flex items-center justify-center gap-0.5 overflow-hidden">
                  <div
                    className={`font-bold cursor-pointer transition-colors truncate ${
                      classFilter === c.cls ? 'text-blue-400' : 'text-gray-200 hover:text-blue-300'
                    }`}
                    style={{ fontSize: Math.max(z(8), zoomCfg.fontSize - 1) }}
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
                    className={`px-1 py-0.5 rounded cursor-pointer transition-all ${
                      expanded ? 'text-blue-400 bg-blue-900/40 border border-blue-700/50' : 'text-gray-500 hover:text-gray-300 bg-slate-800/60 hover:bg-slate-700/60'
                    }`}
                    style={{ fontSize: z(9) }}
                    title={expanded ? 'Notizen-Spalte ausblenden' : 'Notizen-Spalte einblenden'}
                  >
                    {expanded ? '📝◂' : '📝▸'}
                  </button>
                </div>
                <div className="flex gap-0.5 justify-center mt-0.5 flex-wrap">
                  <span
                    className="px-1 rounded font-bold cursor-pointer hover:opacity-80 transition-opacity"
                    style={{ fontSize: z(7), background: badge?.bg, color: badge?.fg }}
                    onClick={() => setFilter(c.typ as any)}
                    title={`Filter: Nur ${c.typ}`}
                  >
                    {c.typ}
                  </span>
                  {/* v3.80 C5: Show Stufe if available, show HK only when hk=true, never show GK */}
                  {c.stufe && (
                    <span className="px-1 rounded font-semibold bg-cyan-900/60 text-cyan-300" style={{ fontSize: z(7) }}>{c.stufe}</span>
                  )}
                  {c.hk && (
                    <span className="px-1 rounded font-semibold bg-orange-900/60 text-orange-200" style={{ fontSize: z(7) }}>HK</span>
                  )}
                  <span className="px-0.5 rounded bg-slate-800 text-slate-400" style={{ fontSize: z(7) }}>{c.les}L</span>
                  {/* v3.102: TaF-Phase als Badge statt orange Text */}
                  {(() => {
                    if (!c.note) return null;
                    const phaseMatch = c.note.match(/Phase\s*(\d)/i);
                    return phaseMatch ? (
                      <span className="px-1 rounded font-semibold bg-purple-900/60 text-purple-300" style={{ fontSize: z(7) }} title={c.note}>Ph{phaseMatch[1]}</span>
                    ) : null;
                  })()}
                  {weeks && (() => {
                    const planned = weeks.filter(w => { const e = w.lessons[c.col]; return e && e.type !== 6; }).length;
                    const free = weeks.filter(w => !w.lessons[c.col]).length;
                    return free > 0 ? (
                      <span className="px-0.5 rounded bg-slate-800/60 text-gray-500" style={{ fontSize: z(6) }} title={`${free} freie Wochen (${planned} geplant)`}>
                        {free} frei
                      </span>
                    ) : null;
                  })()}
                </div>
                <div className="text-gray-500 font-mono mt-0.5" style={{ fontSize: z(7) }}>{c.from}–{c.to}</div>
                {/* v3.102: Redundante Notes filtern (HK/Praktikum als Badge, Phase als Badge) */}
                {c.note && !(/^(praktikum\s*)?(hk)?$/i.test(c.note.trim())) && !(/phasenunterricht/i.test(c.note)) && (
                  <div className="text-amber-600 mt-0.5" style={{ fontSize: z(6) }}>{c.note}</div>
                )}
              </th>
              {expanded && (
                <th
                  className="bg-gray-900/80 px-1 pb-1 border-b-2 border-gray-700 text-center border-l border-gray-800 relative"
                  style={{ width: ncw, minWidth: ncw, maxWidth: ncw }}>
                  <div className="text-gray-500" style={{ fontSize: z(8) }}>📝 Notizen</div>
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
