import { useState, useRef, useMemo, useEffect, useCallback, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { usePlannerStore } from '../store/plannerStore';
import { usePlannerData } from '../hooks/usePlannerData';
import { StatsPanel } from './StatsPanel';
import { TaFPanel } from './TaFPanel';
import { CURRENT_WEEK } from '../data/weeks';
import { checkGradeRequirements } from '../utils/gradeRequirements';
import { useTheme } from '../hooks/useTheme';
import type { FilterType } from '../types';
import { ZOOM_LEVELS } from '../store/plannerStore';

export function AppHeader() {
  const { filter, setFilter, classFilter, setClassFilter, showHelp, toggleHelp, undoStack, undo, setSequencePanelOpen, setSidePanelOpen, setSidePanelTab, zoomLevel, setZoomLevel, autoFitZoom, setAutoFitZoom, columnZoom, setColumnZoom, searchQuery, setSearchQuery, dimPastWeeks, setDimPastWeeks } = usePlannerStore();
  const [showStats, setShowStats] = useState(false);
  const [showTaF, setShowTaF] = useState(false);
  const { isLight, toggleTheme } = useTheme();
  const [showAddMenu, setShowAddMenu] = useState(false);
  const addMenuRef = useRef<HTMLDivElement>(null);
  const addBtnRef = useRef<HTMLButtonElement>(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const { courses: plannerCourses } = usePlannerData();

  // Dynamic course type filters from configured courses
  const courseTypeFilters = useMemo(() => {
    const types = new Set(plannerCourses.map(c => c.typ));
    const ordered: FilterType[] = ['SF', 'EWR', 'EF', 'IN', 'KS'];
    return ordered.filter(t => t !== 'ALL' && types.has(t as import('../types').CourseType));
  }, [plannerCourses]);

  // Grade warnings badge
  const { weekData, lessonDetails } = usePlannerStore();
  const { s2StartIndex, settings: plannerSettings } = usePlannerData();
  const gradeIssueCount = useMemo(() => {
    if (!weekData.length || !plannerCourses.length) return 0;
    return checkGradeRequirements(weekData, lessonDetails, plannerCourses, s2StartIndex, plannerSettings?.assessmentRules)
      .filter(w => w.status !== 'ok').length;
  }, [weekData, lessonDetails, plannerCourses, s2StartIndex, plannerSettings?.assessmentRules]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close add menu on click outside (v3.77 #6, v3.90 M4: Portal-aware)
  useEffect(() => {
    if (!showAddMenu) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (addMenuRef.current?.contains(target) || addBtnRef.current?.contains(target)) return;
      setShowAddMenu(false);
    };
    const keyHandler = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowAddMenu(false); };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', keyHandler);
    return () => { document.removeEventListener('mousedown', handler); document.removeEventListener('keydown', keyHandler); };
  }, [showAddMenu]);

  return (
    <div className="border-b px-4 py-2 sticky top-0 z-[60] flex items-center gap-2 no-print overflow-hidden" style={{ background: 'var(--toolbar-bg)', borderColor: 'var(--toolbar-border)' }}>
      <div className="flex items-baseline gap-2 flex-shrink-0">
        <span className="text-base font-bold text-gray-50">
          <span className="text-blue-400">⊞</span> Unterrichtsplaner
        </span>
        <span className="text-[10px] text-gray-500">v3.91</span>
      </div>
      {/* J6: Toolbar-Layout — Suche links, Filter mitte, Icons rechts */}
      {/* === Area 1: Search (flex-1, nimmt verfügbaren Platz) === */}
      <div className="relative flex-1 min-w-[120px]">
        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Escape') { setSearchQuery(''); (e.target as HTMLInputElement).blur(); } }}
          placeholder="🔍 Suche…"
          className="w-full px-2 py-0.5 rounded text-[10px] bg-slate-800 border border-gray-700 text-gray-300 outline-none focus:border-blue-400 placeholder-gray-600"
        />
        {searchQuery && (
          <button
            onClick={() => { setSearchQuery(''); searchInputRef.current?.focus(); }}
            className="absolute right-1 top-1/2 -translate-y-1/2 text-[9px] text-gray-500 hover:text-gray-300 cursor-pointer"
          >✕</button>
        )}
      </div>
      {/* M4: «+» Button — Dropdown als Portal gerendert (kein overflow-clip-Problem) */}
      <div className="flex-shrink-0" ref={addMenuRef}>
        <button
          ref={addBtnRef}
          onClick={() => {
            if (!showAddMenu) {
              const rect = addBtnRef.current?.getBoundingClientRect();
              if (rect) setDropdownPos({ top: rect.bottom + 4, left: rect.left });
            }
            setShowAddMenu(!showAddMenu);
          }}
          className="px-1.5 py-0.5 rounded text-[10px] font-semibold border border-dashed border-green-700 text-green-500 cursor-pointer hover:bg-green-900/20 hover:text-green-300 transition-colors"
          title="Neue Sequenz oder UE erstellen"
        >
          +
        </button>
      </div>
      {showAddMenu && createPortal(
        <div ref={addMenuRef} className="bg-slate-800 border border-slate-600 rounded-lg shadow-xl py-1 w-44"
          style={{ position: 'fixed', top: dropdownPos.top, left: dropdownPos.left, zIndex: 9999 }}>
          <button onClick={() => {
            setSidePanelOpen(true);
            setSidePanelTab('sequences');
            setSequencePanelOpen(true);
            setShowAddMenu(false);
          }}
            className="w-full px-3 py-1.5 text-left text-[10px] text-gray-200 hover:bg-slate-700 cursor-pointer flex items-center gap-2">
            <span className="text-green-400">▧</span> Neue Sequenz
          </button>
          <button onClick={() => {
            setSidePanelOpen(true);
            setSidePanelTab('details');
            setShowAddMenu(false);
          }}
            className="w-full px-3 py-1.5 text-left text-[10px] text-gray-200 hover:bg-slate-700 cursor-pointer flex items-center gap-2">
            <span className="text-blue-400">📖</span> Neue UE
          </button>
        </div>,
        document.body
      )}
      {/* === Area 2: Filters (flex-shrink, bei Platzmangel zusammengestaucht) === */}
      <div className="flex gap-1 items-center flex-shrink overflow-hidden">
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
        {showTaF && <TaFPanel onClose={() => setShowTaF(false)} />}
      </div>
      {/* === Area 3: Icons + Stats + Settings (flex-none, immer sichtbar) === */}
      <div className="flex gap-1 items-center flex-shrink-0">
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
        {zoomLevel === 3 && (
          <button
            onClick={() => setAutoFitZoom(!autoFitZoom)}
            className={`px-1.5 py-0.5 rounded text-[9px] font-semibold cursor-pointer transition-colors border ${
              autoFitZoom ? 'bg-cyan-600/30 border-cyan-500 text-cyan-300' : 'border-gray-700 text-gray-500 hover:text-gray-300'
            }`}
            title={autoFitZoom ? 'Auto-Fit: Tabelle passt sich an Bildschirmbreite an' : 'Auto-Fit: Tabelle hat feste Spaltenbreite'}
          >
            ⟷
          </button>
        )}
        {/* v3.91 N3: Zoom − / + Buttons */}
        <div className="flex items-center border border-gray-700 rounded overflow-hidden">
          <button
            onClick={() => setColumnZoom(columnZoom - 1)}
            disabled={columnZoom <= 0}
            className={`px-1.5 py-0.5 text-[9px] font-semibold cursor-pointer transition-colors border-r border-gray-700 ${columnZoom <= 0 ? 'text-gray-700 cursor-not-allowed' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'}`}
            title={`Zoom verkleinern (Stufe ${columnZoom + 1}/${ZOOM_LEVELS.length})`}
          >
            −
          </button>
          <button
            onClick={() => setColumnZoom(columnZoom + 1)}
            disabled={columnZoom >= ZOOM_LEVELS.length - 1}
            className={`px-1.5 py-0.5 text-[9px] font-semibold cursor-pointer transition-colors ${columnZoom >= ZOOM_LEVELS.length - 1 ? 'text-gray-700 cursor-not-allowed' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'}`}
            title={`Zoom vergrössern (Stufe ${columnZoom + 1}/${ZOOM_LEVELS.length})`}
          >
            +
          </button>
        </div>
        <button
          onClick={() => setDimPastWeeks(!dimPastWeeks)}
          className={`px-2 py-0.5 rounded text-[9px] cursor-pointer transition-colors ${dimPastWeeks ? 'text-amber-400 bg-amber-900/30 border border-amber-700' : 'text-gray-500 border border-gray-700 hover:text-gray-300'}`}
          title={dimPastWeeks ? 'Vergangene Wochen: abgedunkelt' : 'Vergangene Wochen: volle Helligkeit'}
        >
          {dimPastWeeks ? '◐' : '●'}
        </button>
        <button
          onClick={toggleTheme}
          className={`px-2 py-0.5 rounded text-[9px] cursor-pointer transition-colors border ${isLight ? 'text-amber-500 bg-amber-100 border-amber-300' : 'text-gray-500 border-gray-700 hover:text-yellow-300'}`}
          title={isLight ? 'Wechsel zu Darkmode' : 'Wechsel zu Lightmode'}
        >
          {isLight ? '☀' : '☽'}
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
          title="Kurzanleitung & Tastenkürzel"
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
    <div className="border-b px-4 py-2 text-[10px] leading-relaxed no-print" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
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
      <b>Leere Zelle</b> = Neue UE/Sequenz
      <br />
      <b>Zoom:</b> <b>1</b> = Semester-Übersicht · <b>2</b> = Block-Ansicht · <b>3</b> = Wochen-Ansicht
      <br />
      <b className="text-amber-400">⚠ 1L↔2L:</b> Bei Kursen mit alternierenden Slots warnt das Tool bei Verschiebungskonflikten.
    </div>
  );
}

export function MultiSelectToolbar() {
  const { multiSelection, clearMultiSelect,
    addSequence, setEditingSequenceId, setSidePanelOpen, setSidePanelTab, lessonDetails } = usePlannerStore();
  const { courses: plannerCoursesInner } = usePlannerData();
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Compute position from selected cells' bounding rects
  const computePosition = useCallback(() => {
    if (multiSelection.length === 0) { setPos(null); return; }
    if (window.innerWidth < 768) { setIsMobile(true); setPos(null); return; }
    setIsMobile(false);

    const rects: DOMRect[] = [];
    for (const key of multiSelection) {
      const el = document.querySelector(`[data-cell-key="${key}"]`);
      if (el) rects.push(el.getBoundingClientRect());
    }
    if (rects.length === 0) { setPos(null); return; }

    // Union bounding rect
    const top = Math.min(...rects.map(r => r.top));
    const right = Math.max(...rects.map(r => r.right));
    const left = Math.min(...rects.map(r => r.left));

    const menuW = 160;
    const menuH = 180;
    const gap = 8;

    // Default: right of selection
    let posLeft = right + gap;
    let posTop = top;

    // Flip left if overflows right
    if (posLeft + menuW > window.innerWidth - 8) {
      posLeft = left - menuW - gap;
    }
    // Shift up if overflows bottom
    if (posTop + menuH > window.innerHeight - 8) {
      posTop = Math.max(8, window.innerHeight - menuH - 8);
    }
    // Ensure not above viewport
    if (posTop < 8) posTop = 8;

    setPos({ top: posTop, left: Math.max(8, posLeft) });
  }, [multiSelection]);

  useLayoutEffect(() => { computePosition(); }, [computePosition]);

  // ESC to close (v3.77 #2)
  useEffect(() => {
    if (multiSelection.length === 0) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') clearMultiSelect();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [multiSelection, clearMultiSelect]);

  // Re-position on scroll
  useEffect(() => {
    if (multiSelection.length === 0) return;
    const handler = () => computePosition();
    window.addEventListener('scroll', handler, true);
    window.addEventListener('resize', handler);
    return () => { window.removeEventListener('scroll', handler, true); window.removeEventListener('resize', handler); };
  }, [multiSelection, computePosition]);

  if (multiSelection.length === 0) return null;

  // Group selection by courseId and create sequence
  const handleCreateSequence = () => {
    const parsed = multiSelection.map(key => {
      const parts = key.split('-');
      const courseId = parts[parts.length - 1];
      const week = parts.slice(0, parts.length - 1).join('-');
      return { week, courseId };
    });

    const byCourse = new Map<string, string[]>();
    for (const { week, courseId } of parsed) {
      if (!byCourse.has(courseId)) byCourse.set(courseId, []);
      byCourse.get(courseId)!.push(week);
    }

    const [courseId, weeks] = [...byCourse.entries()][0];
    const course = plannerCoursesInner.find(c => c.id === courseId);
    if (!course) return;

    const sortedWeeks = [...weeks].sort();

    const areas = new Set<string>();
    for (const { week, courseId: cid } of parsed) {
      const d = lessonDetails[`${week}-${cid}`];
      if (d?.subjectArea) areas.add(d.subjectArea);
    }
    const sharedArea = areas.size === 1 ? [...areas][0] as import('../types').SubjectArea : undefined;

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

  const courseIds = new Set(multiSelection.map(key => {
    const parts = key.split('-');
    return parts[parts.length - 1];
  }));
  const singleCourse = courseIds.size === 1;

  // Mobile fallback: fixed bottom bar
  if (isMobile || !pos) {
    return (
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-indigo-950/95 backdrop-blur border border-indigo-500 rounded-lg px-4 py-2 flex items-center gap-3 text-[10px] z-[55] shadow-xl shadow-black/40">
        <span className="font-bold text-indigo-200">{multiSelection.length} markiert</span>
        {singleCourse && (
          <button onClick={handleCreateSequence}
            className="px-2 py-0.5 rounded bg-green-700 text-white border-none text-[9px] font-semibold cursor-pointer hover:bg-green-600">
            ▧ Sequenz
          </button>
        )}
        <button onClick={clearMultiSelect}
          className="px-2 py-0.5 rounded bg-transparent text-indigo-300 border border-indigo-500 text-[9px] cursor-pointer">
          ✕
        </button>
      </div>
    );
  }

  // Desktop: floating context menu next to selection
  return (
    <div
      ref={menuRef}
      className="fixed bg-indigo-950/95 backdrop-blur border border-indigo-500 rounded-lg p-1.5 flex flex-col gap-1 text-[10px] z-[55] shadow-xl shadow-black/40"
      style={{ top: pos.top, left: pos.left, minWidth: 140 }}
    >
      <div className="text-[9px] font-bold text-indigo-200 px-1.5 pb-0.5 border-b border-indigo-700/50 mb-0.5">
        {multiSelection.length} markiert
      </div>
      {singleCourse && (
        <button onClick={handleCreateSequence}
          className="w-full text-left px-1.5 py-1 rounded bg-green-700/80 text-white text-[9px] font-semibold cursor-pointer hover:bg-green-600">
          ▧ Neue Sequenz
        </button>
      )}
      <button onClick={clearMultiSelect}
        className="w-full text-left px-1.5 py-1 rounded bg-transparent text-indigo-300 border border-indigo-500/50 text-[9px] cursor-pointer hover:bg-indigo-800/30">
        ✕ Aufheben
      </button>
    </div>
  );
}

export function Legend() {
  const { categories, courses: plannerCourses, settings } = usePlannerData();

  // Filter categories to only show those linked to active course types
  const activeCategories = useMemo(() => {
    const activeCourseTypes = new Set(plannerCourses.map(c => c.typ));
    if (!settings?.subjects?.length) return categories; // No subjects configured → show all
    const subjectCourseTypes = new Map<string, string>();
    for (const s of settings.subjects) {
      subjectCourseTypes.set(s.id.toUpperCase(), s.courseType);
    }
    return categories.filter(cat => {
      const ct = subjectCourseTypes.get(cat.key);
      return !ct || activeCourseTypes.has(ct as any);
    });
  }, [categories, plannerCourses, settings]);

  const fixedItems: [string, string][] = [
    ['Prüfung', '#fee2e2'],
    ['Event', '#e5e7eb'],
    ['Ferien', '#ffffff'],
  ];
  return (
    <div className="px-4 py-1 flex gap-2.5 flex-wrap text-[8px] border-b" style={{ background: 'var(--bg-primary)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
      {activeCategories.map(cat => (
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
