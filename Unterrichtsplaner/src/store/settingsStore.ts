import type { Course, CourseType, DayOfWeek, Semester } from '../types';
import { COURSES } from '../data/courses';
import { WEEKS, S2_START_INDEX } from '../data/weeks';

// === Settings Types ===
export type SchoolLevel = 'Grundstufe' | 'Sek1' | 'Sek2' | 'Berufsbildung' | 'Hochschule';

export const STUFE_OPTIONS: Record<SchoolLevel, { key: string; label: string }[]> = {
  Sek2: [
    { key: 'GYM1', label: 'GYM1' }, { key: 'GYM2', label: 'GYM2' },
    { key: 'GYM3', label: 'GYM3' }, { key: 'GYM4', label: 'GYM4' },
    { key: 'GYM5', label: 'GYM5 (TaF)' },
  ],
  Sek1: [
    { key: '7. Klasse', label: '7. Klasse' }, { key: '8. Klasse', label: '8. Klasse' },
    { key: '9. Klasse', label: '9. Klasse' },
  ],
  Grundstufe: [
    { key: '1. Klasse', label: '1. Kl.' }, { key: '2. Klasse', label: '2. Kl.' },
    { key: '3. Klasse', label: '3. Kl.' }, { key: '4. Klasse', label: '4. Kl.' },
    { key: '5. Klasse', label: '5. Kl.' }, { key: '6. Klasse', label: '6. Kl.' },
  ],
  Berufsbildung: [
    { key: '1. Lehrjahr', label: '1. LJ' }, { key: '2. Lehrjahr', label: '2. LJ' },
    { key: '3. Lehrjahr', label: '3. LJ' }, { key: '4. Lehrjahr', label: '4. LJ' },
  ],
  Hochschule: [
    { key: '1. Semester', label: '1. Sem.' }, { key: '2. Semester', label: '2. Sem.' },
    { key: '3. Semester', label: '3. Sem.' }, { key: '4. Semester', label: '4. Sem.' },
    { key: '5. Semester', label: '5. Sem.' }, { key: '6. Semester', label: '6. Sem.' },
  ],
};

export interface AssessmentRule {
  label: string;           // e.g. "Standortbestimmung (Nov)"
  deadline: string;        // descriptive, e.g. "Ende Semester 1" or "2026-03-15"
  minGrades: number;       // minimum number of assessments
  semester: 1 | 2 | 'year' | 'custom'; // when this rule applies
  stufe?: string;          // which GYM level, e.g. 'GYM1' — undefined = all
  weeklyLessonsThreshold?: number; // only apply if weekly lessons > threshold
  minGradesAboveThreshold?: number; // min grades when weekly lessons > threshold (v3.77 #11)
  customDate?: string;     // ISO date for 'custom' semester (v3.77 #11)
}

export interface PlannerSettings {
  version: number;
  schoolLevel?: SchoolLevel;
  school?: {
    name: string;
    lessonDurationMin: number; // default 45
  };
  subjects: SubjectConfig[];
  courses: CourseConfig[];
  specialWeeks: SpecialWeekConfig[];
  holidays: HolidayConfig[];
  semesterBreak: number; // week index where S2 starts
  stoffverteilung?: StoffverteilungEntry[];
  curriculumGoals?: import('../data/curriculumGoals').CurriculumGoal[];
  assessmentRules?: AssessmentRule[];
}

export interface StoffverteilungEntry {
  semester: string; // e.g. 'S1'
  gym: string;      // e.g. 'GYM1'
  weights: Record<string, number>; // subjectKey -> weight, e.g. { BWL: 3, VWL: 0, RECHT: 1 }
}

export interface SubjectConfig {
  id: string;
  label: string;
  shortLabel: string;
  color: string;
  courseType: CourseType;
}

export interface CourseConfig {
  id: string;
  col?: number;  // v3.86 I1-P1: explizite Spalten-ID (aus JSON-Konfiguration)
  cls: string;
  typ: CourseType;
  day: DayOfWeek;
  from: string;
  to: string;
  les: number;
  hk: boolean;
  semesters: Semester[];
  note?: string;
  sol?: boolean;
  stufe?: string; // GYM1–GYM5, 7.–9. Klasse, 1.–6. Klasse
}

