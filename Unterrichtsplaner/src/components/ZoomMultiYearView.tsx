import { useMemo, useState, useRef } from 'react';
import { usePlannerStore } from '../store/plannerStore';
import { usePlannerData } from '../hooks/usePlannerData';
import { type CurriculumGoal } from '../data/curriculumGoals';
import { WR_CATEGORIES, WR_BLOCK_COLORS, DEFAULT_BLOCK_COLOR, type CategoryDefinition } from '../data/categories';
import type { SubjectArea, ManagedSequence } from '../types';
import type { StoffverteilungEntry } from '../store/settingsStore';
import { STOFFVERTEILUNG_PRESETS } from '../data/stoffverteilungPresets';

/** Build a zero-initialized Record from category keys */
function emptyCountRecord(cats: CategoryDefinition[]): Record<string, number> {
  const r: Record<string, number> = {};
  for (const c of cats) r[c.key] = 0;
  return r;
}
function emptyArrayRecord(cats: CategoryDefinition[]): Record<string, string[]> {
  const r: Record<string, string[]> = {};
  for (const c of cats) r[c.key] = [];
  return r;
}
function emptyGoalRecord(cats: CategoryDefinition[]): Record<string, CurriculumGoal[]> {
  const r: Record<string, CurriculumGoal[]> = {};
  for (const c of cats) r[c.key] = [];
  return r;
}

/**
 * Zoom Level 1: Multi-Year View
 * 
 * Shows a high-level overview of the 4-year gymnasium curriculum
 * organized by semesters (S1–S8) with subject distribution.
 * 
 * Two modes:
 * - "curriculum" = Lehrplan-Sicht (what SHOULD be taught per semester)
 * - "actual" = Ist-Zustand (what IS planned in the current planner data)
 */

// Generated from WR_CATEGORIES + WR_BLOCK_COLORS — dark-mode variants for Zoom 1
const SUBJECT_COLORS: Record<string, { bg: string; text: string; border: string; light: string }> = Object.fromEntries(
  WR_CATEGORIES.map(cat => {
    const blk = WR_BLOCK_COLORS[cat.key] || DEFAULT_BLOCK_COLOR;
    return [cat.key, {
      bg: blk.bg,
      text: cat.border,   // use border color as text in dark mode
      border: cat.color,
      light: cat.bg,
    }];
  })
);
// Fallback for custom/unknown subject areas (v3.79 B8)
const FALLBACK_SC: { bg: string; text: string; border: string; light: string } = { bg: '#334155', text: '#94a3b8', border: '#64748b', light: '#f1f5f9' };
/** Safe lookup — never returns undefined */
function sc(area: string): { bg: string; text: string; border: string; light: string } { return SUBJECT_COLORS[area] || FALLBACK_SC; }

/** All subject areas from categories (dynamic, no hardcoded filter) */
const ALL_AREAS = WR_CATEGORIES.map(c => c.key) as SubjectArea[];

/** Row type for dynamic stoffverteilung data */
type StoffRow = { semester: string; gym: string; weights: Record<string, number> };

// Group curriculum goals by semester
function getGoalsBySemester(semester: string, allGoals: CurriculumGoal[]): CurriculumGoal[] {
  return allGoals.filter(g => {
    if (!g.semester) return false;
    // Handle ranges like "S3/S4", "S5–S8"
    return g.semester.includes(semester) ||
      g.semester.split(/[/–-]/).some(s => s.trim() === semester);
  });
}

type ViewMode = 'curriculum' | 'actual' | 'class';

// No default SF groups — must be configured via course settings with stufe
const DEFAULT_SF_GROUPS: SFGroup[] = [];

type SFGroup = { cls: string; gymYear: number; semesters: string[]; label: string };

/** Map stufe (e.g. 'GYM1') to semesters (e.g. ['S1','S2']) */
function stufeToSemesters(stufe: string): string[] {
  const num = parseInt(stufe.replace(/\D/g, ''));
  if (!num || num < 1) return ['S1', 'S2'];
  return [`S${(num - 1) * 2 + 1}`, `S${num * 2}`];
}

