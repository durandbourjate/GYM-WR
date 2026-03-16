import { useRef, useEffect, useMemo } from 'react';
import { usePlannerStore, switchInstance, saveToInstance } from './store/plannerStore';
import { useInstanceStore, generateWeekIds } from './store/instanceStore';
import { usePlannerData } from './hooks/usePlannerData';
import { loadSettings, applySettingsToWeekData } from './store/settingsStore';
import { SemesterHeader } from './components/SemesterHeader';
import { WeekRows } from './components/WeekRows';
import { AppHeader, HelpBar, MultiSelectToolbar } from './components/Toolbar';
import { DetailPanel } from './components/DetailPanel';
import { InsertDialog } from './components/InsertDialog';
import { ZoomMultiYearView } from './components/ZoomMultiYearView';
import { WelcomeScreen } from './components/PlannerTabs';
import { ErrorBoundary } from './components/ErrorBoundary';
import { UpdateBanner } from './components/UpdateBanner';

function App() {
  const { instances, activeId, setActive } = useInstanceStore();
  const prevActiveId = useRef<string | null>(null);

  // Handle instance switching
  useEffect(() => {
    if (activeId && activeId !== prevActiveId.current) {
      switchInstance(prevActiveId.current, activeId);
      prevActiveId.current = activeId;
    }
  }, [activeId]);

  // Auto-save on unmount / before unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (activeId) saveToInstance(activeId);
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      handleBeforeUnload();
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [activeId]);

  // No instances yet → Welcome screen
  if (instances.length === 0) {
    return (
      <div className="text-slate-200 min-h-screen font-sans" style={{ background: 'var(--bg-primary)' }}>
        <WelcomeScreen />
      </div>
    );
  }

  // No active instance → select first
  if (!activeId) {
    setActive(instances[0].id);
    return null;
  }

  return (
    <div className="text-slate-200 min-h-screen font-sans" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }} data-app-root>
      <PlannerContent />
    </div>
  );
}

