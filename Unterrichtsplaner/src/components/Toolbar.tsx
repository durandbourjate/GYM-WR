import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { usePlannerStore } from '../store/plannerStore';
import { usePlannerData } from '../hooks/usePlannerData';
import { StatsPanel } from './StatsPanel';
import { TaFPanel } from './TaFPanel';
import { COURSES } from '../data/courses';
import { CURRENT_WEEK, S2_START_INDEX } from '../data/weeks';
import { checkGradeRequirements } from '../utils/gradeRequirements';
import type { FilterType } from '../types';

export function AppHeader() {
  const { filter, setFilter, classFilter, setClassFilter, showHelp, toggleHelp, undoStack, undo, setSequencePanelOpen, sidePanelOpen, setSidePanelOpen, setSidePanelTab, zoomLevel, setZoomLevel, searchQuery, setSearchQuery, dimPastWeeks, setDimPastWeeks } = usePlannerStore();
  const [showStats, setShowStats] = useState(false);
  const [showTaF, setShowTaF] = useState(false);
  const { courses: plannerCourses } = usePlannerData();

  // Dynamic course type filters from configured courses
  const courseTypeFilters = useMemo(() => {
    const types = new Set(plannerCourses.map(c => c.typ));
    const ordered: FilterType[] = ['SF', 'EWR', 'EF', 'IN', 'KS'];
    return ordered.filter(t => types.has(t));
  }, [plannerCourses]);

  // Grade warnings badge
  const { weekData, lessonDetails } = usePlannerStore();
  const gradeIssueCount = useMemo(() => {
    if (!weekData.length) return 0;
    return checkGradeRequirements(weekData, lessonDetails, COURSES, S2_START_INDEX)
      .filter(w => w.status !== 'ok').length;
  }, [weekData, lessonDetails]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="bg-gray-900 border-b border-gray-800 px-4 py-2 sticky top-0 z-[60] flex items-center justify-between flex-wrap gap-2 no-print">
      <div className="flex items-baseline gap-2">
        <span className="text-base font-bold text-gray-50">
          <span className="text-blue-400">⊞</span> Unterrichtsplaner
        </span>
        <span className="text-[10px] text-gray-500">SJ 25/26 · DUY · v2.9</span>
      </div>
      <div className="flex gap-1 items-center">
        {/* Dynamic course type filters */}
        <button
          onClick={() => setFilter('ALL')}
          className={`px-2 py-0.5 rounded text-[10px] font-semibold border cursor-pointer transition-colors ${
            filter === 'ALL'
              ? 'bg-blue-500 text-white border-blue-500'
              : 'bg-transparent text-gray-400 border-gray-700 hover:border-gray-500'
          }`}
          title="Alle Kurse anzeigen"
        >
          Alle
        </button>
        {courseTypeFilters.map((typ) => (
          <button
            key={typ}
            onClick={() => setFilter(typ)}
            className={`px-2 py-0.5 rounded text-[10px] font-semibold border cursor-pointer transition-colors ${
              filter === typ
                ? 'bg-blue-500 text-white border-blue-500'
                : 'bg-transparent text-gray-400 border-gray-700 hover:border-gray-500'
            }`}
            title={`Filter: ${typ}`}
          >
            {typ}
          </button>
        ))}
        {/* TaF toggle */}
        <button
          onClick={() => setShowTaF(true)}
          className="px-2 py-0.5 rounded text-[10px] font-semibold border border-gray-700 text-gray-500 cursor-pointer hover:text-purple-300 hover:border-purple-700 transition-colors"
          title="TaF Phasenmodell"
        >
          TaF
        </button>
        {classFilter && (
          <button
            onClick={() => setClassFilter(null)}
            className="px-2 py-0.5 rounded text-[10px] font-semibold border cursor-pointer bg-amber-500/20 text-amber-300 border-amber-500 hover:bg-amber-500/30"
            title="Klassenfilter aufheben"
          >
            {classFilter} ✕
          </button>
        )}
        {/* Search */}
        <div className="relative">
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Escape') { setSearchQuery(''); (e.target as HTMLInputElement).blur(); } }}
            placeholder="🔍 Suche…"
            className="w-28 focus:w-44 transition-all px-2 py-0.5 rounded text-[10px] bg-slate-800 border border-gray-700 text-gray-300 outline-none focus:border-blue-400 placeholder-gray-600"
          />
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(''); searchInputRef.current?.focus(); }}
              className="absolute right-1 top-1/2 -translate-y-1/2 text-[9px] text-gray-500 hover:text-gray-300 cursor-pointer"
            >✕</button>
          )}
        </div>
        {showTaF && <TaFPanel onClose={() => setShowTaF(false)} />}
        <span className="w-px h-4 bg-gray-700 mx-1" />
        {undoStack.length > 0 && (
          <button
            onClick={undo}
            className="px-2 py-0.5 rounded text-[10px] border border-gray-700 text-gray-400 cursor-pointer hover:text-gray-200 hover:border-gray-500"
            title="Rückgängig (⌘Z)"
          >
            ↩
          </button>
        )}
        <button
          onClick={() => {
            const el = document.querySelector(`tr[data-week="${CURRENT_WEEK}"]`);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }}
          className="px-2 py-0.5 rounded text-[10px] border border-gray-700 text-gray-400 cursor-pointer hover:text-gray-200 hover:border-gray-500"
          title={`Zur aktuellen Woche (KW ${CURRENT_WEEK}) scrollen`}
        >
          ◉
        </button>
        <button
          onClick={() => setShowStats(true)}
          className="px-2 py-0.5 rounded text-[10px] border border-gray-700 text-gray-500 cursor-pointer hover:text-gray-300 hover:border-gray-500 relative"
          title="Statistik"
        >
          📊
          {gradeIssueCount > 0 && (
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full text-[7px] font-bold text-white flex items-center justify-center">
              {gradeIssueCount}
            </span>
          )}
        </button>
        {showStats && <StatsPanel onClose={() => setShowStats(false)} />}
        <span className="w-px h-4 bg-gray-700 mx-1" />
        {/* Zoom Level */}
        <div className="flex items-center border border-gray-700 rounded overflow-hidden">
          {([1, 3] as const).map((z, i) => (
            <button
              key={z}
              onClick={() => setZoomLevel(z)}
              className={`px-1.5 py-0.5 text-[9px] font-semibold cursor-pointer transition-colors ${
                zoomLevel === z
                  ? 'bg-cyan-600 text-white'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'
              } ${i === 0 ? 'border-r border-gray-700' : ''}`}
              title={z === 1 ? 'Jahresübersicht' : 'Wochenansicht'}
            >
              {z === 1 ? '◫' : '▦'}
            </button>
          ))}
        </div>
        <button
          onClick={() => setDimPastWeeks(!dimPastWeeks)}
          className={`px-2 py-0.5 rounded text-[9px] cursor-pointer transition-colors ${dimPastWeeks ? 'text-amber-400 bg-amber-900/30 border border-amber-700' : 'text-gray-500 border border-gray-700 hover:text-gray-300'}`}
          title={dimPastWeeks ? 'Vergangene Wochen: abgedunkelt' : 'Vergangene Wochen: volle Helligkeit'}
        >
          {dimPastWeeks ? '◐' : '●'}
        </button>
        <span className="w-px h-4 bg-gray-700 mx-1" />
        <button
          onClick={() => {
            const isSeqOpen = sidePanelOpen && usePlannerStore.getState().sidePanelTab === 'sequences';
            if (isSeqOpen) {
              setSidePanelOpen(false);
              setSequencePanelOpen(false);
            } else {
              setSidePanelOpen(true);
              setSidePanelTab('sequences');
              setSequencePanelOpen(true);
            }
          }}
          className={`px-2 py-0.5 rounded text-[10px] border cursor-pointer ${
            sidePanelOpen && usePlannerStore.getState().sidePanelTab === 'sequences'
              ? 'bg-green-900 border-green-600 text-green-300'
              : 'border-gray-700 text-gray-500 hover:border-green-700 hover:text-green-400'
          }`}
          title="Sequenzen verwalten"
        >
          ▧ Seq
        </button>
        <button
          onClick={() => {
            setSidePanelOpen(true);
            setSidePanelTab('settings');
          }}
          className="px-2 py-0.5 rounded text-[10px] border border-gray-700 text-gray-500 cursor-pointer hover:text-blue-300 hover:border-blue-700"
          title="Einstellungen (Export/Import hier)"
        >
          ⚙️
        </button>
        <button
          onClick={toggleHelp}
          className={`px-2 py-0.5 rounded text-[10px] border cursor-pointer ${
            showHelp ? 'bg-slate-800 border-gray-600 text-gray-300' : 'border-gray-700 text-gray-500'
          }`}
        >
          ?
        </button>
      </div>
    </div>
  );
}

