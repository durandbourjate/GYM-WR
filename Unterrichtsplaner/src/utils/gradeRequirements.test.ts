import { describe, it, expect } from 'vitest'
import {
  getGymStufe,
  getGradeRequirements,
  getCourseGroups,
  countAssessments,
  checkGradeRequirements,
} from './gradeRequirements'
import type { Course, Week, LessonDetail } from '../types'

// Minimal-Fixture: deckt alle Pflichtfelder von Course ab.
function makeCourse(id: string, cls: string, typ: string, les: 1 | 2 | 3, col: number): Course {
  return { id, col, cls, typ, day: 'Mo', from: '08:00', to: '08:45', les, hk: false, semesters: [1, 2] }
}

describe('getGymStufe', () => {
  it('ordnet Klasse 29c bei SJ-Ende 2026 GYM1 zu', () => {
    expect(getGymStufe('29c')).toBe('GYM1')
  })
  it('nimmt die erste 2-stellige Zahl im Klassennamen', () => {
    expect(getGymStufe('28bc29fs')).toBe('GYM2')
    expect(getGymStufe('27a28f')).toBe('GYM3')
  })
  it('ordnet GYM4 und GYM5 (TaF) korrekt zu', () => {
    expect(getGymStufe('26d')).toBe('GYM4')
    expect(getGymStufe('25s')).toBe('GYM5')
  })
  it('liefert UNKNOWN bei fehlender Zahl oder zu grossem Abstand', () => {
    expect(getGymStufe('abc')).toBe('UNKNOWN')
    expect(getGymStufe('24x')).toBe('UNKNOWN')
  })
  it('respektiert den maturaYear-Override', () => {
    expect(getGymStufe('30a', 2027)).toBe('GYM1')
  })
})

describe('getGradeRequirements', () => {
  it('GYM1 liefert 3 Vorgaben in fester Reihenfolge', () => {
    const r = getGradeRequirements('GYM1', 3)
    expect(r.map(x => x.label)).toEqual([
      'Standortbestimmung (Nov)', 'Semesterzeugnis', 'Jahreszeugnis',
    ])
  })
  it('GYM1 mit >3 Wochenlektionen hebt das Jahreszeugnis-Minimum auf 4', () => {
    expect(getGradeRequirements('GYM1', 4).at(-1)!.minGrades).toBe(4)
    expect(getGradeRequirements('GYM1', 3).at(-1)!.minGrades).toBe(3)
  })
  it('GYM2-5 liefert 2 Vorgaben', () => {
    const r = getGradeRequirements('GYM3', 2)
    expect(r.map(x => x.label)).toEqual(['Zwischenbericht', 'Jahreszeugnis'])
  })
  it('GYM2 mit >3 Wochenlektionen hebt das Jahreszeugnis-Minimum auf 4', () => {
    expect(getGradeRequirements('GYM2', 5).at(-1)!.minGrades).toBe(4)
  })
})

describe('getCourseGroups', () => {
  it('gruppiert nach Klasse+Typ, summiert Wochenlektionen, dedupliziert kursIds', () => {
    const groups = getCourseGroups([
      makeCourse('a', '29c', 'SF', 2, 11),
      makeCourse('b', '29c', 'SF', 1, 13),
      makeCourse('c', '28c', 'IN', 1, 4),
    ])
    expect(groups).toHaveLength(2)
    const sf = groups.find(g => g.key === '29c-SF')!
    expect(sf.weeklyLessons).toBe(3)
    expect(sf.kursIds).toEqual(['a', 'b'])
    expect(sf.gymStufe).toBe('GYM1')
  })
  it('zaehlt einen doppelt uebergebenen kursId nicht doppelt', () => {
    const kurs = makeCourse('a', '29c', 'SF', 2, 11)
    const groups = getCourseGroups([kurs, kurs])
    expect(groups).toHaveLength(1)
    expect(groups[0].weeklyLessons).toBe(2)
    expect(groups[0].kursIds).toEqual(['a'])
  })
})

describe('countAssessments', () => {
  const courses = [makeCourse('a', '29c', 'SF', 2, 11)]

  it('zaehlt Lektionen mit blockCategory ASSESSMENT', () => {
    const weeks: Week[] = [{ w: '33', lessons: { 11: { title: 'Pruefung', type: 1 } } }]
    const details: Record<string, LessonDetail> = { '33-11': { blockCategory: 'ASSESSMENT' } }
    expect(countAssessments(weeks, details, ['a'], courses, 'year', 1)).toBe(1)
  })
  it('zaehlt LessonEntry vom Typ 4 als Fallback', () => {
    const weeks: Week[] = [{ w: '33', lessons: { 11: { title: 'Pruefung', type: 4 } } }]
    expect(countAssessments(weeks, {}, ['a'], courses, 'year', 1)).toBe(1)
  })
  it('ignoriert Lektionen ohne Titel und fremde Spalten', () => {
    const weeks: Week[] = [
      { w: '33', lessons: { 11: { title: '', type: 4 }, 99: { title: 'X', type: 4 } } },
    ]
    expect(countAssessments(weeks, {}, ['a'], courses, 'year', 1)).toBe(0)
  })
  it('filtert nach Semester ueber s2StartIndex', () => {
    const weeks: Week[] = [
      { w: '33', lessons: { 11: { title: 'P1', type: 4 } } },
      { w: '34', lessons: { 11: { title: 'P2', type: 4 } } },
    ]
    expect(countAssessments(weeks, {}, ['a'], courses, 1, 1)).toBe(1)
    expect(countAssessments(weeks, {}, ['a'], courses, 2, 1)).toBe(1)
    expect(countAssessments(weeks, {}, ['a'], courses, 'year', 1)).toBe(2)
  })
  it('wendet bei semesterFilter custom keinen Semester-Filter an', () => {
    const weeks: Week[] = [
      { w: '33', lessons: { 11: { title: 'P1', type: 4 } } },
      { w: '34', lessons: { 11: { title: 'P2', type: 4 } } },
    ]
    expect(countAssessments(weeks, {}, ['a'], courses, 'custom', 1)).toBe(2)
  })
})

describe('checkGradeRequirements', () => {
  it('berechnet Status und sortiert critical vor warning', () => {
    const courses = [makeCourse('a', '29c', 'SF', 3, 11)]
    const warnings = checkGradeRequirements([], {}, courses, 1)
    expect(warnings).toHaveLength(3)
    expect(warnings.map(w => w.status)).toEqual(['critical', 'critical', 'warning'])
  })
  it('ueberspringt Gruppen mit gymStufe UNKNOWN', () => {
    const courses = [makeCourse('x', 'abc', 'SF', 3, 11)]
    expect(checkGradeRequirements([], {}, courses, 1)).toEqual([])
  })
  it('meldet ok, wenn genug Beurteilungen geplant sind', () => {
    const courses = [makeCourse('a', '29c', 'SF', 3, 11)]
    const weeks: Week[] = [
      { w: '33', lessons: { 11: { title: 'P1', type: 4 } } },
      { w: '34', lessons: { 11: { title: 'P2', type: 4 } } },
      { w: '35', lessons: { 11: { title: 'P3', type: 4 } } },
    ]
    const warnings = checkGradeRequirements(weeks, {}, courses, 99)
    expect(warnings.every(w => w.status === 'ok')).toBe(true)
  })
})
