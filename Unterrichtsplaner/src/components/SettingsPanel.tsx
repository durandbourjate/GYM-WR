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
import { useInstanceStore, weekToDate } from '../store/instanceStore';
import { useGCalStore } from '../store/gcalStore';
import { loginWithGoogle, logout as gcalLogout, fetchCalendarList, syncPlannerToCalendar, buildWeekYearMap, scanCalendarsForSpecialWeeks, checkCollisions, type SyncProgress, type ImportCandidate } from '../services/gcal';

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

/** Add minutes to a "HH:MM" time string, return "HH:MM" */
function addMinutesToTime(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return time;
  const total = h * 60 + m + minutes;
  const rh = Math.floor(total / 60) % 24;
  const rm = total % 60;
  return `${String(rh).padStart(2, '0')}:${String(rm).padStart(2, '0')}`;
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
                    <div>
                      <label className="text-[8px] text-gray-400 mb-0.5 block">Beginn</label>
                      <SmallInput value={c.from} onChange={(v) => {
                        const autoEnd = addMinutesToTime(v, c.les * 45);
                        updateCourse(c.id, { from: v, to: autoEnd });
                      }} placeholder="08:05" className="w-28 text-[11px]" type="time" />
                    </div>
                    <span className="text-[10px] text-gray-400 mt-4">–</span>
                    <div>
                      <label className="text-[8px] text-gray-400 mb-0.5 block">Ende <span className="text-gray-500">(auto)</span></label>
                      <SmallInput value={c.to} onChange={(v) => updateCourse(c.id, { to: v })} placeholder="08:50" className="w-28 text-[11px]" type="time" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[8px] text-gray-400 mb-0.5 block">Dauer</label>
                    <CourseDurationPicker value={c.les * 45} onChange={(min) => {
                      const autoEnd = addMinutesToTime(c.from, min);
                      updateCourse(c.id, { les: durationToLes(min), to: autoEnd });
                    }} />
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
                  <div className="flex gap-1 mt-1 flex-wrap">
                    <button onClick={() => setEditingId(null)} className="text-[8px] text-blue-400 cursor-pointer">✓ Fertig</button>
                    <button onClick={() => {
                      const dup: CourseConfig = { ...c, id: generateId(), day: 'Di' as DayOfWeek };
                      onChange([...courses, dup]);
                      setEditingId(dup.id);
                    }} className="text-[8px] text-green-400 cursor-pointer" title="Kurs mit anderem Tag duplizieren (z.B. für Di+Do-Kurse)">+ Tag</button>
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
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());

  const addHoliday = () => {
    onChange([...holidays, { id: generateId(), label: '', startWeek: '', endWeek: '' }]);
  };

  const update = (id: string, patch: Partial<HolidayConfig>) => {
    onChange(holidays.map(h => h.id === id ? { ...h, ...patch } : h));
  };

  const remove = (id: string) => {
    onChange(holidays.filter(h => h.id !== id));
  };

  const toggleExpanded = (id: string) => {
    setExpandedDays(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-1.5">
      <p className="text-[8px] text-gray-400">Ferienperioden als KW-Bereiche. Tagesauswahl erscheint automatisch bei Einzelwochen (z.B. Auffahrt).</p>
      {holidays.map(h => {
        const isSingleWeek = h.startWeek && h.endWeek && h.startWeek === h.endWeek;
        const hasPartialDays = h.days && h.days.length < 5;
        const showDays = isSingleWeek || hasPartialDays || expandedDays.has(h.id);
        return (
        <div key={h.id} className="bg-slate-800 rounded p-2 space-y-1.5">
          <div className="flex gap-1 items-center">
            <SmallInput value={h.label} onChange={(v) => update(h.id, { label: v })} placeholder="Name (z.B. Herbstferien)" className="flex-1" />
            <span className="text-[8px] text-gray-400">KW</span>
            <SmallInput value={h.startWeek} onChange={(v) => update(h.id, { startWeek: v })} placeholder="von" className="w-10" />
            <span className="text-[8px] text-gray-400">–</span>
            <SmallInput value={h.endWeek} onChange={(v) => update(h.id, { endWeek: v })} placeholder="bis" className="w-10" />
            {!isSingleWeek && !hasPartialDays && (
              <button onClick={() => toggleExpanded(h.id)}
                className="text-[7px] text-gray-500 cursor-pointer hover:text-gray-300"
                title="Tagesauswahl anzeigen">
                {expandedDays.has(h.id) ? '▾' : '▸'}
              </button>
            )}
            <button onClick={() => remove(h.id)} className="text-[8px] text-red-400 cursor-pointer">✕</button>
          </div>
          {/* Day selector — auto-shown for single weeks, toggled for multi-week */}
          {showDays && (
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
          )}
        </div>
        );
      })}
      <button onClick={addHoliday}
        className="w-full py-1 rounded border border-dashed border-gray-600 text-gray-400 hover:text-gray-300 text-[9px] cursor-pointer">
        + Ferienperiode hinzufügen
      </button>
    </div>
  );
}

