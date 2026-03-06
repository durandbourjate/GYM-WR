import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { FilterType, Week, LessonEntry, Course, LessonDetail, ManagedSequence, SequenceBlock, HKGroup, TaFPhase, CollectionItem } from '../types';
import { COURSES } from '../data/courses';
import { INITIAL_LESSON_DETAILS } from '../data/initialLessonDetails';
import { instanceStorageKey } from './instanceStore';
import type { PlannerSettings } from './settingsStore';
import { configToCourses, loadSettings } from './settingsStore';
import { createUISlice, type Selection, type EditingCell, type InsertDialog } from './slices/uiSlice';
import { createCollectionSlice } from './slices/collectionSlice';
import { createSequenceSlice } from './slices/sequenceSlice';

// v3.91 N3: Zoom-Stufen für Spaltenbreite und Schriftgrösse
export const ZOOM_LEVELS = [
  { colWidth: 120, fontSize: 9 },   // Stufe 1 (min)
  { colWidth: 160, fontSize: 10 },  // Stufe 2
  { colWidth: 200, fontSize: 11 },  // Stufe 3 (default)
  { colWidth: 260, fontSize: 12 },  // Stufe 4
  { colWidth: 340, fontSize: 14 },  // Stufe 5 (max)
] as const;

/** Zoom-Scale Helper: skaliert einen Pixel-Basiswert proportional zur Zoom-Stufe.
 *  Referenz = Stufe 3 (fontSize 11). Bei Stufe 1 ~18% kleiner, Stufe 5 ~27% grösser. */
export function zs(base: number, zoomCfg: typeof ZOOM_LEVELS[number]): number {
  return Math.round(base * zoomCfg.fontSize / 11);
}