export function HelpBar() {
  const { showHelp } = usePlannerStore();
  if (!showHelp) return null;

  return (
    <div className="bg-slate-800 border-b border-gray-700 px-4 py-2 text-[10px] text-slate-400 leading-relaxed no-print">
      <b className="text-gray-200">Bedienung:</b>{' '}
      <b>1× Klick</b> = Auswählen (Mini-Buttons: + ↓ i) ·{' '}
      <b>2× Klick</b> = Details öffnen ·{' '}
      <b>Hover</b> = Vorschau ·{' '}
      <b>⇧/⌘+Klick</b> = Mehrfachauswahl ·{' '}
      <b>Delete</b> = Zelle leeren ·{' '}
      <b>⌘Z</b> = Rückgängig ·{' '}
      <b>⌘F</b> = Suche ·{' '}
      <b>⌘P</b> = Drucken ·{' '}
      <b>↑↓</b> = Nächste Woche ·{' '}
      <b>Leere Zelle</b> = Neue Kachel/Sequenz
      <br />
      <b>Zoom:</b> <b>1</b> = Semester-Übersicht · <b>2</b> = Block-Ansicht · <b>3</b> = Wochen-Ansicht
      <br />
      <b className="text-amber-400">⚠ 1L↔2L:</b> Bei Kursen mit alternierenden Slots warnt das Tool bei Verschiebungskonflikten.
    </div>
  );
}