function SubjectBar({ area, weight, total }: { area: SubjectArea; weight: number; total: number }) {
  if (weight === 0) return null;
  const pct = (weight / total) * 100;
  const c = sc(area);
  return (
    <div className="flex items-center" style={{ width: `${pct}%`, minWidth: 20 }}>
      <div className="h-5 rounded-sm w-full flex items-center justify-center"
        style={{ background: c.bg, border: `1px solid ${c.border}` }}>
        <span className="text-[9px] font-bold" style={{ color: c.text }}>{weight}</span>
      </div>
    </div>
  );
}

function GoalChip({ goal }: { goal: CurriculumGoal }) {
  const c = sc(goal.area);
  return (
    <div className="flex items-start gap-1 py-0.5 group"
      title={`${goal.goal}\n\nInhalte: ${goal.contents.join(', ')}`}>
      <span className="text-[8px] font-mono px-1 py-px rounded shrink-0"
        style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>
        {goal.id}
      </span>
      <span className="text-[9px] leading-tight" style={{ color: 'var(--text-secondary)' }}>
        {goal.topic}
      </span>
    </div>
  );
}

function SemesterCard({ sv, expanded, onToggle, allGoals }: {
  sv: StoffRow;
  expanded: boolean;
  onToggle: () => void;
  allGoals: CurriculumGoal[];
}) {
  const goals = useMemo(() => getGoalsBySemester(sv.semester, allGoals), [sv.semester, allGoals]);
  const total = Object.values(sv.weights).reduce((a, b) => a + b, 0);
  
  // Group goals by area
  const goalsByArea = useMemo(() => {
    const grouped = emptyGoalRecord(WR_CATEGORIES) as Record<SubjectArea, CurriculumGoal[]>;
    for (const g of goals) grouped[g.area].push(g);
    return grouped;
  }, [goals]);

  return (
    <div className={`rounded-md border transition-all ${expanded ? 'border-[var(--border-light)]' : 'border-[var(--border)] hover:border-[var(--border-light)]'}`}
      style={{ background: expanded ? 'var(--bg-primary)' : 'var(--bg-card)' }}>
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 cursor-pointer" onClick={onToggle}>
        <span className="text-[13px] font-bold w-6" style={{ color: 'var(--text-primary)' }}>{sv.semester}</span>
        {/* Subject distribution bar */}
        <div className="flex-1 flex gap-px">
          {ALL_AREAS.map(area => (
            <SubjectBar key={area} area={area} weight={sv.weights[area] || 0} total={Math.max(total, 1)} />
          ))}
        </div>
        <span className="text-[9px] w-12 text-right" style={{ color: 'var(--text-dim)' }}>{goals.length} Ziele</span>
        <span className="text-[11px]" style={{ color: 'var(--text-dim)' }}>{expanded ? '▾' : '▸'}</span>
      </div>
      
      {/* Expanded details */}
      {expanded && (
        <div className="px-3 pb-2 space-y-1.5 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
          {ALL_AREAS.map(area => {
            const areaGoals = goalsByArea[area];
            if (areaGoals.length === 0) return null;
            const c = sc(area);
            return (
              <div key={area}>
                <div className="flex items-center gap-1 mb-0.5">
                  <span className="text-[9px] font-bold px-1 rounded"
                    style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>
                    {area}
                  </span>
                </div>
                <div className="pl-1 space-y-px">
                  {areaGoals.map(g => <GoalChip key={g.id} goal={g} />)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ActualDataCard({ semester, gymYear, sfGroups }: { semester: string; gymYear: string; sfGroups: SFGroup[] }) {
  const { sequences, weekData } = usePlannerStore();
  const { s2StartIndex, courses: plannerCourses } = usePlannerData();

  // Determine which weeks belong to S1 vs S2
  const s1Weeks = useMemo(() => new Set(weekData.slice(0, s2StartIndex).map(w => w.w)), [weekData, s2StartIndex]);
  const s2Weeks = useMemo(() => new Set(weekData.slice(s2StartIndex).map(w => w.w)), [weekData, s2StartIndex]);
  const semesterNum = parseInt(semester.replace('S', ''));
  const isOddSemester = semesterNum % 2 === 1; // S1, S3, S5, S7 = 1. Semester
  const relevantWeeks = isOddSemester ? s1Weeks : s2Weeks;

  // Find courses for this GYM year (SF courses matching the class)
  const sfGroup = sfGroups.find(g => g.semesters.includes(semester));
  const courseIds = useMemo(() => {
    if (!sfGroup) return new Set<string>();
    return new Set(plannerCourses.filter(c => c.cls === sfGroup.cls && c.typ === 'SF').map(c => c.id));
  }, [sfGroup, plannerCourses]);

  // Count actual planned lessons by subject area from sequences (filtered by semester weeks + courses)
  const stats = useMemo(() => {
    const counts = emptyCountRecord(WR_CATEGORIES) as Record<SubjectArea, number>;
    const topics = emptyArrayRecord(WR_CATEGORIES) as Record<SubjectArea, string[]>;
    
    for (const seq of sequences) {
      // Check if sequence belongs to this class group
      const seqCourseIds = seq.courseIds || [seq.courseId];
      if (!seqCourseIds.some(cid => courseIds.has(cid))) continue;
      
      const area = seq.subjectArea;
      if (!area) continue;
      for (const block of seq.blocks) {
        // Count only weeks that fall in the relevant semester
        const semesterWeekCount = block.weeks.filter(w => relevantWeeks.has(w)).length;
        if (semesterWeekCount === 0) continue;
        const effectiveArea = block.subjectArea || area;
        counts[effectiveArea] += semesterWeekCount;
        if (block.topicMain && !topics[effectiveArea].includes(block.topicMain)) {
          topics[effectiveArea].push(block.topicMain);
        }
      }
    }
    
    return { counts, topics };
  }, [sequences, courseIds, relevantWeeks]);

  const total = Object.values(stats.counts).reduce((a, b) => a + b, 0);

  return (
    <div className="rounded-md border px-3 py-2" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-[13px] font-bold" style={{ color: 'var(--text-primary)' }}>{semester}</span>
        <span className="text-[9px]" style={{ color: 'var(--text-dim)' }}>{gymYear}</span>
        <span className="text-[9px] ml-auto" style={{ color: 'var(--text-dim)' }}>{total} Lektionen geplant</span>
      </div>
      {total > 0 ? (
        <div className="space-y-1">
          {ALL_AREAS.map(area => {
            if (stats.counts[area] === 0) return null;
            const c = sc(area);
            return (
              <div key={area} className="flex items-center gap-2">
                <span className="text-[9px] font-bold w-10 shrink-0" style={{ color: c.text }}>{area}</span>
                <div className="flex-1 h-3 rounded-sm overflow-hidden" style={{ background: 'var(--bg-secondary)' }}>
                  <div className="h-full rounded-sm transition-all" style={{
                    width: `${(stats.counts[area] / total) * 100}%`,
                    background: c.border,
                    opacity: 0.7,
                  }} />
                </div>
                <span className="text-[9px] w-6 text-right" style={{ color: 'var(--text-dim)' }}>{stats.counts[area]}</span>
              </div>
            );
          })}
          {/* Topics preview */}
          <div className="mt-1 pt-1" style={{ borderTop: '1px solid var(--border)' }}>
            {ALL_AREAS.map(area => {
              if (stats.topics[area].length === 0) return null;
              const c = sc(area);
              return (
                <div key={area} className="text-[8px] truncate" style={{ color: 'var(--text-dim)' }}>
                  <span style={{ color: c.text }}>{area}:</span>{' '}
                  {stats.topics[area].slice(0, 3).join(', ')}{stats.topics[area].length > 3 ? ' …' : ''}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-[11px] italic" style={{ color: 'var(--text-dim)' }}>Keine Daten verfügbar</div>
      )}
    </div>
  );
}

function ClassViewCard({ group, sequences, stoffverteilung, allGoals }: { group: SFGroup; sequences: ManagedSequence[]; stoffverteilung: StoffRow[]; allGoals: CurriculumGoal[] }) {
  const { courses: plannerCourses } = usePlannerData();
  // Find sequences for this class group
  const classSequences = useMemo(() => {
    const courseIds = plannerCourses.filter(c => c.cls === group.cls && c.typ === 'SF').map(c => c.id);
    return sequences.filter(s =>
      courseIds.includes(s.courseId) || (s.courseIds && s.courseIds.some(cid => courseIds.includes(cid)))
    );
  }, [group.cls, sequences, plannerCourses]);

  // Count weeks by subject area
  const stats = useMemo(() => {
    const counts = emptyCountRecord(WR_CATEGORIES) as Record<SubjectArea, number>;
    const blocks: { area: SubjectArea; label: string; weeks: number; topicMain?: string }[] = [];
    for (const seq of classSequences) {
      for (const block of seq.blocks) {
        const area = block.subjectArea || seq.subjectArea;
        if (!area) continue;
        counts[area] += block.weeks.length;
        blocks.push({ area, label: block.label, weeks: block.weeks.length, topicMain: block.topicMain });
      }
    }
    return { counts, blocks };
  }, [classSequences]);

  const total = Object.values(stats.counts).reduce((a, b) => a + b, 0);

  // Curriculum goals for this class's semesters
  const semesterGoals = useMemo(() => {
    const goals: Record<string, CurriculumGoal[]> = {};
    for (const sem of group.semesters) {
      goals[sem] = getGoalsBySemester(sem, allGoals);
    }
    return goals;
  }, [group.semesters, allGoals]);

  const sv1 = stoffverteilung.find(s => s.semester === group.semesters[0]);
  const sv2 = stoffverteilung.find(s => s.semester === group.semesters[1]);

  return (
    <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--border-light)', background: 'var(--bg-card)' }}>
      {/* Header */}
      <div className="px-3 py-2" style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-bold text-amber-400">GYM{group.gymYear}</span>
          <span className="text-[12px] font-semibold" style={{ color: 'var(--text-primary)' }}>{group.cls}</span>
          <span className="text-[9px] ml-auto" style={{ color: 'var(--text-dim)' }}>{group.semesters.join(' + ')} · {total} Wochen geplant</span>
        </div>
      </div>

      <div className="p-3 space-y-3">
        {/* Soll vs Ist comparison per semester */}
        {group.semesters.map((sem, idx) => {
          const sv = idx === 0 ? sv1 : sv2;
          if (!sv) return null;
          const svTotal = Object.values(sv.weights).reduce((a, b) => a + b, 0);
          const goals = semesterGoals[sem] || [];
          return (
            <div key={sem} className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-bold" style={{ color: 'var(--text-secondary)' }}>{sem}</span>
                <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
              </div>
              {/* Soll bar */}
              <div className="flex items-center gap-1.5">
                <span className="text-[8px] w-8 shrink-0" style={{ color: 'var(--text-dim)' }}>Soll</span>
                <div className="flex-1 flex gap-px">
                  {ALL_AREAS.map(area => (
                    <SubjectBar key={area} area={area} weight={sv.weights[area] || 0} total={Math.max(svTotal, 1)} />
                  ))}
                </div>
              </div>
              {/* Ist bars */}
              {total > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[8px] w-8 shrink-0" style={{ color: 'var(--text-dim)' }}>Ist</span>
                  <div className="flex-1 flex gap-px">
                    {ALL_AREAS.map(area => {
                      if (stats.counts[area] === 0) return null;
                      const c = sc(area);
                      const pct = Math.min((stats.counts[area] / Math.max(total, 1)) * 100, 100);
                      return (
                        <div key={area} className="flex items-center" style={{ width: `${pct}%`, minWidth: 20 }}>
                          <div className="h-5 rounded-sm w-full flex items-center justify-center"
                            style={{ background: c.bg, border: `1px solid ${c.border}`, opacity: 0.8 }}>
                            <span className="text-[9px] font-bold" style={{ color: c.text }}>{stats.counts[area]}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {/* Goals */}
              <div className="pl-9 space-y-px">
                {goals.slice(0, 6).map(g => <GoalChip key={g.id} goal={g} />)}
                {goals.length > 6 && <span className="text-[8px]" style={{ color: 'var(--text-dim)' }}>+{goals.length - 6} weitere</span>}
              </div>
            </div>
          );
        })}

        {/* Planned blocks detail */}
        {stats.blocks.length > 0 && (
          <div className="pt-2" style={{ borderTop: '1px solid var(--border)' }}>
            <span className="text-[9px] font-semibold" style={{ color: 'var(--text-dim)' }}>Geplante Blöcke:</span>
            <div className="mt-1 space-y-0.5">
              {stats.blocks.map((b, i) => {
                const c = sc(b.area);
                return (
                  <div key={i} className="flex items-center gap-1.5">
                    <span className="text-[8px] px-1 py-px rounded shrink-0"
                      style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>
                      {b.area}
                    </span>
                    <span className="text-[9px] truncate flex-1" style={{ color: 'var(--text-secondary)' }}>{b.topicMain || b.label}</span>
                    <span className="text-[8px] shrink-0" style={{ color: 'var(--text-dim)' }}>{b.weeks}W</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** Convert StoffverteilungEntry[] to StoffRow format for rendering.
 *  Normalizes weight keys to uppercase to match WR_CATEGORIES keys (z.B. 'Recht' → 'RECHT'). */
function entriesToRows(entries: StoffverteilungEntry[]): StoffRow[] {
  return entries.map(e => {
    const normalized: Record<string, number> = {};
    for (const [key, val] of Object.entries(e.weights)) {
      normalized[key.toUpperCase()] = (normalized[key.toUpperCase()] || 0) + val;
    }
    return { semester: e.semester, gym: e.gym, weights: normalized };
  });
}

export function ZoomMultiYearView() {
  const { sequences } = usePlannerStore();
  const { settings, effectiveGoals } = usePlannerData();
  const [mode, setMode] = useState<ViewMode>('curriculum');
  const [expandedSemesters, setExpandedSemesters] = useState<Set<string>>(new Set());
  const importRef = useRef<HTMLInputElement>(null);

  // Dynamic SF groups from courses with stufe, fallback to hardcoded
  const sfGroups: SFGroup[] = useMemo(() => {
    if (!settings?.courses?.length) return DEFAULT_SF_GROUPS;
    const grouped = new Map<string, { cls: string; stufe: string; }>();
    for (const c of settings.courses) {
      if (c.typ === 'SF' && c.stufe) {
        const key = `${c.cls}|${c.stufe}`;
        if (!grouped.has(key)) grouped.set(key, { cls: c.cls, stufe: c.stufe });
      }
    }
    if (grouped.size === 0) return DEFAULT_SF_GROUPS;
    return [...grouped.values()].map(g => {
      const num = parseInt(g.stufe.replace(/\D/g, '')) || 1;
      return {
        cls: g.cls,
        gymYear: num,
        semesters: stufeToSemesters(g.stufe),
        label: `${g.cls} · ${g.stufe}`,
      };
    }).sort((a, b) => a.gymYear - b.gymYear);
  }, [settings]);

  // Dynamic Stoffverteilung from settings (no hardcoded fallback)
  const stoffverteilung = useMemo(() => {
    if (settings?.stoffverteilung?.length) return entriesToRows(settings.stoffverteilung);
    return [] as StoffRow[];
  }, [settings]);

  const hasStoffverteilung = stoffverteilung.length > 0;

  // Distinct GYM years for rendering
  const gymYears = useMemo(() => {
    const years = [...new Set(stoffverteilung.map(s => s.gym))];
    return years.map(gym => {
      const semesters = stoffverteilung.filter(s => s.gym === gym).map(s => s.semester);
      return { gym, semesters };
    });
  }, [stoffverteilung]);

  const toggleSemester = (s: string) => {
    setExpandedSemesters(prev => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s); else next.add(s);
      return next;
    });
  };

  const expandAll = () => setExpandedSemesters(new Set(stoffverteilung.map(s => s.semester)));
  const collapseAll = () => setExpandedSemesters(new Set());

  // Import Stoffverteilung from JSON
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string) as StoffverteilungEntry[];
        if (!Array.isArray(data) || data.length === 0) { alert('Ungültiges Format.'); return; }
        if (confirm(`${data.length} Semester-Einträge importieren?`)) {
          const store = usePlannerStore.getState();
          store.setPlannerSettings({ ...store.plannerSettings, stoffverteilung: data } as Parameters<typeof store.setPlannerSettings>[0]);
        }
      } catch { alert('JSON konnte nicht gelesen werden.'); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Summary stats — dynamic per area
  const totals = useMemo(() => {
    const areaTotals: Record<string, number> = {};
    for (const area of ALL_AREAS) areaTotals[area] = 0;
    for (const sv of stoffverteilung) {
      for (const area of ALL_AREAS) areaTotals[area] += sv.weights[area] || 0;
    }
    return { areas: areaTotals, goals: effectiveGoals.length };
  }, [stoffverteilung, effectiveGoals]);

  return (
    <div className="p-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>◫ Mehrjahresübersicht</h2>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-dim)' }}>
            {sfGroups.length > 0
              ? `${gymYears.length} Jahrgänge · ${sfGroups.length} Klassen (${stoffverteilung.at(0)?.semester || ''}–${stoffverteilung.at(-1)?.semester || ''})`
              : 'Keine Kurse mit Stufe konfiguriert'}
          </p>
        </div>
        <div className="flex gap-1">
          <button onClick={() => setMode('curriculum')}
            className={`px-2.5 py-1 rounded text-[11px] font-semibold border cursor-pointer transition-colors ${
              mode === 'curriculum' ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300' : 'border-[var(--border)] text-[var(--text-dim)] hover:text-[var(--text-secondary)]'
            }`}>
            📋 Stoffverteilung
          </button>
          <button onClick={() => setMode('actual')}
            className={`px-2.5 py-1 rounded text-[11px] font-semibold border cursor-pointer transition-colors ${
              mode === 'actual' ? 'bg-green-500/20 border-green-500 text-green-300' : 'border-[var(--border)] text-[var(--text-dim)] hover:text-[var(--text-secondary)]'
            }`}>
            📊 Ist-Zustand
          </button>
          <button onClick={() => setMode('class')}
            className={`px-2.5 py-1 rounded text-[11px] font-semibold border cursor-pointer transition-colors ${
              mode === 'class' ? 'bg-amber-500/20 border-amber-500 text-amber-300' : 'border-[var(--border)] text-[var(--text-dim)] hover:text-[var(--text-secondary)]'
            }`}>
            🎓 Jahrgänge
          </button>
        </div>
      </div>

      {mode === 'curriculum' && (
        <>
          {!hasStoffverteilung ? (
            <div className="text-center py-8">
              <div className="text-2xl mb-2">📋</div>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Keine Stoffverteilung konfiguriert</p>
              <p className="text-[12px] mt-1" style={{ color: 'var(--text-dim)' }}>Importiere eine Stoffverteilung oder wähle eine Vorlage.</p>
              <div className="flex flex-wrap gap-2 justify-center mt-3">
                <label className="px-3 py-1.5 rounded border border-indigo-500/40 text-indigo-300 text-[12px] cursor-pointer hover:bg-indigo-500/10">
                  📂 Aus Datei (JSON)
                  <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
                </label>
                {STOFFVERTEILUNG_PRESETS.map(preset => (
                  <button key={preset.id} onClick={() => {
                    if (confirm(`Vorlage «${preset.label}» laden? (${preset.data.length} Semester)`)) {
                      const store = usePlannerStore.getState();
                      store.setPlannerSettings({ ...store.plannerSettings, stoffverteilung: preset.data } as Parameters<typeof store.setPlannerSettings>[0]);
                    }
                  }}
                    className="px-3 py-1.5 rounded border text-[12px] cursor-pointer" style={{ borderColor: 'var(--border-light)', color: 'var(--text-muted)' }}>
                    {preset.icon} {preset.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
          <>
          {/* Summary bar */}
          <div className="flex items-center gap-3 mb-3 px-2 py-1.5 rounded-md border" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
            <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Gesamt:</span>
            {ALL_AREAS.filter(a => totals.areas[a] > 0).map(area => (
              <span key={area} className="text-[11px] font-bold" style={{ color: sc(area)?.text }}>{area} {totals.areas[area]}</span>
            ))}
            <span className="text-[9px] ml-auto" style={{ color: 'var(--text-dim)' }}>{totals.goals} Lehrplanziele</span>
            <label className="text-[9px] cursor-pointer" style={{ color: 'var(--text-dim)' }} title="Stoffverteilung importieren (JSON)">
              📥<input type="file" accept=".json" className="hidden" onChange={handleImport} />
            </label>
            <button onClick={expandAll} className="text-[9px] cursor-pointer" style={{ color: 'var(--text-dim)' }} title="Alle aufklappen">⊞</button>
            <button onClick={collapseAll} className="text-[9px] cursor-pointer" style={{ color: 'var(--text-dim)' }} title="Alle zuklappen">⊟</button>
          </div>

          {/* GYM years */}
          <div className="space-y-4">
            {gymYears.map(({ gym, semesters }) => (
              <div key={gym}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[12px] font-bold text-amber-500">{gym}</span>
                  <div className="flex-1 h-px bg-amber-800/40" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {semesters.map(sem => {
                    const sv = stoffverteilung.find(s => s.semester === sem);
                    if (!sv) return null;
                    return (
                      <SemesterCard key={sem} sv={sv}
                        expanded={expandedSemesters.has(sem)}
                        onToggle={() => toggleSemester(sem)}
                        allGoals={effectiveGoals} />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          </>
          )}
        </>
      )}

      {mode === 'actual' && (
        <>
          {/* Actual data view */}
          <div className="text-[11px] mb-3 px-2 py-1.5 rounded-md border" style={{ color: 'var(--text-dim)', background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
            Zeigt geplante Lektionen aus den Sequenzen des aktuellen Schuljahres.
          </div>
          {gymYears.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-2xl mb-2">📊</div>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Keine Daten verfügbar</p>
              <p className="text-[12px] mt-1" style={{ color: 'var(--text-dim)' }}>Konfiguriere Kurse mit Stufe und Stoffverteilung.</p>
            </div>
          ) : (
          <div className="space-y-4">
            {gymYears.map(({ gym, semesters }) => (
              <div key={gym}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[12px] font-bold text-amber-500">{gym}</span>
                  <div className="flex-1 h-px bg-amber-800/40" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {semesters.map(sem => (
                    <ActualDataCard key={sem} semester={sem} gymYear={gym} sfGroups={sfGroups} />
                  ))}
                </div>
              </div>
            ))}
          </div>
          )}
        </>
      )}

      {mode === 'class' && (
        <>
          <div className="text-[11px] mb-3 px-2 py-1.5 rounded-md border" style={{ color: 'var(--text-dim)', background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
            Zeigt Soll- und Ist-Zustand pro SF-Gruppe im aktuellen Schuljahr.
          </div>
          {sfGroups.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-2xl mb-2">🎓</div>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Keine SF-Gruppen konfiguriert</p>
              <p className="text-[12px] mt-1" style={{ color: 'var(--text-dim)' }}>Konfiguriere Kurse mit Stufe in den Einstellungen.</p>
            </div>
          ) : (
          <div className="space-y-3">
            {sfGroups.map(group => (
              <ClassViewCard key={group.cls} group={group} sequences={sequences} stoffverteilung={stoffverteilung} allGoals={effectiveGoals} />
            ))}
          </div>
          )}
        </>
      )}

      {/* Legend */}
      <div className="mt-4 pt-3 flex items-center gap-4" style={{ borderTop: '1px solid var(--border)' }}>
        {ALL_AREAS.map(area => {
          const c = sc(area);
          return (
            <div key={area} className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm" style={{ background: c.bg, border: `1px solid ${c.border}` }} />
              <span className="text-[9px] font-medium" style={{ color: c.text }}>{area}</span>
            </div>
          );
        })}
        <span className="text-[8px] ml-auto" style={{ color: 'var(--text-dim)' }}>Zahlen = Gewichtungseinheiten</span>
      </div>
    </div>
  );
}
