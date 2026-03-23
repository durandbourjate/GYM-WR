import type { StateCreator } from 'zustand';
import type { PlannerState } from '../plannerStore';
import type { FilterType, Course } from '../../types';
import { getLinkedKursIds } from '../../data/courses';

// === Helper interfaces (moved from plannerStore.ts) ===

export interface Selection {
  week: string;
  kursId: string;
  title: string;
  course: Course;
}

export interface EditingCell {
  week: string;
  col: number;
}

export interface InsertDialog {
  week: string;
  course: Course;
  hasMismatch: boolean;
  pairedCourses: Course[];
}

// === UISlice Interface ===

export interface UISlice {
  filter: FilterType;
  setFilter: (f: FilterType) => void;
  classFilter: string | null;
  setClassFilter: (c: string | null) => void;
  courseFilter: string | null;
  setCourseFilter: (c: string | null) => void;
  zoomLevel: 1 | 2 | 3;
  setZoomLevel: (z: 1 | 2 | 3) => void;
  autoFitZoom: boolean;
  setAutoFitZoom: (v: boolean) => void;
  columnZoom: number; // 0-4 index into ZOOM_LEVELS
  setColumnZoom: (z: number) => void;
  dimPastWeeks: boolean;
  setDimPastWeeks: (v: boolean) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selection: Selection | null;
  setSelection: (s: Selection | null) => void;
  multiSelection: string[];
  lastSelectedKey: string | null;
  toggleMultiSelect: (key: string) => void;
  setMultiSelectionDirect: (keys: string[]) => void;
  selectRange: (toKey: string, allWeeks: string[], courses: Course[], crossDay?: boolean) => void;
  clearMultiSelect: () => void;
  showHelp: boolean;
  toggleHelp: () => void;
  editing: EditingCell | null;
  setEditing: (e: EditingCell | null) => void;
  insertDialog: InsertDialog | null;
  setInsertDialog: (d: InsertDialog | null) => void;
  detailPanelExpanded: boolean;
  setDetailPanelExpanded: (v: boolean) => void;
  sidePanelOpen: boolean;
  setSidePanelOpen: (v: boolean) => void;
  sidePanelTab: 'details' | 'sequences' | 'collection' | 'settings';
  setSidePanelTab: (t: 'details' | 'sequences' | 'collection' | 'settings') => void;
  pendingHolidayKw: string | null;
  setPendingHolidayKw: (kw: string | null) => void;
  hoveredCell: { week: string; col: number } | null;
  setHoveredCell: (c: { week: string; col: number } | null) => void;
  emptyCellAction: { week: string; kursId: string; course: Course; selectedWeeks?: string[] } | null;
  setEmptyCellAction: (a: { week: string; kursId: string; course: Course; selectedWeeks?: string[] } | null) => void;
  dragSelectAnchor: { week: string; col: number; kursId: string } | null;
  dragSelectCurrent: { week: string; col: number } | null;
  dragSelectedKeys: string[]; // "week-col" keys
  setDragSelectAnchor: (a: { week: string; col: number; kursId: string } | null) => void;
  setDragSelectCurrent: (c: { week: string; col: number } | null) => void;
  setDragSelectedKeys: (keys: string[]) => void;
  settingsOpen: boolean;
  setSettingsOpen: (v: boolean) => void;
  settingsEditKursId: string | null;
  setSettingsEditKursId: (id: string | null) => void;
  panelWidth: number;
  setPanelWidth: (w: number) => void;
  expandedNoteCols: Record<string, boolean>; // course IDs with expanded note columns
  toggleNoteCol: (kursId: string) => void;
  noteColWidth: number; // shared width for all note columns
  setNoteColWidth: (w: number) => void;
}

// === UISlice Implementation ===

