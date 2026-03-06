import { useState, useMemo, useRef, useEffect } from 'react';
import type { CourseType, DayOfWeek, Semester } from '../../types';
import { usePlannerStore } from '../../store/plannerStore';
import {
  generateId, STUFE_OPTIONS,
  type CourseConfig, type SubjectConfig, type SchoolLevel,
} from '../../store/settingsStore';
import { SmallInput, SmallSelect } from './shared';

// === Duration helper for courses ===
/** Build duration presets as multiples of the standard lesson duration */
function getDurationPresets(baseDuration: number): { min: number; label: string }[] {
  const d = baseDuration || 45;
  return [
    { min: d, label: `${d} min` },
    { min: d * 2, label: `${d * 2} min` },
    { min: d * 3, label: `${d * 3} min` },
  ];
}

function durationToLes(min: number, baseDuration: number = 45): 1 | 2 | 3 {
  const d = baseDuration || 45;
  if (min <= d * 1.1) return 1;
  if (min <= d * 2.1) return 2;
  return 3;
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
// WR-specific course types (only shown when WR-Fachbereiche configured)
const WR_COURSE_TYPES: { key: CourseType; label: string }[] = [
  { key: 'SF', label: 'SF' }, { key: 'EWR', label: 'EWR' }, { key: 'EF', label: 'EF' },
];
// General course types (always available)
const GENERAL_COURSE_TYPES: { key: CourseType; label: string }[] = [
  { key: 'KS', label: 'KS' }, { key: 'IN', label: 'IN' },
];
const WR_KEYS = new Set(['BWL', 'VWL', 'RECHT']);

function getCourseTypes(subjects: SubjectConfig[]): { key: CourseType; label: string }[] {
  const hasWR = subjects.some(s => WR_KEYS.has(s.id?.toUpperCase() || '') || WR_KEYS.has(s.label?.toUpperCase() || ''));
  return hasWR ? [...WR_COURSE_TYPES, ...GENERAL_COURSE_TYPES] : GENERAL_COURSE_TYPES;
}

// === Course Duration Picker ===
function CourseDurationPicker({ value, onChange, baseDuration = 45 }: { value: number; onChange: (min: number) => void; baseDuration?: number }) {
  const presets = useMemo(() => getDurationPresets(baseDuration), [baseDuration]);
  const [customMode, setCustomMode] = useState(false);
  const [customVal, setCustomVal] = useState('');
  const isPreset = presets.some(p => p.min === value);

  return (
    <div className="flex flex-wrap gap-1 items-center">
      {presets.map(p => (
        <button key={p.min} onClick={() => { onChange(p.min); setCustomMode(false); }}
          className={`px-1.5 py-0.5 rounded text-[11px] font-medium border cursor-pointer transition-all ${
            value === p.min ? 'bg-blue-600/30 border-blue-500' : ''
          }`}
          style={value === p.min ? { color: 'var(--text-primary)' } : { borderColor: 'var(--border-light)', color: 'var(--text-muted)' }}>
          {p.label}
        </button>
      ))}
      {customMode || (!isPreset && value > 0) ? (
        <div className="flex items-center gap-0.5">
          <input autoFocus={customMode} type="number" value={!isPreset ? String(value) : customVal}
            onChange={(e) => { const n = parseInt(e.target.value) || 0; setCustomVal(e.target.value); if (n > 0) onChange(n); }}
            onKeyDown={(e) => { if (e.key === 'Escape') setCustomMode(false); }}
            placeholder="min"
            className="border border-blue-400 rounded px-1.5 py-0.5 text-[11px] outline-none w-14"
            style={{ background: 'var(--bg-hover)', color: 'var(--text-primary)' }} />
          <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>min</span>
        </div>
      ) : (
        <button onClick={() => setCustomMode(true)}
          className="px-1.5 py-0.5 rounded text-[11px] border border-dashed cursor-pointer"
          style={{ borderColor: 'var(--border-light)', color: 'var(--text-muted)' }}>
          Andere
        </button>
      )}
    </div>
  );
}

// === Course Editor ===
export function CourseEditor({ courses, onChange, schoolLevel, baseDuration = 45, focusCourseId, subjects = [] }: { courses: CourseConfig[]; onChange: (c: CourseConfig[]) => void; schoolLevel?: SchoolLevel; baseDuration?: number; focusCourseId?: string | null; subjects?: SubjectConfig[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const focusRef = useRef<HTMLDivElement>(null);

  // Auto-expand and scroll to focused course
  useEffect(() => {
    if (focusCourseId) {
      const course = courses.find(c => c.id === focusCourseId);
      if (course) {
        setEditingId(course.id);
        // Clear the focus request after handling
        usePlannerStore.getState().setSettingsEditCourseId(null);
        setTimeout(() => focusRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
      }
    }
  }, [focusCourseId]);

  const addCourse = () => {
    const newCourse: CourseConfig = {
      id: generateId(), cls: '', typ: 'SF' as any, day: 'Mo' as any,
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
        <div key={stableKey} ref={group.some(c => c.id === editingId) ? focusRef : undefined} className="rounded p-2 space-y-1" style={{ border: '1px solid var(--border)' }}>
          <div className="text-[11px] font-semibold cursor-pointer hover:text-blue-300 transition-colors" style={{ color: 'var(--text-secondary)' }}
            onClick={() => setEditingId(editingId === group[0].id ? null : group[0].id)}>
            {group[0].cls || '(neu)'} <span className="text-blue-400">{group[0].typ}</span>
            <span className="text-[8px] ml-1" style={{ color: 'var(--text-dim)' }}>({group.map(c => c.day).join(', ')})</span>
          </div>
          {group.map(c => (
            <div key={c.id}>
              {editingId === c.id ? (
                <div className="space-y-1.5 rounded p-2" style={{ background: 'var(--bg-secondary)' }}>
                  <div className="flex gap-1 flex-wrap">
                    <SmallInput value={c.cls} onChange={(v) => updateCourse(c.id, { cls: v })} placeholder="Klasse" className="w-20" />
                    {subjects.length > 0
                      ? <SmallSelect value={c.typ} onChange={(v) => updateCourse(c.id, { typ: v })} options={getCourseTypes(subjects)} />
                      : <SmallInput value={c.typ} onChange={(v) => updateCourse(c.id, { typ: v as CourseType })} placeholder="Typ" className="w-14" />
                    }
                    {schoolLevel && (
                      <select value={c.stufe || ''} onChange={(e) => updateCourse(c.id, { stufe: e.target.value || undefined })}
                        className="rounded px-1 py-0.5 text-[11px] outline-none focus:border-blue-400 cursor-pointer"
                        style={{ background: 'var(--bg-hover)', color: 'var(--text-primary)', border: '1px solid var(--border-light)' }}>
                        <option value="">Stufe…</option>
                        {STUFE_OPTIONS[schoolLevel].map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
                      </select>
                    )}
                    {/* Day checkboxes — each checked day = a course entry in the same cls+typ group */}
                    <div className="flex gap-0.5 items-center ml-1">
                      {DAYS.map(d => {
                        const sibling = group.find(s => s.day === d && s.id !== c.id);
                        const isThisDay = c.day === d;
                        const isChecked = isThisDay || !!sibling;
                        return (
                          <label key={d} className={`flex items-center gap-0 text-[9px] cursor-pointer select-none px-0.5 py-0.5 rounded ${
                            isChecked ? 'text-blue-300 bg-blue-900/30' : ''
                          }`}
                            style={isChecked ? undefined : { color: 'var(--text-dim)' }}>
                            <input type="checkbox" checked={isChecked}
                              className="cursor-pointer w-3 h-3"
                              onChange={(e) => {
                                if (e.target.checked && !isChecked) {
                                  // Clone this course for the new day
                                  const dup: CourseConfig = { ...c, id: generateId(), day: d };
                                  onChange([...courses, dup]);
                                } else if (!e.target.checked && isChecked) {
                                  if (isThisDay) {
                                    // Can't uncheck own day if it's the only day left
                                    const siblingCount = group.filter(s => s.id !== c.id).length;
                                    if (siblingCount === 0) return; // don't remove last entry
                                    onChange(courses.filter(x => x.id !== c.id));
                                    setEditingId(group.find(s => s.id !== c.id)?.id || null);
                                  } else if (sibling) {
                                    // Remove the sibling course for this day
                                    onChange(courses.filter(x => x.id !== sibling.id));
                                  }
                                }
                              }}
                            />
                            {d}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <div className="flex gap-1 items-start flex-wrap">
                      <div>
                        <label className="text-[9px] mb-0.5 block" style={{ color: 'var(--text-muted)' }}>Beginn</label>
                        <SmallInput value={c.from} onChange={(v) => {
                          const autoEnd = addMinutesToTime(v, c.les * 45);
                          updateCourse(c.id, { from: v, to: autoEnd });
                        }} placeholder="08:05" className="w-28 text-[13px]" type="time" />
                      </div>
                      <span className="text-[12px] mt-4" style={{ color: 'var(--text-muted)' }}>–</span>
                      <div>
                        <label className="text-[9px] mb-0.5 block" style={{ color: 'var(--text-muted)' }}>Ende <span style={{ color: 'var(--text-dim)' }}>(auto)</span></label>
                        <SmallInput value={c.to} onChange={(v) => updateCourse(c.id, { to: v })} placeholder="08:50" className="w-28 text-[13px]" type="time" />
                      </div>
                    </div>
                    {c.les > 1 && <p className="text-[6px] text-yellow-600 mt-0.5" title="Pausen zwischen Lektionen werden nicht automatisch berücksichtigt. Endzeit ggf. manuell anpassen.">⚠ ohne Pausen</p>}
                  </div>
                  <div>
                    <label className="text-[9px] mb-0.5 block" style={{ color: 'var(--text-muted)' }}>Dauer</label>
                    <CourseDurationPicker value={c.les * baseDuration} baseDuration={baseDuration} onChange={(min) => {
                      const autoEnd = addMinutesToTime(c.from, min);
                      updateCourse(c.id, { les: durationToLes(min, baseDuration), to: autoEnd });
                    }} />
                  </div>
                  <div className="flex gap-3 items-center flex-wrap" title="Für unterschiedliche Tage pro Semester: separate Einträge mit S1 bzw. S2 erstellen (via Tage-Checkboxen oben)">
                    <label className="flex items-center gap-1 text-[11px] cursor-pointer" style={{ color: 'var(--text-muted)' }}>
                      <input type="checkbox" checked={c.hk} onChange={(e) => updateCourse(c.id, { hk: e.target.checked })} className="cursor-pointer" />
                      HK
                    </label>
                    <label className="flex items-center gap-1 text-[11px] cursor-pointer" style={{ color: 'var(--text-muted)' }} title="Semester 1 — Eintrag nur im 1. Semester aktiv">
                      <input type="checkbox" checked={c.semesters.includes(1)} onChange={(e) => {
                        const s = e.target.checked ? [...new Set([...c.semesters, 1 as Semester])] : c.semesters.filter(x => x !== 1);
                        updateCourse(c.id, { semesters: s });
                      }} className="cursor-pointer" />
                      S1
                    </label>
                    <label className="flex items-center gap-1 text-[11px] cursor-pointer" style={{ color: 'var(--text-muted)' }} title="Semester 2 — Eintrag nur im 2. Semester aktiv">
                      <input type="checkbox" checked={c.semesters.includes(2)} onChange={(e) => {
                        const s = e.target.checked ? [...new Set([...c.semesters, 2 as Semester])] : c.semesters.filter(x => x !== 2);
                        updateCourse(c.id, { semesters: s });
                      }} className="cursor-pointer" />
                      S2
                    </label>
                    <label className="flex items-center gap-1 text-[11px] cursor-pointer" style={{ color: 'var(--text-muted)' }} title="Selbstorganisiertes Lernen">
                      <input type="checkbox" checked={!!c.sol && (typeof c.sol === 'boolean' ? c.sol : c.sol.enabled)} onChange={(e) => {
                        if (e.target.checked) {
                          updateCourse(c.id, { sol: { enabled: true } as any });
                        } else {
                          updateCourse(c.id, { sol: undefined as any });
                        }
                      }} className="cursor-pointer" />
                      SOL
                    </label>
                  </div>
                  {/* v3.100 #3b: SOL-Konfiguration pro Kurs */}
                  {c.sol && (typeof c.sol === 'boolean' ? c.sol : (c.sol as any).enabled) && (() => {
                    const solConfig = typeof c.sol === 'object' ? c.sol as { enabled: boolean; duration?: string; description?: string; topic?: string } : { enabled: true };
                    return (
                      <div className="pl-2 border-l-2 rounded-sm space-y-1.5 mt-1" style={{ borderColor: '#8b5cf6' }}>
                        <div>
                          <label className="text-[9px] mb-0.5 block" style={{ color: 'var(--text-dim)' }}>SOL-Thema</label>
                          <SmallInput value={solConfig.topic || ''} onChange={(v) => updateCourse(c.id, { sol: { ...solConfig, enabled: true, topic: v || undefined } as any })} placeholder="SOL-Thema…" className="w-full" />
                        </div>
                        <div>
                          <label className="text-[9px] mb-0.5 block" style={{ color: 'var(--text-dim)' }}>SOL-Dauer</label>
                          <SmallInput value={solConfig.duration || ''} onChange={(v) => updateCourse(c.id, { sol: { ...solConfig, enabled: true, duration: v || undefined } as any })} placeholder="z.B. 45 min" className="w-24" />
                        </div>
                        <div>
                          <label className="text-[9px] mb-0.5 block" style={{ color: 'var(--text-dim)' }}>SOL-Beschreibung</label>
                          <SmallInput value={solConfig.description || ''} onChange={(v) => updateCourse(c.id, { sol: { ...solConfig, enabled: true, description: v || undefined } as any })} placeholder="Auftrag, Hinweise…" className="w-full" />
                        </div>
                      </div>
                    );
                  })()}
                  <SmallInput value={c.note || ''} onChange={(v) => updateCourse(c.id, { note: v || undefined })} placeholder="Bemerkung (optional)" className="w-full" />
                  <div className="flex gap-1 mt-1 flex-wrap">
                    <button onClick={() => setEditingId(null)} className="text-[9px] text-blue-400 cursor-pointer">✓ Fertig</button>
                    <button onClick={() => removeCourse(c.id)} className="text-[9px] text-red-400 cursor-pointer ml-auto">Entfernen</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-[11px] cursor-pointer group"
                  style={{ color: 'var(--text-muted)' }}
                  onClick={() => setEditingId(c.id)}>
                  <span className="font-mono" style={{ color: 'var(--text-muted)' }}>{c.day}</span>
                  <span>{c.from}–{c.to}</span>
                  <span style={{ color: 'var(--text-dim)' }}>{c.les * 45}min{c.hk ? ' HK' : ''}</span>
                  <span style={{ color: 'var(--text-dim)' }}>{c.semesters.map(s => `S${s}`).join('+')}</span>
                  {c.stufe && <span className="text-cyan-500 text-[9px]">{c.stufe}</span>}
                  {c.note && <span className="text-amber-600 text-[9px]">{c.note}</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      ))}
      <button onClick={addCourse}
        className="w-full py-1.5 rounded border border-dashed text-[11px] cursor-pointer transition-all"
        style={{ borderColor: 'var(--border-light)', color: 'var(--text-muted)' }}>
        + Kurs hinzufügen
      </button>
    </div>
  );
}
