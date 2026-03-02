import { useMemo } from 'react';
import { COURSES, getLinkedCourseIds as staticGetLinkedCourseIds } from '../data/courses';
import { WEEKS, S2_START_INDEX } from '../data/weeks';
import { configToCourses, loadSettings } from '../store/settingsStore';
import { usePlannerStore } from '../store/plannerStore';
import { useInstanceStore, generateWeekIds } from '../store/instanceStore';
import type { Course, Week } from '../types';

/**
 * Determine the current ISO week number.
 */
function getCurrentISOWeek(): string {
  const now = new Date();
  const jan4 = new Date(now.getFullYear(), 0, 4);
  const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / 86400000) + 1;
  const dayOfWeek = jan4.getDay() || 7;
  const weekNum = Math.ceil((dayOfYear + dayOfWeek - 1) / 7);
  return String(Math.max(1, Math.min(53, weekNum))).padStart(2, '0');
}

/**
 * Hook that returns courses and weeks.
 * 
 * Settings source priority:
 * 1. plannerSettings in store (per-instance, new system)
 * 2. global localStorage settings (legacy, migration path)
 * 3. hardcoded COURSES/WEEKS (legacy fallback)
 */
export function usePlannerData() {
  const activeMeta = useInstanceStore(s => s.getActive());
  const storeSettings = usePlannerStore(s => s.plannerSettings);
  
  // Fall back to global settings for legacy planners only
  const globalSettings = useMemo(() => loadSettings(), []);
  
  // Determine if this is a legacy planner (no store settings + default range or no instance)
  const isLegacyPlanner = useMemo(() => {
    if (!activeMeta) return true;
    if (storeSettings) return false; // has per-instance settings → not legacy
    const isDefaultRange = activeMeta.startWeek === 33 && activeMeta.startYear === 2025
      && activeMeta.endWeek === 27 && activeMeta.endYear === 2026;
    return isDefaultRange && !storeSettings && globalSettings !== null;
  }, [activeMeta, storeSettings, globalSettings]);

  const settings = storeSettings ?? (isLegacyPlanner ? globalSettings : null);
  const hasCustomCourses = settings !== null && settings.courses.length > 0;

  // === Courses ===
  // Legacy planners: fall back to hardcoded COURSES
  // New planners without settings: empty (no courses until configured)
  const courses: Course[] = useMemo(() => {
    if (hasCustomCourses && settings) {
      return configToCourses(settings.courses);
    }
    if (isLegacyPlanner) return COURSES;
    return []; // new planner, no courses configured yet
  }, [settings, hasCustomCourses, isLegacyPlanner]);

  // === Weeks ===
  const { weeks, s2StartIndex } = useMemo(() => {
    if (!activeMeta) {
      return { weeks: WEEKS, s2StartIndex: settings?.semesterBreak ?? S2_START_INDEX };
    }

    if (isLegacyPlanner && WEEKS.length > 0) {
      // Legacy planner — use static WEEKS with hardcoded lesson data
      return { weeks: WEEKS, s2StartIndex: settings?.semesterBreak ?? S2_START_INDEX };
    }

    // Dynamic weeks from instance metadata
    const weekIds = generateWeekIds(
      activeMeta.startWeek, activeMeta.startYear,
      activeMeta.endWeek, activeMeta.endYear
    );
    const dynamicWeeks: Week[] = weekIds.map(w => ({ w, lessons: {} }));

    // S2 start index from semesterBreakWeek
    const breakWeek = String(activeMeta.semesterBreakWeek ?? 7).padStart(2, '0');
    const breakIdx = weekIds.indexOf(breakWeek);
    const s2Idx = breakIdx >= 0 ? breakIdx : Math.floor(weekIds.length / 2);

    return { weeks: dynamicWeeks, s2StartIndex: s2Idx };
  }, [activeMeta, settings, isLegacyPlanner]);

  const currentWeek = useMemo(() => getCurrentISOWeek(), []);

  // === Linked course IDs ===
  const getLinkedCourseIds = useMemo(() => {
    if (!hasCustomCourses) return staticGetLinkedCourseIds;
    return (courseId: string): string[] => {
      const course = courses.find(c => c.id === courseId);
      if (!course) return [courseId];
      return courses
        .filter(c => c.cls === course.cls && c.typ === course.typ)
        .map(c => c.id);
    };
  }, [courses, hasCustomCourses]);

  return { courses, weeks, s2StartIndex, currentWeek, getLinkedCourseIds, hasCustomCourses, isLegacy: isLegacyPlanner };
}
