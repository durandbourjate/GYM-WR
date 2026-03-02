/**
 * Instance Store — Multi-Planner Management
 * 
 * Manages multiple independent planner instances.
 * Each instance gets its own localStorage key for planner data.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface PlannerMeta {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  // Time range
  startWeek: number;     // e.g. 33
  startYear: number;     // e.g. 2025
  endWeek: number;       // e.g. 27
  endYear: number;       // e.g. 2026
  semesterBreakWeek?: number; // e.g. 7 (KW where S2 starts)
}

interface InstanceState {
  instances: PlannerMeta[];
  activeId: string | null;

  // Actions
  createInstance: (name: string, opts?: Partial<PlannerMeta>) => string;
  deleteInstance: (id: string) => void;
  renameInstance: (id: string, name: string) => void;
  setActive: (id: string) => void;
  updateMeta: (id: string, updates: Partial<PlannerMeta>) => void;
  getActive: () => PlannerMeta | null;

  // Import/Export
  exportInstance: (id: string) => string | null;
  importInstance: (json: string) => string | null;
}

function generateId(): string {
  return 'p_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

/** Storage key for a planner instance's data */
export function instanceStorageKey(id: string): string {
  return `planner-data-${id}`;
}

/** Generate week IDs for a school year range */
export function generateWeekIds(startWeek: number, startYear: number, endWeek: number, endYear: number): string[] {
  const weeks: string[] = [];
  let currentWeek = startWeek;
  let currentYear = startYear;

  while (true) {
    weeks.push(String(currentWeek).padStart(2, '0'));

    if (currentWeek === endWeek && currentYear === endYear) break;

    // Get max weeks in current year (ISO 8601: most years have 52, some have 53)
    const maxWeek = getISOWeeksInYear(currentYear);
    currentWeek++;
    if (currentWeek > maxWeek) {
      currentWeek = 1;
      currentYear++;
    }

    // Safety: prevent infinite loop
    if (weeks.length > 60) break;
  }

  return weeks;
}

function getISOWeeksInYear(year: number): number {
  // A year has 53 weeks if Jan 1 is Thursday, or Dec 31 is Thursday
  const jan1 = new Date(year, 0, 1);
  const dec31 = new Date(year, 11, 31);
  return (jan1.getDay() === 4 || dec31.getDay() === 4) ? 53 : 52;
}

/** Get the Monday date for a given ISO week */
export function weekToDate(week: number, year: number): Date {
  const jan4 = new Date(year, 0, 4);
  const dayOfWeek = jan4.getDay() || 7;
  const monday = new Date(jan4);
  monday.setDate(jan4.getDate() - dayOfWeek + 1 + (week - 1) * 7);
  return monday;
}

/** Format a week range as readable string */
export function formatWeekRange(meta: PlannerMeta): string {
  return `KW${meta.startWeek}/${meta.startYear} – KW${meta.endWeek}/${meta.endYear}`;
}

export const useInstanceStore = create<InstanceState>()(
  persist(
    (set, get) => ({
      instances: [],
      activeId: null,

      createInstance: (name, opts) => {
        const id = generateId();
        const now = new Date().toISOString();
        const meta: PlannerMeta = {
          id,
          name,
          createdAt: now,
          updatedAt: now,
          startWeek: opts?.startWeek ?? 33,
          startYear: opts?.startYear ?? new Date().getFullYear(),
          endWeek: opts?.endWeek ?? 27,
          endYear: opts?.endYear ?? new Date().getFullYear() + 1,
          semesterBreakWeek: opts?.semesterBreakWeek ?? 7,
          ...opts,
        };
        set(state => ({
          instances: [...state.instances, meta],
          activeId: id,
        }));
        return id;
      },

      deleteInstance: (id) => {
        // Remove data from localStorage
        localStorage.removeItem(instanceStorageKey(id));
        set(state => {
          const remaining = state.instances.filter(i => i.id !== id);
          return {
            instances: remaining,
            activeId: state.activeId === id
              ? (remaining[0]?.id ?? null)
              : state.activeId,
          };
        });
      },

      renameInstance: (id, name) => {
        set(state => ({
          instances: state.instances.map(i =>
            i.id === id ? { ...i, name, updatedAt: new Date().toISOString() } : i
          ),
        }));
      },

      setActive: (id) => set({ activeId: id }),

      updateMeta: (id, updates) => {
        set(state => ({
          instances: state.instances.map(i =>
            i.id === id ? { ...i, ...updates, updatedAt: new Date().toISOString() } : i
          ),
        }));
      },

      getActive: () => {
        const { instances, activeId } = get();
        return instances.find(i => i.id === activeId) ?? null;
      },

      exportInstance: (id) => {
        const meta = get().instances.find(i => i.id === id);
        if (!meta) return null;
        const dataStr = localStorage.getItem(instanceStorageKey(id));
        const data = dataStr ? JSON.parse(dataStr) : {};
        return JSON.stringify({ meta, data }, null, 2);
      },

      importInstance: (json) => {
        try {
          const parsed = JSON.parse(json);
          if (!parsed.meta?.name) return null;

          const id = generateId();
          const now = new Date().toISOString();
          const meta: PlannerMeta = {
            ...parsed.meta,
            id,
            createdAt: now,
            updatedAt: now,
          };

          // Store the planner data
          if (parsed.data) {
            localStorage.setItem(instanceStorageKey(id), JSON.stringify(parsed.data));
          }

          set(state => ({
            instances: [...state.instances, meta],
            activeId: id,
          }));

          return id;
        } catch (e) {
          console.error('Import failed:', e);
          return null;
        }
      },
    }),
    {
      name: 'unterrichtsplaner-instances',
      onRehydrateStorage: () => {
        // Called after zustand has loaded persisted state from localStorage
        return () => migrateIfLegacy();
      },
    }
  )
);

// === Auto-migration: Legacy data → Instance ===
// If no instances exist but legacy data is present in 'unterrichtsplaner-storage',
// create a default instance pointing to that data.
function migrateIfLegacy() {
  const state = useInstanceStore.getState();
  if (state.instances.length > 0) return; // already has instances

  const legacyRaw = localStorage.getItem('unterrichtsplaner-storage');
  if (!legacyRaw) return; // no legacy data

  try {
    const parsed = JSON.parse(legacyRaw);
    const hasData = parsed.state?.weekData?.length > 0 || parsed.weekData?.length > 0;
    if (!hasData) return; // empty legacy data, skip

    // Create a legacy instance
    const id = generateId();
    const now = new Date().toISOString();
    const meta: PlannerMeta = {
      id,
      name: 'SJ 25/26',
      createdAt: now,
      updatedAt: now,
      startWeek: 33,
      startYear: 2025,
      endWeek: 27,
      endYear: 2026,
      semesterBreakWeek: 7,
    };

    // Copy legacy data to instance slot
    localStorage.setItem(instanceStorageKey(id), legacyRaw);

    useInstanceStore.setState({
      instances: [meta],
      activeId: id,
    });

    console.log('[Migration] Legacy planner data migrated to instance:', id);
  } catch (e) {
    console.error('[Migration] Failed to migrate legacy data:', e);
  }
}