export interface SpecialWeekConfig {
  id: string;
  label: string;
  week: string; // KW
  type: 'event' | 'holiday';
  gymLevel?: string | string[]; // 'GYM1'|'GYM2'|... | string[] — undefined = alle (J5: Mehrfachauswahl)
  excludedCourseIds?: string[]; // courses NOT affected (default: all affected)
  days?: number[]; // 1=Mo..5=Fr, undefined = all days
  courseFilter?: string[]; // v3.82 E7: Array von Kurs-IDs; undefined/leer = alle Kurse sichtbar
}

export interface HolidayConfig {
  id: string;
  label: string;
  startWeek: string;
  endWeek: string;
  days?: number[]; // 1=Mo..5=Fr, undefined = all days (for partial holidays like Auffahrt)
}

// === Legacy Migration (v3.86 I1-P4) ===
/** Ältere HolidayConfigs ohne days-Feld: bekannte Einzel-Tag-Feiertage heuristisch ergänzen */
export function migrateLegacyHoliday(h: HolidayConfig): HolidayConfig {
  if (h.days !== undefined) return h; // bereits korrekt
  if (h.startWeek === h.endWeek) {
    const label = h.label.toLowerCase();
    if (label.includes('auffahrt')) return { ...h, days: [4] }; // Donnerstag
    if (label.includes('pfingstmontag')) return { ...h, days: [1] }; // Montag
    if (label.includes('1. august') || label.includes('bundesfeier')) return { ...h, days: [1] };
    if (label.includes('neujahr')) return { ...h, days: [1] };
    if (label.includes('berchtoldstag')) return { ...h, days: [2] };
  }
  return h;
}

/** Alle Holidays in einem Settings-Objekt migrieren */
export function migrateHolidays(holidays: HolidayConfig[]): HolidayConfig[] {
  return holidays.map(migrateLegacyHoliday);
}

// === Persistence ===
const SETTINGS_KEY = 'unterrichtsplaner-settings';

// No default subjects — user configures their own (avoids school-specific hardcoding)
const DEFAULT_SUBJECTS: SubjectConfig[] = [];

export function loadSettings(): PlannerSettings | null {
  try {
    const data = localStorage.getItem(SETTINGS_KEY);
    if (!data) return null;
    const parsed = JSON.parse(data) as PlannerSettings;
    // v3.86 I1-P4: Legacy-Holidays migrieren
    if (parsed.holidays) parsed.holidays = migrateHolidays(parsed.holidays);
    return parsed;
  } catch { return null; }
}

