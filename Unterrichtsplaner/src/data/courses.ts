import type { Course } from '../types';

// Stundenplan SJ 25/26 — gemäss Stundenpläne Phase 1–4 (konsolidiert 04.03.2026)
// Quelle: stundenplan_duy_2526.json / stundenplan_alle_phasen.md
// Korrekturen gegenüber v1:
//   - 28c IN S1: Mo L7 Praktikum (P-02) ergänzt
//   - 29f IN S1: Mo L8-9 (H-206, Praktikum) statt Di L8-9
//   - 30s IN: aufgeteilt in 4 Einträge je Phase/Semester
//   - 29fs EWR: Zimmer ergänzt (H-108 S1, H-204 S2)
//   - KS 27a S2: col korrigiert auf 10

export const COURSES: Course[] = [

  // === SF (ganzjährig, Di + Do) ===
  { id: 'c11',         col: 11, cls: '29c',       typ: 'SF',  day: 'Di', from: '09:00', to: '09:45', les: 1, hk: false, semesters: [1, 2] },
  { id: 'c31',         col: 31, cls: '29c',       typ: 'SF',  day: 'Do', from: '10:05', to: '11:45', les: 2, hk: false, semesters: [1, 2] },
  { id: 'c17',         col: 17, cls: '27a28f',    typ: 'SF',  day: 'Di', from: '13:40', to: '15:20', les: 2, hk: false, semesters: [1, 2] },
  { id: 'c35',         col: 35, cls: '27a28f',    typ: 'SF',  day: 'Do', from: '13:40', to: '15:20', les: 2, hk: false, semesters: [1, 2] },
  { id: 'c19',         col: 19, cls: '28bc29fs',  typ: 'SF',  day: 'Di', from: '15:35', to: '17:10', les: 2, hk: false, semesters: [1, 2] },
  { id: 'c29',         col: 29, cls: '28bc29fs',  typ: 'SF',  day: 'Do', from: '09:00', to: '09:45', les: 1, hk: false, semesters: [1, 2] },

  // === KS Klassenstunde 27a ===
  // S1: Mo L3 (H-104), S2: Do L10 (H-101)
  { id: 'c2',          col: 2,  cls: '27a',       typ: 'KS',  day: 'Mo', from: '10:05', to: '10:50', les: 1, hk: false, semesters: [1] },
  { id: 'c2b',         col: 10, cls: '27a',       typ: 'KS',  day: 'Do', from: '16:25', to: '17:10', les: 1, hk: false, semesters: [2] },

  // === IN Informatik 28c ===
  // S1: Mo L7 Praktikum (hk, P-02) + Di L3-4 Praktikum (hk, H-106)
  // S2: Mo L3-4 (H-111)
  { id: 'c28c_s1_mo',  col: 7,  cls: '28c',       typ: 'IN',  day: 'Mo', from: '13:40', to: '14:25', les: 1, hk: true,  semesters: [1], note: 'Praktikum hk' },
  { id: 'c13',         col: 13, cls: '28c',       typ: 'IN',  day: 'Di', from: '10:05', to: '11:45', les: 2, hk: true,  semesters: [1], note: 'Praktikum hk' },
  { id: 'c4s2',        col: 4,  cls: '28c',       typ: 'IN',  day: 'Mo', from: '10:05', to: '11:45', les: 2, hk: false, semesters: [2] },

  // === IN Informatik 29f ===
  // S1: Mo L8-9 Praktikum (hk, H-206)
  // S2: Mo L7 (C-01)
  { id: 'c6',          col: 8,  cls: '29f',       typ: 'IN',  day: 'Mo', from: '14:35', to: '16:20', les: 2, hk: true,  semesters: [1], note: 'Praktikum hk' },
  { id: 'c6s2',        col: 7,  cls: '29f',       typ: 'IN',  day: 'Mo', from: '13:40', to: '14:25', les: 1, hk: false, semesters: [2] },

  // === IN Informatik 30s (Phasenunterricht — nicht in allen Phasen aktiv) ===
  // S1: Mi L1 (Phase 1, H-106) + Do L9 (Phase 1, H-106)
  // S2: Mi L1 (Phase 3, C-02) + Mo L8 (Phase 3, H-106)
  { id: 'c30s_mi',     col: 1,  cls: '30s',       typ: 'IN',  day: 'Mi', from: '08:05', to: '08:50', les: 1, hk: false, semesters: [1], note: 'Phasenunterricht (nur Phase 1)' },
  { id: 'c30s_do',     col: 9,  cls: '30s',       typ: 'IN',  day: 'Do', from: '15:35', to: '16:20', les: 1, hk: false, semesters: [1], note: 'Phasenunterricht' },
  { id: 'c30s_mi2',    col: 1,  cls: '30s',       typ: 'IN',  day: 'Mi', from: '08:05', to: '08:50', les: 1, hk: false, semesters: [2], note: 'Phasenunterricht (nur Phase 3)' },
  { id: 'c30s_mo2',    col: 8,  cls: '30s',       typ: 'IN',  day: 'Mo', from: '14:35', to: '15:20', les: 1, hk: false, semesters: [2], note: 'Phasenunterricht (nur Phase 3)' },

  // === EWR Ergänzungsfach 29fs ===
  // S1: Di L6 (H-108), S2: Do L6 (H-204)
  { id: 'c15',         col: 6,  cls: '29fs',      typ: 'EWR', day: 'Di', from: '12:50', to: '13:35', les: 1, hk: false, semesters: [1] },
  { id: 'c15s2',       col: 6,  cls: '29fs',      typ: 'EWR', day: 'Do', from: '12:50', to: '13:35', les: 1, hk: false, semesters: [2] },
];

// Alias for backward compat
export const ALL_COURSES = COURSES;

/**
 * Find all courses with the same class + type (linked courses for multi-day sequences).
 * e.g. for 29c SF: returns c11 (Di) + c31 (Do)
 */
export function getLinkedKursIds(kursId: string): string[] {
  const course = COURSES.find(c => c.id === kursId);
  if (!course) return [kursId];
  return COURSES
    .filter(c => c.cls === course.cls && c.typ === course.typ)
    .map(c => c.id);
}
