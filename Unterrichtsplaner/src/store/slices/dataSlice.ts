import type { StateCreator } from 'zustand';
import type { PlannerState } from '../plannerStore';
import type { Week, LessonEntry, LessonDetail, Course, HKGroup, TaFPhase } from '../../types';
import type { PlannerSettings } from '../settingsStore';
import { COURSES } from '../../data/courses';
import { configToCourses, loadSettings } from '../settingsStore';

// === DataSlice Interface ===

export interface DataSlice {
  weekData: Week[];
  setWeekData: (w: Week[]) => void;
  updateLesson: (weekW: string, col: number, entry: LessonEntry) => void;
  lessonDetails: Record<string, LessonDetail>;
  updateLessonDetail: (weekW: string, col: number, detail: Partial<LessonDetail>) => void;
  getLessonDetail: (weekW: string, col: number) => LessonDetail | undefined;
  // HK Rotation
  hkOverrides: Record<string, HKGroup>;
  hkStartGroups: Record<number, HKGroup>;
  setHKOverride: (weekW: string, col: number, group: HKGroup | null) => void;
  setHKStartGroup: (col: number, group: HKGroup) => void;
  // TaF Phasen
  tafPhases: TaFPhase[];
  addTaFPhase: (phase: Omit<TaFPhase, 'id'>) => string;
  updateTaFPhase: (id: string, updates: Partial<TaFPhase>) => void;
  deleteTaFPhase: (id: string) => void;
  // Export / Import
  exportData: () => string;
  importData: (json: string) => boolean;
  // Drag & Drop
  dragSource: { week: string; col: number } | null;
  setDragSource: (d: { week: string; col: number } | null) => void;
  swapLessons: (col: number, weekA: string, weekB: string) => void;
  moveLessonToEmpty: (col: number, fromWeek: string, toWeek: string) => void;
  moveLessonToColumn: (fromCol: number, fromWeek: string, toCol: number, toWeek: string) => void;
  pushLessons: (courseCol: number, beforeWeekW: string, allWeeks: string[]) => void;
  batchShiftDown: (keys: string[], allWeeks: string[], courses: Course[]) => void;
  batchInsertBefore: (keys: string[], allWeeks: string[], courses: Course[]) => void;
  moveGroup: (col: number, fromWeeks: string[], toWeek: string, allWeeks: string[]) => void;
  // T5: Sequence block drag — move ALL weeks of a sequence block together
  moveSequenceBlock: (col: number, fromWeek: string, toWeek: string, allWeekOrder: string[], kursId: string) => void;
  // Undo
  undoStack: Week[][];
  pushUndo: () => void;
  undo: () => void;
  // Planner Settings
  plannerSettings: PlannerSettings | null;
  setPlannerSettings: (s: PlannerSettings | null) => void;
}

// === DataSlice Implementation ===

