import { useMemo, useState, useRef } from 'react';
import { usePlannerStore } from '../store/plannerStore';
import { usePlannerData } from '../hooks/usePlannerData';
import { type CurriculumGoal } from '../data/curriculumGoals';
import { WR_CATEGORIES, type CategoryDefinition } from '../data/categories';
import type { SubjectArea, ManagedSequence } from '../types';
import type { StoffverteilungEntry } from '../store/settingsStore';

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

// Generated from WR_CATEGORIES — dark-mode variants for Zoom 1
const SUBJECT_COLORS: Record<string, { bg: string; text: string; border: string; light: string }> = Object.fromEntries(
  WR_CATEGORIES.map(cat => [cat.key, {
    bg: cat.key === 'BWL' ? '#1e3a5f' : cat.key === 'VWL' ? '#3b1f0b' : cat.key === 'RECHT' ? '#052e16' : cat.key === 'IN' ? '#1f2937' : '#2e1065',
    text: cat.border,   // use border color as text in dark mode
    border: cat.color,
    light: cat.bg,
  }])
);

/** The three main WR subject areas (used for Stoffverteilung, totals, etc.) */
const MAIN_AREAS = WR_CATEGORIES.filter(c => ['BWL', 'VWL', 'RECHT'].includes(c.key)).map(c => c.key) as SubjectArea[];

// Stoffverteilung from Grobzuteilung DUY
const STOFF_VERTEILUNG: { semester: string; gym: string; recht: number; bwl: number; vwl: number }[] = [
  { semester: 'S1', gym: 'GYM1', recht: 0, bwl: 3, vwl: 0 },
  { semester: 'S2', gym: 'GYM1', recht: 1, bwl: 2, vwl: 0 },
  { semester: 'S3', gym: 'GYM2', recht: 2, bwl: 1, vwl: 2 },
  { semester: 'S4', gym: 'GYM2', recht: 3, bwl: 0, vwl: 2 },
  { semester: 'S5', gym: 'GYM3', recht: 2, bwl: 0, vwl: 2 },
  { semester: 'S6', gym: 'GYM3', recht: 0, bwl: 2, vwl: 2 },
  { semester: 'S7', gym: 'GYM4', recht: 2, bwl: 0, vwl: 2 },
  { semester: 'S8', gym: 'GYM4', recht: 0, bwl: 2, vwl: 2 },
];

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

// Default SF groups (legacy fallback for SJ 25/26)
const DEFAULT_SF_GROUPS = [
  { cls: '29c', gymYear: 1, semesters: ['S1', 'S2'], label: '29c · GYM1' },
  { cls: '28bc29fs', gymYear: 2, semesters: ['S3', 'S4'], label: '28bc29fs · GYM2' },
  { cls: '27a28f', gymYear: 3, semesters: ['S5', 'S6'], label: '27a28f · GYM3' },
];

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
  const c = SUBJECT_COLORS[area];
  return (
    <div className="flex items-center" style={{ width: `${pct}%`, minWidth: 20 }}>
      <div className="h-5 rounded-sm w-full flex items-center justify-center"
        style={{ background: c.bg, border: `1px solid ${c.border}` }}>
        <span className="text-[8px] font-bold" style={{ color: c.text }}>{weight}</span>
      </div>
    </div>
  );
}

function GoalChip({ goal }: { goal: CurriculumGoal }) {
  const c = SUBJECT_COLORS[goal.area];
  return (
    <div className="flex items-start gap-1 py-0.5 group"
      title={`${goal.goal}\n\nInhalte: ${goal.contents.join(', ')}`}>
      <span className="text-[7px] font-mono px-1 py-px rounded shrink-0"
        style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>
        {goal.id}
      </span>
      <span className="text-[8px] text-gray-300 leading-tight">
        {goal.topic}
      </span>
    </div>
  );
}