export const createUISlice: StateCreator<PlannerState, [], [], UISlice> = (set, get) => ({
  filter: 'ALL',
  setFilter: (f) => set({ filter: f }),
  classFilter: null,
  setClassFilter: (c) => set({ classFilter: c }),
  courseFilter: null,
  setCourseFilter: (c) => set({ courseFilter: c }),
  zoomLevel: 3,
  setZoomLevel: (z) => set({ zoomLevel: z }),
  autoFitZoom: false,
  setAutoFitZoom: (v) => set({ autoFitZoom: v }),
  columnZoom: parseInt(localStorage.getItem('columnZoom') || '2', 10),
  setColumnZoom: (z) => { const clamped = Math.max(0, Math.min(4, z)); localStorage.setItem('columnZoom', String(clamped)); set({ columnZoom: clamped }); },
  dimPastWeeks: true,
  setDimPastWeeks: (v) => set({ dimPastWeeks: v }),
  searchQuery: '',
  setSearchQuery: (q) => set({ searchQuery: q }),
  selection: null,
  setSelection: (s) => set({
    selection: s,
    lastSelectedKey: s ? `${s.week}-${s.kursId}` : get().lastSelectedKey,
  }),
  multiSelection: [],
  lastSelectedKey: null,
  toggleMultiSelect: (key) =>
    set((state) => {
      // If this is the first Cmd+Click and there's a current selection, include it too
      const currentKey = state.selection ? `${state.selection.week}-${state.selection.kursId}` : null;
      const base = state.multiSelection.length === 0 && currentKey && currentKey !== key
        ? [currentKey]
        : state.multiSelection;
      return {
        multiSelection: base.includes(key)
          ? base.filter((k) => k !== key)
          : [...base, key],
        lastSelectedKey: key,
      };
    }),
  setMultiSelectionDirect: (keys) => set({ multiSelection: keys, lastSelectedKey: keys[keys.length - 1] ?? null }),
  selectRange: (toKey, allWeeks, courses, crossDay) => {
    const state = get();
    const fromKey = state.lastSelectedKey;
    if (!fromKey) {
      set({ multiSelection: [toKey], lastSelectedKey: toKey });
      return;
    }
    const [fromWeek, fromKursId] = fromKey.split('-');
    const [toWeek, toKursId] = toKey.split('-');

    // Helper: check if a week+course is selectable (allow empty cells, skip holidays/events)
    const weekMap = new Map(state.weekData.map(w => [w.w, w]));
    const isSelectableLesson = (wk: string, kursId: string): boolean => {
      const course = courses.find(c => c.id === kursId);
      if (!course) return false;
      const week = weekMap.get(wk);
      if (!week) return false;
      const entry = week.lessons[course.col];
      if (!entry) return true; // Allow empty cells (for creating sequences on blank weeks)
      if (entry.type === 5 || entry.type === 6) return false; // skip events/holidays
      return true;
    };

    // Check if both courses belong to the same class+type (linked courses, e.g. Di+Do)
    const fromCourse = courses.find(c => c.id === fromKursId);
    const toCourse = courses.find(c => c.id === toKursId);
    const areLinked = fromCourse && toCourse &&
      fromCourse.cls === toCourse.cls && fromCourse.typ === toCourse.typ &&
      fromKursId !== toKursId;

    if (areLinked && crossDay !== false) {
      // Cross-day selection: select all weeks in range for BOTH course columns
      const fromIdx = allWeeks.indexOf(fromWeek);
      const toIdx = allWeeks.indexOf(toWeek);
      if (fromIdx < 0 || toIdx < 0) return;
      const startIdx = Math.min(fromIdx, toIdx);
      const endIdx = Math.max(fromIdx, toIdx);
      const rangeKeys: string[] = [];
      for (let i = startIdx; i <= endIdx; i++) {
        if (isSelectableLesson(allWeeks[i], fromKursId)) rangeKeys.push(`${allWeeks[i]}-${fromKursId}`);
        if (isSelectableLesson(allWeeks[i], toKursId)) rangeKeys.push(`${allWeeks[i]}-${toKursId}`);
      }
      set((s) => ({
        multiSelection: Array.from(new Set([...s.multiSelection, ...rangeKeys])),
        lastSelectedKey: toKey,
      }));
      return;
    }

    if (fromKursId !== toKursId && !(areLinked && crossDay === false)) {
      // Different, unlinked courses — block range select (error-prone cross-course selection)
      // Only allow single-cell add via Cmd/Ctrl+Click, not Shift+Click range
      return;
    }

    // Same column range selection (or linked course with crossDay=false → use fromKursId column)
    const fromIdx = allWeeks.indexOf(fromWeek);
    const toIdx = allWeeks.indexOf(toWeek);
    if (fromIdx < 0 || toIdx < 0) return;
    const startIdx = Math.min(fromIdx, toIdx);
    const endIdx = Math.max(fromIdx, toIdx);
    const rangeKeys: string[] = [];
    for (let i = startIdx; i <= endIdx; i++) {
      if (isSelectableLesson(allWeeks[i], fromKursId)) rangeKeys.push(`${allWeeks[i]}-${fromKursId}`);
    }

    // Check if same-column range should also include linked day
    if (crossDay !== false) {
      const linkedKursIds = getLinkedKursIds(fromKursId);
      if (linkedKursIds.length > 1) {
        // Automatically include linked day columns
        for (const otherKursId of linkedKursIds) {
          if (otherKursId !== fromKursId) {
            for (let i = startIdx; i <= endIdx; i++) {
              if (isSelectableLesson(allWeeks[i], otherKursId)) rangeKeys.push(`${allWeeks[i]}-${otherKursId}`);
            }
          }
        }
      }
    }

    set((s) => ({
      multiSelection: Array.from(new Set([...s.multiSelection, ...rangeKeys])),
      lastSelectedKey: toKey,
    }));
  },
  clearMultiSelect: () => set({ multiSelection: [], lastSelectedKey: null }),
  showHelp: false,
  toggleHelp: () => set((state) => ({ showHelp: !state.showHelp })),
  editing: null,
  setEditing: (e) => set({ editing: e }),
  insertDialog: null,
  setInsertDialog: (d) => set({ insertDialog: d }),
  detailPanelExpanded: false,
  setDetailPanelExpanded: (v) => set({ detailPanelExpanded: v }),
  // Phase 1: Side panel
  sidePanelOpen: false,
  setSidePanelOpen: (v) => set({ sidePanelOpen: v }),
  sidePanelTab: 'details',
  setSidePanelTab: (t) => set({ sidePanelTab: t }),
  pendingHolidayKw: null,
  setPendingHolidayKw: (kw) => set({ pendingHolidayKw: kw }),
  hoveredCell: null,
  setHoveredCell: (c) => set({ hoveredCell: c }),
  emptyCellAction: null,
  setEmptyCellAction: (a) => set({ emptyCellAction: a }),
  dragSelectAnchor: null,
  dragSelectCurrent: null,
  dragSelectedKeys: [],
  setDragSelectAnchor: (a) => set({ dragSelectAnchor: a }),
  setDragSelectCurrent: (c) => set({ dragSelectCurrent: c }),
  setDragSelectedKeys: (keys) => set({ dragSelectedKeys: keys }),
  settingsOpen: false,
  setSettingsOpen: (v) => set({ settingsOpen: v }),
  settingsEditKursId: null,
  setSettingsEditKursId: (id) => set({ settingsEditKursId: id }),
  panelWidth: 400,
  setPanelWidth: (w) => set({ panelWidth: w }),
  expandedNoteCols: {},
  toggleNoteCol: (kursId) => set((s) => {
    const next = { ...s.expandedNoteCols };
    if (next[kursId]) { delete next[kursId]; } else { next[kursId] = true; }
    return { expandedNoteCols: next };
  }),
  noteColWidth: 200,
  setNoteColWidth: (w) => set({ noteColWidth: Math.max(80, Math.min(400, w)) }),
});