// ReapplyButton removed — Auto-Save with 400ms debounce makes manual re-apply unnecessary

// === Settings Collection Picker Modal ===
function SettingsCollectionPicker({ onLoad, onClose }: { onLoad: (snapshot: string) => void; onClose: () => void }) {
  const { collection } = usePlannerStore();
  const settingsItems = collection.filter(item => item.type === 'settings' && item.settingsSnapshot);

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center" onClick={onClose}>
      <div className="bg-slate-800 border border-slate-600 rounded-lg p-4 w-80 max-h-[60vh] shadow-xl flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="text-[11px] font-bold text-gray-200 mb-3">📚 Konfiguration aus Sammlung laden</div>
        {settingsItems.length === 0 ? (
          <div className="text-[9px] text-gray-400 text-center py-4">
            Keine gespeicherten Konfigurationen in der Sammlung.
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-1.5 mb-3">
            {settingsItems.map(item => {
              let summary = '';
              try {
                const s = JSON.parse(item.settingsSnapshot!);
                summary = `${s.courses?.length || 0} Kurse, ${s.holidays?.length || 0} Ferien, ${s.specialWeeks?.length || 0} Sonderwochen`;
              } catch { summary = 'Fehler'; }
              const dateStr = new Date(item.createdAt).toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: '2-digit' });
              return (
                <button key={item.id} onClick={() => onLoad(item.settingsSnapshot!)}
                  className="w-full text-left px-3 py-2 rounded bg-slate-700/50 hover:bg-slate-700 border border-slate-600 hover:border-blue-500 cursor-pointer transition-all">
                  <div className="text-[10px] font-semibold text-gray-200">{item.title}</div>
                  <div className="text-[8px] text-gray-400">{summary} · {dateStr}</div>
                </button>
              );
            })}
          </div>
        )}
        <button onClick={onClose}
          className="w-full py-1.5 rounded text-[9px] text-gray-400 border border-gray-700 cursor-pointer hover:text-gray-200">
          Abbrechen
        </button>
      </div>
    </div>
  );
}

