import { describe, it, expect } from 'vitest';
import { detectLessonType, matchHeaderToCourse, parseWeekFromCell } from './excelImportMapping';
import type { Course } from '../types';

// Minimal-Kurse mit dynamischen col-Werten (100+), wie sie configToCourses für
// selbst-definierte Kurse erzeugt — der Regressions-Kern dieses Features.
const COURSES_DYN: Course[] = [
  { id: 'a', col: 100, cls: '29c', typ: 'SF', day: 'Di', from: '', to: '', les: 2, hk: false, semesters: [1, 2] },
  { id: 'b', col: 101, cls: '27a', typ: 'IN', day: 'Mo', from: '', to: '', les: 1, hk: false, semesters: [1] },
];

describe('detectLessonType', () => {
  it('erkennt die Lektionstypen pro Branch', () => {
    expect(detectLessonType('Herbstferien')).toBe(6);
    expect(detectLessonType('Prüfung FIBU')).toBe(4);
    expect(detectLessonType('Sporttag')).toBe(5);
    expect(detectLessonType('BYOD Projekt')).toBe(3);
    expect(detectLessonType('Einführung BWL')).toBe(1);
    expect(detectLessonType('OR AT Verträge')).toBe(2);
    expect(detectLessonType('Irgendwas Neutrales')).toBe(0);
    expect(detectLessonType('')).toBe(0);
  });
});

describe('matchHeaderToCourse', () => {
  it('matcht Header gegen dynamische col-Werte (100+), nicht gegen statische COURSES', () => {
    // Klassenname im Header → dynamische col
    expect(matchHeaderToCourse('29c Di', COURSES_DYN)).toBe(100);
    expect(matchHeaderToCourse('Mo 27a', COURSES_DYN)).toBe(101);
    // Teilstring-Match (h.includes(cls))
    expect(matchHeaderToCourse('Kurs 29c SF', COURSES_DYN)).toBe(100);
  });
  it('gibt null bei keinem Match', () => {
    expect(matchHeaderToCourse('Unbekannt', COURSES_DYN)).toBeNull();
    expect(matchHeaderToCourse('', COURSES_DYN)).toBeNull();
  });
  it('gibt null bei leerer Kursliste (Planer ohne konfigurierte Kurse)', () => {
    expect(matchHeaderToCourse('29c', [])).toBeNull();
  });
});

describe('parseWeekFromCell', () => {
  const allowed = ['33', '34', '35'];
  it('parst KW-Muster und reine Zahlen, padded auf 2 Stellen', () => {
    expect(parseWeekFromCell('KW 33', allowed)).toBe('33');
    expect(parseWeekFromCell('Woche 34', allowed)).toBe('34');
    expect(parseWeekFromCell('35', allowed)).toBe('35');
  });
  it('gibt null wenn die Woche ausserhalb des erlaubten Bereichs liegt', () => {
    expect(parseWeekFromCell('KW 50', allowed)).toBeNull();
    expect(parseWeekFromCell('1', allowed)).toBeNull();
  });
  it('gibt null bei Nicht-Wochen-Text', () => {
    expect(parseWeekFromCell('Thema', allowed)).toBeNull();
    expect(parseWeekFromCell('', allowed)).toBeNull();
  });
});
