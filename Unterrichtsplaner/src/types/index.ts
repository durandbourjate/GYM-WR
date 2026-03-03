// Core types for the Unterrichtsplaner

export type CourseType = string; // Previously: 'SF' | 'EWR' | 'EF' | 'KS' | 'IN'; now flexible (v3.76 #1)
export type DayOfWeek = 'Mo' | 'Di' | 'Mi' | 'Do' | 'Fr';
export type LessonType = 0 | 1 | 2 | 3 | 4 | 5 | 6;
// 0=other, 1=BWL, 2=Recht/VWL, 3=IN, 4=exam, 5=event, 6=holiday

export type Semester = 1 | 2;

export interface Course {
  id: string;
  col: number;           // Excel column reference
  cls: string;           // Class name (e.g. "29c", "28bc29fs")
  typ: CourseType;
  day: DayOfWeek;
  from: string;          // Start time "09:00"
  to: string;            // End time "09:45"
  les: 1 | 2 | 3;       // Number of lessons
  hk: boolean;           // Is Halbklasse?
  semesters: Semester[];  // Active in which semesters
  note?: string;         // Additional info
}

export interface LessonEntry {
  title: string;
  type: LessonType;
}

export interface Week {
  w: string;             // Week number as string (e.g. "33", "01")
  lessons: Record<number, LessonEntry>; // col -> entry
}

export interface SequenceBlock {
  weeks: string[];
  label: string;
  // Block-level details (inherited as defaults by contained tiles)
  topicMain?: string;
  topicSub?: string;
  subjectArea?: SubjectArea;
  curriculumGoal?: string;
  description?: string;
  materialLinks?: string[];
}

/** Legacy static format (for migration) */
export interface Sequence {
  weeks: string[];
  label: string;
}

/** Managed sequence with CRUD capabilities */
export interface ManagedSequence {
  id: string;
  courseId: string;         // Primary course (backward compat)
  courseIds?: string[];      // All linked courses (multi-day: e.g. ["c11","c31"] for 29c SF Di+Do)
  multiDayMode?: 'alternating' | 'separate'; // alternating=Di-Do-Di-Do, separate=Di-Di-Di/Do-Do-Do
  title: string;
  subjectArea?: SubjectArea;
  blocks: SequenceBlock[];
  color?: string;
  links?: { label: string; url: string }[];
  notes?: string;
  sol?: SolDetails; // Sequence-level SOL (total for all contained lessons)
  createdAt: string;
  updatedAt: string;
}

export interface SequenceInfo {
  sequenceId: string;
  label: string;
  index: number;
  total: number;
  isFirst: boolean;
  isLast: boolean;
  color?: string;
}

export type FilterType = 'ALL' | CourseType;

// Extended lesson detail fields (Phase 1)
export type SubjectArea = 'VWL' | 'BWL' | 'RECHT' | 'IN' | 'INTERDISZ';

// === Block-Typ / Untertyp (zweistufig) ===
export type BlockCategory = 'LESSON' | 'ASSESSMENT' | 'EVENT' | 'HOLIDAY';

// Legacy flat BlockType (for migration)
export type BlockType =
  | 'LESSON'
  | 'EXAM'
  | 'EXAM_ORAL'
  | 'EXAM_LONG'
  | 'PRESENTATION'
  | 'PROJECT_DUE'
  | 'SELF_STUDY'
  | 'INTRO'
  | 'DISCUSSION'
  | 'EVENT'
  | 'HOLIDAY';

export interface SolDetails {
  enabled: boolean;
  topic?: string;
  description?: string;
  materialLinks?: string[];
  duration?: string; // z.B. "45 min"
}

export interface LessonDetail {
  subjectArea?: SubjectArea;
  topicMain?: string;
  topicSub?: string;
  curriculumGoal?: string;
  /** @deprecated Use blockCategory + blockSubtype instead */
  blockType?: BlockType;
  blockCategory?: BlockCategory;
  blockSubtype?: string;
  duration?: string; // e.g. "45 min", "90 min", "Halbtag", "Ganztag"
  description?: string;
  learningviewUrl?: string;
  materialLinks?: string[];
  notes?: string;
  sol?: SolDetails;
  badges?: CellBadge[];
}

export interface CellBadge {
  label: string;   // 1-3 Zeichen, z.B. "P", "HK", "📝"
  color: string;   // Hex-Farbe, z.B. "#ef4444"
}

// === Materialsammlung (Collection) ===
export type CollectionItemType = 'unit' | 'sequence' | 'schoolyear' | 'curriculum' | 'settings';

/** A single archived teaching unit (1 block + lesson details) */
export interface CollectionUnit {
  block: SequenceBlock;           // Block data (weeks stripped on archive)
  lessonDetails: Record<string, LessonDetail>; // Snapshots keyed by relative index "0","1","2"...
  lessonTitles: string[];         // Original tile titles in order
}

/** A collection item — the universal container in the Sammlung */
export interface CollectionItem {
  id: string;
  type: CollectionItemType;
  title: string;
  subjectArea?: SubjectArea;
  courseType?: CourseType;         // SF, EWR, EF...
  cls?: string;                   // Original class (e.g. "29c", "27a28f")
  schoolYear?: string;            // e.g. "24/25", "25/26"
  gymYears?: string;              // e.g. "GYM1-GYM4" for curriculum
  tags?: string[];
  notes?: string;
  // Content — depends on type:
  units: CollectionUnit[];        // type='unit': 1 entry; 'sequence': multiple; 'schoolyear'/'curriculum': all
  settingsSnapshot?: string;      // type='settings': JSON-serialized PlannerSettings
  // Metadata from original sequence(s)
  sequenceTitle?: string;         // Original ManagedSequence title
  sequenceColor?: string;
  createdAt: string;
}

// HK Rotation
export type HKGroup = 'A' | 'B';

// TaF Phasenmodell
export interface TaFPhase {
  id: string;
  name: string;           // z.B. "Phase 1", "Trainingsphase"
  startWeek: string;      // KW
  endWeek: string;        // KW
  color: string;          // Phasenfarbe
  absentClasses: string[];  // Klassen die in dieser Phase abwesend sind
  presentClasses: string[]; // Klassen die anwesend sind
  notes?: string;
}
