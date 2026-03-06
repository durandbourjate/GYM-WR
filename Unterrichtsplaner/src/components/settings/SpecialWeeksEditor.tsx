import { useState, useMemo } from 'react';
import { SmallInput, SmallSelect } from './shared';
import { generateId, type SpecialWeekConfig, type CourseConfig } from '../../store/settingsStore';
import { getGymStufe } from '../../utils/gradeRequirements';

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
 * J5: Compute excludedCourseIds based on gymLevel (string | string[]).
 * All courses whose class does NOT match ANY gymLevel are excluded.
 */
function computeExcludedCourses(gymLevel: string | string[] | undefined, courses: CourseConfig[]): string[] {
  const levels = !gymLevel ? [] : Array.isArray(gymLevel) ? gymLevel : [gymLevel];
  if (levels.length === 0 || levels.includes('alle')) return [];

  const excluded: string[] = [];
  for (const c of courses) {
    const courseLevel = getCourseGymLevel(c.cls);
    const isTaF = /[fs]/.test(c.cls.replace(/\d/g, ''));
    const matchesAny = levels.some(lv => {
      if (lv === 'TaF') return isTaF;
      if (lv === 'alle') return true;
      return courseLevel === lv;
    });
    if (!matchesAny) excluded.push(c.id);
  }
  return excluded;
}

/** J5: Normalize gymLevel to string[] for display */
function normalizeGymLevel(gl?: string | string[]): string[] {
  if (!gl) return [];
  return Array.isArray(gl) ? gl : [gl];
}

/** J5: Format gymLevel array for header display */
export function formatGymLevel(gl?: string | string[]): string {
  const arr = normalizeGymLevel(gl);
  if (arr.length === 0) return '';
  return arr.join(', ');
}

