import type { LessonType, SequenceInfo, CourseType, ManagedSequence } from '../types';

export const LESSON_COLORS: Record<LessonType, { bg: string; fg: string; border: string }> = {
  0: { bg: '#eef2f7', fg: '#475569', border: '#cbd5e1' },
  1: { bg: '#dbeafe', fg: '#1e40af', border: '#93c5fd' }, // BWL (blau)
  2: { bg: '#fff7ed', fg: '#9a3412', border: '#fdba74' }, // VWL (orange) — legacy: was Recht/VWL combined
  3: { bg: '#f3f4f6', fg: '#4b5563', border: '#d1d5db' }, // IN (grau)
  4: { bg: '#fee2e2', fg: '#991b1b', border: '#fca5a5' }, // Exam
  5: { bg: '#e5e7eb', fg: '#4b5563', border: '#d1d5db' }, // Event (grau)
  6: { bg: '#ffffff', fg: '#a1a1aa', border: '#e4e4e7' }, // Holiday
};

// SubjectArea-based colors matching LearningView: VWL=orange, BWL=blau, Recht=grün, IN=grau
// Legacy export — still used by WeekRows, HoverPreview etc. for static color lookup.
// For dynamic (per-planner) colors, use usePlannerData().categories + getCategoryColors().
import { WR_CATEGORIES, categoriesToColorMap } from '../data/categories';
export const SUBJECT_AREA_COLORS: Record<string, { bg: string; fg: string; border: string }> = categoriesToColorMap(WR_CATEGORIES);

export const DAY_COLORS: Record<string, string> = {
  Mo: '#818cf8', Di: '#a78bfa', Mi: '#c084fc', Do: '#e879f9', Fr: '#f472b6',
};

export const TYPE_BADGES: Record<CourseType, { bg: string; fg: string }> = {
  SF: { bg: '#16a34a', fg: '#fff' },
  EWR: { bg: '#d97706', fg: '#fff' },
  IN: { bg: '#0ea5e9', fg: '#fff' },
  KS: { bg: '#7c3aed', fg: '#fff' },
  EF: { bg: '#ec4899', fg: '#fff' },
};

// Default sequence colors palette (16 colors for large sequence counts)
export const SEQUENCE_COLORS = [
  '#16a34a', '#0ea5e9', '#d97706', '#7c3aed', '#ec4899',
  '#14b8a6', '#f43f5e', '#8b5cf6', '#eab308', '#06b6d4',
  '#84cc16', '#e11d48', '#2563eb', '#ea580c', '#4f46e5', '#0d9488',
];

export function getSequenceInfoFromStore(
  courseId: string,
  weekW: string,
  sequences: ManagedSequence[]
): SequenceInfo | null {
  for (const seq of sequences) {
    // Match primary courseId OR any in courseIds array
    const matchesCourse = seq.courseId === courseId ||
      (seq.courseIds && seq.courseIds.includes(courseId));
    if (!matchesCourse) continue;
    for (const block of seq.blocks) {
      const idx = block.weeks.indexOf(weekW);
      if (idx >= 0) {
        return {
          sequenceId: seq.id,
          label: block.label,
          index: idx,
          total: block.weeks.length,
          isFirst: idx === 0,
          isLast: idx === block.weeks.length - 1,
          color: seq.color,
        };
      }
    }
  }
  return null;
}

export function isPastWeek(w: string, current: string): boolean {
  const n = parseInt(w);
  const c = parseInt(current);
  // School year runs w33-w32: weeks 33+ are in year 1, weeks 01-32 in year 2
  if (n >= 33) return c >= 33 ? n < c : true;  // both in Y1, or current is in Y2
  if (c >= 33) return false;                     // week in Y2, current in Y1
  return n < c;                                   // both in Y2
}