export function MultiSelectToolbar() {
  const { multiSelection, clearMultiSelect, batchShiftDown, batchInsertBefore, weekData,
    addSequence, setEditingSequenceId, setSidePanelOpen, setSidePanelTab, lessonDetails } = usePlannerStore();
  if (multiSelection.length === 0) return null;

  const allWeeks = weekData.map(w => w.w);

  // Group selection by courseId and create sequence
  const handleCreateSequence = () => {
    // Parse selection keys: "2026-W09-c11" → { week, courseId }
    const parsed = multiSelection.map(key => {
      const parts = key.split('-');
      const courseId = parts[parts.length - 1];
      const week = parts.slice(0, parts.length - 1).join('-');
      return { week, courseId };
    });

    // Group by courseId
    const byCourse = new Map<string, string[]>();
    for (const { week, courseId } of parsed) {
      if (!byCourse.has(courseId)) byCourse.set(courseId, []);
      byCourse.get(courseId)!.push(week);
    }

    // Use the first (or only) courseId
    const [courseId, weeks] = [...byCourse.entries()][0];
    const course = COURSES.find(c => c.id === courseId);
    if (!course) return;

    // Sort weeks chronologically
    const sortedWeeks = [...weeks].sort();

    // Detect shared subjectArea across selected cells
    const areas = new Set<string>();
    for (const { week, courseId: cid } of parsed) {
      const d = lessonDetails[`${week}-${cid}`];
      if (d?.subjectArea) areas.add(d.subjectArea);
    }
    const sharedArea = areas.size === 1 ? [...areas][0] as import('../types').SubjectArea : undefined;

    // Create single block with all selected weeks
    const seqId = addSequence({
      courseId,
      title: `Neue Sequenz ${course.cls}`,
      blocks: [{ weeks: sortedWeeks, label: '', ...(sharedArea ? { subjectArea: sharedArea } : {}) }],
      ...(sharedArea ? { subjectArea: sharedArea } : {}),
    });

    setEditingSequenceId(`${seqId}-0`);
    setSidePanelOpen(true);
    setSidePanelTab('sequences');
    clearMultiSelect();
  };

  // Check if all selections are in the same course column
  const courseIds = new Set(multiSelection.map(key => {
    const parts = key.split('-');
    return parts[parts.length - 1];
  }));
  const singleCourse = courseIds.size === 1;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-indigo-950/95 backdrop-blur border border-indigo-500 rounded-lg px-4 py-2 flex items-center gap-3 text-[10px] z-[55] shadow-xl shadow-black/40">
      <span className="font-bold text-indigo-200">{multiSelection.length} markiert</span>
      {singleCourse && (
        <button
          onClick={handleCreateSequence}
          className="px-2 py-0.5 rounded bg-green-700 text-white border-none text-[9px] font-semibold cursor-pointer hover:bg-green-600"
        >
          ▧ Neue Sequenz
        </button>
      )}
      <button
        onClick={() => batchShiftDown(multiSelection, allWeeks, COURSES)}
        className="px-2 py-0.5 rounded bg-indigo-600 text-white border-none text-[9px] font-semibold cursor-pointer hover:bg-indigo-500"
      >
        ↓ Verschieben (+1)
      </button>
      <button
        onClick={() => batchInsertBefore(multiSelection, allWeeks, COURSES)}
        className="px-2 py-0.5 rounded bg-indigo-600 text-white border-none text-[9px] font-semibold cursor-pointer hover:bg-indigo-500"
      >
        ⊞ Einfügen davor
      </button>
      <button
        onClick={clearMultiSelect}
        className="px-2 py-0.5 rounded bg-transparent text-indigo-300 border border-indigo-500 text-[9px] cursor-pointer"
      >
        ✕ Aufheben
      </button>
    </div>
  );
}

export function Legend() {
  const { categories } = usePlannerData();
  const fixedItems: [string, string][] = [
    ['Prüfung', '#fee2e2'],
    ['Event', '#e5e7eb'],
    ['Ferien', '#ffffff'],
  ];
  return (
    <div className="px-4 py-1 flex gap-2.5 flex-wrap text-[8px] text-gray-400 border-b border-slate-900/60">
      {categories.map(cat => (
        <span key={cat.key} className="flex items-center gap-0.5">
          <span className="w-2 h-2 rounded-sm border border-black/10" style={{ background: cat.bg }} />
          {cat.label}
        </span>
      ))}
      {fixedItems.map(([label, bg]) => (
        <span key={label} className="flex items-center gap-0.5">
          <span className="w-2 h-2 rounded-sm border border-black/10" style={{ background: bg }} />
          {label}
        </span>
      ))}
      <span>│</span>
      <span className="flex items-center gap-0.5">
        <span className="w-[3px] h-2.5 rounded-sm bg-green-600" />
        Sequenz
      </span>
    </div>
  );
}
