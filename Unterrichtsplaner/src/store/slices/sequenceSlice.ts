import type { StateCreator } from 'zustand';
import type { PlannerState } from '../plannerStore';
import type { LessonType, ManagedSequence, SequenceBlock } from '../../types';
import { SEQUENCES as STATIC_SEQUENCES } from '../../data/sequences';
import { COURSES } from '../../data/courses';
import { configToCourses, loadSettings } from '../settingsStore';

// === SequenceSlice Interface ===

export interface SequenceSlice {
  sequences: ManagedSequence[];
  sequencesMigrated: boolean;
  sequenceTitlesFixed: boolean;
  migrateStaticSequences: () => void;
  fixSequenceTitles: () => void;
  addSequence: (seq: Omit<ManagedSequence, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateSequence: (id: string, updates: Partial<ManagedSequence>) => void;
  deleteSequence: (id: string) => void;
  addBlockToSequence: (seqId: string, block: SequenceBlock) => void;
  updateBlockInSequence: (seqId: string, blockIndex: number, updates: Partial<SequenceBlock>) => void;
  removeBlockFromSequence: (seqId: string, blockIndex: number) => void;
  // T6: Remove block AND delete all associated weekData entries + lessonDetails
  removeBlockWithLessons: (seqId: string, blockIndex: number) => void;
  reorderBlocks: (seqId: string, fromIndex: number, toIndex: number) => void;
  getAvailableWeeks: (courseId: string, startWeek: string, allWeekOrder: string[]) => string[];
  autoPlaceSequence: (seqId: string, startWeek: string, allWeekOrder: string[]) => { placed: number; skipped: string[] };
  sequencePanelOpen: boolean;
  setSequencePanelOpen: (v: boolean) => void;
  editingSequenceId: string | null;
  setEditingSequenceId: (id: string | null) => void;
}

// === SequenceSlice Implementation ===

export const createSequenceSlice: StateCreator<PlannerState, [], [], SequenceSlice> = (set, get) => ({
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
    // K3: Sync weekData for blocks that already have weeks assigned (z.B. MultiSelectToolbar)
    const state = get();
    const settings = state.plannerSettings || loadSettings();
    let newWeekData = state.weekData;
    if (settings && seq.blocks && seq.blocks.length > 0) {
      const courses = configToCourses(settings.courses);
      const course = courses.find(c => c.id === seq.courseId);
      if (course) {
        const allBlockWeeks = new Set(seq.blocks.flatMap(b => b.weeks));
        if (allBlockWeeks.size > 0) {
          newWeekData = state.weekData.map(w => {
            if (!allBlockWeeks.has(w.w)) return w;
            const existing = w.lessons[course.col];
            if (existing?.title) return w;
            return { ...w, lessons: { ...w.lessons, [course.col]: { title: 'UE', type: 1 as LessonType } } };
          });
        }
      }
    }
    set((s) => ({ sequences: [...s.sequences, newSeq], weekData: newWeekData }));
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
  addBlockToSequence: (seqId, block) => {
    const state = get();
    const seq = state.sequences.find(s => s.id === seqId);
    // K3: Sync weekData — create placeholder lessons for all weeks in block
    // Fallback auf loadSettings() wenn plannerSettings noch null
    let newWeekData = state.weekData;
    const settings = state.plannerSettings || loadSettings();
    if (seq && block.weeks.length > 0 && settings) {
      const courses = configToCourses(settings.courses);
      const course = courses.find(c => c.id === seq.courseId);
      if (course) {
        newWeekData = state.weekData.map(w => {
          if (!block.weeks.includes(w.w)) return w;
          const existing = w.lessons[course.col];
          if (existing?.title) return w; // Don't overwrite existing
          return { ...w, lessons: { ...w.lessons, [course.col]: { title: 'UE', type: 1 as LessonType } } };
        });
      }
    }
    set({
      weekData: newWeekData,
      sequences: state.sequences.map((s) =>
        s.id === seqId
          ? { ...s, blocks: [...s.blocks, block], updatedAt: new Date().toISOString() }
          : s
      ),
    });
  },
  updateBlockInSequence: (seqId, blockIndex, updates) => {
    const state = get();
    const seq = state.sequences.find(s => s.id === seqId);
    // K3: Sync weekData when weeks change — Fallback auf loadSettings()
    let newWeekData = state.weekData;
    const settings = state.plannerSettings || loadSettings();
    if (seq && updates.weeks && settings) {
      const oldBlock = seq.blocks[blockIndex];
      const newWeeks = updates.weeks.filter(w => !oldBlock?.weeks.includes(w));
      if (newWeeks.length > 0) {
        const courses = configToCourses(settings.courses);
        const course = courses.find(c => c.id === seq.courseId);
        if (course) {
          newWeekData = state.weekData.map(w => {
            if (!newWeeks.includes(w.w)) return w;
            const existing = w.lessons[course.col];
            if (existing?.title) return w;
            return { ...w, lessons: { ...w.lessons, [course.col]: { title: 'UE', type: 0 as LessonType } } };
          });
        }
      }
    }
    set({
      weekData: newWeekData,
      sequences: state.sequences.map((s) =>
        s.id === seqId
          ? {
              ...s,
              blocks: s.blocks.map((b, i) => (i === blockIndex ? { ...b, ...updates } : b)),
              updatedAt: new Date().toISOString(),
            }
          : s
      ),
    });
  },
  removeBlockFromSequence: (seqId, blockIndex) =>
    set((state) => ({
      sequences: state.sequences.map((s) =>
        s.id === seqId
          ? { ...s, blocks: s.blocks.filter((_, i) => i !== blockIndex), updatedAt: new Date().toISOString() }
          : s
      ),
      // v3.100 #5: editingSequenceId nullen wenn gelöschte Sequenz editiert wird
      editingSequenceId: state.editingSequenceId?.startsWith(seqId) ? null : state.editingSequenceId,
    })),
  // T6: Remove block AND delete weekData + lessonDetails for all block weeks
  removeBlockWithLessons: (seqId, blockIndex) => {
    const state = get();
    const seq = state.sequences.find(s => s.id === seqId);
    if (!seq || !seq.blocks[blockIndex]) return;
    state.pushUndo();
    const block = seq.blocks[blockIndex];
    const weeksToDelete = new Set(block.weeks);
    // Find all columns for this sequence's courses
    const allCourseIds = seq.courseIds && seq.courseIds.length > 0 ? seq.courseIds : [seq.courseId];
    const settings = state.plannerSettings || loadSettings();
    const courses = settings ? configToCourses(settings.courses) : COURSES;
    const cols = allCourseIds.map(cid => courses.find(c => c.id === cid)?.col).filter((c): c is number => c !== undefined);
    // Remove weekData entries for block weeks in sequence columns
    const newWeekData = state.weekData.map(w => {
      if (!weeksToDelete.has(w.w)) return w;
      const newLessons = { ...w.lessons };
      for (const col of cols) delete newLessons[col];
      return { ...w, lessons: newLessons };
    });
    // Remove lessonDetails for block weeks
    const newDetails = { ...state.lessonDetails };
    for (const wk of weeksToDelete) {
      for (const col of cols) delete newDetails[`${wk}-${col}`];
    }
    // Remove block from sequence (or remove entire sequence if it was the only block)
    const newBlocks = seq.blocks.filter((_, i) => i !== blockIndex);
    const newSequences = newBlocks.length > 0
      ? state.sequences.map(s => s.id === seqId ? { ...s, blocks: newBlocks, updatedAt: new Date().toISOString() } : s)
      : state.sequences.filter(s => s.id !== seqId);
    // v3.100 #5: editingSequenceId nullen wenn gelöschte Sequenz editiert wird → verhindert Weisser-Bildschirm
    const clearEditing = state.editingSequenceId?.startsWith(seqId) ? null : state.editingSequenceId;
    set({ weekData: newWeekData, lessonDetails: newDetails, sequences: newSequences, editingSequenceId: clearEditing });
  },
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
    const lessonType: import('../../types').LessonType = 0; // Subject area is stored on the sequence, not the lesson type

    state.pushUndo();

    let weekIdx = 0;
    let placed = 0;
    const skipped: string[] = [];
    const newWeekData = state.weekData.map(w => ({ ...w, lessons: { ...w.lessons } }));
    const weekMap = new Map(newWeekData.map(w => [w.w, w]));
    const newBlocks: import('../../types').SequenceBlock[] = [];

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
});
