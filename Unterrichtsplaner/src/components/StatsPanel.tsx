import { useMemo, useEffect } from 'react';
import { usePlannerStore } from '../store/plannerStore';
import { checkGradeRequirements } from '../utils/gradeRequirements';
import { usePlannerData } from '../hooks/usePlannerData';
import type { Course, Week } from '../types';

interface CourseStats {
  course: Course;
  totalLessons: number;
  exams: number;
  events: number;
  holidays: number;
  byType: Record<number, number>;
  examWeeks: string[];
}

function computeStats(weekData: Week[], courses: Course[]): CourseStats[] {
  if (courses.length === 0 || weekData.length === 0) return [];
  return courses.map((course) => {
    const stats: CourseStats = {
      course,
      totalLessons: 0,
      exams: 0,
      events: 0,
      holidays: 0,
      byType: {},
      examWeeks: [],
    };
    for (const week of weekData) {
      const entry = week.lessons[course.col];
      if (!entry) continue;
      stats.totalLessons++;
      stats.byType[entry.type] = (stats.byType[entry.type] || 0) + 1;
      if (entry.type === 4) {
        stats.exams++;
        stats.examWeeks.push(week.w);
      }
      if (entry.type === 5) stats.events++;
      if (entry.type === 6) stats.holidays++;
    }
    return stats;
  });
}

import { WR_CATEGORIES, inferFachbereichFromLessonType } from '../data/categories';

/** Legacy lessonType → label/color. Subject types (1,2,3) derived dynamically from categories. */
function getTypeLabel(lt: number): { label: string; color: string } {
  if (lt === 4) return { label: 'Prüfung', color: '#ef4444' };
  if (lt === 5) return { label: 'Event', color: '#eab308' };
  if (lt === 6) return { label: 'Ferien', color: '#d4d4d8' };
  const sa = inferFachbereichFromLessonType(lt);
  const cat = sa ? WR_CATEGORIES.find(c => c.key === sa) : undefined;
  if (cat) return { label: cat.label, color: cat.color };
  return { label: 'Andere', color: '#94a3b8' };
}

function MiniBar({ byType, total }: { byType: Record<number, number>; total: number }) {
  if (total === 0) return <div className="h-2 bg-gray-800 rounded" />;
  const order = [1, 2, 3, 0, 4, 5, 6];
  return (
    <div className="h-2 rounded overflow-hidden flex">
      {order.map((t) => {
        const count = byType[t] || 0;
        if (count === 0) return null;
        return (
          <div
            key={t}
            style={{
              width: `${(count / total) * 100}%`,
              background: getTypeLabel(t)?.color || '#666',
            }}
            title={`${getTypeLabel(t)?.label}: ${count}`}
          />
        );
      })}
    </div>
  );
}

/**
 * Parse class strings to extract individual class groups.
 * e.g. "28bc29fs" → ['28b', '28c', '29f', '29s']
 * e.g. "27a28f" → ['27a', '28f']
 * e.g. "29c" → ['29c']
 */
function parseClassGroups(cls: string): string[] {
  const groups: string[] = [];
  const regex = /(\d{2})([a-z]+)/g;
  let match;
  while ((match = regex.exec(cls)) !== null) {
    const year = match[1];
    const letters = match[2];
    for (const letter of letters) {
      groups.push(`${year}${letter}`);
    }
  }
  return groups;
}

interface Collision {
  week: string;
  classes: string[]; // affected class groups
  courses: string[]; // course cls strings
}

function findExamCollisions(stats: CourseStats[]): Collision[] {
  // Build a map: week → list of { course, classGroups }
  const weekExams = new Map<string, { cls: string; groups: string[] }[]>();
  for (const s of stats) {
    for (const w of s.examWeeks) {
      const arr = weekExams.get(w) || [];
      arr.push({ cls: s.course.cls, groups: parseClassGroups(s.course.cls) });
      weekExams.set(w, arr);
    }
  }

  const collisions: Collision[] = [];
  for (const [w, exams] of weekExams) {
    if (exams.length < 2) continue;
    // Check for overlapping class groups between different exams
    const allGroups = new Map<string, string[]>(); // group → [cls1, cls2]
    for (const exam of exams) {
      for (const g of exam.groups) {
        const arr = allGroups.get(g) || [];
        arr.push(exam.cls);
        allGroups.set(g, arr);
      }
    }
    const overlapping = [...allGroups.entries()].filter(([, courses]) => courses.length > 1);
    if (overlapping.length > 0) {
      const affectedClasses = overlapping.map(([g]) => g);
      const affectedCourses = [...new Set(overlapping.flatMap(([, c]) => c))];
      collisions.push({ week: w, classes: affectedClasses, courses: affectedCourses });
    }
  }
  return collisions.sort((a, b) => {
    const ai = parseInt(a.week), bi = parseInt(b.week);
    // School year order: 33+ before 01-32
    const aN = ai >= 33 ? ai - 33 : ai + 20;
    const bN = bi >= 33 ? bi - 33 : bi + 20;
    return aN - bN;
  });
}