function SemesterCard({ sv, expanded, onToggle, allGoals }: {
  sv: typeof STOFF_VERTEILUNG[0];
  expanded: boolean;
  onToggle: () => void;
  allGoals: CurriculumGoal[];
}) {
  const goals = useMemo(() => getGoalsBySemester(sv.semester, allGoals), [sv.semester, allGoals]);
  const total = sv.recht + sv.bwl + sv.vwl;
  
  // Group goals by area
  const goalsByArea = useMemo(() => {
    const grouped = emptyGoalRecord(WR_CATEGORIES) as Record<SubjectArea, CurriculumGoal[]>;
    for (const g of goals) grouped[g.area].push(g);
    return grouped;
  }, [goals]);

  return (
    <div className={`rounded-md border transition-all ${expanded ? 'border-slate-500' : 'border-slate-700 hover:border-slate-600'}`}
      style={{ background: expanded ? '#0f172a' : '#0c1220' }}>
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 cursor-pointer" onClick={onToggle}>
        <span className="text-[11px] font-bold text-gray-200 w-6">{sv.semester}</span>
        {/* Subject distribution bar */}
        <div className="flex-1 flex gap-px">
          <SubjectBar area="BWL" weight={sv.bwl} total={Math.max(total, 1)} />
          <SubjectBar area="VWL" weight={sv.vwl} total={Math.max(total, 1)} />
          <SubjectBar area="RECHT" weight={sv.recht} total={Math.max(total, 1)} />
        </div>
        <span className="text-[8px] text-gray-500 w-12 text-right">{goals.length} Ziele</span>
        <span className="text-[9px] text-gray-500">{expanded ? '▾' : '▸'}</span>
      </div>
      
      {/* Expanded details */}
      {expanded && (
        <div className="px-3 pb-2 space-y-1.5 border-t border-slate-700/50 pt-2">
          {MAIN_AREAS.map(area => {
            const areaGoals = goalsByArea[area];
            if (areaGoals.length === 0) return null;
            const c = SUBJECT_COLORS[area];
            return (
              <div key={area}>
                <div className="flex items-center gap-1 mb-0.5">
                  <span className="text-[8px] font-bold px-1 rounded"
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
    <div className="rounded-md border border-slate-700 bg-slate-900/50 px-3 py-2">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-[11px] font-bold text-gray-200">{semester}</span>
        <span className="text-[8px] text-gray-500">{gymYear}</span>
        <span className="text-[8px] text-gray-600 ml-auto">{total} Lektionen geplant</span>
      </div>
      {total > 0 ? (
        <div className="space-y-1">
          {[...MAIN_AREAS, 'IN' as SubjectArea].map(area => {
            if (stats.counts[area] === 0) return null;
            const c = SUBJECT_COLORS[area];
            return (
              <div key={area} className="flex items-center gap-2">
                <span className="text-[8px] font-bold w-10 shrink-0" style={{ color: c.text }}>{area}</span>
                <div className="flex-1 h-3 bg-slate-800 rounded-sm overflow-hidden">
                  <div className="h-full rounded-sm transition-all" style={{
                    width: `${(stats.counts[area] / total) * 100}%`,
                    background: c.border,
                    opacity: 0.7,
                  }} />
                </div>
                <span className="text-[8px] text-gray-500 w-6 text-right">{stats.counts[area]}</span>
              </div>
            );
          })}
          {/* Topics preview */}
          <div className="mt-1 pt-1 border-t border-slate-700/30">
            {MAIN_AREAS.map(area => {
              if (stats.topics[area].length === 0) return null;
              const c = SUBJECT_COLORS[area];
              return (
                <div key={area} className="text-[7px] text-gray-500 truncate">
                  <span style={{ color: c.text }}>{area}:</span>{' '}
                  {stats.topics[area].slice(0, 3).join(', ')}{stats.topics[area].length > 3 ? ' …' : ''}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-[9px] text-gray-600 italic">Keine Daten verfügbar</div>
      )}
    </div>
  );
}

function ClassViewCard({ group, sequences, stoffverteilung, allGoals }: { group: SFGroup; sequences: ManagedSequence[]; stoffverteilung: { semester: string; gym: string; recht: number; bwl: number; vwl: number }[]; allGoals: CurriculumGoal[] }) {
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
    <div className="rounded-lg border border-slate-600 bg-slate-900/80 overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2 bg-slate-800/50 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-bold text-amber-400">GYM{group.gymYear}</span>
          <span className="text-[10px] font-semibold text-gray-200">{group.cls}</span>
          <span className="text-[8px] text-gray-500 ml-auto">{group.semesters.join(' + ')} · {total} Wochen geplant</span>
        </div>
      </div>

      <div className="p-3 space-y-3">
        {/* Soll vs Ist comparison per semester */}
        {group.semesters.map((sem, idx) => {
          const sv = idx === 0 ? sv1 : sv2;
          if (!sv) return null;
          const goals = semesterGoals[sem] || [];
          return (
            <div key={sem} className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-gray-300">{sem}</span>
                <div className="flex-1 h-px bg-slate-700" />
              </div>
              {/* Soll bar */}
              <div className="flex items-center gap-1.5">
                <span className="text-[7px] text-gray-500 w-8 shrink-0">Soll</span>
                <div className="flex-1 flex gap-px">
                  <SubjectBar area="BWL" weight={sv.bwl} total={Math.max(sv.bwl + sv.vwl + sv.recht, 1)} />
                  <SubjectBar area="VWL" weight={sv.vwl} total={Math.max(sv.bwl + sv.vwl + sv.recht, 1)} />
                  <SubjectBar area="RECHT" weight={sv.recht} total={Math.max(sv.bwl + sv.vwl + sv.recht, 1)} />
                </div>
              </div>
              {/* Ist bars */}
              {total > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[7px] text-gray-500 w-8 shrink-0">Ist</span>
                  <div className="flex-1 flex gap-px">
                    {MAIN_AREAS.map(area => {
                      if (stats.counts[area] === 0) return null;
                      const c = SUBJECT_COLORS[area];
                      const pct = Math.min((stats.counts[area] / Math.max(total, 1)) * 100, 100);
                      return (
                        <div key={area} className="flex items-center" style={{ width: `${pct}%`, minWidth: 20 }}>
                          <div className="h-5 rounded-sm w-full flex items-center justify-center"
                            style={{ background: c.bg, border: `1px solid ${c.border}`, opacity: 0.8 }}>
                            <span className="text-[8px] font-bold" style={{ color: c.text }}>{stats.counts[area]}</span>
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
                {goals.length > 6 && <span className="text-[7px] text-gray-600">+{goals.length - 6} weitere</span>}
              </div>
            </div>
          );
        })}

        {/* Planned blocks detail */}
        {stats.blocks.length > 0 && (
          <div className="border-t border-slate-700/50 pt-2">
            <span className="text-[8px] text-gray-500 font-semibold">Geplante Blöcke:</span>
            <div className="mt-1 space-y-0.5">
              {stats.blocks.map((b, i) => {
                const c = SUBJECT_COLORS[b.area];
                return (
                  <div key={i} className="flex items-center gap-1.5">
                    <span className="text-[7px] px-1 py-px rounded shrink-0"
                      style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>
                      {b.area}
                    </span>
                    <span className="text-[8px] text-gray-300 truncate flex-1">{b.topicMain || b.label}</span>
                    <span className="text-[7px] text-gray-500 shrink-0">{b.weeks}W</span>
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

/** Convert StoffverteilungEntry[] to legacy format for rendering */
function entriesToLegacy(entries: StoffverteilungEntry[]): { semester: string; gym: string; recht: number; bwl: number; vwl: number }[] {
  return entries.map(e => ({
    semester: e.semester,
    gym: e.gym,
    recht: e.weights['RECHT'] || 0,
    bwl: e.weights['BWL'] || 0,
    vwl: e.weights['VWL'] || 0,
  }));
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

  // Dynamic Stoffverteilung from settings, fallback to hardcoded
  const stoffverteilung = useMemo(() => {
    if (settings?.stoffverteilung?.length) return entriesToLegacy(settings.stoffverteilung);
    return STOFF_VERTEILUNG;
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

  // Summary stats
  const totals = useMemo(() => {
    const t = { recht: 0, bwl: 0, vwl: 0, goals: 0 };
    for (const sv of stoffverteilung) {
      t.recht += sv.recht;
      t.bwl += sv.bwl;
      t.vwl += sv.vwl;
    }
    t.goals = effectiveGoals.length;
    return t;
  }, [stoffverteilung, effectiveGoals]);

  return (
    <div className="p-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-bold text-gray-200">◫ Mehrjahresübersicht</h2>
          <p className="text-[9px] text-gray-500 mt-0.5">
            {sfGroups.length > 0
              ? `SF WR · ${gymYears.length} Jahrgänge (${stoffverteilung.at(0)?.semester || 'S1'}–${stoffverteilung.at(-1)?.semester || 'S8'})`
              : 'SF WR · Keine Kurse mit Stufe konfiguriert'}
          </p>
        </div>
        <div className="flex gap-1">
          <button onClick={() => setMode('curriculum')}
            className={`px-2.5 py-1 rounded text-[9px] font-semibold border cursor-pointer transition-colors ${
              mode === 'curriculum' ? 'bg-blue-500/20 border-blue-500 text-blue-300' : 'border-gray-700 text-gray-500 hover:text-gray-300'
            }`}>
            📋 Stoffverteilung
          </button>
          <button onClick={() => setMode('actual')}
            className={`px-2.5 py-1 rounded text-[9px] font-semibold border cursor-pointer transition-colors ${
              mode === 'actual' ? 'bg-green-500/20 border-green-500 text-green-300' : 'border-gray-700 text-gray-500 hover:text-gray-300'
            }`}>
            📊 Ist-Zustand
          </button>
          <button onClick={() => setMode('class')}
            className={`px-2.5 py-1 rounded text-[9px] font-semibold border cursor-pointer transition-colors ${
              mode === 'class' ? 'bg-amber-500/20 border-amber-500 text-amber-300' : 'border-gray-700 text-gray-500 hover:text-gray-300'
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
              <p className="text-gray-400 text-sm">Keine Stoffverteilung konfiguriert</p>
              <p className="text-gray-500 text-[10px] mt-1">Importiere eine Stoffverteilung (JSON) oder konfiguriere Fachbereiche.</p>
              <label className="inline-block mt-3 px-3 py-1.5 rounded border border-blue-500/40 text-blue-300 text-[10px] cursor-pointer hover:bg-blue-500/10">
                📥 Stoffverteilung importieren (JSON)
                <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
              </label>
            </div>
          ) : (
          <>
          {/* Summary bar */}
          <div className="flex items-center gap-3 mb-3 px-2 py-1.5 bg-slate-800/50 rounded-md border border-slate-700">
            <span className="text-[9px] text-gray-400">Gesamt:</span>
            <span className="text-[9px] font-bold" style={{ color: SUBJECT_COLORS.BWL.text }}>BWL {totals.bwl}</span>
            <span className="text-[9px] font-bold" style={{ color: SUBJECT_COLORS.VWL.text }}>VWL {totals.vwl}</span>
            <span className="text-[9px] font-bold" style={{ color: SUBJECT_COLORS.RECHT.text }}>Recht {totals.recht}</span>
            <span className="text-[8px] text-gray-500 ml-auto">{totals.goals} Lehrplanziele</span>
            <label className="text-[8px] text-gray-500 hover:text-gray-300 cursor-pointer" title="Stoffverteilung importieren (JSON)">
              📥<input type="file" accept=".json" className="hidden" onChange={handleImport} />
            </label>
            <button onClick={expandAll} className="text-[8px] text-gray-500 hover:text-gray-300 cursor-pointer" title="Alle aufklappen">⊞</button>
            <button onClick={collapseAll} className="text-[8px] text-gray-500 hover:text-gray-300 cursor-pointer" title="Alle zuklappen">⊟</button>
          </div>

          {/* GYM years */}
          <div className="space-y-4">
            {gymYears.map(({ gym, semesters }) => (
              <div key={gym}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-bold text-amber-500">{gym}</span>
                  <div className="flex-1 h-px bg-amber-800/30" />
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
          <div className="text-[9px] text-gray-500 mb-3 px-2 py-1.5 bg-slate-800/50 rounded-md border border-slate-700">
            Zeigt geplante Lektionen aus den Sequenzen des aktuellen Schuljahres.
          </div>
          {gymYears.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-2xl mb-2">📊</div>
              <p className="text-gray-400 text-sm">Keine Daten verfügbar</p>
              <p className="text-gray-500 text-[10px] mt-1">Konfiguriere Kurse mit Stufe und Stoffverteilung.</p>
            </div>
          ) : (
          <div className="space-y-4">
            {gymYears.map(({ gym, semesters }) => (
              <div key={gym}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-bold text-amber-500">{gym}</span>
                  <div className="flex-1 h-px bg-amber-800/30" />
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
          <div className="text-[9px] text-gray-500 mb-3 px-2 py-1.5 bg-slate-800/50 rounded-md border border-slate-700">
            Zeigt Soll- und Ist-Zustand pro SF-Gruppe im aktuellen Schuljahr.
          </div>
          {sfGroups.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-2xl mb-2">🎓</div>
              <p className="text-gray-400 text-sm">Keine SF-Gruppen konfiguriert</p>
              <p className="text-gray-500 text-[10px] mt-1">Konfiguriere Kurse mit Stufe in den Einstellungen.</p>
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
      <div className="mt-4 pt-3 border-t border-slate-700/50 flex items-center gap-4">
        {MAIN_AREAS.map(area => {
          const c = SUBJECT_COLORS[area];
          return (
            <div key={area} className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm" style={{ background: c.bg, border: `1px solid ${c.border}` }} />
              <span className="text-[8px] font-medium" style={{ color: c.text }}>{area}</span>
            </div>
          );
        })}
        <span className="text-[7px] text-gray-600 ml-auto">Zahlen = Gewichtungseinheiten</span>
      </div>
    </div>
  );
}