// === Google Calendar Section (v3.60) ===
function GCalSection() {
  const { clientId, setClientId, calendars, setCalendars,
    writeCalendarId, setWriteCalendarId, readCalendarIds, toggleReadCalendar } = useGCalStore();
  const isAuth = useGCalStore(s => s.isAuthenticated());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editClientId, setEditClientId] = useState(clientId);
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<SyncProgress | null>(null);
  const [syncResult, setSyncResult] = useState<SyncProgress | null>(null);
  const [importing, setImporting] = useState(false);
  const [importCandidates, setImportCandidates] = useState<ImportCandidate[] | null>(null);
  const [selectedImports, setSelectedImports] = useState<Set<string>>(new Set());
  const [checkingCollisions, setCheckingCollisions] = useState(false);
  const collisionCount = Object.keys(useGCalStore(s => s.collisions)).length;

  const handleLogin = useCallback(async () => {
    if (!editClientId.trim()) { setError('Client ID erforderlich'); return; }
    setClientId(editClientId.trim());
    setLoading(true); setError(null);
    try {
      await loginWithGoogle(editClientId.trim());
      const cals = await fetchCalendarList();
      setCalendars(cals);
      // Auto-select primary calendar as write calendar
      const primary = cals.find((c: any) => c.primary);
      if (primary && !writeCalendarId) setWriteCalendarId(primary.id);
    } catch (e: any) {
      setError(e.message || 'Login fehlgeschlagen');
    }
    setLoading(false);
  }, [editClientId, setClientId, setCalendars, writeCalendarId, setWriteCalendarId]);

  const handleLogout = useCallback(() => {
    gcalLogout();
    setError(null);
  }, []);

  const handleRefreshCalendars = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const cals = await fetchCalendarList();
      setCalendars(cals);
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  }, [setCalendars]);

  const handleSync = useCallback(async () => {
    if (!writeCalendarId) { setError('Kein Schreib-Kalender ausgewählt'); return; }
    const activeMeta = useInstanceStore.getState().getActive();
    if (!activeMeta) { setError('Kein aktiver Planer'); return; }
    const store = usePlannerStore.getState();
    const weekData = store.weekData;
    const settings = store.plannerSettings;
    if (!settings || !weekData.length) { setError('Keine Planerdaten vorhanden'); return; }

    // Build courses from settings (same logic as usePlannerData)
    const courses: import('../types').Course[] = settings.courses.map((cc, i) => ({
      id: cc.id || `c${i}`,
      col: i,
      cls: cc.cls,
      typ: cc.typ as import('../types').CourseType,
      day: cc.day as import('../types').DayOfWeek,
      from: cc.from,
      to: cc.to,
      les: cc.les as 1 | 2 | 3,
      hk: cc.hk ?? false,
      semesters: cc.semesters as import('../types').Semester[],
      note: cc.note,
    }));

    const weekYearMap = buildWeekYearMap(
      activeMeta.startWeek, activeMeta.startYear,
      activeMeta.endWeek, activeMeta.endYear,
    );

    setSyncing(true); setSyncProgress(null); setSyncResult(null); setError(null);
    try {
      const result = await syncPlannerToCalendar(
        writeCalendarId, weekData, courses, weekYearMap,
        (p) => setSyncProgress({ ...p }),
      );
      setSyncResult(result);
      if (result.errors.length > 0) {
        setError(`${result.errors.length} Fehler beim Sync`);
      }
    } catch (e: any) {
      setError(e.message || 'Sync fehlgeschlagen');
    }
    setSyncing(false);
  }, [writeCalendarId]);

  const handleScanImport = useCallback(async () => {
    if (readCalendarIds.length === 0) { setError('Keine Lese-Kalender ausgewählt'); return; }
    const activeMeta = useInstanceStore.getState().getActive();
    if (!activeMeta) { setError('Kein aktiver Planer'); return; }

    // Build time range from planner meta
    const weekYearMap = buildWeekYearMap(activeMeta.startWeek, activeMeta.startYear, activeMeta.endWeek, activeMeta.endYear);
    const weeks = Object.entries(weekYearMap);
    if (weeks.length === 0) return;
    const firstWeek = weeks[0];
    const lastWeek = weeks[weeks.length - 1];
    const timeMin = new Date(weekToDate(parseInt(firstWeek[0]), firstWeek[1])).toISOString();
    const lastMon = weekToDate(parseInt(lastWeek[0]), lastWeek[1]);
    lastMon.setDate(lastMon.getDate() + 6);
    const timeMax = lastMon.toISOString();

    setImporting(true); setError(null); setImportCandidates(null);
    try {
      const candidates = await scanCalendarsForSpecialWeeks(readCalendarIds, timeMin, timeMax);
      setImportCandidates(candidates);
      // Pre-select all
      setSelectedImports(new Set(candidates.map(c => c.event.id)));
    } catch (e: any) {
      setError(e.message || 'Scan fehlgeschlagen');
    }
    setImporting(false);
  }, [readCalendarIds]);

  const handleConfirmImport = useCallback(() => {
    if (!importCandidates) return;
    const store = usePlannerStore.getState();
    const settings = store.plannerSettings;
    if (!settings) { setError('Keine Planer-Settings'); return; }

    const toImport = importCandidates.filter(c => selectedImports.has(c.event.id));
    if (toImport.length === 0) return;

    // Merge with existing specialWeeks, avoid duplicates by week+label
    const existing = settings.specialWeeks || [];
    const existingKeys = new Set(existing.map(s => `${s.week}-${s.label}`));
    const newWeeks: import('../store/settingsStore').SpecialWeekConfig[] = [];
    for (const c of toImport) {
      const key = `${c.suggestedConfig.week}-${c.suggestedConfig.label}`;
      if (!existingKeys.has(key)) {
        newWeeks.push(c.suggestedConfig);
        existingKeys.add(key);
      }
    }

    if (newWeeks.length === 0) {
      setError('Alle ausgewählten Events sind bereits als Sonderwochen vorhanden.');
      return;
    }

    store.setPlannerSettings({ ...settings, specialWeeks: [...existing, ...newWeeks] });
    // Also save to global settings
    saveSettings({ ...settings, specialWeeks: [...existing, ...newWeeks] });
    // Apply to weekData
    if (store.weekData.length > 0) {
      const applied = applySettingsToWeekData(store.weekData, { ...settings, specialWeeks: [...existing, ...newWeeks] });
      store.pushUndo();
      store.setWeekData(applied.weekData);
    }

    setImportCandidates(null);
    setSelectedImports(new Set());
    alert(`${newWeeks.length} Sonderwoche(n) importiert.`);
  }, [importCandidates, selectedImports]);

  const handleCheckCollisions = useCallback(async () => {
    if (readCalendarIds.length === 0) { setError('Keine Lese-Kalender ausgewählt'); return; }
    const activeMeta = useInstanceStore.getState().getActive();
    if (!activeMeta) { setError('Kein aktiver Planer'); return; }
    const store = usePlannerStore.getState();
    const weekData = store.weekData;
    const settings = store.plannerSettings;
    if (!settings || !weekData.length) { setError('Keine Planerdaten vorhanden'); return; }

    const courses: import('../types').Course[] = settings.courses.map((cc, i) => ({
      id: cc.id || `c${i}`,
      col: i,
      cls: cc.cls,
      typ: cc.typ as import('../types').CourseType,
      day: cc.day as import('../types').DayOfWeek,
      from: cc.from,
      to: cc.to,
      les: cc.les as 1 | 2 | 3,
      hk: cc.hk ?? false,
      semesters: cc.semesters as import('../types').Semester[],
      note: cc.note,
    }));

    const weekYearMap = buildWeekYearMap(activeMeta.startWeek, activeMeta.startYear, activeMeta.endWeek, activeMeta.endYear);

    setCheckingCollisions(true); setError(null);
    try {
      const collisions = await checkCollisions(readCalendarIds, weekData, courses, weekYearMap);
      useGCalStore.getState().setCollisions(collisions);
    } catch (e: any) {
      setError(e.message || 'Kollisionsprüfung fehlgeschlagen');
    }
    setCheckingCollisions(false);
  }, [readCalendarIds]);

  return (
    <Section title="📅 Google Calendar">
      <div className="space-y-2">
        <p className="text-[8px] text-gray-400">
          Verbinde einen Google Kalender, um Lektionen als Events zu synchronisieren und Kollisionen zu erkennen.
        </p>

        {/* Client ID */}
        <div>
          <label className="text-[8px] text-gray-400 block mb-0.5">OAuth Client ID</label>
          <input
            type="text"
            value={editClientId}
            onChange={(e) => setEditClientId(e.target.value)}
            placeholder="xxxx.apps.googleusercontent.com"
            className="w-full bg-slate-700 text-slate-200 text-[9px] px-2 py-1 rounded border border-slate-600 outline-none focus:border-blue-500"
          />
          <p className="text-[7px] text-gray-500 mt-0.5">
            Erstelle eine OAuth Client ID in der <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener" className="text-blue-400 hover:underline">Google Cloud Console</a>.
          </p>
        </div>

        {/* Login/Logout */}
        <div className="flex gap-1">
          {!isAuth ? (
            <button onClick={handleLogin} disabled={loading}
              className="flex-1 py-1.5 rounded text-[9px] font-medium bg-blue-700 hover:bg-blue-600 text-white cursor-pointer transition-all disabled:opacity-50">
              {loading ? '⏳ Verbinde…' : '🔑 Mit Google anmelden'}
            </button>
          ) : (
            <>
              <div className="flex-1 py-1.5 rounded text-[9px] font-medium bg-green-900/40 text-green-300 text-center border border-green-800/50">
                ✅ Verbunden
              </div>
              <button onClick={handleLogout}
                className="px-2 py-1.5 rounded text-[9px] bg-slate-700 hover:bg-red-900/60 text-gray-300 hover:text-red-300 cursor-pointer transition-all">
                Abmelden
              </button>
            </>
          )}
        </div>

        {error && <div className="text-[8px] text-red-400 bg-red-900/20 px-2 py-1 rounded">❌ {error}</div>}

        {/* Calendar selection (when authenticated) */}
        {isAuth && calendars.length > 0 && (
          <div className="space-y-2 pt-1 border-t border-slate-700">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-semibold text-gray-300">Kalender</span>
              <button onClick={handleRefreshCalendars} disabled={loading}
                className="text-[8px] text-blue-400 hover:text-blue-300 cursor-pointer">
                🔄 Aktualisieren
              </button>
            </div>

            {/* Write calendar */}
            <div>
              <label className="text-[8px] text-gray-400 block mb-0.5">Schreib-Kalender (Planer → Kalender)</label>
              <select
                value={writeCalendarId || ''}
                onChange={(e) => setWriteCalendarId(e.target.value || null)}
                className="w-full bg-slate-700 text-slate-200 text-[9px] px-2 py-1 rounded border border-slate-600"
              >
                <option value="">— Kein Kalender —</option>
                {calendars
                  .filter(c => c.accessRole === 'owner' || c.accessRole === 'writer')
                  .map(c => (
                    <option key={c.id} value={c.id}>{c.summary}{c.primary ? ' (Primär)' : ''}</option>
                  ))}
              </select>
            </div>

            {/* Read calendars */}
            <div>
              <label className="text-[8px] text-gray-400 block mb-0.5">Lese-Kalender (Kalender → Planer / Kollisionen)</label>
              <div className="max-h-32 overflow-y-auto space-y-0.5">
                {calendars.map(c => (
                  <label key={c.id} className="flex items-center gap-1.5 px-1.5 py-0.5 rounded hover:bg-slate-700/60 cursor-pointer text-[9px]">
                    <input
                      type="checkbox"
                      checked={readCalendarIds.includes(c.id)}
                      onChange={() => toggleReadCalendar(c.id)}
                      className="accent-blue-500 w-3 h-3"
                    />
                    <span className="text-gray-200 truncate">{c.summary}</span>
                    {c.primary && <span className="text-[7px] text-blue-400">Primär</span>}
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {isAuth && calendars.length === 0 && !loading && (
          <button onClick={handleRefreshCalendars}
            className="w-full py-1.5 rounded text-[9px] bg-slate-700 hover:bg-slate-600 text-gray-300 cursor-pointer transition-all">
            📋 Kalender laden
          </button>
        )}

        {/* Sync section (v3.61) */}
        {isAuth && writeCalendarId && (
          <div className="space-y-1.5 pt-1.5 border-t border-slate-700">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-semibold text-gray-300">Planer → Kalender Sync</span>
            </div>
            <p className="text-[7px] text-gray-500">
              Erstellt/aktualisiert Google Calendar Events für alle Lektionen. Events werden mit einem <code>planer-managed</code>-Tag markiert.
            </p>
            <button onClick={handleSync} disabled={syncing}
              className="w-full py-1.5 rounded text-[9px] font-medium bg-blue-700 hover:bg-blue-600 text-white cursor-pointer transition-all disabled:opacity-50">
              {syncing ? '⏳ Synchronisiere…' : '🔄 Jetzt synchronisieren'}
            </button>

            {/* Progress bar */}
            {syncing && syncProgress && (
              <div className="space-y-0.5">
                <div className="w-full bg-slate-700 rounded-full h-1.5">
                  <div className="bg-blue-500 h-1.5 rounded-full transition-all"
                    style={{ width: `${syncProgress.total > 0 ? (syncProgress.done / syncProgress.total * 100) : 0}%` }} />
                </div>
                <p className="text-[7px] text-gray-500">
                  {syncProgress.done} / {syncProgress.total} — {syncProgress.created} erstellt, {syncProgress.updated} aktualisiert, {syncProgress.deleted} gelöscht
                </p>
              </div>
            )}

            {/* Result */}
            {syncResult && !syncing && (
              <div className={`text-[8px] px-2 py-1 rounded ${syncResult.errors.length > 0 ? 'bg-amber-900/20 text-amber-300' : 'bg-green-900/20 text-green-300'}`}>
                ✅ Sync abgeschlossen: {syncResult.created} erstellt, {syncResult.updated} aktualisiert, {syncResult.deleted} gelöscht
                {syncResult.errors.length > 0 && (
                  <div className="mt-1 text-[7px] text-red-400">
                    {syncResult.errors.slice(0, 5).map((e, i) => <div key={i}>• {e}</div>)}
                    {syncResult.errors.length > 5 && <div>… und {syncResult.errors.length - 5} weitere</div>}
                  </div>
                )}
              </div>
            )}

            {/* Clear event mapping */}
            <button onClick={() => {
              if (confirm('Event-Mapping zurücksetzen? Beim nächsten Sync werden alle Events neu erstellt (bestehende Events im Kalender werden nicht gelöscht).')) {
                useGCalStore.getState().clearEventMap();
                setSyncResult(null);
              }
            }}
              className="text-[7px] text-gray-500 hover:text-gray-300 cursor-pointer">
              🗑 Event-Mapping zurücksetzen
            </button>
          </div>
        )}

        {/* Import section (v3.62) */}
        {isAuth && readCalendarIds.length > 0 && (
          <div className="space-y-1.5 pt-1.5 border-t border-slate-700">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-semibold text-gray-300">Kalender → Planer Import</span>
            </div>
            <p className="text-[7px] text-gray-500">
              Scannt Lese-Kalender nach Sonderwochen (IW, Besuchstag, Studienreise etc.) und importiert sie als Sonderwochen-Einstellungen.
            </p>
            <button onClick={handleScanImport} disabled={importing}
              className="w-full py-1.5 rounded text-[9px] font-medium bg-slate-700 hover:bg-slate-600 text-gray-200 cursor-pointer transition-all disabled:opacity-50">
              {importing ? '⏳ Scanne Kalender…' : '📥 Sonderwochen aus Kalender importieren'}
            </button>

            {/* Import candidates list */}
            {importCandidates !== null && (
              <div className="space-y-1">
                {importCandidates.length === 0 ? (
                  <p className="text-[8px] text-gray-500 italic">Keine passenden Events gefunden.</p>
                ) : (
                  <>
                    <p className="text-[8px] text-gray-400">{importCandidates.length} Events gefunden:</p>
                    <div className="max-h-48 overflow-y-auto space-y-0.5">
                      {importCandidates.map(c => (
                        <label key={c.event.id} className="flex items-start gap-1.5 px-1.5 py-1 rounded hover:bg-slate-700/60 cursor-pointer text-[9px]">
                          <input
                            type="checkbox"
                            checked={selectedImports.has(c.event.id)}
                            onChange={() => setSelectedImports(prev => {
                              const next = new Set(prev);
                              if (next.has(c.event.id)) next.delete(c.event.id);
                              else next.add(c.event.id);
                              return next;
                            })}
                            className="accent-blue-500 w-3 h-3 mt-0.5"
                          />
                          <div>
                            <div className="text-gray-200">{c.event.summary}</div>
                            <div className="text-[7px] text-gray-500">
                              KW {c.suggestedConfig.week} · {c.matchedKeyword}
                              {c.suggestedConfig.gymLevel && ` · ${c.suggestedConfig.gymLevel}`}
                              {c.suggestedConfig.days && ` · Tage: ${c.suggestedConfig.days.map(d => ['Mo','Di','Mi','Do','Fr'][d-1]).join(',')}`}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                    <div className="flex gap-1">
                      <button onClick={handleConfirmImport} disabled={selectedImports.size === 0}
                        className="flex-1 py-1 rounded text-[9px] font-medium bg-blue-700 hover:bg-blue-600 text-white cursor-pointer transition-all disabled:opacity-50">
                        ✅ {selectedImports.size} importieren
                      </button>
                      <button onClick={() => { setImportCandidates(null); setSelectedImports(new Set()); }}
                        className="px-2 py-1 rounded text-[9px] bg-slate-700 hover:bg-slate-600 text-gray-300 cursor-pointer transition-all">
                        Abbrechen
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Collision check section (v3.63) */}
        {isAuth && readCalendarIds.length > 0 && (
          <div className="space-y-1.5 pt-1.5 border-t border-slate-700">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-semibold text-gray-300">Kollisionswarnungen</span>
              {collisionCount > 0 && (
                <span className="text-[8px] text-amber-400 font-bold">⚠️ {collisionCount}</span>
              )}
            </div>
            <p className="text-[7px] text-gray-500">
              Prüft ob externe Kalender-Events (Sitzungen, Konferenzen) mit Lektionszeiten kollidieren. Kollisionen werden als ⚠️ im Wochenplan angezeigt.
            </p>
            <button onClick={handleCheckCollisions} disabled={checkingCollisions}
              className="w-full py-1.5 rounded text-[9px] font-medium bg-slate-700 hover:bg-slate-600 text-gray-200 cursor-pointer transition-all disabled:opacity-50">
              {checkingCollisions ? '⏳ Prüfe Kollisionen…' : '⚠️ Kollisionen prüfen'}
            </button>
            {collisionCount > 0 && (
              <div className="text-[8px] text-amber-300 bg-amber-900/20 px-2 py-1 rounded">
                {collisionCount} Lektion(en) haben Zeitkonflikte mit externen Kalender-Events. Siehe ⚠️ im Wochenplan.
              </div>
            )}
            {collisionCount > 0 && (
              <button onClick={() => useGCalStore.getState().clearCollisions()}
                className="text-[7px] text-gray-500 hover:text-gray-300 cursor-pointer">
                ✕ Warnungen ausblenden
              </button>
            )}
          </div>
        )}
      </div>
    </Section>
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
  const [showCollectionPicker, setShowCollectionPicker] = useState(false);

  // Save current settings to collection
  const saveToCollection = useCallback(() => {
    const activeMeta = useInstanceStore.getState().getActive();
    const planerName = activeMeta?.name || 'Planer';
    const datum = new Date().toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: '2-digit' });
    const store = usePlannerStore.getState();
    store.addCollectionItem({
      type: 'settings',
      title: `Konfiguration ${planerName} ${datum}`,
      units: [],
      settingsSnapshot: JSON.stringify(settings),
    });
    alert('Konfiguration in Sammlung gespeichert.');
  }, [settings]);

  // Load settings from a collection item
  const loadFromCollection = useCallback((snapshot: string) => {
    try {
      const imported = JSON.parse(snapshot);
      if (!Array.isArray(imported.courses) || !Array.isArray(imported.holidays) || !Array.isArray(imported.specialWeeks)) {
        alert('Ungültige Konfiguration in der Sammlung.');
        return;
      }
      if (!confirm(`Bestehende Einstellungen werden überschrieben (${imported.courses.length} Kurse, ${imported.holidays.length} Ferienperioden, ${imported.specialWeeks.length} Sonderwochen). Fortfahren?`)) {
        return;
      }
      setSettings(imported as PlannerSettings);
      doSave(imported as PlannerSettings);
      setShowCollectionPicker(false);
    } catch { alert('Fehler beim Lesen der Konfiguration.'); }
  }, [doSave]);

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

      {/* Collection save/load */}
      <Section title="📚 Sammlung">
        <div className="space-y-2">
          <p className="text-[8px] text-gray-400">Konfigurationen (Kurse, Ferien, Sonderwochen) in der Sammlung sichern oder aus einer gespeicherten Konfiguration laden.</p>
          <div className="flex gap-1">
            <button onClick={saveToCollection}
              className="flex-1 py-1.5 rounded text-[9px] font-medium bg-slate-700 hover:bg-slate-600 text-gray-200 cursor-pointer transition-all">
              📥 In Sammlung speichern
            </button>
            <button onClick={() => setShowCollectionPicker(true)}
              className="flex-1 py-1.5 rounded text-[9px] font-medium bg-slate-700 hover:bg-slate-600 text-gray-200 cursor-pointer transition-all">
              📚 Aus Sammlung laden
            </button>
          </div>
        </div>
      </Section>

      {/* Collection picker modal */}
      {showCollectionPicker && <SettingsCollectionPicker onLoad={loadFromCollection} onClose={() => setShowCollectionPicker(false)} />}

      {/* Google Calendar */}
      <GCalSection />

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
