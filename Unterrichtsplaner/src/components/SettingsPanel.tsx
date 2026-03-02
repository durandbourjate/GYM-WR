import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import type { CourseType, DayOfWeek, Semester } from '../types';
import { usePlannerStore } from '../store/plannerStore';
import {
  loadSettings, saveSettings, getDefaultSettings, generateId,
  importCurrentCourses, importCurrentHolidays, importCurrentSpecialWeeks,
  applySettingsToWeekData,
  type PlannerSettings, type CourseConfig, type SpecialWeekConfig, type HolidayConfig,
  type SubjectConfig,
} from '../store/settingsStore';
import { WR_CATEGORIES, generateColorVariants } from '../data/categories';
import { getGymStufe } from '../utils/gradeRequirements';
import { IW_PRESET_2526 } from '../data/iwPresets';
import { useInstanceStore } from '../store/instanceStore';

// === Duration helper for courses ===
const COURSE_DURATION_PRESETS = [
  { min: 45, label: '45 min' },
  { min: 90, label: '90 min' },
  { min: 135, label: '135 min' },
];

function durationToLes(min: number): 1 | 2 | 3 {
  if (min <= 50) return 1;
  if (min <= 100) return 2;
  return 3;
}

function lesToDuration(les: number): number {
  return les * 45;
}

const DAYS: DayOfWeek[] = ['Mo', 'Di', 'Mi', 'Do', 'Fr'];
const COURSE_TYPES: { key: CourseType; label: string }[] = [
  { key: 'SF', label: 'SF' }, { key: 'EWR', label: 'EWR' },
  { key: 'EF', label: 'EF' }, { key: 'KS', label: 'KS' }, { key: 'IN', label: 'IN' },
];

// === Helper Components ===
function Section({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-slate-700 rounded-lg overflow-hidden">
      <button onClick={() => setOpen(!open)}
        className="w-full px-3 py-2 text-left text-[11px] font-semibold text-gray-200 bg-slate-800 hover:bg-slate-750 cursor-pointer flex items-center justify-between">
        {title}
        <span className="text-gray-400">{open ? '▾' : '▸'}</span>
      </button>
      {open && <div className="p-3 space-y-2 bg-slate-900/50">{children}</div>}
    </div>
  );
}

function SmallInput({ value, onChange, placeholder, className = '', type = 'text' }: {
  value: string; onChange: (v: string) => void; placeholder?: string; className?: string; type?: string;
}) {
  return (
    <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} type={type}
      className={`bg-slate-700 text-slate-200 border border-slate-600 rounded px-1.5 py-0.5 text-[10px] outline-none focus:border-blue-400 ${type === 'time' ? 'min-w-[5rem]' : ''} ${className}`} />
  );
}

function SmallSelect<T extends string>({ value, onChange, options }: {
  value: T; onChange: (v: T) => void; options: { key: T; label: string }[];
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value as T)}
      className="bg-slate-700 text-slate-200 border border-slate-600 rounded px-1 py-0.5 text-[9px] outline-none focus:border-blue-400 cursor-pointer">
      {options.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
    </select>
  );
}

