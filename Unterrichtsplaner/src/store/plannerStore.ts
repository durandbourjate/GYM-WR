import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { FilterType, Week, LessonEntry, Course, LessonDetail, ManagedSequence, SequenceBlock, HKGroup, TaFPhase, CollectionItem, CollectionUnit } from '../types';
import { SEQUENCES as STATIC_SEQUENCES } from '../data/sequences';
import { COURSES, getLinkedCourseIds } from '../data/courses';
import { INITIAL_LESSON_DETAILS } from '../data/initialLessonDetails';
import { instanceStorageKey } from './instanceStore';
import type { PlannerSettings } from './settingsStore';

interface Selection {
  week: string;
  courseId: string;
  title: string;
  course: Course;
}

interface EditingCell {
  week: string;
  col: number;
}

interface InsertDialog {
  week: string;
  course: Course;
  hasMismatch: boolean;
  pairedCourses: Course[];
}

interface PlannerState {
  filter: FilterType;
  setFilter: (f: FilterType) => void;
  classFilter: string | null;
  setClassFilter: (c: string | null) => void;
  courseFilter: string | null;
  setCourseFilter: (c: string | null) => void;
  zoomLevel: 1 | 2 | 3;
  setZoomLevel: (z: 1 | 2 | 3) => void;
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
  weekData: Week[];
  setWeekData: (w: Week[]) => void;
  updateLesson: (weekW: string, col: number, entry: LessonEntry) => void;
  insertDialog: InsertDialog | null;
  setInsertDialog: (d: InsertDialog | null) => void;
  // Drag & Drop
  dragSource: { week: string; col: number } | null;
  setDragSource: (d: { week: string; col: number } | null) => void;
  swapLessons: (col: number, weekA: string, weekB: string) => void;
  moveLessonToEmpty: (col: number, fromWeek: string, toWeek: string) => void;
  pushLessons: (courseCol: number, beforeWeekW: string, allWeeks: string[]) => void;
  batchShiftDown: (keys: string[], allWeeks: string[], courses: Course[]) => void;
  batchInsertBefore: (keys: string[], allWeeks: string[], courses: Course[]) => void;
  // Group drag & drop
  moveGroup: (col: number, fromWeeks: string[], toWeek: string, allWeeks: string[]) => void;
  // Lesson Details
  lessonDetails: Record<string, LessonDetail>; // key: "weekW-col"
  updateLessonDetail: (weekW: string, col: number, detail: Partial<LessonDetail>) => void;
  getLessonDetail: (weekW: string, col: number) => LessonDetail | undefined;
  // Detail Panel state
  detailPanelExpanded: boolean;
  setDetailPanelExpanded: (v: boolean) => void;
  // Phase 1: Side panel
  sidePanelOpen: boolean;
  setSidePanelOpen: (v: boolean) => void;
  sidePanelTab: 'details' | 'sequences' | 'collection' | 'settings';
  setSidePanelTab: (t: 'details' | 'sequences' | 'collection' | 'settings') => void;
  hoveredCell: { week: string; col: number } | null;
  setHoveredCell: (c: { week: string; col: number } | null) => void;
  // Empty cell action (double-click or drag-select context menu)
  emptyCellAction: { week: string; courseId: string; course: Course; selectedWeeks?: string[] } | null;
  setEmptyCellAction: (a: { week: string; courseId: string; course: Course; selectedWeeks?: string[] } | null) => void;
  // Drag selection on empty cells
  dragSelectAnchor: { week: string; col: number; courseId: string } | null;
  dragSelectCurrent: { week: string; col: number } | null;
  dragSelectedKeys: string[]; // "week-col" keys
  setDragSelectAnchor: (a: { week: string; col: number; courseId: string } | null) => void;
  setDragSelectCurrent: (c: { week: string; col: number } | null) => void;
  setDragSelectedKeys: (keys: string[]) => void;
  // Sequences CRUD
  sequences: ManagedSequence[];
  sequencesMigrated: boolean;
  sequenceTitlesFixed: boolean;
  migrateStaticSequences: () => void;
  fixSequenceTitles: () => void;
  addSequence: (seq: Omit<ManagedSequence, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateSequence: (id: string, updates: Partial<Pick<ManagedSequence, 'title' | 'subjectArea' | 'blocks' | 'color' | 'courseId' | 'courseIds' | 'multiDayMode' | 'links' | 'notes' | 'sol'>>) => void;
  deleteSequence: (id: string) => void;
  addBlockToSequence: (seqId: string, block: SequenceBlock) => void;
  updateBlockInSequence: (seqId: string, blockIndex: number, block: Partial<SequenceBlock>) => void;
  removeBlockFromSequence: (seqId: string, blockIndex: number) => void;
  reorderBlocks: (seqId: string, fromIndex: number, toIndex: number) => void;
  // Auto-placement
  autoPlaceSequence: (seqId: string, startWeek: string, allWeekOrder: string[]) => { placed: number; skipped: string[] };
  getAvailableWeeks: (courseId: string, startWeek: string, allWeekOrder: string[]) => string[];
  // Sequence Panel UI state
  sequencePanelOpen: boolean;
  setSequencePanelOpen: (v: boolean) => void;
  editingSequenceId: string | null;
  setEditingSequenceId: (id: string | null) => void;
  // Export / Import
  exportData: () => string;
  importData: (json: string) => boolean;
  // HK Rotation
  hkOverrides: Record<string, HKGroup>; // key: "weekW-col" -> 'A' | 'B'
  hkStartGroups: Record<number, HKGroup>; // col -> start group
  setHKOverride: (weekW: string, col: number, group: HKGroup | null) => void;
  setHKStartGroup: (col: number, group: HKGroup) => void;
  // TaF Phasen
  tafPhases: TaFPhase[];
  addTaFPhase: (phase: Omit<TaFPhase, 'id'>) => string;
  updateTaFPhase: (id: string, updates: Partial<TaFPhase>) => void;
  deleteTaFPhase: (id: string) => void;
  // Collection (Materialsammlung)
  collection: CollectionItem[];
  addCollectionItem: (item: Omit<CollectionItem, 'id' | 'createdAt'>) => string;
  updateCollectionItem: (id: string, updates: Partial<Pick<CollectionItem, 'title' | 'tags' | 'notes' | 'subjectArea'>>) => void;
  deleteCollectionItem: (id: string) => void;
  archiveBlock: (seqId: string, blockIndex: number, schoolYear?: string) => string;
  archiveSequence: (seqId: string, schoolYear?: string) => string;
  archiveSchoolYear: (courseType: string, cls: string, schoolYear: string) => string;
  archiveCurriculum: (courseType: string, cls: string, schoolYear: string, gymYears: string) => string;
  importFromCollection: (itemId: string, targetCourseId: string, options: { includeNotes: boolean; includeMaterialLinks: boolean }) => string | null;
  // Undo
  undoStack: Week[][];
  pushUndo: () => void;
  undo: () => void;
  // Planner Settings (per-instance: courses, holidays, special weeks)
  plannerSettings: PlannerSettings | null;
  setPlannerSettings: (s: PlannerSettings) => void;
  // Settings UI
  settingsOpen: boolean;
  setSettingsOpen: (v: boolean) => void;
  settingsEditCourseId: string | null;
  setSettingsEditCourseId: (id: string | null) => void;
  panelWidth: number;
  setPanelWidth: (w: number) => void;
  // Note column expansion (per course column)
  expandedNoteCols: Record<string, boolean>; // course IDs with expanded note columns
  toggleNoteCol: (courseId: string) => void;
  noteColWidth: number; // shared width for all note columns
  setNoteColWidth: (w: number) => void;
}

export const usePlannerStore = create<PlannerState>()(
  persist(
    (set, get) => ({
  filter: 'ALL',
  setFilter: (f) => set({ filter: f }),
  classFilter: null,
  setClassFilter: (c) => set({ classFilter: c }),
  courseFilter: null,
  setCourseFilter: (c) => set({ courseFilter: c }),
  zoomLevel: 3,
  setZoomLevel: (z) => set({ zoomLevel: z }),
  dimPastWeeks: true,
  setDimPastWeeks: (v) => set({ dimPastWeeks: v }),
  searchQuery: '',
  setSearchQuery: (q) => set({ searchQuery: q }),
  selection: null,
  setSelection: (s) => set({
    selection: s,
    lastSelectedKey: s ? `${s.week}-${s.courseId}` : get().lastSelectedKey,
  }),
  multiSelection: [],
  lastSelectedKey: null,
  toggleMultiSelect: (key) =>
    set((state) => {
      // If this is the first Cmd+Click and there's a current selection, include it too
      const currentKey = state.selection ? `${state.selection.week}-${state.selection.courseId}` : null;
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
    const [fromWeek, fromCourseId] = fromKey.split('-');
    const [toWeek, toCourseId] = toKey.split('-');

    // Helper: check if a week+course is selectable (allow empty cells, skip holidays/events)
    const weekMap = new Map(state.weekData.map(w => [w.w, w]));
    const isSelectableLesson = (wk: string, courseId: string): boolean => {
      const course = courses.find(c => c.id === courseId);
      if (!course) return false;
      const week = weekMap.get(wk);
      if (!week) return false;
      const entry = week.lessons[course.col];
      if (!entry) return true; // Allow empty cells (for creating sequences on blank weeks)
      if (entry.type === 5 || entry.type === 6) return false; // skip events/holidays
      return true;
    };

    // Check if both courses belong to the same class+type (linked courses, e.g. Di+Do)
    const fromCourse = courses.find(c => c.id === fromCourseId);
    const toCourse = courses.find(c => c.id === toCourseId);
    const areLinked = fromCourse && toCourse &&
      fromCourse.cls === toCourse.cls && fromCourse.typ === toCourse.typ &&
      fromCourseId !== toCourseId;

    if (areLinked && crossDay !== false) {
      // Cross-day selection: select all weeks in range for BOTH course columns
      const fromIdx = allWeeks.indexOf(fromWeek);
      const toIdx = allWeeks.indexOf(toWeek);
      if (fromIdx < 0 || toIdx < 0) return;
      const startIdx = Math.min(fromIdx, toIdx);
      const endIdx = Math.max(fromIdx, toIdx);
      const rangeKeys: string[] = [];
      for (let i = startIdx; i <= endIdx; i++) {
        if (isSelectableLesson(allWeeks[i], fromCourseId)) rangeKeys.push(`${allWeeks[i]}-${fromCourseId}`);
        if (isSelectableLesson(allWeeks[i], toCourseId)) rangeKeys.push(`${allWeeks[i]}-${toCourseId}`);
      }
      set((s) => ({
        multiSelection: Array.from(new Set([...s.multiSelection, ...rangeKeys])),
        lastSelectedKey: toKey,
      }));
      return;
    }

    if (fromCourseId !== toCourseId && !(areLinked && crossDay === false)) {
      // Different, unlinked courses — block range select (error-prone cross-course selection)
      // Only allow single-cell add via Cmd/Ctrl+Click, not Shift+Click range
      return;
    }

    // Same column range selection (or linked course with crossDay=false → use fromCourseId column)
    const fromIdx = allWeeks.indexOf(fromWeek);
    const toIdx = allWeeks.indexOf(toWeek);
    if (fromIdx < 0 || toIdx < 0) return;
    const startIdx = Math.min(fromIdx, toIdx);
    const endIdx = Math.max(fromIdx, toIdx);
    const rangeKeys: string[] = [];
    for (let i = startIdx; i <= endIdx; i++) {
      if (isSelectableLesson(allWeeks[i], fromCourseId)) rangeKeys.push(`${allWeeks[i]}-${fromCourseId}`);
    }

    // Check if same-column range should also include linked day
    if (crossDay !== false) {
      const linkedCourseIds = getLinkedCourseIds(fromCourseId);
      if (linkedCourseIds.length > 1) {
        // Automatically include linked day columns
        for (const otherCourseId of linkedCourseIds) {
          if (otherCourseId !== fromCourseId) {
            for (let i = startIdx; i <= endIdx; i++) {
              if (isSelectableLesson(allWeeks[i], otherCourseId)) rangeKeys.push(`${allWeeks[i]}-${otherCourseId}`);
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
  weekData: [],
  setWeekData: (w) => set({ weekData: w }),
  updateLesson: (weekW, col, entry) =>
    set((state) => ({
      weekData: state.weekData.map((w) =>
        w.w === weekW
          ? { ...w, lessons: { ...w.lessons, [col]: entry } }
          : w
      ),
    })),
  insertDialog: null,
  setInsertDialog: (d) => set({ insertDialog: d }),

  // Lesson Details
  lessonDetails: { ...INITIAL_LESSON_DETAILS },
  updateLessonDetail: (weekW, col, detail) =>
    set((state) => {
      const key = `${weekW}-${col}`;
      const existing = state.lessonDetails[key] || {};
      return {
        lessonDetails: {
          ...state.lessonDetails,
          [key]: { ...existing, ...detail },
        },
      };
    }),
  getLessonDetail: (weekW, col) => {
    const key = `${weekW}-${col}`;
    return get().lessonDetails[key];
  },
  detailPanelExpanded: false,
  setDetailPanelExpanded: (v) => set({ detailPanelExpanded: v }),
  // Phase 1: Side panel
  sidePanelOpen: false,
  setSidePanelOpen: (v) => set({ sidePanelOpen: v }),
  sidePanelTab: 'details',
  setSidePanelTab: (t) => set({ sidePanelTab: t }),
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

  // Sequences CRUD
  sequences: [],
  sequencesMigrated: false,
  sequenceTitlesFixed: false,
  migrateStaticSequences: () => {
    const state = get();
    if (state.sequencesMigrated) return;
    const now = new Date().toISOString();
    const migrated: ManagedSequence[] = [];
    for (const [courseId, seqBlocks] of Object.entries(STATIC_SEQUENCES)) {
      const course = COURSES.find(c => c.id === courseId);
      const courseLabel = course ? `${course.cls} ${course.typ} ${course.day}` : courseId;
      migrated.push({
        id: `seq-${courseId}-${Date.now()}`,
        courseId,
        title: `Sequenzen ${courseLabel}`,
        blocks: seqBlocks.map(b => ({ weeks: [...b.weeks], label: b.label })),
        createdAt: now,
        updatedAt: now,
      });
    }
    set({ sequences: migrated, sequencesMigrated: true });
  },
  fixSequenceTitles: () => {
    const state = get();
    if (state.sequenceTitlesFixed) return;
    // Fix old "Sequenzen cXX" titles to use class+type+day
    const updated = state.sequences.map(seq => {
      if (/^Sequenzen c\d+$/.test(seq.title)) {
        const course = COURSES.find(c => c.id === seq.courseId);
        if (course) {
          return { ...seq, title: `Sequenzen ${course.cls} ${course.typ} ${course.day}`, updatedAt: new Date().toISOString() };
        }
      }
      return seq;
    });
    set({ sequences: updated, sequenceTitlesFixed: true });
  },
  addSequence: (seq) => {
    const now = new Date().toISOString();
    const id = `seq-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const newSeq: ManagedSequence = { ...seq, id, createdAt: now, updatedAt: now };
    set((state) => ({ sequences: [...state.sequences, newSeq] }));
    return id;
  },
  updateSequence: (id, updates) =>
    set((state) => ({
      sequences: state.sequences.map((s) =>
        s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s
      ),
    })),
  deleteSequence: (id) =>
    set((state) => ({ sequences: state.sequences.filter((s) => s.id !== id) })),
  addBlockToSequence: (seqId, block) =>
    set((state) => ({
      sequences: state.sequences.map((s) =>
        s.id === seqId
          ? { ...s, blocks: [...s.blocks, block], updatedAt: new Date().toISOString() }
          : s
      ),
    })),
  updateBlockInSequence: (seqId, blockIndex, block) =>
    set((state) => ({
      sequences: state.sequences.map((s) =>
        s.id === seqId
          ? {
              ...s,
              blocks: s.blocks.map((b, i) => (i === blockIndex ? { ...b, ...block } : b)),
              updatedAt: new Date().toISOString(),
            }
          : s
      ),
    })),
  removeBlockFromSequence: (seqId, blockIndex) =>
    set((state) => ({
      sequences: state.sequences.map((s) =>
        s.id === seqId
          ? { ...s, blocks: s.blocks.filter((_, i) => i !== blockIndex), updatedAt: new Date().toISOString() }
          : s
      ),
    })),
  reorderBlocks: (seqId, fromIndex, toIndex) =>
    set((state) => ({
      sequences: state.sequences.map((s) => {
        if (s.id !== seqId) return s;
        const blocks = [...s.blocks];
        const [moved] = blocks.splice(fromIndex, 1);
        blocks.splice(toIndex, 0, moved);
        return { ...s, blocks, updatedAt: new Date().toISOString() };
      }),
    })),
  // Auto-placement: find free weeks for a course
  getAvailableWeeks: (courseId, startWeek, allWeekOrder) => {
    const state = get();
    // Find sequence that matches this courseId (or has it in courseIds)
    const seq = state.sequences.find(s =>
      s.courseId === courseId || (s.courseIds && s.courseIds.includes(courseId))
    );
    // Get all cols to check: if multi-day, all linked cols must be free
    const allCourseIds = seq?.courseIds && seq.courseIds.length > 1 ? seq.courseIds : [courseId];
    const cols = allCourseIds.map(cid => {
      const course = COURSES.find(c => c.id === cid);
      return course ? course.col : parseInt(cid.replace('c', ''));
    }).filter(c => !isNaN(c));
    if (cols.length === 0) return [];
    
    const startIdx = allWeekOrder.indexOf(startWeek);
    if (startIdx < 0) return [];
    
    const available: string[] = [];
    for (let i = startIdx; i < allWeekOrder.length; i++) {
      const weekW = allWeekOrder[i];
      const week = state.weekData.find(w => w.w === weekW);
      if (!week) { available.push(weekW); continue; }
      // Skip weeks where ANY col has a holiday (6) or event (5)
      const hasBlockingEntry = cols.some(col => {
        const entry = week.lessons[col];
        return entry && (entry.type === 5 || entry.type === 6);
      });
      if (hasBlockingEntry) continue;
      // Also check if ANY other col in the week has a holiday (global block)
      const hasGlobalHoliday = Object.values(week.lessons).some(e => e.type === 6);
      if (hasGlobalHoliday) continue;
      // Week is available only if ALL linked cols are free
      const allFree = cols.every(col => !week.lessons[col]);
      if (allFree) {
        available.push(weekW);
      }
    }
    return available;
  },
  // Auto-place a sequence: distribute blocks across free weeks starting from startWeek
  autoPlaceSequence: (seqId, startWeek, allWeekOrder) => {
    const state = get();
    const seq = state.sequences.find(s => s.id === seqId);
    if (!seq) return { placed: 0, skipped: [] };
    
    // Get all columns to place into (multi-course support)
    const allCourseIds = seq.courseIds && seq.courseIds.length > 0 ? seq.courseIds : [seq.courseId];
    const cols = allCourseIds.map(cid => {
      const course = COURSES.find(c => c.id === cid);
      return course ? course.col : parseInt(cid.replace('c', ''));
    }).filter(c => !isNaN(c));
    if (cols.length === 0) return { placed: 0, skipped: [] };

    // Get available weeks based on primary column
    const available = state.getAvailableWeeks(seq.courseId, startWeek, allWeekOrder);
    
    // Determine LessonType from subjectArea (legacy mapping for grid rendering)
    const lessonType: import('../types').LessonType = 0; // Subject area is stored on the sequence, not the lesson type
    
    state.pushUndo();
    
    let weekIdx = 0;
    let placed = 0;
    const skipped: string[] = [];
    const newWeekData = state.weekData.map(w => ({ ...w, lessons: { ...w.lessons } }));
    const weekMap = new Map(newWeekData.map(w => [w.w, w]));
    const newBlocks: import('../types').SequenceBlock[] = [];
    
    for (const block of seq.blocks) {
      const blockWeeks: string[] = [];
      for (let i = 0; i < block.weeks.length; i++) {
        // Find next available week
        while (weekIdx < available.length) {
          const candidateWeek = available[weekIdx];
          weekIdx++;
          const week = weekMap.get(candidateWeek);
          if (week) {
            // Place in ALL columns (primary + linked)
            for (const col of cols) {
              week.lessons[col] = { title: block.label, type: lessonType };
            }
            blockWeeks.push(candidateWeek);
            placed++;
            break;
          } else {
            skipped.push(candidateWeek);
          }
        }
      }
      newBlocks.push({ label: block.label, weeks: blockWeeks });
    }
    
    // Update weekData and sequence blocks
    set({
      weekData: newWeekData,
      sequences: state.sequences.map(s =>
        s.id === seqId
          ? { ...s, blocks: newBlocks, updatedAt: new Date().toISOString() }
          : s
      ),
    });
    
    return { placed, skipped };
  },
  // Sequence Panel UI state
  sequencePanelOpen: false,
  setSequencePanelOpen: (v) => set({ sequencePanelOpen: v }),
  editingSequenceId: null,
  setEditingSequenceId: (id) => set({ editingSequenceId: id }),

  // HK Rotation
  hkOverrides: {},
  hkStartGroups: {},
  setHKOverride: (weekW, col, group) =>
    set((state) => {
      const key = `${weekW}-${col}`;
      const next = { ...state.hkOverrides };
      if (group === null) {
        delete next[key];
      } else {
        next[key] = group;
      }
      return { hkOverrides: next };
    }),
  setHKStartGroup: (col, group) =>
    set((state) => ({
      hkStartGroups: { ...state.hkStartGroups, [col]: group },
    })),

  // TaF Phasen
  tafPhases: [],
  addTaFPhase: (phase) => {
    const id = `taf-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
    set((state) => ({ tafPhases: [...state.tafPhases, { ...phase, id }] }));
    return id;
  },
  updateTaFPhase: (id, updates) =>
    set((state) => ({
      tafPhases: state.tafPhases.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    })),
  deleteTaFPhase: (id) =>
    set((state) => ({
      tafPhases: state.tafPhases.filter((p) => p.id !== id),
    })),

  // Export / Import
  exportData: () => {
    const state = get();
    return JSON.stringify({
      version: '3.0',
      exportedAt: new Date().toISOString(),
      weekData: state.weekData,
      lessonDetails: state.lessonDetails,
      sequences: state.sequences,
      hkOverrides: state.hkOverrides,
      hkStartGroups: state.hkStartGroups,
      tafPhases: state.tafPhases,
    }, null, 2);
  },
  importData: (json: string) => {
    try {
      const data = JSON.parse(json);
      if (!data.weekData || !Array.isArray(data.weekData)) throw new Error('Invalid data');
      const state = get();
      state.pushUndo();
      set({
        weekData: data.weekData,
        lessonDetails: data.lessonDetails || {},
        sequences: data.sequences || state.sequences,
        hkOverrides: data.hkOverrides || {},
        hkStartGroups: data.hkStartGroups || {},
        tafPhases: data.tafPhases || [],
      });
      return true;
    } catch {
      return false;
    }
  },

  // Drag & Drop
  dragSource: null,
  setDragSource: (d) => set({ dragSource: d }),
  swapLessons: (col, weekA, weekB) => {
    if (weekA === weekB) return;
    const state = get();
    state.pushUndo();

    // Update sequences: swap weekA↔weekB in blocks belonging to courses with this col
    const courseId = COURSES.find(c => c.col === col)?.id;
    const updatedSeqs = state.sequences.map(seq => {
      if (courseId && seq.courseId !== courseId && !(seq.courseIds && seq.courseIds.includes(courseId))) return seq;
      let changed = false;
      const newBlocks = seq.blocks.map(b => {
        const hasA = b.weeks.includes(weekA);
        const hasB = b.weeks.includes(weekB);
        if (!hasA && !hasB) return b;
        changed = true;
        return {
          ...b,
          weeks: b.weeks.map(w => w === weekA ? weekB : w === weekB ? weekA : w),
        };
      });
      return changed ? { ...seq, blocks: newBlocks, updatedAt: new Date().toISOString() } : seq;
    });

    set({
      weekData: state.weekData.map((w) => {
        if (w.w === weekA) {
          const entryB = state.weekData.find((ww) => ww.w === weekB)?.lessons[col];
          const newLessons = { ...w.lessons };
          if (entryB) newLessons[col] = { ...entryB };
          else delete newLessons[col];
          return { ...w, lessons: newLessons };
        }
        if (w.w === weekB) {
          const entryA = state.weekData.find((ww) => ww.w === weekA)?.lessons[col];
          const newLessons = { ...w.lessons };
          if (entryA) newLessons[col] = { ...entryA };
          else delete newLessons[col];
          return { ...w, lessons: newLessons };
        }
        return w;
      }),
      sequences: updatedSeqs,
    });
  },
  moveLessonToEmpty: (col, fromWeek, toWeek) => {
    if (fromWeek === toWeek) return;
    const state = get();
    state.pushUndo();

    // Update sequences: replace fromWeek→toWeek in blocks
    const courseId = COURSES.find(c => c.col === col)?.id;
    const updatedSeqs = state.sequences.map(seq => {
      if (courseId && seq.courseId !== courseId && !(seq.courseIds && seq.courseIds.includes(courseId))) return seq;
      let changed = false;
      const newBlocks = seq.blocks.map(b => {
        if (!b.weeks.includes(fromWeek)) return b;
        changed = true;
        return { ...b, weeks: b.weeks.map(w => w === fromWeek ? toWeek : w) };
      });
      return changed ? { ...seq, blocks: newBlocks, updatedAt: new Date().toISOString() } : seq;
    });

    set({
      weekData: state.weekData.map((w) => {
        if (w.w === fromWeek) {
          const newLessons = { ...w.lessons };
          delete newLessons[col];
          return { ...w, lessons: newLessons };
        }
        if (w.w === toWeek) {
          const entry = state.weekData.find((ww) => ww.w === fromWeek)?.lessons[col];
          if (!entry) return w;
          return { ...w, lessons: { ...w.lessons, [col]: { ...entry } } };
        }
        return w;
      }),
      sequences: updatedSeqs,
    });
  },
  pushLessons: (courseCol, beforeWeekW, allWeeks) => {
    const state = get();
    state.pushUndo();
    const weekOrder = allWeeks;
    const targetIdx = weekOrder.indexOf(beforeWeekW);
    if (targetIdx < 0) return;
    const newWeekData = [...state.weekData.map((w) => ({ ...w, lessons: { ...w.lessons } }))];
    const weekMap = new Map(newWeekData.map((w) => [w.w, w]));
    const relevantWeeks = weekOrder.slice(targetIdx);

    // Collect entries, skipping fixed cells (type 5=Event, 6=Holiday)
    const fixedWeeks = new Set<string>();
    const movableEntries: (LessonEntry | null)[] = [];
    for (const wk of relevantWeeks) {
      const week = weekMap.get(wk);
      const entry = week?.lessons[courseCol] || null;
      if (entry && (entry.type === 5 || entry.type === 6)) {
        fixedWeeks.add(wk);
      } else {
        movableEntries.push(entry);
      }
    }
    // Insert null at front (push down by 1)
    movableEntries.unshift(null);

    // Place back, skipping fixed weeks
    let mi = 0;
    for (const wk of relevantWeeks) {
      if (fixedWeeks.has(wk)) continue; // leave fixed in place
      const week = weekMap.get(wk);
      if (week) {
        if (mi < movableEntries.length && movableEntries[mi]) {
          week.lessons[courseCol] = movableEntries[mi]!;
        } else {
          delete week.lessons[courseCol];
        }
      }
      mi++;
    }
    set({ weekData: newWeekData });
  },

  // Batch operations for multi-select
  batchShiftDown: (keys, allWeeks, courses) => {
    const state = get();
    state.pushUndo();
    const parsed = keys.map(k => {
      const [weekW, courseId] = k.split('-');
      const course = courses.find(c => c.id === courseId);
      return course ? { weekW, col: course.col } : null;
    }).filter(Boolean) as { weekW: string; col: number }[];
    const byCols = new Map<number, string[]>();
    for (const p of parsed) {
      const arr = byCols.get(p.col) || [];
      arr.push(p.weekW);
      byCols.set(p.col, arr);
    }
    let newWeekData = state.weekData.map(w => ({ ...w, lessons: { ...w.lessons } }));
    for (const [col, weeks] of byCols) {
      const earliest = weeks.reduce((best, w) => {
        const bi = allWeeks.indexOf(best);
        const wi = allWeeks.indexOf(w);
        return wi < bi ? w : best;
      }, weeks[0]);
      const weekMap = new Map(newWeekData.map(w => [w.w, w]));
      const targetIdx = allWeeks.indexOf(earliest);
      if (targetIdx < 0) continue;
      const relevantWeeks = allWeeks.slice(targetIdx);
      const entries: (LessonEntry | null)[] = relevantWeeks.map(wk => weekMap.get(wk)?.lessons[col] || null);
      entries.unshift(null);
      for (let i = 0; i < relevantWeeks.length; i++) {
        const wk = weekMap.get(relevantWeeks[i]);
        if (wk) {
          if (entries[i]) wk.lessons[col] = entries[i]!;
          else delete wk.lessons[col];
        }
      }
    }
    set({ weekData: newWeekData, multiSelection: [] });
  },
  batchInsertBefore: (keys, allWeeks, courses) => {
    get().batchShiftDown(keys, allWeeks, courses);
  },

  // Group drag & drop: move a group of cells in a column to a new position
  moveGroup: (col, fromWeeks, toWeek, allWeeks) => {
    const state = get();
    state.pushUndo();
    const weekMap = new Map(state.weekData.map(w => [w.w, w]));

    // Sort fromWeeks by their order in allWeeks
    const sorted = [...fromWeeks].sort((a, b) => allWeeks.indexOf(a) - allWeeks.indexOf(b));

    // Filter out fixed entries (holidays/events type 5,6) — don't move them
    const movable = sorted.filter(wk => {
      const entry = weekMap.get(wk)?.lessons[col];
      return entry && entry.type !== 5 && entry.type !== 6;
    });
    if (movable.length === 0) return;

    // Collect the entries to move
    const entries: (LessonEntry | null)[] = movable.map(wk => weekMap.get(wk)?.lessons[col] || null);
    const details: Record<string, LessonDetail | undefined> = {};
    for (const wk of movable) {
      details[wk] = state.lessonDetails[`${wk}-${col}`];
    }

    // Remove entries from their original positions
    let newWeekData = state.weekData.map(w => {
      if (movable.includes(w.w)) {
        const newLessons = { ...w.lessons };
        delete newLessons[col];
        return { ...w, lessons: newLessons };
      }
      return { ...w, lessons: { ...w.lessons } };
    });

    // Find target position and insert, shifting existing content down
    const toIdx = allWeeks.indexOf(toWeek);
    if (toIdx < 0) { set({ weekData: newWeekData }); return; }

    // Collect non-fixed entries from toWeek onwards (excluding the moved entries)
    const weekMapNew = new Map(newWeekData.map(w => [w.w, w]));
    const targetWeeks = allWeeks.slice(toIdx);

    // Gather existing entries in the target range
    const existing: { week: string; entry: LessonEntry | null }[] = [];
    for (const wk of targetWeeks) {
      const w = weekMapNew.get(wk);
      const entry = w?.lessons[col] || null;
      const isFixed = entry && (entry.type === 5 || entry.type === 6);
      if (!isFixed) {
        existing.push({ week: wk, entry });
      }
    }

    // Build new order: moved entries first, then existing non-null entries
    const movedEntries = entries.filter(e => e !== null) as LessonEntry[];
    const existingEntries = existing.filter(e => e.entry !== null).map(e => e.entry!);
    const allEntries = [...movedEntries, ...existingEntries];

    // Place back into non-fixed slots from toIdx
    let entryIdx = 0;
    for (const wk of targetWeeks) {
      const w = weekMapNew.get(wk);
      if (!w) continue;
      const curEntry = w.lessons[col];
      const isFixed = curEntry && (curEntry.type === 5 || curEntry.type === 6);
      if (isFixed) continue;

      if (entryIdx < allEntries.length) {
        w.lessons[col] = allEntries[entryIdx];
        entryIdx++;
      } else {
        delete w.lessons[col];
      }
    }

    // Update sequences: remap weeks for blocks in this column
    const courseId = COURSES.find(c => c.col === col)?.id;
    const updatedSeqs = state.sequences.map(seq => {
      if (courseId && seq.courseId !== courseId && !(seq.courseIds && seq.courseIds.includes(courseId))) return seq;
      // Rebuild week mapping based on new positions
      let changed = false;
      const newBlocks = seq.blocks.map(b => {
        const hasMovedWeek = b.weeks.some(w => sorted.includes(w));
        if (!hasMovedWeek) return b;
        changed = true;
        // For moved weeks, find their new positions
        return b; // Sequence tracking for group moves is complex — keep blocks as-is for now
      });
      return changed ? { ...seq, blocks: newBlocks, updatedAt: new Date().toISOString() } : seq;
    });

    set({ weekData: newWeekData.map(w => weekMapNew.get(w.w) || w), sequences: updatedSeqs, multiSelection: [] });
  },

  // === Collection (Materialsammlung) ===
  collection: [],

  addCollectionItem: (item) => {
    const id = crypto.randomUUID();
    set((state) => ({
      collection: [...state.collection, { ...item, id, createdAt: new Date().toISOString() }],
    }));
    return id;
  },

  updateCollectionItem: (id, updates) =>
    set((state) => ({
      collection: state.collection.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    })),

  deleteCollectionItem: (id) =>
    set((state) => ({
      collection: state.collection.filter((c) => c.id !== id),
    })),

  // Archive a single block as CollectionUnit
  archiveBlock: (seqId, blockIndex, schoolYear) => {
    const state = get();
    const seq = state.sequences.find((s) => s.id === seqId);
    if (!seq || !seq.blocks[blockIndex]) return '';
    const block = seq.blocks[blockIndex];
    const course = COURSES.find((c) => c.id === seq.courseId);

    // Snapshot lesson details for this block's weeks
    const lessonDetails: Record<string, LessonDetail> = {};
    const lessonTitles: string[] = [];
    block.weeks.forEach((w, i) => {
      const col = course?.col;
      if (col !== undefined) {
        const key = `${w}-${col}`;
        if (state.lessonDetails[key]) lessonDetails[String(i)] = { ...state.lessonDetails[key] };
        const weekData = state.weekData.find((wd) => wd.w === w);
        lessonTitles.push(weekData?.lessons[col]?.title || '');
      }
    });

    const unit: CollectionUnit = {
      block: { ...block, weeks: [] }, // Strip weeks
      lessonDetails,
      lessonTitles,
    };

    return get().addCollectionItem({
      type: 'unit',
      title: block.label || seq.title,
      subjectArea: block.subjectArea || seq.subjectArea,
      courseType: course?.typ,
      cls: course?.cls,
      schoolYear,
      sequenceTitle: seq.title,
      sequenceColor: seq.color,
      units: [unit],
    });
  },

  // Archive entire ManagedSequence (all blocks)
  archiveSequence: (seqId, schoolYear) => {
    const state = get();
    const seq = state.sequences.find((s) => s.id === seqId);
    if (!seq) return '';
    const course = COURSES.find((c) => c.id === seq.courseId);

    const units: CollectionUnit[] = seq.blocks.map((block) => {
      const lessonDetails: Record<string, LessonDetail> = {};
      const lessonTitles: string[] = [];
      block.weeks.forEach((w, i) => {
        const col = course?.col;
        if (col !== undefined) {
          const key = `${w}-${col}`;
          if (state.lessonDetails[key]) lessonDetails[String(i)] = { ...state.lessonDetails[key] };
          const weekData = state.weekData.find((wd) => wd.w === w);
          lessonTitles.push(weekData?.lessons[col]?.title || '');
        }
      });
      return { block: { ...block, weeks: [] }, lessonDetails, lessonTitles };
    });

    return get().addCollectionItem({
      type: 'sequence',
      title: seq.title,
      subjectArea: seq.subjectArea,
      courseType: course?.typ,
      cls: course?.cls,
      schoolYear,
      sequenceTitle: seq.title,
      sequenceColor: seq.color,
      units,
    });
  },

  // Archive all sequences for a course type + class in a school year
  archiveSchoolYear: (courseType, cls, schoolYear) => {
    const state = get();
    const matchingCourses = COURSES.filter((c) => c.typ === courseType && c.cls === cls);
    const courseIds = new Set(matchingCourses.map((c) => c.id));
    const matchingSeqs = state.sequences.filter((s) => courseIds.has(s.courseId));

    const units: CollectionUnit[] = [];
    let sa: string | undefined;
    matchingSeqs.forEach((seq) => {
      if (seq.subjectArea && !sa) sa = seq.subjectArea;
      const course = COURSES.find((c) => c.id === seq.courseId);
      seq.blocks.forEach((block) => {
        const lessonDetails: Record<string, LessonDetail> = {};
        const lessonTitles: string[] = [];
        block.weeks.forEach((w, i) => {
          const col = course?.col;
          if (col !== undefined) {
            const key = `${w}-${col}`;
            if (state.lessonDetails[key]) lessonDetails[String(i)] = { ...state.lessonDetails[key] };
            const weekData = state.weekData.find((wd) => wd.w === w);
            lessonTitles.push(weekData?.lessons[col]?.title || '');
          }
        });
        units.push({ block: { ...block, weeks: [] }, lessonDetails, lessonTitles });
      });
    });

    return get().addCollectionItem({
      type: 'schoolyear',
      title: `${courseType} ${cls} – SJ ${schoolYear}`,
      courseType: courseType as any,
      cls,
      schoolYear,
      units,
    });
  },

  // Archive entire curriculum (multi-year)
  archiveCurriculum: (courseType, cls, schoolYear, gymYears) => {
    const state = get();
    // Same as schoolYear but with gymYears metadata
    const matchingCourses = COURSES.filter((c) => c.typ === courseType && c.cls === cls);
    const courseIds = new Set(matchingCourses.map((c) => c.id));
    const matchingSeqs = state.sequences.filter((s) => courseIds.has(s.courseId));

    const units: CollectionUnit[] = [];
    matchingSeqs.forEach((seq) => {
      const course = COURSES.find((c) => c.id === seq.courseId);
      seq.blocks.forEach((block) => {
        const lessonDetails: Record<string, LessonDetail> = {};
        const lessonTitles: string[] = [];
        block.weeks.forEach((w, i) => {
          const col = course?.col;
          if (col !== undefined) {
            const key = `${w}-${col}`;
            if (state.lessonDetails[key]) lessonDetails[String(i)] = { ...state.lessonDetails[key] };
            const weekData = state.weekData.find((wd) => wd.w === w);
            lessonTitles.push(weekData?.lessons[col]?.title || '');
          }
        });
        units.push({ block: { ...block, weeks: [] }, lessonDetails, lessonTitles });
      });
    });

    return get().addCollectionItem({
      type: 'curriculum',
      title: `${courseType} ${cls} – ${gymYears}`,
      courseType: courseType as any,
      cls,
      schoolYear,
      gymYears,
      units,
    });
  },

  // Import from collection → create new sequence
  importFromCollection: (itemId, targetCourseId, options) => {
    const state = get();
    const item = state.collection.find((c) => c.id === itemId);
    if (!item || item.units.length === 0) return null;
    const course = COURSES.find((c) => c.id === targetCourseId);
    if (!course) return null;

    // Create blocks from units (without weeks — user assigns manually)
    const blocks: SequenceBlock[] = item.units.map((u) => ({
      ...u.block,
      weeks: [], // Must be assigned by user
      materialLinks: options.includeMaterialLinks ? u.block.materialLinks : undefined,
    }));

    // Create the sequence
    const seqId = get().addSequence({
      courseId: targetCourseId,
      title: item.title,
      subjectArea: item.subjectArea,
      blocks,
      color: item.sequenceColor,
    });

    // Optionally import lesson detail snapshots (stored for later when weeks are assigned)
    // Note: Since weeks aren't assigned yet, we store the details in notes
    if (options.includeNotes) {
      item.units.forEach((u) => {
        const detailNotes = Object.entries(u.lessonDetails)
          .filter(([, d]) => d.notes)
          .map(([idx, d]) => `[${u.lessonTitles[Number(idx)] || `L${idx}`}] ${d.notes}`)
          .join('\n');
        if (detailNotes && u.block.description === undefined) {
          // Append to block description as reference
          const blockIdx = item.units.indexOf(u);
          get().updateBlockInSequence(seqId, blockIdx, {
            description: (u.block.description || '') + (detailNotes ? '\n--- Notizen (Import) ---\n' + detailNotes : ''),
          });
        }
      });
    }

    return seqId;
  },

  undoStack: [],
  pushUndo: () =>
    set((state) => ({
      undoStack: [
        ...state.undoStack.slice(-9),
        state.weekData.map((w) => ({ ...w, lessons: { ...w.lessons } })),
      ],
    })),
  undo: () =>
    set((state) => {
      if (state.undoStack.length === 0) return state;
      const prev = state.undoStack[state.undoStack.length - 1];
      return {
        weekData: prev,
        undoStack: state.undoStack.slice(0, -1),
      };
    }),
  plannerSettings: null,
  setPlannerSettings: (s) => set({ plannerSettings: s }),
  settingsOpen: false,
  setSettingsOpen: (v) => set({ settingsOpen: v }),
  settingsEditCourseId: null,
  setSettingsEditCourseId: (id) => set({ settingsEditCourseId: id }),
  panelWidth: 400,
  setPanelWidth: (w) => set({ panelWidth: w }),
  expandedNoteCols: {},
  toggleNoteCol: (courseId) => set((s) => {
    const next = { ...s.expandedNoteCols };
    if (next[courseId]) { delete next[courseId]; } else { next[courseId] = true; }
    return { expandedNoteCols: next };
  }),
  noteColWidth: 200,
  setNoteColWidth: (w) => set({ noteColWidth: Math.max(80, Math.min(400, w)) }),
  }),
    {
      name: 'unterrichtsplaner-storage',
      version: 3,
      partialize: (state) => ({
        weekData: state.weekData,
        lessonDetails: state.lessonDetails,
        sequences: state.sequences,
        sequencesMigrated: state.sequencesMigrated,
        sequenceTitlesFixed: state.sequenceTitlesFixed,
        hkOverrides: state.hkOverrides,
        hkStartGroups: state.hkStartGroups,
        tafPhases: state.tafPhases,
        collection: state.collection,
        plannerSettings: state.plannerSettings,
      }),
      migrate: (persisted: unknown, version: number) => {
        const state = persisted as Record<string, unknown>;
        if (version < 2) {
          return { ...state, sequences: [], sequencesMigrated: false, sequenceTitlesFixed: false };
        }
        if (version < 3) {
          // Merge initial lesson details (from Excel) without overwriting user edits
          const existing = (state.lessonDetails || {}) as Record<string, unknown>;
          const merged = { ...INITIAL_LESSON_DETAILS };
          // User edits take precedence
          for (const [key, val] of Object.entries(existing)) {
            if (val && typeof val === 'object') {
              merged[key] = { ...(merged[key] || {}), ...val } as typeof merged[string];
            }
          }
          return { ...state, lessonDetails: merged };
        }
        return persisted;
      },
    }
  )
);

// === Multi-Planner Instance Switching ===

/** Extract persistable state from current store */
function extractPersistedState(): Record<string, unknown> {
  const state = usePlannerStore.getState();
  return {
    weekData: state.weekData,
    lessonDetails: state.lessonDetails,
    sequences: state.sequences,
    sequencesMigrated: state.sequencesMigrated,
    sequenceTitlesFixed: state.sequenceTitlesFixed,
    hkOverrides: state.hkOverrides,
    hkStartGroups: state.hkStartGroups,
    tafPhases: state.tafPhases,
    collection: state.collection,
    plannerSettings: state.plannerSettings,
  };
}

/** Save current store state to a specific instance slot */
export function saveToInstance(instanceId: string): void {
  const data = extractPersistedState();
  const wrapped = { state: data, version: 3 };
  localStorage.setItem(instanceStorageKey(instanceId), JSON.stringify(wrapped));
}

/** Load an instance's data into the store (replaces current state) */
export function loadFromInstance(instanceId: string): void {
  const raw = localStorage.getItem(instanceStorageKey(instanceId));
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      const data = parsed.state || parsed;
      const isNew = !!data.plannerSettings;
      usePlannerStore.setState({
        weekData: data.weekData || [],
        lessonDetails: data.lessonDetails || {},
        sequences: data.sequences || [],
        sequencesMigrated: data.sequencesMigrated ?? isNew,
        sequenceTitlesFixed: data.sequenceTitlesFixed ?? isNew,
        hkOverrides: data.hkOverrides || {},
        hkStartGroups: data.hkStartGroups || {},
        tafPhases: data.tafPhases || [],
        collection: data.collection || [],
        plannerSettings: data.plannerSettings || null,
        // Reset ALL UI & transient state on switch
        selection: null,
        editing: null,
        insertDialog: null,
        dragSource: null,
        multiSelection: [],
        lastSelectedKey: null,
        undoStack: [],
        editingSequenceId: null,
        emptyCellAction: null,
        dragSelectAnchor: null,
        dragSelectCurrent: null,
        dragSelectedKeys: [],
        hoveredCell: null,
        searchQuery: '',
        courseFilter: null,
        classFilter: null,
        settingsEditCourseId: null,
      });
    } catch (e) {
      console.error('Failed to load instance:', e);
      resetToEmpty();
    }
  } else {
    resetToEmpty();
  }
}

/** Reset store to empty state (new planner) */
export function resetToEmpty(): void {
  usePlannerStore.setState({
    weekData: [],
    lessonDetails: {},
    sequences: [],
    sequencesMigrated: true,
    sequenceTitlesFixed: true,
    hkOverrides: {},
    hkStartGroups: {},
    tafPhases: [],
    collection: [],
    plannerSettings: null,
    selection: null,
    editing: null,
    insertDialog: null,
    dragSource: null,
    multiSelection: [],
  });
}

/** Switch from one instance to another (save current, load new) */
export function switchInstance(fromId: string | null, toId: string): void {
  if (fromId) {
    saveToInstance(fromId);
  }
  loadFromInstance(toId);
}

/** Export instance data as JSON string */
export function exportInstanceData(instanceId: string): string | null {
  // If this is the currently active instance, save first
  const currentData = extractPersistedState();
  const raw = localStorage.getItem(instanceStorageKey(instanceId));
  const data = raw ? JSON.parse(raw)?.state || JSON.parse(raw) : currentData;
  return JSON.stringify(data, null, 2);
}