export function StatsPanel({ onClose }: { onClose: () => void }) {
  // G4: ESC schliesst Modal
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const { weekData, sequences, lessonDetails } = usePlannerStore();
  const { courses: plannerCourses, s2StartIndex, settings } = usePlannerData();
  const stats = useMemo(() => computeStats(weekData, plannerCourses), [weekData, plannerCourses]);
  const collisions = useMemo(() => findExamCollisions(stats), [stats]);
  const gradeWarnings = useMemo(
    () => plannerCourses.length > 0 ? checkGradeRequirements(weekData, lessonDetails, plannerCourses, s2StartIndex, settings?.assessmentRules) : [],
    [weekData, lessonDetails, plannerCourses, s2StartIndex, settings?.assessmentRules]
  );

  const gradeIssues = gradeWarnings.filter(w => w.status !== 'ok');
  const totalExams = stats.reduce((s, c) => s + c.exams, 0);
  const teachingWeeks = stats.reduce(
    (s, c) => s + c.totalLessons - c.holidays - c.events,
    0
  );
  const totalSequences = sequences.length;
  const totalBlocks = sequences.reduce((s, sq) => s + sq.blocks.length, 0);

  return (
    <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center" onClick={onClose}>
      <div
        className="bg-slate-800 rounded-lg p-5 max-w-3xl w-full max-h-[80vh] overflow-y-auto border border-gray-700 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-sm font-bold text-gray-100">📊 Statistik</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 cursor-pointer text-xs">✕</button>
        </div>

        {stats.length === 0 && (
          <div className="text-center py-8">
            <div className="text-2xl mb-2">📊</div>
            <p className="text-gray-400 text-sm">Keine Daten vorhanden</p>
            <p className="text-gray-500 text-[12px] mt-1">Lege zuerst Kurse an und plane Lektionen.</p>
          </div>
        )}

        {stats.length > 0 && <>
        {/* Summary */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <div className="bg-slate-700/50 rounded p-2.5 text-center">
            <div className="text-lg font-bold text-gray-100">{totalExams}</div>
            <div className="text-[11px] text-gray-400">Prüfungen total</div>
          </div>
          <div className="bg-slate-700/50 rounded p-2.5 text-center">
            <div className="text-lg font-bold text-gray-100">{plannerCourses.length}</div>
            <div className="text-[11px] text-gray-400">Kurse</div>
          </div>
          <div className="bg-slate-700/50 rounded p-2.5 text-center">
            <div className="text-lg font-bold text-gray-100">{teachingWeeks}</div>
            <div className="text-[11px] text-gray-400">Unterrichts-Einträge</div>
          </div>
          <div className="rounded p-2.5 text-center" style={collisions.length > 0 ? { background: 'var(--status-crit-bg)', border: '1px solid var(--status-crit-border)' } : undefined}>
            <div className={`text-lg font-bold ${collisions.length > 0 ? '' : 'text-gray-100'}`} style={collisions.length > 0 ? { color: 'var(--status-crit-text)' } : undefined}>
              {collisions.length}
            </div>
            <div className="text-[11px] text-gray-400">Prüfungskollisionen</div>
          </div>
        </div>

        {/* Sequenz-Übersicht */}
        <div className="bg-slate-700/30 rounded p-2.5 mb-4 flex gap-6">
          <div className="text-[12px] text-gray-400">
            <span className="font-semibold text-gray-300">{totalSequences}</span> Sequenzen
          </div>
          <div className="text-[12px] text-gray-400">
            <span className="font-semibold text-gray-300">{totalBlocks}</span> Blöcke
          </div>
        </div>

        {/* Per-course table */}
        <table className="w-full text-[12px] mb-4">
          <thead>
            <tr className="text-gray-500 border-b border-gray-700">
              <th className="text-left py-1 pr-2">Kurs</th>
              <th className="text-left py-1 pr-2">Typ</th>
              <th className="text-right py-1 pr-2">Lekt.</th>
              <th className="text-right py-1 pr-2">Prüf.</th>
              <th className="text-left py-1 px-2 w-40">Verteilung</th>
              <th className="text-left py-1">Prüfungswochen</th>
            </tr>
          </thead>
          <tbody>
            {stats.map((s) => (
              <tr key={s.course.id} className="border-b border-gray-800 hover:bg-slate-700/30">
                <td className="py-1.5 pr-2 font-semibold text-gray-200">{s.course.cls}</td>
                <td className="py-1.5 pr-2">
                  <span className="px-1 py-px rounded text-[9px] font-bold" style={{
                    background: s.course.typ === 'SF' ? '#16a34a' : s.course.typ === 'IN' ? '#0ea5e9' : s.course.typ === 'EWR' ? '#d97706' : '#7c3aed',
                    color: '#fff',
                  }}>{s.course.typ}</span>
                </td>
                <td className="py-1.5 pr-2 text-right text-gray-300">{s.totalLessons - s.holidays}</td>
                <td className="py-1.5 pr-2 text-right font-semibold text-red-400">{s.exams || '–'}</td>
                <td className="py-1.5 px-2"><MiniBar byType={s.byType} total={s.totalLessons} /></td>
                <td className="py-1.5 text-gray-500">
                  {s.examWeeks.length > 0 ? s.examWeeks.map((w) => `KW${w}`).join(', ') : '–'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Exam collisions – enhanced with class-group analysis */}
        {collisions.length > 0 && (
          <div className="rounded p-3 mb-4" style={{ background: 'var(--status-crit-bg)', border: '1px solid var(--status-crit-border)' }}>
            <div className="text-[12px] font-bold mb-2" style={{ color: 'var(--status-crit-text)' }}>⚠ Prüfungskollisionen (gleiche SuS betroffen)</div>
            <div className="space-y-1.5">
              {collisions.map((c) => (
                <div key={c.week} className="rounded p-2" style={{ background: 'var(--status-crit-bg)' }}>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[12px] font-bold" style={{ color: 'var(--status-crit-text)' }}>KW {c.week}</span>
                    <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>
                      {c.courses.join(' & ')}
                    </span>
                  </div>
                  <div className="text-[11px]" style={{ color: 'var(--status-crit-text)' }}>
                    Betroffene Klassen: {c.classes.join(', ')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {collisions.length === 0 && (
          <div className="rounded p-3 mb-4" style={{ background: 'var(--status-ok-bg)', border: '1px solid var(--status-ok-border)' }}>
            <div className="text-[12px]" style={{ color: 'var(--status-ok-text)' }}>✓ Keine Prüfungskollisionen erkannt</div>
          </div>
        )}

        {/* Grade requirements (MiSDV) — v3.91 N1: CSS-Variablen für Light-Mode Kontrast */}
        <div className="rounded p-3 mb-4" style={{
          background: gradeIssues.length > 0 ? 'var(--status-warn-bg)' : 'var(--status-ok-bg)',
          border: `1px solid ${gradeIssues.length > 0 ? 'var(--status-warn-border)' : 'var(--status-ok-border)'}`,
        }}>
          <div className="text-[12px] font-bold mb-2" style={{ color: gradeIssues.length > 0 ? 'var(--status-warn-text)' : 'var(--status-ok-text)' }}>
            📋 Beurteilungsvorgaben (MiSDV Art. 4)
          </div>
          {gradeIssues.length === 0 ? (
            <div className="text-[12px]" style={{ color: 'var(--status-ok-text)' }}>✓ Alle Mindestanforderungen erfüllt</div>
          ) : (
            <div className="space-y-1">
              {gradeIssues.map((w, i) => (
                <div key={i} className="rounded p-2 text-[11px]" style={{
                  background: w.status === 'critical' ? 'var(--status-crit-bg)' : 'var(--status-warn-bg)',
                  color: w.status === 'critical' ? 'var(--status-crit-text)' : 'var(--status-warn-text)',
                  border: `1px solid ${w.status === 'critical' ? 'var(--status-crit-border)' : 'var(--status-warn-border)'}`,
                }}>
                  <span className="font-bold">{w.courseGroup}</span>
                  <span style={{ color: 'var(--text-muted)' }} className="ml-1">({w.gymStufe}, {w.weeklyLessons}L/Wo)</span>
                  <span className="ml-1">{w.status === 'critical' ? '🔴' : '🟡'} {w.message}</span>
                </div>
              ))}
            </div>
          )}
          {/* Compact overview of all groups */}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {gradeWarnings.filter(w => w.status === 'ok').length > 0 && (
              <div className="text-[9px]" style={{ color: 'var(--text-dim)' }}>
                ✓ OK: {gradeWarnings.filter(w => w.status === 'ok').map(w => `${w.courseGroup} (${w.requirement.label}: ${w.currentCount}/${w.requirement.minGrades})`).join(' · ')}
              </div>
            )}
          </div>
        </div>

        </>}

        {/* Legend */}
        <div className="mt-3 flex gap-3 flex-wrap">
          {[1, 2, 3, 0, 4, 5].map((t) => (
            <span key={t} className="flex items-center gap-1 text-[9px] text-gray-500">
              <span className="w-2 h-2 rounded-sm" style={{ background: getTypeLabel(t).color }} />
              {getTypeLabel(t).label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