/** The actual planner grid — separated so it re-renders on instance switch */
function PlannerContent() {
  const { filter, classFilter, courseFilter, setCourseFilter, weekData, setWeekData, migrateStaticSequences, fixSequenceTitles, sequencePanelOpen, sidePanelOpen, sidePanelTab, zoomLevel, autoFitZoom, panelWidth, plannerSettings } = usePlannerStore();
  const { courses: allCourses, weeks: hookWeeks, s2StartIndex, isLegacy } = usePlannerData();
  const curRef = useRef<HTMLTableRowElement>(null);

  // Initialize weekData in store, and re-apply holidays when plannerSettings change
  useEffect(() => {
    if (weekData.length === 0) {
      let initial = hookWeeks.map((w) => ({ ...w, lessons: { ...w.lessons } }));
      // Only use per-instance settings for holidays (never fall back to global
      // settings for NEW planners — global settings may contain legacy holiday data)
      const settings = plannerSettings ?? (isLegacy ? loadSettings() : null);
      if (settings && (settings.holidays.length > 0 || settings.specialWeeks.length > 0)) {
        const applied = applySettingsToWeekData(initial, settings);
        initial = applied.weekData;
      }
      setWeekData(initial);
    } else if (plannerSettings) {
      // Re-apply holidays/special weeks whenever plannerSettings change.
      // applySettingsToWeekData first clears old type-5/6 entries, then reapplies —
      // user lessons (not holidays/events) are preserved. (v3.76 #7)
      const applied = applySettingsToWeekData(weekData, plannerSettings);
      setWeekData(applied.weekData);
    }
  }, [plannerSettings]);

  // v3.99 V2: Fehlende Wochen ergänzen (z.B. KW 28–32 Sommerferien)
  const activeMeta = useInstanceStore(s => s.getActive());
  useEffect(() => {
    if (weekData.length === 0 || !activeMeta) return;
    const expected = generateWeekIds(activeMeta.startWeek, activeMeta.startYear, activeMeta.endWeek, activeMeta.endYear);
    const existing = new Set(weekData.map(w => w.w));
    const missing = expected.filter(wId => !existing.has(wId));
    if (missing.length === 0) return;
    // Fehlende Wochen ergänzen und sortieren
    const extended = [...weekData, ...missing.map(w => ({ w, lessons: {} as Record<number, import('./types').LessonEntry> }))];
    const order = new Map(expected.map((id, idx) => [id, idx]));
    extended.sort((a, b) => (order.get(a.w) ?? 999) - (order.get(b.w) ?? 999));
    // Settings anwenden (Ferien/Events markieren)
    const settings = plannerSettings ?? (isLegacy ? loadSettings() : null);
    if (settings && (settings.holidays?.length > 0 || settings.specialWeeks?.length > 0)) {
      const applied = applySettingsToWeekData(extended, settings);
      setWeekData(applied.weekData);
    } else {
      setWeekData(extended);
    }
    console.log('[App V2] Fehlende Wochen ergänzt:', missing);
  }, [weekData.length, activeMeta?.endWeek]);

  // Migrate static sequences to store on first render (legacy planners only)
  useEffect(() => {
    if (isLegacy) {
      migrateStaticSequences();
      fixSequenceTitles();
    }
  }, [isLegacy]);

  // K3: Startup-Sync — Sequenz-Wochen ohne weekData-Eintrag nachrüsten
  useEffect(() => {
    if (weekData.length === 0 || allCourses.length === 0) return;
    const store = usePlannerStore.getState();
    if (store.sequences.length === 0) return;
    let modified = false;
    let wd = weekData.map(w => ({ ...w, lessons: { ...w.lessons } }));
    for (const seq of store.sequences) {
      const course = allCourses.find(c => c.id === seq.courseId);
      if (!course) continue;
      for (const block of seq.blocks) {
        for (const weekW of block.weeks) {
          const w = wd.find(x => x.w === weekW);
          if (!w) continue;
          const existing = w.lessons[course.col];
          if (!existing?.title) {
            w.lessons[course.col] = { title: 'UE', type: 1 };
            modified = true;
          }
        }
      }
    }
    if (modified) setWeekData(wd);
  }, [weekData.length > 0 && allCourses.length > 0]); // einmalig beim Start

  // Auto-open settings for new empty planners (no courses configured)
  useEffect(() => {
    if (!isLegacy && allCourses.length === 0) {
      usePlannerStore.getState().setSidePanelOpen(true);
      usePlannerStore.getState().setSidePanelTab('settings');
    }
  }, [isLegacy, allCourses.length]);

  const DAY_ORDER: Record<string, number> = { Mo: 0, Di: 1, Mi: 2, Do: 3, Fr: 4 };
  const filterCourses = (semester: 1 | 2) => {
    let c = allCourses.filter((co) => co.semesters.includes(semester));
    if (filter !== 'ALL') c = c.filter((co) => co.typ === filter);
    if (classFilter) c = c.filter((co) => co.cls === classFilter);
    if (courseFilter) c = c.filter((co) => `${co.cls}|${co.typ}` === courseFilter);
    return [...c].sort((a, b) => {
      const dayDiff = (DAY_ORDER[a.day] ?? 9) - (DAY_ORDER[b.day] ?? 9);
      if (dayDiff !== 0) return dayDiff;
      return a.from.localeCompare(b.from);
    });
  };

  const allWeekKeys = useMemo(() =>
    (weekData.length > 0 ? weekData : hookWeeks).map(w => w.w), [weekData, hookWeeks]);

  const s1Courses = useMemo(() => filterCourses(1), [filter, classFilter, courseFilter, allCourses]);
  const s2Courses = useMemo(() => filterCourses(2), [filter, classFilter, courseFilter, allCourses]);
  const s1Weeks = useMemo(() =>
    (weekData.length > 0 ? weekData : hookWeeks).slice(0, s2StartIndex), [weekData, hookWeeks, s2StartIndex]);
  const s2Weeks = useMemo(() =>
    (weekData.length > 0 ? weekData : hookWeeks).slice(s2StartIndex), [weekData, hookWeeks, s2StartIndex]);

  useEffect(() => {
    setTimeout(() => curRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
  }, []);

  // Keyboard shortcut: Ctrl+Z for undo, Escape to close panel
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't capture shortcuts when editing inputs
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        usePlannerStore.getState().undo();
      }
      if (e.key === 'Escape') {
        const state = usePlannerStore.getState();
        if (state.settingsOpen) {
          state.setSettingsOpen(false);
        } else if (state.insertDialog) {
          state.setInsertDialog(null);
        } else if (state.editingSequenceId) {
          state.setEditingSequenceId(null);
        } else if (state.multiSelection.length > 0) {
          state.clearMultiSelect();
        } else if (state.courseFilter) {
          state.setCourseFilter(null);
        } else if (state.sidePanelOpen) {
          state.setSidePanelOpen(false);
          state.setSequencePanelOpen(false);
        } else if (state.selection) {
          state.setSelection(null);
        }
      }
      // Zoom shortcuts: 1, 2, 3 (without modifier)
      if (!e.metaKey && !e.ctrlKey && !e.altKey) {
        if (e.key === '1') usePlannerStore.getState().setZoomLevel(1);
        if (e.key === '2') usePlannerStore.getState().setZoomLevel(1); // Zoom 2 removed, redirect to 1
        if (e.key === '3') usePlannerStore.getState().setZoomLevel(3);
      }
      // Arrow keys: navigate between weeks when a cell is selected
      if ((e.key === 'ArrowUp' || e.key === 'ArrowDown') && !e.metaKey && !e.ctrlKey) {
        const state = usePlannerStore.getState();
        if (!state.selection) return;
        e.preventDefault();
        const allW = (state.weekData.length > 0 ? state.weekData : hookWeeks).map(w => w.w);
        const curIdx = allW.indexOf(state.selection.week);
        if (curIdx < 0) return;
        const nextIdx = e.key === 'ArrowUp' ? curIdx - 1 : curIdx + 1;
        if (nextIdx < 0 || nextIdx >= allW.length) return;
        const nextWeek = allW[nextIdx];
        const c = state.selection.course;
        if (!c) return;
        const weekEntry = state.weekData.find(w => w.w === nextWeek);
        const entry = weekEntry?.lessons[c.col];
        state.setSelection({ week: nextWeek, courseId: c.id, title: entry?.title || '', course: c });
        // Scroll into view
        const row = document.querySelector(`tr[data-week="${nextWeek}"]`);
        if (row) row.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
      // Delete/Backspace: clear selected cell content
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const state = usePlannerStore.getState();
        if (state.selection) {
          e.preventDefault();
          const { week, course: c } = state.selection;
          if (c) {
            state.pushUndo();
            state.updateLesson(week, c.col, { title: '', type: 0 });
            state.setSelection({ ...state.selection, title: '' });
          }
        }
      }
      // Cmd+F: focus search
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="Suche"]') as HTMLInputElement;
        searchInput?.focus();
        searchInput?.select();
      }
      // Cmd+P: print
      if ((e.metaKey || e.ctrlKey) && e.key === 'p') {
        // Let browser handle print with our CSS
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <>
      <div className="print-title hidden">Unterrichtsplanung – {classFilter || 'Alle Klassen'}{filter !== 'ALL' ? ` (${filter})` : ''}</div>
      <AppHeader />
      <HelpBar />
      <MultiSelectToolbar />
      <InsertDialog />

      {courseFilter && (
        <div className="flex items-center gap-2 px-4 py-1 bg-blue-900/40 border-b border-blue-800/50">
          <span className="text-[10px] text-blue-300 font-semibold">🔍 Gefiltert: {courseFilter.replace('|', ' ')}</span>
          <button
            onClick={() => setCourseFilter(null)}
            className="text-[10px] text-blue-400 hover:text-white bg-blue-800/60 hover:bg-blue-700 px-1.5 py-0.5 rounded cursor-pointer transition-colors"
            title="Filter aufheben (Esc)"
          >✕</button>
        </div>
      )}

      <div className="flex" style={{ height: 'calc(100vh - 36px)' }}>
        <div className="overflow-auto flex-1" style={{ paddingBottom: 20, marginRight: (sidePanelOpen || sequencePanelOpen) ? panelWidth : 0 }}>
          <ErrorBoundary fallbackLabel="Planungsraster">
          {allCourses.length === 0 ? (
            /* Empty state: no courses configured */
            <div className="flex flex-col items-center justify-center h-full text-center px-8">
              <div className="text-4xl mb-4">📚</div>
              <h2 className="text-lg font-bold text-white mb-2">Noch keine Kurse konfiguriert</h2>
              <p className="text-slate-400 text-sm mb-6 max-w-md">
                Lege im Einstellungen-Panel deine Kurse an (Klasse, Tag, Lektionen), um das Planungsraster zu erstellen.
              </p>
              {sidePanelOpen && sidePanelTab === 'settings' ? (
                <p className="text-blue-400 text-sm">→ Kurse im geöffneten Einstellungs-Panel anlegen</p>
              ) : (
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-500 transition-colors cursor-pointer"
                  onClick={() => {
                    usePlannerStore.getState().setSidePanelOpen(true);
                    usePlannerStore.getState().setSidePanelTab('settings');
                  }}
                >
                  ⚙️ Einstellungen öffnen
                </button>
              )}
            </div>
          ) : zoomLevel === 1 || zoomLevel === 2 ? (
            <ZoomMultiYearView />
          ) : (
            <>
              {/* Semester 1 — Week View */}
              <table className={`border-collapse ${autoFitZoom ? 'table-fixed w-full' : 'w-max min-w-full'}`}>
                <SemesterHeader courses={s1Courses} semester={1} weeks={s1Weeks} />
                <tbody>
                  <WeekRows weeks={s1Weeks} courses={s1Courses} allWeeks={allWeekKeys} currentRef={curRef} />
                </tbody>
              </table>

              {/* Semester divider */}
              <div className="py-1.5 px-4 flex items-center gap-2" style={{ background: 'linear-gradient(90deg, #f59e0b20, #f59e0b40, #f59e0b20)' }}>
                <span className="text-xs font-bold text-amber-500">━━ Semester 2 ━━</span>
                <span className="text-[9px] text-amber-800">ab KW 07</span>
              </div>

              {/* Semester 2 — Week View */}
              <table className={`border-collapse ${autoFitZoom ? 'table-fixed w-full' : 'w-max min-w-full'}`}>
                <SemesterHeader courses={s2Courses} semester={2} weeks={s2Weeks} />
                <tbody>
                  <WeekRows weeks={s2Weeks} courses={s2Courses} allWeeks={allWeekKeys} currentRef={curRef} />
                </tbody>
              </table>
            </>
          )}
          </ErrorBoundary>
        </div>
      </div>

      <ErrorBoundary fallbackLabel="Detail-Panel">
        <DetailPanel />
      </ErrorBoundary>
      <UpdateBanner />
    </>
  );
}

export default App;