export function saveSettings(settings: PlannerSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function getDefaultSettings(): PlannerSettings {
  return {
    version: 1,
    school: { name: '', lessonDurationMin: 45 },
    subjects: [...DEFAULT_SUBJECTS],
    courses: [],
    specialWeeks: [],
    holidays: [],
    semesterBreak: 26,
  };
}

// Convert CourseConfig[] to Course[] (for use with existing planner logic)
// v3.86 I1-P1: bevorzuge explizites col-Feld aus Konfiguration
export function configToCourses(configs: CourseConfig[]): Course[] {
  return configs.map((c, i) => ({
    id: c.id,
    col: c.col ?? (100 + i), // bevorzuge explizites col-Feld, Fallback 100+
    cls: c.cls,
    typ: c.typ,
    day: c.day,
    from: c.from,
    to: c.to,
    les: c.les as 1 | 2 | 3,
    hk: c.hk,
    semesters: c.semesters,
    note: c.note,
    stufe: c.stufe, // v3.80 C5
  }));
}

// Generate a unique ID
export function generateId(): string {
  return 'c' + Math.random().toString(36).slice(2, 8);
}

// Import current hardcoded courses into settings
export function importCurrentCourses(): CourseConfig[] {
  return COURSES.map(c => ({
    id: c.id,
    cls: c.cls,
    typ: c.typ,
    day: c.day,
    from: c.from,
    to: c.to,
    les: c.les,
    hk: c.hk,
    semesters: [...c.semesters],
    note: c.note,
  }));
}

// Detect holidays from current WEEKS data (weeks where all entries are type 6)
export function importCurrentHolidays(): HolidayConfig[] {
  const holidays: HolidayConfig[] = [];
  let currentHoliday: { label: string; startWeek: string; endWeek: string } | null = null;

  for (const week of WEEKS) {
    const entries = Object.values(week.lessons);
    const allHoliday = entries.length > 0 && entries.every(e => e.type === 6);
    if (allHoliday) {
      const label = entries[0]?.title || 'Ferien';
      if (currentHoliday && currentHoliday.label === label) {
        currentHoliday.endWeek = week.w;
      } else {
        if (currentHoliday) holidays.push({ id: generateId(), ...currentHoliday });
        currentHoliday = { label, startWeek: week.w, endWeek: week.w };
      }
    } else {
      if (currentHoliday) holidays.push({ id: generateId(), ...currentHoliday });
      currentHoliday = null;
    }
  }
  if (currentHoliday) holidays.push({ id: generateId(), ...currentHoliday });
  return holidays;
}

// Detect special weeks from current WEEKS data (weeks where all entries are type 5 or type 6 partial)
export function importCurrentSpecialWeeks(): SpecialWeekConfig[] {
  const specials: SpecialWeekConfig[] = [];
  for (const week of WEEKS) {
    const entries = Object.values(week.lessons);
    if (entries.length === 0) continue;
    const allEvent = entries.every(e => e.type === 5);
    if (allEvent) {
      const label = entries[0]?.title || 'Sonderwoche';
      specials.push({ id: generateId(), label, week: week.w, type: 'event' });
      continue;
    }
    // Check for partial holidays (some entries are type 6, not all → single-day holiday in a week)
    const holidays = entries.filter(e => e.type === 6);
    const nonHolidays = entries.filter(e => e.type !== 6);
    if (holidays.length > 0 && nonHolidays.length > 0) {
      // This week has a partial holiday (e.g. Auffahrt on Thursday but other days have lessons)
      const label = holidays[0]?.title || 'Feiertag';
      specials.push({ id: generateId(), label, week: week.w, type: 'holiday' });
    }
  }
  return specials;
}

// Get effective courses: settings if available, else hardcoded
export function getEffectiveCourses(): Course[] {
  const settings = loadSettings();
  if (settings && settings.courses.length > 0) {
    return configToCourses(settings.courses);
  }
  return COURSES;
}

// Get effective S2 start index
export function getEffectiveS2StartIndex(): number {
  const settings = loadSettings();
  if (settings) return settings.semesterBreak;
  return S2_START_INDEX;
}

/**
 * Apply holidays and special weeks from settings to weekData.
 * Returns modified weekData copy + stats. Does NOT modify store directly.
 */
export function applySettingsToWeekData(
  weekData: import('../types').Week[],
  settings: PlannerSettings
): { weekData: import('../types').Week[]; holidayWeeks: number; specialWeeks: number } {
  const result = weekData.map(w => ({ ...w, lessons: { ...w.lessons } }));
  // Build col set from settings courses (same col numbering as configToCourses) (v3.77 #4, v3.86 I1-P1)
  const allCols = new Set<number>();
  for (let i = 0; i < settings.courses.length; i++) {
    allCols.add(settings.courses[i].col ?? (100 + i));
  }
  // Also include any existing cols from weekData (legacy planners)
  for (const w of result) {
    for (const col of Object.keys(w.lessons).map(Number)) {
      allCols.add(col);
    }
  }
  if (allCols.size === 0) return { weekData: result, holidayWeeks: 0, specialWeeks: 0 };

  let holidayWeeks = 0;
  let specialWeeks = 0;

  // Clear existing type-6 (holiday) and type-5 (event) entries before applying settings
  for (const w of result) {
    for (const col of allCols) {
      const entry = w.lessons[col];
      if (entry && (entry.type === 6 || entry.type === 5)) {
        delete w.lessons[col];
      }
    }
  }

  // Helper: expand KW range within weekData order
  const allWeekIds = result.map(w => w.w);
  const expandWeekRange = (start: string, end: string): string[] => {
    const startIdx = allWeekIds.indexOf(start);
    const endIdx = allWeekIds.indexOf(end);
    if (startIdx === -1) return [];
    // Normalfall: endIdx >= startIdx
    if (endIdx !== -1 && endIdx >= startIdx) {
      return allWeekIds.slice(startIdx, endIdx + 1);
    }
    // Jahreswechsel: endIdx < startIdx → bis Ende + ab Anfang (v3.86 I1-P3)
    if (endIdx !== -1 && endIdx < startIdx) {
      return [...allWeekIds.slice(startIdx), ...allWeekIds.slice(0, endIdx + 1)];
    }
    // endIdx nicht im Array → nur startIdx
    return [allWeekIds[startIdx]];
  };

  // G1: Tag-Mapping für Einzel-Tag-Ferien (1=Mo..5=Fr)
  const DAY_TO_NUM: Record<string, number> = { Mo: 1, Di: 2, Mi: 3, Do: 4, Fr: 5 };
  const colToDay = new Map<number, number>();
  for (let i = 0; i < settings.courses.length; i++) {
    const c = settings.courses[i];
    colToDay.set(c.col ?? (100 + i), DAY_TO_NUM[c.day] || 0);
  }

  // Apply holidays (G1: Einzel-Tag-Ferien nur auf passende Tage)
  for (const holiday of settings.holidays) {
    const weeks = expandWeekRange(holiday.startWeek, holiday.endWeek);
    const hasPartialDays = holiday.days && holiday.days.length > 0 && holiday.days.length < 5;
    const holidayDays = hasPartialDays ? new Set(holiday.days) : null;
    for (const weekW of weeks) {
      const weekEntry = result.find(w => w.w === weekW);
      if (!weekEntry) continue;
      for (const col of allCols) {
        // G1: Bei Einzel-Tag-Ferien nur passende Wochentage markieren
        if (holidayDays) {
          const courseDay = colToDay.get(col);
          if (courseDay && !holidayDays.has(courseDay)) continue;
        }
        weekEntry.lessons[col] = { title: holiday.label, type: 6 };
      }
      holidayWeeks++;
    }
  }

  // Build col → courseId mapping for exclusion checks (v3.86 I1-P1: use c.col)
  const colToCourseId = new Map<number, string>();
  for (let i = 0; i < settings.courses.length; i++) {
    const c = settings.courses[i];
    colToCourseId.set(c.col ?? (100 + i), c.id);
  }

  // Build col → CourseConfig lookup for gymLevel filtering (v3.86 I1-P1: use c.col)
  const colToCourse = new Map<number, CourseConfig>();
  for (let i = 0; i < settings.courses.length; i++) {
    const c = settings.courses[i];
    colToCourse.set(c.col ?? (100 + i), c);
  }

  // Apply special weeks (events/partial holidays)
  for (const special of settings.specialWeeks) {
    const weekEntry = result.find(w => w.w === special.week);
    if (!weekEntry) continue;
    const excluded = new Set(special.excludedCourseIds || []);
    // v3.82 E7: courseFilter — nur für bestimmte Kurse sichtbar
    const courseFilterSet = special.courseFilter && special.courseFilter.length > 0
      ? new Set(special.courseFilter)
      : null; // null = alle Kurse
    // J5: gymLevel Mehrfachauswahl — normalisieren zu Array
    const rawLevel = special.gymLevel;
    const levels = !rawLevel ? [] : Array.isArray(rawLevel) ? rawLevel : [rawLevel];
    const hasGymFilter = levels.length > 0 && !(levels.length === 1 && levels[0] === 'alle');

    for (const col of allCols) {
      const courseId = colToCourseId.get(col);
      const course = colToCourse.get(col);

      // Filter 1: gymLevel — Stufe/TaF (J5: Mehrfachauswahl)
      if (hasGymFilter && course) {
        const isTaF = /[fs]/.test(course.cls.replace(/\d/g, ''));
        const matchesAny = levels.some(lv => {
          if (lv === 'TaF') return isTaF;
          if (lv === 'alle') return true;
          return course.stufe === lv;
        });
        if (!matchesAny) continue;
      }

      // Filter 2: courseFilter — explizite Kursliste (v3.82 E7)
      if (courseFilterSet && courseId && !courseFilterSet.has(courseId)) continue;

      // Legacy: excludedCourseIds
      if (courseId && excluded.has(courseId)) continue;

      weekEntry.lessons[col] = {
        title: special.label,
        type: special.type === 'holiday' ? 6 : 5,
      };
    }
    specialWeeks++;
  }

  return { weekData: result, holidayWeeks, specialWeeks };
}