// === Special Weeks Editor (Hierarchisch: KW → GYM-Stufen) ===
export function SpecialWeeksEditor({ weeks, courses, onChange }: {
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
    // When KW changes, keep the group expanded by updating expandedWeek (v3.76 #8)
    if (patch.week !== undefined) {
      setExpandedWeek(patch.week);
    }
  };

  // J5: Mehrfachauswahl — toggle einzelne Stufe
  const toggleGymLevel = (id: string, level: string) => {
    const entry = weeks.find(w => w.id === id);
    if (!entry) return;
    const current = normalizeGymLevel(entry.gymLevel);
    let next: string[];
    if (level === 'alle') {
      next = []; // "alle" = kein Filter
    } else if (current.includes(level)) {
      next = current.filter(l => l !== level);
    } else {
      next = [...current, level];
    }
    const gymLevel = next.length === 0 ? undefined : next.length === 1 ? next[0] : next;
    const excluded = computeExcludedCourses(gymLevel, courses);
    onChange(weeks.map(w => w.id === id ? { ...w, gymLevel, excludedCourseIds: excluded.length > 0 ? excluded : undefined } : w));
  };

  const remove = (id: string) => {
    onChange(weeks.filter(w => w.id !== id));
  };


  return (
    <div className="space-y-1.5">
      <p className="text-[8px]" style={{ color: 'var(--text-muted)' }}>Pro Kalenderwoche können verschiedene GYM-Stufen unterschiedliche Sonderwochen haben. Klicke auf eine KW um Details zu bearbeiten.</p>
      {grouped.map(([kw, entries]) => {
        const isExpanded = expandedWeek === kw;
        const stableKey = entries[0]?.id || kw || 'new';
        return (
          <div key={stableKey} className="rounded overflow-hidden" style={{ border: '1px solid var(--border)' }}>
            <div className="flex items-center gap-2 px-2 py-1.5 cursor-pointer"
              style={{ background: 'var(--bg-secondary)' }}
              onClick={() => setExpandedWeek(isExpanded ? null : kw)}>
              <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>{isExpanded ? '▾' : '▸'}</span>
              <span className="text-[10px] font-semibold text-amber-400 font-mono w-10">{kw ? `KW${kw}` : 'Neu'}</span>
              <span className="text-[9px] truncate flex-1" style={{ color: 'var(--text-secondary)' }}>
                {entries.map((e, i) => (
                  <span key={e.id}>
                    {i > 0 && ', '}
                    {e.gymLevel && <span className="text-[8px] font-semibold text-blue-400">{formatGymLevel(e.gymLevel)} </span>}
                    {e.label || '(unbenannt)'}
                  </span>
                ))}
              </span>
              <span className="text-[8px]" style={{ color: 'var(--text-dim)' }}>{entries.length} {entries.length === 1 ? 'Eintrag' : 'Einträge'}</span>
            </div>
            {isExpanded && (
              <div className="p-2 space-y-2" style={{ background: 'var(--bg-primary)' }}>
                {entries.map(w => (
                  <div key={w.id} className="rounded p-2 space-y-1.5" style={{ background: 'var(--bg-secondary)' }}>
                    <div className="flex gap-1 items-center">
                      <SmallInput value={w.week} onChange={(v) => update(w.id, { week: v })} placeholder="KW" className="w-10" />
                      <SmallInput value={w.label} onChange={(v) => update(w.id, { label: v })} placeholder="z.B. Medienwoche" className="flex-1" />
                      {/* J5: Checkbox-Mehrfachauswahl statt Dropdown */}
                      <div className="flex flex-wrap gap-0.5">
                        {GYM_LEVEL_OPTIONS.map(opt => {
                          const active = opt.key === 'alle'
                            ? normalizeGymLevel(w.gymLevel).length === 0
                            : normalizeGymLevel(w.gymLevel).includes(opt.key);
                          return (
                            <button key={opt.key} onClick={() => toggleGymLevel(w.id, opt.key)}
                              className={`px-1 py-px rounded text-[7px] cursor-pointer transition-colors ${
                                active ? 'bg-blue-600/40 text-blue-200 border border-blue-500/60' : 'border border-transparent'
                              }`}
                              style={active ? undefined : { background: 'var(--bg-hover)', color: 'var(--text-dim)' }}>{opt.label}</button>
                          );
                        })}
                      </div>
                      <SmallSelect value={w.type} onChange={(v) => update(w.id, { type: v })}
                        options={[{ key: 'event', label: '📅 Event' }, { key: 'holiday', label: '🏖 Frei' }]} />
                      <button onClick={() => remove(w.id)} className="text-[8px] text-red-400 cursor-pointer">✕</button>
                    </div>
                    {/* Day selector */}
                    <div className="flex items-center gap-1">
                      <span className="text-[7px]" style={{ color: 'var(--text-muted)' }}>Tage:</span>
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
                              active ? 'bg-amber-700/40 text-amber-300 border border-amber-500/50' : 'border border-transparent'
                            }`}
                            style={active ? undefined : { background: 'var(--bg-hover)', color: 'var(--text-dim)' }}>
                            {day}
                          </button>
                        );
                      })}
                      {(w.days && w.days.length < 5) && (
                        <button onClick={() => update(w.id, { days: undefined })}
                          className="text-[7px] cursor-pointer ml-1" style={{ color: 'var(--text-dim)' }}>Ganze Woche</button>
                      )}
                    </div>
                    {/* Course exclusions */}
                    {courses.length > 0 && (
                      <div className="flex flex-wrap gap-1 items-center">
                        <span className="text-[7px]" style={{ color: 'var(--text-muted)' }} title="Kurse, die von dieser Sonderwoche NICHT betroffen sind (= normaler Unterricht)">Nicht betroffen:</span>
                        {courses.map(c => {
                          const excluded = w.excludedCourseIds?.includes(c.id);
                          return (
                            <button key={c.id} onClick={() => {
                              const current = w.excludedCourseIds || [];
                              update(w.id, {
                                excludedCourseIds: excluded ? current.filter(x => x !== c.id) : [...current, c.id]
                              });
                            }}
                              title={excluded ? `${c.cls} ${c.typ} (${c.day}) hat normalen Unterricht` : `${c.cls} ${c.typ} (${c.day}) ist von Sonderwoche betroffen`}
                              className={`text-[7px] px-1 py-px rounded cursor-pointer ${excluded ? 'bg-red-900/40 text-red-300 border border-red-500/50' : 'border border-transparent'}`}
                              style={excluded ? undefined : { background: 'var(--bg-hover)', color: 'var(--text-muted)' }}>
                              {c.cls} {c.day}
                            </button>
                          );
                        })}
                      </div>
                    )}
                    {/* v3.82 E7: Sichtbarkeit pro Kurs */}
                    {courses.length > 0 && (
                      <div className="space-y-1">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input type="checkbox" checked={!!w.courseFilter && w.courseFilter.length > 0}
                            onChange={(e) => {
                              if (e.target.checked) {
                                // Aktivieren: alle Kurse vorselektiert
                                update(w.id, { courseFilter: courses.map(c => c.id) });
                              } else {
                                // Deaktivieren: kein Filter
                                update(w.id, { courseFilter: undefined });
                              }
                            }}
                            className="accent-amber-500 cursor-pointer" />
                          <span className="text-[8px]" style={{ color: 'var(--text-secondary)' }}>Nur für bestimmte Kurse anzeigen</span>
                        </label>
                        {w.courseFilter && w.courseFilter.length > 0 && (
                          <div className="ml-4 space-y-1">
                            <div className="flex flex-wrap gap-1">
                              {/* K5: Deduplizierung nach cls+typ — ein Button pro Kursgruppe */}
                              {(() => {
                                const groups = new Map<string, { label: string; ids: string[] }>();
                                for (const c of courses) {
                                  const key = `${c.cls} ${c.typ}`;
                                  if (!groups.has(key)) groups.set(key, { label: key, ids: [] });
                                  groups.get(key)!.ids.push(c.id);
                                }
                                return [...groups.values()].map(g => {
                                  const included = g.ids.some(id => w.courseFilter!.includes(id));
                                  return (
                                    <button key={g.label} onClick={() => {
                                      const current = w.courseFilter || [];
                                      update(w.id, {
                                        courseFilter: included
                                          ? current.filter(x => !g.ids.includes(x))
                                          : [...current, ...g.ids.filter(id => !current.includes(id))]
                                      });
                                    }}
                                      className={`text-[7px] px-1.5 py-0.5 rounded cursor-pointer transition-all ${included ? 'bg-amber-700/40 text-amber-300 border border-amber-500/50' : 'border border-transparent'}`}
                                      style={included ? undefined : { background: 'var(--bg-hover)', color: 'var(--text-dim)' }}>
                                      {g.label}
                                    </button>
                                  );
                                });
                              })()}
                            </div>
                            {/* Schnellauswahl-Buttons */}
                            <div className="flex gap-1 flex-wrap">
                              {/* Alle GYM2 */}
                              {courses.some(c => c.stufe === 'GYM2') && (
                                <button onClick={() => update(w.id, { courseFilter: courses.filter(c => c.stufe === 'GYM2').map(c => c.id) })}
                                  className="text-[7px] px-1.5 py-0.5 rounded cursor-pointer" style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)', border: '1px solid var(--border-light)' }}>Alle GYM2</button>
                              )}
                              {/* Alle SF */}
                              {courses.some(c => c.typ === 'SF') && (
                                <button onClick={() => update(w.id, { courseFilter: courses.filter(c => c.typ === 'SF').map(c => c.id) })}
                                  className="text-[7px] px-1.5 py-0.5 rounded cursor-pointer" style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)', border: '1px solid var(--border-light)' }}>Alle SF</button>
                              )}
                              <button onClick={() => update(w.id, { courseFilter: courses.map(c => c.id) })}
                                className="text-[7px] px-1.5 py-0.5 rounded cursor-pointer" style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)', border: '1px solid var(--border-light)' }}>Alle</button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                <button onClick={() => addEntry(kw)}
                  className="w-full py-1 rounded border border-dashed text-[8px] cursor-pointer"
                  style={{ borderColor: 'var(--border-light)', color: 'var(--text-muted)' }}>
                  + Weiteren Eintrag für KW{kw}
                </button>
              </div>
            )}
          </div>
        );
      })}
      <button onClick={addNewWeek}
        className="w-full py-1.5 rounded border border-dashed text-[9px] cursor-pointer transition-all"
        style={{ borderColor: 'var(--border-light)', color: 'var(--text-muted)' }}>
        + Sonderwoche hinzufügen
      </button>
    </div>
  );
}