export const createDataSlice: StateCreator<PlannerState, [], [], DataSlice> = (set, get) => ({
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
          (sw: { week: string; label: string }) => sw.week === weekW && /prüfung/i.test(sw.label)
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
  lessonDetails: {},
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
          // Baue Map: kursId → aktuelle col
          const kursIdToNewCol = new Map<string, number>();
          for (const c of currentCourses) kursIdToNewCol.set(c.id, c.col);
          // Baue Map: alte col → kursId (aus COURSES legacy-Tabelle)
          const oldColToKursId = new Map<number, string>();
          for (const c of COURSES) oldColToKursId.set(c.col, c.id);
          // Migrations-Map: oldCol → newCol
          const colMap = new Map<number, number>();
          for (const oldCol of importedColIds) {
            if (currentColIds.has(oldCol)) continue; // schon korrekt
            const kursId = oldColToKursId.get(oldCol);
            if (kursId) {
              const newCol = kursIdToNewCol.get(kursId);
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
    const kursId = COURSES.find(c => c.col === col)?.id;
    const updatedSeqs = state.sequences.map(seq => {
      if (kursId && seq.kursId !== kursId && !(seq.kursIds && seq.kursIds.includes(kursId))) return seq;
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
    const kursId = COURSES.find(c => c.col === col)?.id;
    const updatedSeqs = state.sequences.map(seq => {
      if (kursId && seq.kursId !== kursId && !(seq.kursIds && seq.kursIds.includes(kursId))) return seq;
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
    // Update sequences: remap kursId + week for matching blocks
    const fromKursId = COURSES.find(c => c.col === fromCol)?.id;
    const toKursId = COURSES.find(c => c.col === toCol)?.id;
    const updatedSeqs = state.sequences.map(seq => {
      if (!fromKursId || (seq.kursId !== fromKursId && !(seq.kursIds && seq.kursIds.includes(fromKursId)))) return seq;
      let changed = false;
      const newBlocks = seq.blocks.map(b => {
        if (!b.weeks.includes(fromWeek)) return b;
        changed = true;
        return { ...b, weeks: b.weeks.map(w => w === fromWeek ? toWeek : w) };
      });
      if (!changed) return seq;
      const newSeq = { ...seq, blocks: newBlocks, updatedAt: new Date().toISOString() };
      // Update kursId if moving to different course
      if (toKursId && fromKursId !== toKursId) {
        newSeq.kursId = toKursId;
        if (newSeq.kursIds) {
          newSeq.kursIds = newSeq.kursIds.map(id => id === fromKursId ? toKursId : id);
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
      const [weekW, kursId] = k.split('-');
      const course = courses.find(c => c.id === kursId);
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
    const kursId = COURSES.find(c => c.col === col)?.id;
    const updatedSeqs = state.sequences.map(seq => {
      if (kursId && seq.kursId !== kursId && !(seq.kursIds && seq.kursIds.includes(kursId))) return seq;
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

  // T5: Move entire sequence block together
  moveSequenceBlock: (col, fromWeek, toWeek, allWeekOrder, kursId) => {
    if (fromWeek === toWeek) return;
    const state = get();

    // Find the sequence and block containing fromWeek for this course
    let targetSeqId = '';
    let targetBlockIdx = -1;
    let blockWeeks: string[] = [];

    for (const seq of state.sequences) {
      const matchesCourse = seq.kursId === kursId ||
        (seq.kursIds && seq.kursIds.includes(kursId));
      if (!matchesCourse) continue;
      for (let bi = 0; bi < seq.blocks.length; bi++) {
        if (seq.blocks[bi].weeks.includes(fromWeek)) {
          targetSeqId = seq.id;
          targetBlockIdx = bi;
          blockWeeks = [...seq.blocks[bi].weeks];
          break;
        }
      }
      if (targetSeqId) break;
    }

    // Not in a sequence or single-week block → no-op (caller falls back to single move)
    if (!targetSeqId || blockWeeks.length <= 1) return;

    // Calculate offset in allWeekOrder
    const fromIdx = allWeekOrder.indexOf(fromWeek);
    const toIdx = allWeekOrder.indexOf(toWeek);
    if (fromIdx < 0 || toIdx < 0) return;
    const offset = toIdx - fromIdx;
    if (offset === 0) return;

    // Calculate new positions for all block weeks
    const weekDataMap = new Map(state.weekData.map(w => [w.w, w]));
    const blockWeekSet = new Set(blockWeeks);
    const weekMapping: { from: string; to: string }[] = [];

    for (const bw of blockWeeks) {
      const bwIdx = allWeekOrder.indexOf(bw);
      if (bwIdx < 0) return;
      const newIdx = bwIdx + offset;
      if (newIdx < 0 || newIdx >= allWeekOrder.length) return; // out of bounds
      const targetW = allWeekOrder[newIdx];
      // Check: target is a holiday/event not in our block → abort
      const tw = weekDataMap.get(targetW);
      const te = tw?.lessons[col];
      if (te && (te.type === 5 || te.type === 6) && !blockWeekSet.has(targetW)) return;
      weekMapping.push({ from: bw, to: targetW });
    }

    state.pushUndo();

    // Collect block entries + details
    const blockEntries = new Map<string, LessonEntry>();
    const blockDetailMap = new Map<string, LessonDetail>();
    for (const bw of blockWeeks) {
      const w = weekDataMap.get(bw);
      if (w?.lessons[col]) blockEntries.set(bw, w.lessons[col]);
      const dk = `${bw}-${col}`;
      if (state.lessonDetails[dk]) blockDetailMap.set(bw, state.lessonDetails[dk]);
    }

    // Collect displaced entries at target positions (not part of current block)
    const displacedEntries: { entry: LessonEntry; detail?: LessonDetail }[] = [];
    for (const { to } of weekMapping) {
      if (blockWeekSet.has(to)) continue;
      const w = weekDataMap.get(to);
      if (w?.lessons[col]?.title) {
        displacedEntries.push({
          entry: w.lessons[col],
          detail: state.lessonDetails[`${to}-${col}`],
        });
      }
    }

    // Build new weekData
    const newWeekData = state.weekData.map(w => ({ ...w, lessons: { ...w.lessons } }));
    const newWeekMap = new Map(newWeekData.map(w => [w.w, w]));

    // Clear all block source positions
    for (const bw of blockWeeks) {
      const week = newWeekMap.get(bw);
      if (week) delete week.lessons[col];
    }

    // Place block entries at new positions
    for (const { from, to } of weekMapping) {
      const entry = blockEntries.get(from);
      if (entry) {
        const week = newWeekMap.get(to);
        if (week) week.lessons[col] = { ...entry };
      }
    }

    // Place displaced entries into vacated block positions
    const targetWeekSet = new Set(weekMapping.map(m => m.to));
    const vacated = blockWeeks.filter(bw => !targetWeekSet.has(bw));
    for (let i = 0; i < displacedEntries.length && i < vacated.length; i++) {
      const week = newWeekMap.get(vacated[i]);
      if (week) week.lessons[col] = { ...displacedEntries[i].entry };
    }

    // Update lesson details
    const newDetails = { ...state.lessonDetails };
    for (const bw of blockWeeks) delete newDetails[`${bw}-${col}`];
    for (const { from, to } of weekMapping) {
      const d = blockDetailMap.get(from);
      if (d) newDetails[`${to}-${col}`] = d;
    }
    // Displaced details → vacated positions
    for (let i = 0; i < displacedEntries.length && i < vacated.length; i++) {
      const d = displacedEntries[i].detail;
      if (d) newDetails[`${vacated[i]}-${col}`] = d;
    }

    // Update sequences: remap block weeks
    const newBlockWeeks = weekMapping.map(m => m.to);
    const updatedSeqs = state.sequences.map(seq => {
      if (seq.id !== targetSeqId) return seq;
      return {
        ...seq,
        blocks: seq.blocks.map((b, idx) =>
          idx === targetBlockIdx ? { ...b, weeks: newBlockWeeks } : b
        ),
        updatedAt: new Date().toISOString(),
      };
    });

    set({ weekData: newWeekData, lessonDetails: newDetails, sequences: updatedSeqs });
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
});
