/**
 * Noten-Vorgaben-Tracking (MiSDV Art. 4)
 *
 * Prüft ob die Mindestanzahl Leistungsbeurteilungen pro Kursgruppe eingehalten wird.
 * Regeln gemäss Beurteilung_Notengebung.md:
 *
 * GYM1:
 *   - Standortbestimmung (Nov): mind. 1 Note/Fach
 *   - Semesterzeugnis (Ende Sem1): mind. 2 Noten/Fach
 *   - Jahreszeugnis (Ende SJ): ≤3L → mind. 3, >3L → mind. 4
 *
 * GYM2–4:
 *   - Zwischenbericht (Sem1): mind. 1 Note/Fach
 *   - Jahreszeugnis (Ende SJ): ≤3L → mind. 3, >3L → mind. 4
 */

import type { Course, Week, LessonDetail } from '../types';
import type { AssessmentRule } from '../store/settingsStore';

// Current school year: Maturjahrgang → GYM-Stufe in SJ 25/26
// 29 → GYM1, 28 → GYM2, 27 → GYM3, 26 → GYM4

export type GymStufe = 'GYM1' | 'GYM2' | 'GYM3' | 'GYM4' | 'GYM5' | 'UNKNOWN';

/**
 * Derive GYM level from class name and school year.
 * Class names like "29c", "28bc29fs", "27a28f" — extract the lowest number.
 * For SJ 25/26: Matura 2029 = GYM1, 2028 = GYM2, 2027 = GYM3, 2026 = GYM4
 */
export function getGymStufe(cls: string, maturaYear?: number): GymStufe {
  // Extract first 2-digit number from class name
  const match = cls.match(/(\d{2})/);
  if (!match) return 'UNKNOWN';
  const mj = parseInt(match[1], 10) + 2000; // e.g. 29 → 2029

  // Default: SJ 25/26 means GYM1 graduates in 2029
  // maturaYear param allows override for different school years
  const sjEndYear = maturaYear ?? 2026; // End year of current school year

  const diff = mj - sjEndYear;
  if (diff === 3) return 'GYM1';
  if (diff === 2) return 'GYM2';
  if (diff === 1) return 'GYM3';
  if (diff === 0) return 'GYM4';
  if (diff === -1) return 'GYM5'; // TaF 5th year
  return 'UNKNOWN';
}

export interface GradeRequirement {
  label: string;
  deadline: string; // descriptive, e.g. "Ende Semester 1"
  minGrades: number;
  semester: 1 | 2 | 'year' | 'custom';
}

/**
 * Get grade requirements for a course group based on GYM level and weekly lessons.
 */
export function getGradeRequirements(gymStufe: GymStufe, weeklyLessons: number): GradeRequirement[] {
  if (gymStufe === 'GYM1') {
    return [
      { label: 'Standortbestimmung (Nov)', deadline: 'KW 45', minGrades: 1, semester: 1 },
      { label: 'Semesterzeugnis', deadline: 'Ende Semester 1', minGrades: 2, semester: 1 },
      { label: 'Jahreszeugnis', deadline: 'Ende Schuljahr', minGrades: weeklyLessons > 3 ? 4 : 3, semester: 'year' },
    ];
  }
  // GYM2–GYM5
  return [
    { label: 'Zwischenbericht', deadline: 'Ende Semester 1', minGrades: 1, semester: 1 },
    { label: 'Jahreszeugnis', deadline: 'Ende Schuljahr', minGrades: weeklyLessons > 3 ? 4 : 3, semester: 'year' },
  ];
}

export interface GradeWarning {
  courseGroup: string; // e.g. "29c SF"
  gymStufe: GymStufe;
  requirement: GradeRequirement;
  currentCount: number;
  weeklyLessons: number;
  status: 'ok' | 'warning' | 'critical';
  message: string;
}

/**
 * Count assessments in weekData for a set of course columns.
 * An assessment is: blockCategory === 'ASSESSMENT' in lessonDetails,
 * OR LessonEntry.type === 4 (exam) in weekData.
 */