// === Subjects / Categories Editor ===
function SubjectsEditor({ subjects, onChange }: { subjects: SubjectConfig[]; onChange: (s: SubjectConfig[]) => void }) {
  const [editingId, setEditingId] = useState<string | null>(null);

  const addSubject = () => {
    const newSubj: SubjectConfig = {
      id: generateId(), label: '', shortLabel: '', color: '#64748b', courseType: 'SF',
    };
    onChange([...subjects, newSubj]);
    setEditingId(newSubj.id);
  };

  const update = (id: string, patch: Partial<SubjectConfig>) => {
    onChange(subjects.map(s => s.id === id ? { ...s, ...patch } : s));
  };

  const remove = (id: string) => {
    if (confirm('Fachbereich wirklich entfernen? Bestehende Zuordnungen bleiben erhalten, werden aber nicht mehr farbig angezeigt.')) {
      onChange(subjects.filter(s => s.id !== id));
      if (editingId === id) setEditingId(null);
    }
  };

  const loadWRDefaults = () => {
    const wrSubjects: SubjectConfig[] = WR_CATEGORIES
      .filter(c => c.key !== 'INTERDISZ')
      .map(c => ({ id: c.key.toLowerCase(), label: c.label, shortLabel: c.shortLabel, color: c.color, courseType: 'SF' as CourseType }));
    onChange(wrSubjects);
  };

  return (
    <div className="space-y-2">
      <p className="text-[8px] text-gray-400">Fachbereiche definieren die Farben und Kategorien für die Unterrichtsplanung. INTERDISZ wird automatisch ergänzt.</p>
      {subjects.length === 0 && (
        <button onClick={loadWRDefaults}
          className="w-full py-1.5 rounded text-[9px] font-medium bg-blue-900/30 border border-blue-500/30 text-blue-300 hover:bg-blue-900/50 cursor-pointer transition-all">
          📋 W&R-Standard laden (BWL, VWL, Recht, IN)
        </button>
      )}
      {subjects.map(s => (
        <div key={s.id}>
          {editingId === s.id ? (
            <div className="bg-slate-800 rounded p-2 space-y-1.5">
              <div className="flex gap-1 items-center">
                <input type="color" value={s.color} onChange={(e) => update(s.id, { color: e.target.value })}
                  className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent" />
                <SmallInput value={s.label} onChange={(v) => update(s.id, { label: v })} placeholder="Name (z.B. Mathematik)" className="flex-1" />
                <SmallInput value={s.shortLabel} onChange={(v) => update(s.id, { shortLabel: v })} placeholder="Kürzel" className="w-12" />
              </div>
              <div className="flex gap-1 items-center">
                <span className="text-[7px] text-gray-400">Vorschau:</span>
                {(() => { const cv = generateColorVariants(s.color); return (
                  <span className="text-[8px] px-1.5 py-0.5 rounded font-semibold" style={{ background: cv.bg, color: cv.fg, border: `1px solid ${cv.border}` }}>
                    {s.shortLabel || s.label || '?'}
                  </span>
                ); })()}
              </div>
              <div className="flex gap-1 mt-1">
                <button onClick={() => setEditingId(null)} className="text-[8px] text-blue-400 cursor-pointer">✓ Fertig</button>
                <button onClick={() => remove(s.id)} className="text-[8px] text-red-400 cursor-pointer ml-auto">Entfernen</button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-[9px] text-gray-400 hover:text-gray-200 cursor-pointer group px-1 py-0.5"
              onClick={() => setEditingId(s.id)}>
              <div className="w-3 h-3 rounded-sm shrink-0" style={{ background: s.color }} />
              <span className="font-medium text-gray-300">{s.label || '(unbenennt)'}</span>
              <span className="text-gray-500">{s.shortLabel}</span>
            </div>
          )}
        </div>
      ))}
      <button onClick={addSubject}
        className="w-full py-1 rounded border border-dashed border-gray-600 text-gray-400 hover:text-gray-300 hover:border-gray-400 text-[9px] cursor-pointer transition-all">
        + Fachbereich hinzufügen
      </button>
    </div>
  );
}

// === Course Duration Picker ===
function CourseDurationPicker({ value, onChange }: { value: number; onChange: (min: number) => void }) {
  const [customMode, setCustomMode] = useState(false);
  const [customVal, setCustomVal] = useState('');
  const isPreset = COURSE_DURATION_PRESETS.some(p => p.min === value);

  return (
    <div className="flex flex-wrap gap-1 items-center">
      {COURSE_DURATION_PRESETS.map(p => (
        <button key={p.min} onClick={() => { onChange(p.min); setCustomMode(false); }}
          className={`px-1.5 py-0.5 rounded text-[9px] font-medium border cursor-pointer transition-all ${
            value === p.min ? 'bg-blue-600/30 border-blue-500 text-gray-200' : 'border-gray-600 text-gray-400 hover:text-gray-300'
          }`}>
          {p.label}
        </button>
      ))}
      {customMode || (!isPreset && value > 0) ? (
        <div className="flex items-center gap-0.5">
          <input autoFocus={customMode} type="number" value={!isPreset ? String(value) : customVal}
            onChange={(e) => { const n = parseInt(e.target.value) || 0; setCustomVal(e.target.value); if (n > 0) onChange(n); }}
            onKeyDown={(e) => { if (e.key === 'Escape') setCustomMode(false); }}
            placeholder="min"
            className="bg-slate-700 text-slate-200 border border-blue-400 rounded px-1.5 py-0.5 text-[9px] outline-none w-14" />
          <span className="text-[8px] text-gray-400">min</span>
        </div>
      ) : (
        <button onClick={() => setCustomMode(true)}
          className="px-1.5 py-0.5 rounded text-[9px] border border-dashed border-gray-600 text-gray-400 hover:text-gray-300 cursor-pointer">
          Andere
        </button>
      )}
    </div>
  );
}

