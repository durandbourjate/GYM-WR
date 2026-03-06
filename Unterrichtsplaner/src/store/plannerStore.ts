import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { INITIAL_LESSON_DETAILS } from '../data/initialLessonDetails';
import { instanceStorageKey, generateWeekIds, useInstanceStore } from './instanceStore';
import { createUISlice, type UISlice } from './slices/uiSlice';
import { createCollectionSlice, type CollectionSlice } from './slices/collectionSlice';
import { createSequenceSlice, type SequenceSlice } from './slices/sequenceSlice';
import { createDataSlice, type DataSlice } from './slices/dataSlice';

// Re-export Slice-Typen für Konsumenten
export type { UISlice, DataSlice, SequenceSlice, CollectionSlice };

// v3.91 N3: Zoom-Stufen für Spaltenbreite und Schriftgrösse
// v3.97: Referenz auf 12 angehoben, Schritte ~15% statt ~10%
export const ZOOM_LEVELS = [
  { colWidth: 120, fontSize: 10 },  // Stufe 1 (min)  — war 9
  { colWidth: 160, fontSize: 11 },  // Stufe 2         — war 10
  { colWidth: 200, fontSize: 12 },  // Stufe 3 (default) — war 11
  { colWidth: 260, fontSize: 14 },  // Stufe 4         — war 12
  { colWidth: 340, fontSize: 16 },  // Stufe 5 (max)   — war 14
] as const;

/** Zoom-Scale Helper: skaliert einen Pixel-Basiswert proportional zur Zoom-Stufe.
 *  Referenz = Stufe 3 (fontSize 12). Bei Stufe 1 ~17% kleiner, Stufe 5 ~33% grösser. */
export function zs(base: number, zoomCfg: typeof ZOOM_LEVELS[number]): number {
  return Math.round(base * zoomCfg.fontSize / 12);
}

// PlannerState = Kombination aller Slices
export type PlannerState = UISlice & DataSlice & SequenceSlice & CollectionSlice;

export const usePlannerStore = create<PlannerState>()(
  persist(
    (...a) => ({
  ...createUISlice(...a),
  ...createCollectionSlice(...a),
  ...createDataSlice(...a),
  ...createSequenceSlice(...a),
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

      // v3.99 V2: Fehlende Wochen ergänzen (z.B. KW 28–32 Sommerferien)
      let weekData = data.weekData || [];
      const meta = useInstanceStore.getState().instances.find(i => i.id === instanceId);
      if (meta && weekData.length > 0) {
        const expected = generateWeekIds(meta.startWeek, meta.startYear, meta.endWeek, meta.endYear);
        const existing = new Set(weekData.map((w: { w: string }) => w.w));
        const missing = expected.filter(wId => !existing.has(wId));
        if (missing.length > 0) {
          weekData = [...weekData, ...missing.map(w => ({ w, lessons: {} as Record<number, never> }))];
          // Sortierung nach erwarteter Reihenfolge
          const order = new Map(expected.map((id, idx) => [id, idx]));
          weekData.sort((a: { w: string }, b: { w: string }) => (order.get(a.w) ?? 999) - (order.get(b.w) ?? 999));
          console.log('[Migration V2] Fehlende Wochen ergänzt:', missing);
        }
      }

      usePlannerStore.setState({
        weekData,
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