export interface PlannerState {
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
  // v3.82 E4: Cross-column move
  moveLessonToColumn: (fromCol: number, fromWeek: string, toCol: number, toWeek: string) => void;
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
  // G6: Doppelklick auf KW → Ferien-Dialog vorausgefüllt
  pendingHolidayKw: string | null;
  setPendingHolidayKw: (kw: string | null) => void;
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
    (...a) => {
  const [set, get] = a;
  return {
  ...createUISlice(...a),
  ...createCollectionSlice(...a),
  weekData: [],
  setWeekData: (w) => set({ weekData: w }),
  updateLesson: (weekW, col, entry) =>
    set((state) => {
      const newWeekData = state.weekData.map((w) =>
        w.w === weekW
          ? { ...w, lessons: { ...w.lessons, [col]: entry } }
          : w
      );
      // v3.84 G8: Auto-PW-Badge bei UE in Prüfungswochen (SF/EF + TaF-Kurs)
      const result: Partial<typeof state> = { weekData: newWeekData };
      if (entry.title && entry.type > 0 && state.plannerSettings) {
        const ps = state.plannerSettings;
        // 1. KW = Prüfungswoche?
        const isPW = ps.specialWeeks.some(
          sw => sw.week === weekW && /prüfung/i.test(sw.label)
        );
        if (isPW) {
          // 2. Kurs finden
          const courses = configToCourses(ps.courses);
          const course = courses.find(c => c.col === col);
          if (course) {
            // 3. Durchgehendes Fach (SF/EF)?
            const isDurchgehend = course.typ === 'SF' || course.typ === 'EF';
            // 4. Reiner TaF-Kurs? (alle Buchstaben sind f/s, keine Regelklassen-Buchstaben a-e)
            const letters = course.cls.replace(/[^a-zA-Z]/g, '').toLowerCase();
            const isTaF = letters.length > 0 && /^[fs]+$/.test(letters);
            if (isDurchgehend && isTaF) {
              const key = `${weekW}-${col}`;
              const existing = state.lessonDetails[key] || {};
              const badges = existing.badges || [];
              if (!badges.some((b: { label: string }) => b.label === 'PW')) {
                result.lessonDetails = {
                  ...state.lessonDetails,
                  [key]: { ...existing, badges: [...badges, { label: 'PW', color: '#ea580c' }] },
                };
              }
            }
          }
        }
      }
      return result;
    }),
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

  ...createSequenceSlice(...a),

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

      // v3.86 I1-P1: col-Migration — alte col-IDs auf aktuelle Konfiguration mappen
      let weekData = data.weekData as Week[];
      let lessonDetails = (data.lessonDetails || {}) as Record<string, LessonDetail>;
      const settings = loadSettings();
      if (settings && settings.courses.length > 0) {
        const currentCourses = configToCourses(settings.courses);
        const currentColIds = new Set(currentCourses.map(c => c.col));
        // Sammle alle col-IDs im importierten weekData
        const importedColIds = new Set<number>();
        for (const w of weekData) {
          for (const col of Object.keys(w.lessons).map(Number)) importedColIds.add(col);
        }
        // Prüfe ob Migration nötig (importierte cols != aktuelle cols)
        const needsMigration = [...importedColIds].some(c => !currentColIds.has(c) && c !== 0);
        if (needsMigration) {
          // Baue Map: courseId → aktuelle col
          const courseIdToNewCol = new Map<string, number>();
          for (const c of currentCourses) courseIdToNewCol.set(c.id, c.col);
          // Baue Map: alte col → courseId (aus COURSES legacy-Tabelle)
          const oldColToCourseId = new Map<number, string>();
          for (const c of COURSES) oldColToCourseId.set(c.col, c.id);
          // Migrations-Map: oldCol → newCol
          const colMap = new Map<number, number>();
          for (const oldCol of importedColIds) {
            if (currentColIds.has(oldCol)) continue; // schon korrekt
            const courseId = oldColToCourseId.get(oldCol);
            if (courseId) {
              const newCol = courseIdToNewCol.get(courseId);
              if (newCol !== undefined) colMap.set(oldCol, newCol);
            }
          }
          // Migration anwenden
          if (colMap.size > 0) {
            weekData = weekData.map(w => {
              const newLessons: Record<number, LessonEntry> = {};
              for (const [col, entry] of Object.entries(w.lessons)) {
                const numCol = Number(col);
                const mappedCol = colMap.get(numCol) ?? numCol;
                newLessons[mappedCol] = entry;
              }
              return { ...w, lessons: newLessons };
            });
            // lessonDetails: Keys sind "weekW-col" Format
            const newDetails: Record<string, LessonDetail> = {};
            for (const [key, detail] of Object.entries(lessonDetails)) {
              const match = key.match(/^(.+)-(\d+)$/);
              if (match) {
                const oldCol = Number(match[2]);
                const mappedCol = colMap.get(oldCol) ?? oldCol;
                newDetails[`${match[1]}-${mappedCol}`] = detail;
              } else {
                newDetails[key] = detail;
              }
            }
            lessonDetails = newDetails;
          }
        }
      }

      set({
        weekData,
        lessonDetails,
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
  // v3.82 E4: Cross-column move (UE von einer Spalte in eine andere verschieben)
  moveLessonToColumn: (fromCol, fromWeek, toCol, toWeek) => {
    if (fromCol === toCol && fromWeek === toWeek) return;
    const state = get();
    const sourceEntry = state.weekData.find(w => w.w === fromWeek)?.lessons[fromCol];
    if (!sourceEntry) return;
    // Move lesson detail too
    const detailKey = `${fromWeek}-${fromCol}`;
    const newDetailKey = `${toWeek}-${toCol}`;
    const detail = state.lessonDetails[detailKey];
    const newDetails = { ...state.lessonDetails };
    if (detail) {
      newDetails[newDetailKey] = detail;
      delete newDetails[detailKey];
    }
    // Update sequences: remap courseId + week for matching blocks
    const fromCourseId = COURSES.find(c => c.col === fromCol)?.id;
    const toCourseId = COURSES.find(c => c.col === toCol)?.id;
    const updatedSeqs = state.sequences.map(seq => {
      if (!fromCourseId || (seq.courseId !== fromCourseId && !(seq.courseIds && seq.courseIds.includes(fromCourseId)))) return seq;
      let changed = false;
      const newBlocks = seq.blocks.map(b => {
        if (!b.weeks.includes(fromWeek)) return b;
        changed = true;
        return { ...b, weeks: b.weeks.map(w => w === fromWeek ? toWeek : w) };
      });
      if (!changed) return seq;
      const newSeq = { ...seq, blocks: newBlocks, updatedAt: new Date().toISOString() };
      // Update courseId if moving to different course
      if (toCourseId && fromCourseId !== toCourseId) {
        newSeq.courseId = toCourseId;
        if (newSeq.courseIds) {
          newSeq.courseIds = newSeq.courseIds.map(id => id === fromCourseId ? toCourseId : id);
        }
      }
      return newSeq;
    });
    set({
      weekData: state.weekData.map(w => {
        const newLessons = { ...w.lessons };
        if (w.w === fromWeek) {
          delete newLessons[fromCol];
        }
        if (w.w === toWeek) {
          newLessons[toCol] = { ...sourceEntry };
        }
        if (w.w === fromWeek || w.w === toWeek) {
          return { ...w, lessons: newLessons };
        }
        return w;
      }),
      lessonDetails: newDetails,
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
  }; },
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