// === Course Editor ===
function CourseEditor({ courses, onChange }: { courses: CourseConfig[]; onChange: (c: CourseConfig[]) => void }) {
  const [editingId, setEditingId] = useState<string | null>(null);

  const addCourse = () => {
    const newCourse: CourseConfig = {
      id: generateId(), cls: '', typ: 'SF', day: 'Mo',
      from: '08:05', to: '08:50', les: 1, hk: false, semesters: [1, 2],
    };
    onChange([...courses, newCourse]);
    setEditingId(newCourse.id);
  };

  const updateCourse = (id: string, patch: Partial<CourseConfig>) => {
    onChange(courses.map(c => c.id === id ? { ...c, ...patch } : c));
  };

  const removeCourse = (id: string) => {
    if (confirm('Kurs wirklich entfernen?')) {
      onChange(courses.filter(c => c.id !== id));
      if (editingId === id) setEditingId(null);
    }
  };

  // Group by class+type — use stable ID-based group keys to prevent focus loss on edit
  const grouped = useMemo(() => {
    const groups: { key: string; stableKey: string; courses: CourseConfig[] }[] = [];
    const seen = new Map<string, number>();
    for (const c of courses) {
      const groupLabel = `${c.cls}|${c.typ}`;
      if (seen.has(groupLabel)) {
        groups[seen.get(groupLabel)!].courses.push(c);
      } else {
        seen.set(groupLabel, groups.length);
        groups.push({ key: groupLabel, stableKey: c.id, courses: [c] });
      }
    }
    return groups;
  }, [courses]);

  return (
    <div className="space-y-2">
      {grouped.map(({ stableKey, courses: group }) => (
        <div key={stableKey} className="border border-slate-700/50 rounded p-2 space-y-1">
          <div className="text-[9px] font-semibold text-gray-300">
            {group[0].cls || '(neu)'} <span className="text-blue-400">{group[0].typ}</span>
          </div>
          {group.map(c => (
            <div key={c.id}>
              {editingId === c.id ? (
                <div className="space-y-1.5 bg-slate-800 rounded p-2">
                  <div className="flex gap-1 flex-wrap">
                    <SmallInput value={c.cls} onChange={(v) => updateCourse(c.id, { cls: v })} placeholder="Klasse" className="w-20" />
                    <SmallSelect value={c.typ} onChange={(v) => updateCourse(c.id, { typ: v })} options={COURSE_TYPES} />
                    <SmallSelect value={c.day} onChange={(v) => updateCourse(c.id, { day: v })} options={DAYS.map(d => ({ key: d, label: d }))} />
                  </div>
                  <div className="flex gap-1 items-center flex-wrap">
                    <SmallInput value={c.from} onChange={(v) => updateCourse(c.id, { from: v })} placeholder="08:05" className="w-24 text-[11px]" type="time" />
                    <span className="text-[10px] text-gray-400">–</span>
                    <SmallInput value={c.to} onChange={(v) => updateCourse(c.id, { to: v })} placeholder="08:50" className="w-24 text-[11px]" type="time" />
                  </div>
                  <div>
                    <label className="text-[8px] text-gray-400 mb-0.5 block">Dauer</label>
                    <CourseDurationPicker value={c.les * 45} onChange={(min) => updateCourse(c.id, { les: durationToLes(min) })} />
                  </div>
                  <div className="flex gap-3 items-center flex-wrap">
                    <label className="flex items-center gap-1 text-[9px] text-gray-400 cursor-pointer">
                      <input type="checkbox" checked={c.hk} onChange={(e) => updateCourse(c.id, { hk: e.target.checked })} className="cursor-pointer" />
                      HK
                    </label>
                    <label className="flex items-center gap-1 text-[9px] text-gray-400 cursor-pointer">
                      <input type="checkbox" checked={c.semesters.includes(1)} onChange={(e) => {
                        const s = e.target.checked ? [...new Set([...c.semesters, 1 as Semester])] : c.semesters.filter(x => x !== 1);
                        updateCourse(c.id, { semesters: s });
                      }} className="cursor-pointer" />
                      S1
                    </label>
                    <label className="flex items-center gap-1 text-[9px] text-gray-400 cursor-pointer">
                      <input type="checkbox" checked={c.semesters.includes(2)} onChange={(e) => {
                        const s = e.target.checked ? [...new Set([...c.semesters, 2 as Semester])] : c.semesters.filter(x => x !== 2);
                        updateCourse(c.id, { semesters: s });
                      }} className="cursor-pointer" />
                      S2
                    </label>
                    <label className="flex items-center gap-1 text-[9px] text-gray-400 cursor-pointer" title="Selbstorganisiertes Lernen">
                      <input type="checkbox" checked={!!c.sol} onChange={(e) => updateCourse(c.id, { sol: e.target.checked || undefined })} className="cursor-pointer" />
                      SOL
                    </label>
                  </div>
                  <SmallInput value={c.note || ''} onChange={(v) => updateCourse(c.id, { note: v || undefined })} placeholder="Bemerkung (optional)" className="w-full" />
                  <div className="flex gap-1 mt-1">
                    <button onClick={() => setEditingId(null)} className="text-[8px] text-blue-400 cursor-pointer">✓ Fertig</button>
                    <button onClick={() => removeCourse(c.id)} className="text-[8px] text-red-400 cursor-pointer ml-auto">Entfernen</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-[9px] text-gray-400 hover:text-gray-200 cursor-pointer group"
                  onClick={() => setEditingId(c.id)}>
                  <span className="text-gray-400 font-mono">{c.day}</span>
                  <span>{c.from}–{c.to}</span>
                  <span className="text-gray-500">{c.les * 45}min{c.hk ? ' HK' : ''}</span>
                  <span className="text-gray-500">{c.semesters.map(s => `S${s}`).join('+')}</span>
                  {c.note && <span className="text-amber-600 text-[8px]">{c.note}</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      ))}
      <button onClick={addCourse}
        className="w-full py-1.5 rounded border border-dashed border-gray-600 text-gray-400 hover:text-gray-300 hover:border-gray-400 text-[9px] cursor-pointer transition-all">
        + Kurs hinzufügen
      </button>
    </div>
  );
}

// === GYM-Level helpers ===
const GYM_LEVEL_OPTIONS: { key: string; label: string }[] = [
  { key: 'alle', label: 'alle' },
  { key: 'GYM1', label: 'GYM1' },
  { key: 'GYM2', label: 'GYM2' },
  { key: 'GYM3', label: 'GYM3' },
  { key: 'GYM4', label: 'GYM4' },
  { key: 'GYM5', label: 'GYM5' },
  { key: 'TaF', label: 'TaF' },
];

/**
 * Derive GYM level from a class name for course-exclusion purposes.
 * Reuses the Maturjahrgang logic from gradeRequirements.ts.
 * TaF classes have 'f' or 's' suffix (e.g. 29fs, 28f).
 */
function getCourseGymLevel(cls: string): string {
  // TaF detection: class name ends with 'f', 's', or 'fs' (e.g. '29fs', '28f', '30s')
  if (/\d{2}[fs]+$/.test(cls) || /[fs]{1,2}$/.test(cls.replace(/\d/g, ''))) {
    // Mixed classes like '28bc29fs' contain both regular and TaF
    // If the class is purely TaF (e.g. '29fs', '30s'), return 'TaF'
    // If mixed (e.g. '27a28f'), derive from the primary regular class
  }
  const stufe = getGymStufe(cls);
  if (stufe === 'UNKNOWN') return 'alle';
  return stufe;
}

/**
 * Compute excludedCourseIds based on gymLevel:
 * All courses whose class does NOT match the gymLevel are excluded.
 */
function computeExcludedCourses(gymLevel: string | undefined, courses: CourseConfig[]): string[] {
  if (!gymLevel || gymLevel === 'alle') return [];

  const excluded: string[] = [];
  for (const c of courses) {
    const courseLevel = getCourseGymLevel(c.cls);
    // For TaF: exclude courses that don't have TaF students
    if (gymLevel === 'TaF') {
      const isTaF = /[fs]/.test(c.cls.replace(/\d/g, ''));
      if (!isTaF) excluded.push(c.id);
    } else {
      // For GYM1-5: exclude courses whose GYM level doesn't match
      if (courseLevel !== gymLevel && courseLevel !== 'alle') {
        excluded.push(c.id);
      }
    }
  }
  return excluded;
}

// === Special Weeks Editor (Hierarchisch: KW → GYM-Stufen) ===
function SpecialWeeksEditor({ weeks, courses, onChange }: {
  weeks: SpecialWeekConfig[]; courses: CourseConfig[]; onChange: (w: SpecialWeekConfig[]) => void;
}) {
  const [expandedWeek, setExpandedWeek] = useState<string | null>(null);

  // Group by KW for hierarchical display
  const grouped = useMemo(() => {
    const map = new Map<string, SpecialWeekConfig[]>();
    for (const w of weeks) {
      const kw = w.week;
      if (!map.has(kw)) map.set(kw, []);
      map.get(kw)!.push(w);
    }
    // Sort by KW number (school year order: KW33-52 then KW01-27)
    return [...map.entries()].sort((a, b) => {
      const na = parseInt(a[0]) || 0, nb = parseInt(b[0]) || 0;
      const wa = na >= 33 ? na : na + 52;
      const wb = nb >= 33 ? nb : nb + 52;
      return wa - wb;
    });
  }, [weeks]);

  const addEntry = (kw: string) => {
    onChange([...weeks, { id: generateId(), label: '', week: kw, type: 'event' }]);
  };

  const addNewWeek = () => {
    const newKw = '';
    onChange([...weeks, { id: generateId(), label: '', week: newKw, type: 'event' }]);
    setExpandedWeek('');
  };

  const update = (id: string, patch: Partial<SpecialWeekConfig>) => {
    onChange(weeks.map(w => w.id === id ? { ...w, ...patch } : w));
  };

  const updateGymLevel = (id: string, gymLevel: string) => {
    const level = gymLevel === 'alle' ? undefined : gymLevel;
    const excluded = computeExcludedCourses(level, courses);
    onChange(weeks.map(w => w.id === id ? { ...w, gymLevel: level, excludedCourseIds: excluded.length > 0 ? excluded : undefined } : w));
  };

  const remove = (id: string) => {
    onChange(weeks.filter(w => w.id !== id));
  };

  const loadIWPreset = () => {
    // Add IW preset entries (don't overwrite existing)
    const existingIds = new Set(weeks.map(w => w.id));
    const newEntries = IW_PRESET_2526
      .filter(e => !existingIds.has(e.id))
      .map(e => ({
        ...e,
        // Auto-compute excludedCourseIds for each preset entry
        excludedCourseIds: computeExcludedCourses(e.gymLevel, courses) || undefined,
      }));
    if (newEntries.length === 0) {
      alert('Alle IW-Einträge sind bereits vorhanden.');
      return;
    }
    onChange([...weeks, ...newEntries]);
  };

  return (
    <div className="space-y-1.5">
      <p className="text-[8px] text-gray-400">Pro Kalenderwoche können verschiedene GYM-Stufen unterschiedliche Sonderwochen haben. Klicke auf eine KW um Details zu bearbeiten.</p>
      {grouped.map(([kw, entries]) => {
        const isExpanded = expandedWeek === kw;
        // Build label with GYM-Stufe badges
        const labelParts = entries.map(e => {
          const badge = e.gymLevel ? `${e.gymLevel} ` : '';
          return badge + (e.label || '');
        }).filter(Boolean);
        const labels = labelParts.join(', ');
        return (
          <div key={kw || 'new'} className="border border-slate-700/50 rounded overflow-hidden">
            <div className="flex items-center gap-2 px-2 py-1.5 bg-slate-800/50 cursor-pointer hover:bg-slate-800"
              onClick={() => setExpandedWeek(isExpanded ? null : kw)}>
              <span className="text-[9px] text-gray-400">{isExpanded ? '▾' : '▸'}</span>
              <span className="text-[10px] font-semibold text-amber-400 font-mono w-10">{kw ? `KW${kw}` : 'Neu'}</span>
              <span className="text-[9px] text-gray-300 truncate flex-1">
                {entries.map((e, i) => (
                  <span key={e.id}>
                    {i > 0 && ', '}
                    {e.gymLevel && <span className="text-[8px] font-semibold text-blue-400">{e.gymLevel} </span>}
                    {e.label || '(unbenannt)'}
                  </span>
                ))}
              </span>
              <span className="text-[8px] text-gray-500">{entries.length} {entries.length === 1 ? 'Eintrag' : 'Einträge'}</span>
            </div>
            {isExpanded && (
              <div className="p-2 space-y-2 bg-slate-900/30">
                {entries.map(w => (
                  <div key={w.id} className="bg-slate-800 rounded p-2 space-y-1.5">
                    <div className="flex gap-1 items-center">
                      <SmallInput value={w.week} onChange={(v) => update(w.id, { week: v })} placeholder="KW" className="w-10" />
                      <SmallInput value={w.label} onChange={(v) => update(w.id, { label: v })} placeholder="z.B. Medienwoche" className="flex-1" />
                      <SmallSelect value={w.gymLevel || 'alle'} onChange={(v) => updateGymLevel(w.id, v)}
                        options={GYM_LEVEL_OPTIONS} />
                      <SmallSelect value={w.type} onChange={(v) => update(w.id, { type: v })}
                        options={[{ key: 'event', label: '📅 Event' }, { key: 'holiday', label: '🏖 Frei' }]} />
                      <button onClick={() => remove(w.id)} className="text-[8px] text-red-400 cursor-pointer">✕</button>
                    </div>
                    {/* Day selector */}
                    <div className="flex items-center gap-1">
                      <span className="text-[7px] text-gray-400">Tage:</span>
                      {['Mo', 'Di', 'Mi', 'Do', 'Fr'].map((day, di) => {
                        const dayNum = di + 1;
                        const days = w.days || [1,2,3,4,5]; // default all
                        const active = days.includes(dayNum);
                        return (
                          <button key={day} onClick={() => {
                            const current = w.days || [1,2,3,4,5];
                            const next = active ? current.filter(d => d !== dayNum) : [...current, dayNum].sort();
                            update(w.id, { days: next.length === 5 ? undefined : next }); // undefined = all
                          }}
                            className={`px-1.5 py-px rounded text-[8px] cursor-pointer transition-all ${
                              active ? 'bg-amber-700/40 text-amber-300 border border-amber-500/50' : 'bg-slate-700 text-gray-500 border border-transparent'
                            }`}>
                            {day}
                          </button>
                        );
                      })}
                      {(w.days && w.days.length < 5) && (
                        <button onClick={() => update(w.id, { days: undefined })}
                          className="text-[7px] text-gray-500 cursor-pointer hover:text-gray-300 ml-1">Ganze Woche</button>
                      )}
                    </div>
                    {/* Course exclusions */}
                    {courses.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        <span className="text-[7px] text-gray-400">Ausgenommen:</span>
                        {courses.map(c => {
                          const excluded = w.excludedCourseIds?.includes(c.id);
                          return (
                            <button key={c.id} onClick={() => {
                              const current = w.excludedCourseIds || [];
                              update(w.id, {
                                excludedCourseIds: excluded ? current.filter(x => x !== c.id) : [...current, c.id]
                              });
                            }}
                              className={`text-[7px] px-1 py-px rounded cursor-pointer ${excluded ? 'bg-red-900/40 text-red-300 border border-red-500/50' : 'bg-slate-700 text-gray-400 border border-transparent'}`}>
                              {c.cls} {c.day}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
                <button onClick={() => addEntry(kw)}
                  className="w-full py-1 rounded border border-dashed border-gray-600 text-gray-400 hover:text-gray-300 text-[8px] cursor-pointer">
                  + Weiteren Eintrag für KW{kw}
                </button>
              </div>
            )}
          </div>
        );
      })}
      <button onClick={addNewWeek}
        className="w-full py-1.5 rounded border border-dashed border-gray-600 text-gray-400 hover:text-gray-300 hover:border-gray-400 text-[9px] cursor-pointer transition-all">
        + Sonderwoche hinzufügen
      </button>
      <button onClick={loadIWPreset}
        className="w-full py-1.5 rounded text-[9px] font-medium bg-amber-900/30 border border-amber-500/30 text-amber-300 hover:bg-amber-900/50 cursor-pointer transition-all">
        IW-Plan SJ 25/26 laden
      </button>
    </div>
  );
}

// === Holidays Editor (mit Tagesauswahl für partielle Wochen) ===
function HolidaysEditor({ holidays, onChange }: { holidays: HolidayConfig[]; onChange: (h: HolidayConfig[]) => void }) {
  const addHoliday = () => {
    onChange([...holidays, { id: generateId(), label: '', startWeek: '', endWeek: '' }]);
  };

  const update = (id: string, patch: Partial<HolidayConfig>) => {
    onChange(holidays.map(h => h.id === id ? { ...h, ...patch } : h));
  };

  const remove = (id: string) => {
    onChange(holidays.filter(h => h.id !== id));
  };

  return (
    <div className="space-y-1.5">
      <p className="text-[8px] text-gray-400">Ferienperioden als KW-Bereiche. Standard = ganze Wochen. Für Einzeltage (z.B. Auffahrt) die betroffenen Tage wählen.</p>
      {holidays.map(h => (
        <div key={h.id} className="bg-slate-800 rounded p-2 space-y-1.5">
          <div className="flex gap-1 items-center">
            <SmallInput value={h.label} onChange={(v) => update(h.id, { label: v })} placeholder="Name (z.B. Herbstferien)" className="flex-1" />
            <span className="text-[8px] text-gray-400">KW</span>
            <SmallInput value={h.startWeek} onChange={(v) => update(h.id, { startWeek: v })} placeholder="von" className="w-10" />
            <span className="text-[8px] text-gray-400">–</span>
            <SmallInput value={h.endWeek} onChange={(v) => update(h.id, { endWeek: v })} placeholder="bis" className="w-10" />
            <button onClick={() => remove(h.id)} className="text-[8px] text-red-400 cursor-pointer">✕</button>
          </div>
          {/* Day selector for partial holidays */}
          <div className="flex items-center gap-1">
            <span className="text-[7px] text-gray-400">Tage:</span>
            {['Mo', 'Di', 'Mi', 'Do', 'Fr'].map((day, di) => {
              const dayNum = di + 1;
              const days = h.days || [1,2,3,4,5];
              const active = days.includes(dayNum);
              return (
                <button key={day} onClick={() => {
                  const current = h.days || [1,2,3,4,5];
                  const next = active ? current.filter(d => d !== dayNum) : [...current, dayNum].sort();
                  update(h.id, { days: next.length === 5 ? undefined : next });
                }}
                  className={`px-1.5 py-px rounded text-[8px] cursor-pointer transition-all ${
                    active ? 'bg-gray-600/40 text-gray-200 border border-gray-500/50' : 'bg-slate-700 text-gray-500 border border-transparent'
                  }`}>
                  {day}
                </button>
              );
            })}
            {(h.days && h.days.length < 5) && (
              <button onClick={() => update(h.id, { days: undefined })}
                className="text-[7px] text-gray-500 cursor-pointer hover:text-gray-300 ml-1">Ganze Woche</button>
            )}
          </div>
        </div>
      ))}
      <button onClick={addHoliday}
        className="w-full py-1 rounded border border-dashed border-gray-600 text-gray-400 hover:text-gray-300 text-[9px] cursor-pointer">
        + Ferienperiode hinzufügen
      </button>
    </div>
  );
}

// === Re-apply Settings to Weeks (rarely needed) ===
function ReapplyButton({ settings }: { settings: PlannerSettings }) {
  const [result, setResult] = useState<{ holidays: number; specials: number } | null>(null);

  const applyToWeeks = () => {
    const store = usePlannerStore.getState();
    const applied = applySettingsToWeekData(store.weekData, settings);
    store.pushUndo();
    store.setWeekData(applied.weekData);
    setResult({ holidays: applied.holidayWeeks, specials: applied.specialWeeks });
    setTimeout(() => setResult(null), 4000);
  };

  const totalEntries = settings.holidays.length + settings.specialWeeks.length;

  return (
    <div className="space-y-1">
      {result && (
        <div className="text-[8px] p-1.5 rounded bg-green-900/30 text-green-300">
          ✅ {result.holidays} Ferienwochen und {result.specials} Sonderwochen eingetragen. Undo verfügbar.
        </div>
      )}
      <button onClick={() => {
        if (totalEntries === 0) return;
        if (confirm(`${totalEntries} Einträge (Ferien + Sonderwochen) erneut in die Planerdaten übernehmen? (Undo möglich)`)) {
          applyToWeeks();
        }
      }}
        className="text-[8px] text-gray-500 hover:text-gray-300 cursor-pointer"
        disabled={totalEntries === 0}>
        🔄 Ferien & Sonderwochen erneut eintragen
      </button>
    </div>
  );
}

// === Main Settings Panel ===
export function SettingsPanel() {
  const storeSettings = usePlannerStore(s => s.plannerSettings);
  const setPlannerSettings = usePlannerStore(s => s.setPlannerSettings);

  const [settings, setSettings] = useState<PlannerSettings>(() => {
    if (storeSettings) return storeSettings;
    const global = loadSettings();
    if (global) return global;
    return getDefaultSettings();
  });
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);

  // Auto-save with debounce (300ms)
  const doSave = useCallback((s: PlannerSettings) => {
    setPlannerSettings(s);
    saveSettings(s);
    // Auto-apply holidays & special weeks to weekData
    const store = usePlannerStore.getState();
    if (store.weekData.length > 0 && (s.holidays.length > 0 || s.specialWeeks.length > 0)) {
      const applied = applySettingsToWeekData(store.weekData, s);
      store.pushUndo();
      store.setWeekData(applied.weekData);
    }
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 1500);
  }, [setPlannerSettings]);

  const updateSettings = useCallback((patch: Partial<PlannerSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...patch };
      // Debounced auto-save
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      setSaveStatus('saving');
      saveTimerRef.current = setTimeout(() => doSave(next), 400);
      return next;
    });
  }, [doSave]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, []);

  const handleReset = useCallback(() => {
    if (confirm('Alle Einstellungen zurücksetzen? Die bestehende Planung bleibt erhalten.')) {
      const fresh = getDefaultSettings();
      setSettings(fresh);
      doSave(fresh);
    }
  }, [doSave]);

  const hasCustomSettings = storeSettings !== null || loadSettings() !== null;

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[11px] font-bold text-gray-200">Einstellungen</h3>
          <p className="text-[8px] text-gray-400 mt-0.5">
            {hasCustomSettings ? 'Eigene Konfiguration aktiv' : 'Standard-Konfiguration (DUY SJ 25/26)'}
          </p>
        </div>
        <div className="flex gap-1 items-center">
          {saveStatus === 'saving' && <span className="text-[9px] text-gray-500">Speichern…</span>}
          {saveStatus === 'saved' && <span className="text-[9px] text-green-400">✓ Gespeichert</span>}
        </div>
      </div>

      {/* Import from hardcoded data */}
      {settings.courses.length === 0 && (
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
          <p className="text-[9px] text-blue-300 mb-2">Keine Kurse konfiguriert. Du kannst den aktuellen Stundenplan importieren oder von Grund auf neu anfangen.</p>
          <button onClick={() => {
            const courses = importCurrentCourses();
            const holidays = importCurrentHolidays();
            const specialWeeks = importCurrentSpecialWeeks();
            updateSettings({ courses, holidays, specialWeeks });
          }}
            className="px-3 py-1 rounded text-[9px] font-medium bg-blue-600 hover:bg-blue-500 text-white cursor-pointer transition-all">
            📋 Aktuellen Stundenplan (DUY SJ 25/26) importieren
          </button>
        </div>
      )}

      {/* School basics */}
      <Section title="🏫 Schule & Grundeinstellungen" defaultOpen>
        <div className="space-y-1.5">
          <div>
            <label className="text-[8px] text-gray-400 mb-0.5 block">Schulname (optional)</label>
            <SmallInput value={settings.school?.name || ''} onChange={(v) => updateSettings({ school: { ...settings.school!, name: v } })} placeholder="z.B. Gymnasium Hofwil" className="w-full" />
          </div>
          <div>
            <label className="text-[8px] text-gray-400 mb-0.5 block">Standard-Lektionsdauer (Minuten)</label>
            <SmallInput value={String(settings.school?.lessonDurationMin || 45)} onChange={(v) => {
              const n = parseInt(v) || 45;
              updateSettings({ school: { ...settings.school!, lessonDurationMin: n } });
            }} placeholder="45" className="w-16" type="number" />
          </div>
        </div>
      </Section>

      {/* Subjects / Categories */}
      <Section title={`🎨 Fachbereiche (${settings.subjects.length})`}>
        <SubjectsEditor subjects={settings.subjects} onChange={(s) => updateSettings({ subjects: s })} />
      </Section>

      {/* Courses */}
      <Section title={`📚 Kurse / Stundenplan (${settings.courses.length})`}>
        <CourseEditor courses={settings.courses} onChange={(c) => updateSettings({ courses: c })} />
      </Section>

      {/* Special Weeks */}
      <Section title={`📅 Sonderwochen (${settings.specialWeeks.length})`}>
        <SpecialWeeksEditor weeks={settings.specialWeeks} courses={settings.courses} onChange={(w) => updateSettings({ specialWeeks: w })} />
      </Section>

      {/* Holidays */}
      <Section title={`🏖 Ferien (${settings.holidays.length})`}>
        <HolidaysEditor holidays={settings.holidays} onChange={(h) => updateSettings({ holidays: h })} />
      </Section>

      {/* Export / Import JSON */}
      <Section title="💾 Daten exportieren / importieren">
        <div className="space-y-3">
          <div>
            <p className="text-[8px] text-gray-400 font-semibold mb-1">Konfiguration (Kurse, Ferien, Sonderwochen, Fächer)</p>
            <div className="flex gap-1">
              <button onClick={() => {
                const activeMeta = useInstanceStore.getState().getActive();
                const planerName = (activeMeta?.name || 'planer').replace(/[^a-zA-Z0-9äöüÄÖÜ_-]/g, '_');
                const datum = new Date().toISOString().slice(0, 10);
                const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url; a.download = `planer-config-${planerName}-${datum}.json`; a.click();
                URL.revokeObjectURL(url);
              }}
                className="flex-1 py-1.5 rounded text-[9px] font-medium bg-slate-700 hover:bg-slate-600 text-gray-200 cursor-pointer transition-all">
                📤 Konfiguration exportieren
              </button>
              <label className="flex-1 py-1.5 rounded text-[9px] font-medium bg-slate-700 hover:bg-slate-600 text-gray-200 text-center cursor-pointer transition-all">
                📥 Konfiguration importieren
                <input type="file" accept=".json" className="hidden" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => {
                    try {
                      const imported = JSON.parse(reader.result as string);
                      // Validate required fields
                      if (!imported || typeof imported !== 'object') {
                        alert('Ungültige Datei: Kein gültiges JSON-Objekt.');
                        return;
                      }
                      if (!Array.isArray(imported.courses)) {
                        alert('Ungültige Datei: Feld "courses" fehlt oder ist kein Array.');
                        return;
                      }
                      if (!Array.isArray(imported.holidays)) {
                        alert('Ungültige Datei: Feld "holidays" fehlt oder ist kein Array.');
                        return;
                      }
                      if (!Array.isArray(imported.specialWeeks)) {
                        alert('Ungültige Datei: Feld "specialWeeks" fehlt oder ist kein Array.');
                        return;
                      }
                      // Confirm before overwriting
                      if (!confirm(`Bestehende Einstellungen werden überschrieben (${imported.courses.length} Kurse, ${imported.holidays.length} Ferienperioden, ${imported.specialWeeks.length} Sonderwochen). Fortfahren?`)) {
                        return;
                      }
                      setSettings(imported as PlannerSettings);
                      doSave(imported as PlannerSettings);
                    } catch { alert('Fehler beim Lesen der Datei.'); }
                  };
                  reader.readAsText(file);
                  e.target.value = ''; // Reset to allow re-import of same file
                }} />
              </label>
            </div>
          </div>

          <div className="border-t border-slate-700 pt-2">
            <p className="text-[8px] text-gray-400 font-semibold mb-1">Planerdaten (Lektionen, Sequenzen, Details)</p>
            <div className="flex gap-1">
              <button onClick={() => {
                const json = usePlannerStore.getState().exportData();
                const blob = new Blob([json], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url; a.download = `unterrichtsplaner-daten-${new Date().toISOString().slice(0, 10)}.json`; a.click();
                URL.revokeObjectURL(url);
              }}
                className="flex-1 py-1.5 rounded text-[9px] font-medium bg-slate-700 hover:bg-slate-600 text-gray-200 cursor-pointer transition-all">
                ⬇ Export
              </button>
              <label className="flex-1 py-1.5 rounded text-[9px] font-medium bg-slate-700 hover:bg-slate-600 text-gray-200 text-center cursor-pointer transition-all">
                ⬆ Import
                <input type="file" accept=".json" className="hidden" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => {
                    try {
                      const success = usePlannerStore.getState().importData(reader.result as string);
                      if (success) {
                        alert('Planerdaten erfolgreich importiert.');
                      } else {
                        alert('Ungültige Datei: Keine gültigen Planerdaten gefunden.');
                      }
                    } catch { alert('Fehler beim Lesen der Datei.'); }
                  };
                  reader.readAsText(file);
                }} />
              </label>
            </div>
          </div>
        </div>
      </Section>

      {/* Danger zone */}
      <div className="pt-2 border-t border-slate-700">
        <button onClick={handleReset}
          className="text-[9px] text-red-400 hover:text-red-300 cursor-pointer">
          ⚠ Einstellungen zurücksetzen
        </button>
      </div>
    </div>
  );
}