export function countAssessments(
  weekData: Week[],
  lessonDetails: Record<string, LessonDetail>,
  kursIds: string[],
  courses: Course[],
  semesterFilter: 1 | 2 | 'year' | 'custom',
  s2StartIndex: number
): number {
  const courseCols = kursIds
    .map(id => courses.find(c => c.id === id))
    .filter(Boolean)
    .map(c => c!.col);

  let count = 0;

  weekData.forEach((week, weekIdx) => {
    // Semester filter
    if (semesterFilter === 1 && weekIdx >= s2StartIndex) return;
    if (semesterFilter === 2 && weekIdx < s2StartIndex) return;

    Object.entries(week.lessons).forEach(([colStr, lesson]) => {
      const col = Number(colStr);
      if (!courseCols.includes(col)) return;
      if (!lesson || !lesson.title) return;

      // Check lessonDetails for blockCategory
      const detailKey = `${week.w}-${col}`;
      const detail = lessonDetails[detailKey];

      if (detail?.blockCategory === 'ASSESSMENT') {
        count++;
        return;
      }

      // Fallback: LessonEntry.type === 4 (exam legacy)
      if (lesson.type === 4) {
        count++;
      }
    });
  });

  return count;
}

export interface CourseGroupInfo {
  key: string; // "29c-SF"
  cls: string;
  typ: string;
  kursIds: string[];
  weeklyLessons: number; // total lessons per week across all days
  gymStufe: GymStufe;
}

/**
 * Group courses by class + type and compute weekly lessons.
 */
export function getCourseGroups(courses: Course[]): CourseGroupInfo[] {
  const groups = new Map<string, CourseGroupInfo>();

  courses.forEach(c => {
    const key = `${c.cls}-${c.typ}`;
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        cls: c.cls,
        typ: c.typ,
        kursIds: [],
        weeklyLessons: 0,
        gymStufe: getGymStufe(c.cls),
      });
    }
    const g = groups.get(key)!;
    if (!g.kursIds.includes(c.id)) {
      g.kursIds.push(c.id);
      g.weeklyLessons += c.les;
    }
  });

  return Array.from(groups.values());
}

/**
 * Convert custom AssessmentRule[] into GradeRequirement[] for a specific group.
 */
function customRulesToRequirements(rules: AssessmentRule[], gymStufe: GymStufe, weeklyLessons: number): GradeRequirement[] {
  return rules
    .filter(r => {
      if (r.stufe && r.stufe !== gymStufe) return false;
      if (r.weeklyLessonsThreshold !== undefined && weeklyLessons <= r.weeklyLessonsThreshold) return false;
      return true;
    })
    .map(r => ({
      label: r.label,
      deadline: r.deadline,
      minGrades: r.minGrades,
      semester: r.semester,
    }));
}

/**
 * Check all grade requirements for all course groups.
 * Returns warnings sorted by severity.
 * Accepts optional custom assessment rules from settings.
 */
export function checkGradeRequirements(
  weekData: Week[],
  lessonDetails: Record<string, LessonDetail>,
  courses: Course[],
  s2StartIndex: number,
  customRules?: AssessmentRule[]
): GradeWarning[] {
  const groups = getCourseGroups(courses);
  const warnings: GradeWarning[] = [];

  groups.forEach(group => {
    if (group.gymStufe === 'UNKNOWN') return;

    const requirements = customRules && customRules.length > 0
      ? customRulesToRequirements(customRules, group.gymStufe, group.weeklyLessons)
      : getGradeRequirements(group.gymStufe, group.weeklyLessons);

    requirements.forEach(req => {
      const count = countAssessments(
        weekData, lessonDetails, group.kursIds, courses,
        req.semester, s2StartIndex
      );

      let status: 'ok' | 'warning' | 'critical';
      let message: string;

      if (count >= req.minGrades) {
        status = 'ok';
        message = `${count}/${req.minGrades} Beurteilungen geplant ✓`;
      } else if (count >= req.minGrades - 1) {
        status = 'warning';
        message = `${count}/${req.minGrades} Beurteilungen — noch ${req.minGrades - count} nötig (${req.label})`;
      } else {
        status = 'critical';
        message = `${count}/${req.minGrades} Beurteilungen — ${req.minGrades - count} fehlen! (${req.label})`;
      }

      warnings.push({
        courseGroup: `${group.cls} ${group.typ}`,
        gymStufe: group.gymStufe,
        requirement: req,
        currentCount: count,
        weeklyLessons: group.weeklyLessons,
        status,
        message,
      });
    });
  });

  // Sort: critical first, then warning, then ok
  warnings.sort((a, b) => {
    const order = { critical: 0, warning: 1, ok: 2 };
    return order[a.status] - order[b.status];
  });

  return warnings;
}
