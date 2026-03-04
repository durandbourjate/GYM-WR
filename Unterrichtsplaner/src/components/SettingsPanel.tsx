import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import type { CourseType, DayOfWeek, Semester } from '../types';
import { usePlannerStore } from '../store/plannerStore';
import {
  loadSettings, saveSettings, getDefaultSettings, generateId,
  applySettingsToWeekData,
  STUFE_OPTIONS,
  type PlannerSettings, type CourseConfig, type SpecialWeekConfig, type HolidayConfig,
  type SubjectConfig, type SchoolLevel, type AssessmentRule,
} from '../store/settingsStore';
import { generateColorVariants } from '../data/categories';
import { SUBJECT_PRESETS, SUBJECT_GROUPS } from '../data/subjectPresets';
import { type CurriculumGoal } from '../data/curriculumGoals';
import { getGymStufe } from '../utils/gradeRequirements';
import { useInstanceStore, weekToDate } from '../store/instanceStore';
import { useGCalStore } from '../store/gcalStore';
import { loginWithGoogle, logout as gcalLogout, fetchCalendarList, syncPlannerToCalendar, buildWeekYearMap, scanCalendarsForSpecialWeeks, checkCollisions, type SyncProgress, type ImportCandidate } from '../services/gcal';

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

// === Helper Components ===
function Section({ title, children, defaultOpen = false, actions }: { title: string; children: React.ReactNode; defaultOpen?: boolean; actions?: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-slate-700 rounded-lg overflow-hidden">
      <div className="flex items-center bg-slate-800 hover:bg-slate-750">
        <button onClick={() => setOpen(!open)}
          className="flex-1 px-3 py-2 text-left text-[11px] font-semibold text-gray-200 cursor-pointer flex items-center justify-between">
          {title}
          <span className="text-gray-400">{open ? '▾' : '▸'}</span>
        </button>
        {open && actions && (
          <div className="flex items-center gap-1 pr-2" onClick={(e) => e.stopPropagation()}>
            {actions}
          </div>
        )}
      </div>
      {open && <div className="p-3 space-y-2 bg-slate-900/50">{children}</div>}
    </div>
  );
}

function SmallInput({ value, onChange, placeholder, className = '', type = 'text' }: {
  value: string; onChange: (v: string) => void; placeholder?: string; className?: string; type?: string;
}) {
  // Use local state to prevent cursor jump on re-render (debounce pattern)
  const [local, setLocal] = useState(value);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { if (ref.current !== document.activeElement) setLocal(value); }, [value]);
  return (
    <input ref={ref} value={local} onChange={(e) => setLocal(e.target.value)}
      onBlur={() => { if (local !== value) onChange(local); }}
      onKeyDown={(e) => { if (e.key === 'Enter') { (e.target as HTMLInputElement).blur(); } }}
      placeholder={placeholder} type={type}
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

// === Rubric Collection Save/Load (v3.77 #8/#9/#10) ===
type RubricType = 'fachbereiche' | 'kurse' | 'sonderwochen' | 'ferien' | 'lehrplanziele' | 'beurteilungsregeln' | 'settings';
const RUBRIC_LABELS: Record<RubricType, string> = {
  fachbereiche: 'Fachbereiche', kurse: 'Kurse', sonderwochen: 'Sonderwochen',
  ferien: 'Ferien', lehrplanziele: 'Lehrplanziele', beurteilungsregeln: 'Beurteilungsregeln', settings: 'Konfiguration',
};

/** Save-to-collection dialog: replace existing or create new (v3.77 #10) */
function SaveToCollectionDialog({ rubricType, data, onClose }: { rubricType: RubricType; data: any; onClose: () => void }) {
  const { collection, addCollectionItem } = usePlannerStore();
  const label = RUBRIC_LABELS[rubricType];
  const existing = collection.filter(item => item.type === rubricType && item.settingsSnapshot);
  const [mode, setMode] = useState<'new' | 'replace'>(existing.length > 0 ? 'replace' : 'new');
  const [selectedId, setSelectedId] = useState(existing[0]?.id || '');
  const activeMeta = useInstanceStore.getState().getActive();
  const datum = new Date().toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: '2-digit' });
  const [newName, setNewName] = useState(`${label} ${activeMeta?.name || 'Planer'} ${datum}`);

  const handleSave = () => {
    const snapshot = JSON.stringify(data);
    if (mode === 'replace' && selectedId) {
      const item = existing.find(e => e.id === selectedId);
      if (item) {
        // Update the existing collection item's snapshot
        // We need to reach into the store directly since updateCollectionItem only updates title/tags/notes/subjectArea
        const store = usePlannerStore.getState();
        const updated = store.collection.map(c => c.id === selectedId ? { ...c, settingsSnapshot: snapshot, title: c.title } : c);
        usePlannerStore.setState({ collection: updated });
      }
    } else {
      addCollectionItem({ type: rubricType as any, title: newName.trim() || `${label} ${datum}`, units: [], settingsSnapshot: snapshot });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center" onClick={onClose}>
      <div className="bg-slate-800 border border-slate-600 rounded-lg p-4 w-80 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="text-[11px] font-bold text-gray-200 mb-3">📥 {label} in Sammlung speichern</div>
        <div className="space-y-2">
          {existing.length > 0 && (
            <div className="flex gap-2 text-[9px]">
              <label className={`flex items-center gap-1 cursor-pointer ${mode === 'replace' ? 'text-blue-300' : 'text-gray-400'}`}>
                <input type="radio" checked={mode === 'replace'} onChange={() => setMode('replace')} className="cursor-pointer" />
                Bestehende ersetzen
              </label>
              <label className={`flex items-center gap-1 cursor-pointer ${mode === 'new' ? 'text-blue-300' : 'text-gray-400'}`}>
                <input type="radio" checked={mode === 'new'} onChange={() => setMode('new')} className="cursor-pointer" />
                Als neue speichern
              </label>
            </div>
          )}
          {mode === 'replace' && existing.length > 0 ? (
            <select value={selectedId} onChange={e => setSelectedId(e.target.value)}
              className="w-full bg-slate-700 text-slate-200 border border-slate-600 rounded px-2 py-1.5 text-[10px] outline-none cursor-pointer">
              {existing.map(item => (
                <option key={item.id} value={item.id}>{item.title}</option>
              ))}
            </select>
          ) : (
            <input value={newName} onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSave(); }}
              placeholder="Name…" autoFocus
              className="w-full bg-slate-700 text-slate-200 border border-slate-600 rounded px-2 py-1.5 text-[10px] outline-none focus:border-blue-400" />
          )}
        </div>
        <div className="flex gap-1 mt-3">
          <button onClick={handleSave} className="flex-1 py-1.5 rounded text-[9px] font-medium bg-blue-600 hover:bg-blue-500 text-white cursor-pointer">Speichern</button>
          <button onClick={onClose} className="flex-1 py-1.5 rounded text-[9px] text-gray-400 border border-gray-700 cursor-pointer hover:text-gray-200">Abbrechen</button>
        </div>
      </div>
    </div>
  );
}

/** Load-from-collection picker for a specific rubric type (v3.77 #9) */
function RubricCollectionPicker({ rubricType, onLoad, onClose }: { rubricType: RubricType; onLoad: (snapshot: string) => void; onClose: () => void }) {
  const { collection } = usePlannerStore();
  const label = RUBRIC_LABELS[rubricType];
  // Show both rubric-specific items AND full 'settings' items (since those contain all rubrics)
  const items = collection.filter(item => (item.type === rubricType || item.type === 'settings') && item.settingsSnapshot);

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center" onClick={onClose}>
      <div className="bg-slate-800 border border-slate-600 rounded-lg p-4 w-80 max-h-[60vh] shadow-xl flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="text-[11px] font-bold text-gray-200 mb-3">📚 {label} aus Sammlung laden</div>
        {items.length === 0 ? (
          <div className="text-[9px] text-gray-400 text-center py-4">
            Keine gespeicherten {label} in der Sammlung.
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-1.5 mb-3">
            {items.map(item => {
              const dateStr = new Date(item.createdAt).toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: '2-digit' });
              const isFullConfig = item.type === 'settings';
              return (
                <button key={item.id} onClick={() => onLoad(item.settingsSnapshot!)}
                  className="w-full text-left px-3 py-2 rounded bg-slate-700/50 hover:bg-slate-700 border border-slate-600 hover:border-blue-500 cursor-pointer transition-all">
                  <div className="text-[10px] font-semibold text-gray-200">{item.title}</div>
                  <div className="text-[8px] text-gray-400">{isFullConfig ? '(Gesamtkonfiguration)' : label} · {dateStr}</div>
                </button>
              );
            })}
          </div>
        )}
        <button onClick={onClose} className="w-full py-1.5 rounded text-[9px] text-gray-400 border border-gray-700 cursor-pointer hover:text-gray-200">Abbrechen</button>
      </div>
    </div>
  );
}

/** Inline buttons for rubric-level collection save/load (v3.77 #9) */
function RubricCollectionButtons({ rubricType, getData, onLoad }: {
  rubricType: RubricType; getData: () => any; onLoad: (data: any) => void;
}) {
  const [showSave, setShowSave] = useState(false);
  const [showLoad, setShowLoad] = useState(false);

  const handleLoad = (snapshot: string) => {
    try {
      const parsed = JSON.parse(snapshot);
      // For full 'settings' items, extract just the rubric we need
      const rubricData = extractRubricData(rubricType, parsed);
      if (rubricData === undefined) { alert('Keine passenden Daten in dieser Konfiguration gefunden.'); return; }
      onLoad(rubricData);
      setShowLoad(false);
    } catch { alert('Fehler beim Lesen der Konfiguration.'); }
  };

  return (
    <>
      <div className="flex gap-1">
        <button onClick={() => setShowSave(true)}
          className="px-1.5 py-0.5 rounded text-[8px] bg-slate-700/50 border border-slate-600 text-gray-400 hover:text-gray-200 hover:border-slate-500 cursor-pointer transition-all"
          title={`${RUBRIC_LABELS[rubricType]} in Sammlung speichern`}>
          📥 Speichern
        </button>
        <button onClick={() => setShowLoad(true)}
          className="px-1.5 py-0.5 rounded text-[8px] bg-slate-700/50 border border-slate-600 text-gray-400 hover:text-gray-200 hover:border-slate-500 cursor-pointer transition-all"
          title={`${RUBRIC_LABELS[rubricType]} aus Sammlung laden`}>
          📚 Laden
        </button>
      </div>
      {showSave && <SaveToCollectionDialog rubricType={rubricType} data={getData()} onClose={() => setShowSave(false)} />}
      {showLoad && <RubricCollectionPicker rubricType={rubricType} onLoad={handleLoad} onClose={() => setShowLoad(false)} />}
    </>
  );
}

/** Compact action button style for Section headers (v3.80 C1) */
const ACT_BTN = "px-1.5 py-0.5 rounded text-[8px] bg-slate-700/50 border border-slate-600 text-gray-400 hover:text-gray-200 hover:border-slate-500 cursor-pointer transition-all";

/** Combined header actions for a settings rubric: [+ Hinzufügen] [💾 Speichern] [📂 Laden] [📥 Import] */
function SectionActions({ rubricType, getData, onLoad, onAdd, importAccept, onImport }: {
  rubricType: RubricType; getData: () => any; onLoad: (data: any) => void;
  onAdd?: () => void; importAccept?: string; onImport?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <>
      {onAdd && <button onClick={onAdd} className={ACT_BTN} title="Hinzufügen">+</button>}
      <RubricCollectionButtons rubricType={rubricType} getData={getData} onLoad={onLoad} />
      {onImport && (
        <label className={ACT_BTN} title="Aus Datei importieren">
          ⬆<input type="file" accept={importAccept || '.json'} className="hidden" onChange={onImport} />
        </label>
      )}
    </>
  );
}

/** Extract rubric-specific data from a parsed settings snapshot */
function extractRubricData(rubricType: RubricType, parsed: any): any {
  switch (rubricType) {
    case 'fachbereiche': return parsed.subjects ?? parsed;
    case 'kurse': return parsed.courses ?? parsed;
    case 'sonderwochen': return parsed.specialWeeks ?? parsed;
    case 'ferien': return parsed.holidays ?? parsed;
    case 'lehrplanziele': return parsed.curriculumGoals ?? parsed;
    case 'beurteilungsregeln': return parsed.assessmentRules ?? parsed;
    case 'settings': return parsed;
    default: return undefined;
  }
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

  return (
    <div className="space-y-2">
      <p className="text-[8px] text-gray-400">Fachbereiche definieren die Farben und Kategorien für die Unterrichtsplanung. INTERDISZ wird automatisch ergänzt.</p>
      {subjects.length === 0 && (
        <p className="text-[9px] text-amber-400/80 bg-amber-900/20 border border-amber-700/30 rounded px-2 py-1.5">
          Keine Fachbereiche konfiguriert. Füge einen Fachbereich hinzu oder wähle eine Vorlage.
        </p>
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
      <div className="flex gap-1 flex-wrap">
        <button onClick={addSubject}
          className="flex-1 py-1 rounded border border-dashed border-gray-600 text-gray-400 hover:text-gray-300 hover:border-gray-400 text-[9px] cursor-pointer transition-all">
          + Fachbereich hinzufügen
        </button>
      </div>
      {/* Fach-Dropdown (v3.81 D4) */}
      <div className="flex gap-1 items-center">
        <span className="text-[8px] text-gray-500">Vorlage:</span>
        <select
          className="bg-slate-800 border border-slate-600 rounded px-1.5 py-0.5 text-[9px] text-gray-300 outline-none cursor-pointer flex-1"
          value=""
          onChange={(e) => {
            const preset = SUBJECT_PRESETS.find(p => p.id === e.target.value);
            if (!preset) return;
            const ids = new Set(subjects.map(s => s.id));
            const labels = new Set(subjects.map(s => s.label.toLowerCase()));
            const unique = preset.subjects.filter(s => !ids.has(s.id) && !labels.has(s.label.toLowerCase()));
            const dupes = preset.subjects.length - unique.length;
            if (unique.length === 0) { alert('Alle Fachbereiche dieser Vorlage sind bereits vorhanden.'); return; }
            if (subjects.length === 0) {
              // Leer → direkt laden
              onChange([...unique]);
            } else {
              // Dialog: Ersetzen oder Ergänzen
              const choice = confirm(
                `«${preset.label}» laden:\n\n` +
                `• OK = Bestehende ersetzen (${subjects.length} → ${preset.subjects.length})\n` +
                `• Abbrechen = Ergänzen (${unique.length} hinzufügen${dupes > 0 ? `, ${dupes} Duplikate übersprungen` : ''})`
              );
              if (choice) {
                onChange([...preset.subjects]);
              } else {
                onChange([...subjects, ...unique]);
              }
            }
          }}
        >
          <option value="">Fach wählen…</option>
          {SUBJECT_GROUPS.map(group => (
            <optgroup key={group} label={`── ${group} ──`}>
              {SUBJECT_PRESETS.filter(p => p.group === group).map(p => (
                <option key={p.id} value={p.id}>{p.icon} {p.label}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>
    </div>
  );
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
function CourseEditor({ courses, onChange, schoolLevel, baseDuration = 45, focusCourseId, subjects = [] }: { courses: CourseConfig[]; onChange: (c: CourseConfig[]) => void; schoolLevel?: SchoolLevel; baseDuration?: number; focusCourseId?: string | null; subjects?: SubjectConfig[] }) {
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
        <div key={stableKey} ref={group.some(c => c.id === editingId) ? focusRef : undefined} className="border border-slate-700/50 rounded p-2 space-y-1">
          <div className="text-[9px] font-semibold text-gray-300 cursor-pointer hover:text-blue-300 transition-colors"
            onClick={() => setEditingId(editingId === group[0].id ? null : group[0].id)}>
            {group[0].cls || '(neu)'} <span className="text-blue-400">{group[0].typ}</span>
            <span className="text-[7px] text-gray-500 ml-1">({group.map(c => c.day).join(', ')})</span>
          </div>
          {group.map(c => (
            <div key={c.id}>
              {editingId === c.id ? (
                <div className="space-y-1.5 bg-slate-800 rounded p-2">
                  <div className="flex gap-1 flex-wrap">
                    <SmallInput value={c.cls} onChange={(v) => updateCourse(c.id, { cls: v })} placeholder="Klasse" className="w-20" />
                    {subjects.length > 0
                      ? <SmallSelect value={c.typ} onChange={(v) => updateCourse(c.id, { typ: v })} options={getCourseTypes(subjects)} />
                      : <SmallInput value={c.typ} onChange={(v) => updateCourse(c.id, { typ: v as CourseType })} placeholder="Typ" className="w-14" />
                    }
                    {schoolLevel && (
                      <select value={c.stufe || ''} onChange={(e) => updateCourse(c.id, { stufe: e.target.value || undefined })}
                        className="bg-slate-700 text-slate-200 border border-slate-600 rounded px-1 py-0.5 text-[9px] outline-none focus:border-blue-400 cursor-pointer">
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
                          <label key={d} className={`flex items-center gap-0 text-[8px] cursor-pointer select-none px-0.5 py-0.5 rounded ${
                            isChecked ? 'text-blue-300 bg-blue-900/30' : 'text-gray-500 hover:text-gray-400'
                          }`}>
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
                    {c.les > 1 && <p className="text-[6px] text-yellow-600 mt-0.5" title="Pausen zwischen Lektionen werden nicht automatisch berücksichtigt. Endzeit ggf. manuell anpassen.">⚠ ohne Pausen</p>}
                  </div>
                  <div>
                    <label className="text-[8px] text-gray-400 mb-0.5 block">Dauer</label>
                    <CourseDurationPicker value={c.les * baseDuration} baseDuration={baseDuration} onChange={(min) => {
                      const autoEnd = addMinutesToTime(c.from, min);
                      updateCourse(c.id, { les: durationToLes(min, baseDuration), to: autoEnd });
                    }} />
                  </div>
                  <div className="flex gap-3 items-center flex-wrap" title="Für unterschiedliche Tage pro Semester: separate Einträge mit S1 bzw. S2 erstellen (via Tage-Checkboxen oben)">
                    <label className="flex items-center gap-1 text-[9px] text-gray-400 cursor-pointer">
                      <input type="checkbox" checked={c.hk} onChange={(e) => updateCourse(c.id, { hk: e.target.checked })} className="cursor-pointer" />
                      HK
                    </label>
                    <label className="flex items-center gap-1 text-[9px] text-gray-400 cursor-pointer" title="Semester 1 — Eintrag nur im 1. Semester aktiv">
                      <input type="checkbox" checked={c.semesters.includes(1)} onChange={(e) => {
                        const s = e.target.checked ? [...new Set([...c.semesters, 1 as Semester])] : c.semesters.filter(x => x !== 1);
                        updateCourse(c.id, { semesters: s });
                      }} className="cursor-pointer" />
                      S1
                    </label>
                    <label className="flex items-center gap-1 text-[9px] text-gray-400 cursor-pointer" title="Semester 2 — Eintrag nur im 2. Semester aktiv">
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
                  {c.stufe && <span className="text-cyan-500 text-[8px]">{c.stufe}</span>}
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
    // When KW changes, keep the group expanded by updating expandedWeek (v3.76 #8)
    if (patch.week !== undefined) {
      setExpandedWeek(patch.week);
    }
  };

  const updateGymLevel = (id: string, gymLevel: string) => {
    const level = gymLevel === 'alle' ? undefined : gymLevel;
    const excluded = computeExcludedCourses(level, courses);
    onChange(weeks.map(w => w.id === id ? { ...w, gymLevel: level, excludedCourseIds: excluded.length > 0 ? excluded : undefined } : w));
  };

  const remove = (id: string) => {
    onChange(weeks.filter(w => w.id !== id));
  };


  return (
    <div className="space-y-1.5">
      <p className="text-[8px] text-gray-400">Pro Kalenderwoche können verschiedene GYM-Stufen unterschiedliche Sonderwochen haben. Klicke auf eine KW um Details zu bearbeiten.</p>
      {grouped.map(([kw, entries]) => {
        const isExpanded = expandedWeek === kw;
        const stableKey = entries[0]?.id || kw || 'new';
        return (
          <div key={stableKey} className="border border-slate-700/50 rounded overflow-hidden">
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
                      <div className="flex flex-wrap gap-1 items-center">
                        <span className="text-[7px] text-gray-400" title="Kurse, die von dieser Sonderwoche NICHT betroffen sind (= normaler Unterricht)">Nicht betroffen:</span>
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
                className="w-5 h-5 flex items-center justify-center text-[10px] text-gray-500 cursor-pointer hover:text-gray-300 hover:bg-slate-700 rounded"
                title="Tagesauswahl anzeigen">
                {expandedDays.has(h.id) ? '▾' : '▸'}
              </button>
            )}
            <button onClick={() => remove(h.id)} className="ml-1 w-5 h-5 flex items-center justify-center text-[9px] text-red-400 cursor-pointer hover:bg-red-900/30 rounded" title="Entfernen">✕</button>
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

// === Assessment Rules Editor ===
const DEFAULT_GYM_RULES: AssessmentRule[] = [
  { label: 'Standortbestimmung (Nov)', deadline: 'KW 45', minGrades: 1, semester: 1, stufe: 'GYM1' },
  { label: 'Semesterzeugnis', deadline: 'Ende Semester 1', minGrades: 2, semester: 1, stufe: 'GYM1' },
  { label: 'Jahreszeugnis', deadline: 'Ende Schuljahr', minGrades: 3, semester: 'year', stufe: 'GYM1', weeklyLessonsThreshold: 3, minGradesAboveThreshold: 4 },
  { label: 'Zwischenbericht', deadline: 'Ende Semester 1', minGrades: 1, semester: 1, stufe: 'GYM2' },
  { label: 'Jahreszeugnis', deadline: 'Ende Schuljahr', minGrades: 3, semester: 'year', weeklyLessonsThreshold: 3, minGradesAboveThreshold: 4 },
];

function AssessmentRulesEditor({ rules, onChange, schoolLevel }: {
  rules: AssessmentRule[];
  onChange: (r: AssessmentRule[]) => void;
  schoolLevel?: SchoolLevel;
}) {
  const addRule = () => {
    onChange([...rules, { label: '', deadline: '', minGrades: 1, semester: 'year' }]);
  };

  const update = (idx: number, patch: Partial<AssessmentRule>) => {
    onChange(rules.map((r, i) => i === idx ? { ...r, ...patch } : r));
  };

  const remove = (idx: number) => {
    onChange(rules.filter((_, i) => i !== idx));
  };

  // Stufe options from school level (v3.77 #11)
  const stufeOptions = useMemo(() => {
    const opts: { key: string; label: string }[] = [{ key: '', label: 'Alle Stufen' }];
    if (schoolLevel && STUFE_OPTIONS[schoolLevel]) {
      opts.push(...STUFE_OPTIONS[schoolLevel]);
    } else {
      // Default GYM levels
      opts.push(
        { key: 'GYM1', label: 'GYM1' }, { key: 'GYM2', label: 'GYM2' },
        { key: 'GYM3', label: 'GYM3' }, { key: 'GYM4', label: 'GYM4' },
        { key: 'GYM5', label: 'GYM5' },
      );
    }
    return opts;
  }, [schoolLevel]);

  // v3.81 D1: handleImport entfernt — Import läuft über SectionActions im Header

  return (
    <div className="space-y-1.5">
      <p className="text-[8px] text-gray-400">
        {rules.length > 0
          ? `${rules.length} eigene Beurteilungsregeln aktiv. Prüfungen werden in der Statistik dagegen geprüft.`
          : 'Standard-Regelwerk (GYM1–5, MiSDV Art. 4) wird verwendet. Eigene Regeln überschreiben den Standard.'}
      </p>
      {rules.map((r, i) => (
        <div key={i} className="bg-slate-800 rounded p-2 space-y-1">
          <div className="flex gap-1 items-center">
            <SmallInput value={r.label} onChange={(v) => update(i, { label: v })} placeholder="Bezeichnung" className="flex-1" />
            <button onClick={() => remove(i)} className="text-[8px] text-red-400 cursor-pointer">✕</button>
          </div>
          <div className="flex gap-1.5 items-center flex-wrap">
            <span className="text-[7px] text-gray-400">Zeitraum:</span>
            <SmallSelect value={String(r.semester)} onChange={(v) => {
              const sem = v === 'year' ? 'year' : v === 'custom' ? 'custom' : parseInt(v) as 1 | 2;
              const deadlineAuto = sem === 1 ? 'Ende Semester 1' : sem === 2 ? 'Ende Semester 2' : sem === 'year' ? 'Ende Schuljahr' : r.deadline;
              update(i, { semester: sem, deadline: sem !== 'custom' ? deadlineAuto : r.deadline });
            }}
              options={[
                { key: '1', label: 'Sem 1' }, { key: '2', label: 'Sem 2' },
                { key: 'year', label: 'Ganz SJ' }, { key: 'custom', label: 'Andere…' },
              ]} />
            {r.semester === 'custom' ? (
              <input type="date" value={r.customDate || ''}
                onChange={(e) => update(i, { customDate: e.target.value, deadline: e.target.value })}
                className="bg-slate-700 text-slate-200 border border-slate-600 rounded px-1.5 py-0.5 text-[9px] outline-none focus:border-blue-400 cursor-pointer" />
            ) : (
              <SmallInput value={r.deadline} onChange={(v) => update(i, { deadline: v })}
                placeholder={r.semester === 'year' ? 'Ende SJ' : `Ende Sem ${r.semester}`} className="w-28" />
            )}
          </div>
          <div className="flex gap-1.5 items-center flex-wrap">
            <span className="text-[7px] text-gray-400">Stufe:</span>
            <select value={r.stufe || ''} onChange={(e) => update(i, { stufe: e.target.value || undefined })}
              className="bg-slate-700 text-slate-200 border border-slate-600 rounded px-1 py-0.5 text-[9px] outline-none focus:border-blue-400 cursor-pointer">
              {stufeOptions.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
            </select>
            <span className="text-[7px] text-gray-400 ml-1">Min. Noten:</span>
            <SmallInput value={String(r.minGrades)} onChange={(v) => update(i, { minGrades: parseInt(v) || 1 })} className="w-10 text-center" type="number" />
          </div>
          {/* Lektionenzahl-abhängige Regeln (v3.77 #11) */}
          <div className="flex gap-1.5 items-center flex-wrap">
            <span className="text-[7px] text-gray-400">Bei &gt;</span>
            <SmallInput value={r.weeklyLessonsThreshold != null ? String(r.weeklyLessonsThreshold) : ''} onChange={(v) => {
              const n = parseInt(v);
              update(i, { weeklyLessonsThreshold: isNaN(n) ? undefined : n });
            }} placeholder="L/W" className="w-10 text-center" type="number" />
            <span className="text-[7px] text-gray-400">L/Woche → Min. Noten:</span>
            <SmallInput value={r.minGradesAboveThreshold != null ? String(r.minGradesAboveThreshold) : ''} onChange={(v) => {
              const n = parseInt(v);
              update(i, { minGradesAboveThreshold: isNaN(n) ? undefined : n });
            }} placeholder="—" className="w-10 text-center" type="number" />
            {r.weeklyLessonsThreshold != null && r.minGradesAboveThreshold != null && (
              <span className="text-[7px] text-gray-500">
                (≤{r.weeklyLessonsThreshold}L → {r.minGrades}, &gt;{r.weeklyLessonsThreshold}L → {r.minGradesAboveThreshold})
              </span>
            )}
          </div>
        </div>
      ))}
      <div className="flex gap-1">
        <button onClick={addRule}
          className="flex-1 py-1 rounded border border-dashed border-gray-600 text-gray-400 hover:text-gray-300 text-[9px] cursor-pointer">
          + Regel hinzufügen
        </button>
        {rules.length === 0 && (
          <button onClick={() => onChange([...DEFAULT_GYM_RULES])}
            className="py-1 px-2 rounded border border-blue-500/30 text-blue-400 text-[9px] cursor-pointer hover:bg-blue-500/10">
            📋 GYM-Standard laden
          </button>
        )}
      </div>
    </div>
  );
}

// (SettingsCollectionPicker removed in v3.77 #9 — replaced by RubricCollectionPicker)

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
  const settingsEditCourseId = usePlannerStore(s => s.settingsEditCourseId);

  const [settings, setSettings] = useState<PlannerSettings>(() => {
    if (storeSettings) return storeSettings;
    const global = loadSettings();
    if (global) return global;
    return getDefaultSettings();
  });
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // === Header-level add handlers (v3.80 C1) ===
  const addSubjectHeader = () => updateSettings({ subjects: [...settings.subjects, { id: generateId(), label: '', shortLabel: '', color: '#64748b', courseType: 'SF' as any }] });
  const addCourseHeader = () => updateSettings({ courses: [...settings.courses, { id: generateId(), cls: '', typ: 'SF' as any, day: 'Mo' as any, from: '08:05', to: '08:50', les: 1, hk: false, semesters: [1, 2] }] });
  const addSpecialWeekHeader = () => updateSettings({ specialWeeks: [...settings.specialWeeks, { id: generateId(), label: '', week: '', type: 'event' }] });
  const addHolidayHeader = () => updateSettings({ holidays: [...settings.holidays, { id: generateId(), label: '', startWeek: '', endWeek: '' }] });
  const addAssessmentHeader = () => updateSettings({ assessmentRules: [...(settings.assessmentRules || []), { label: '', deadline: '', minGrades: 1, semester: 'year' }] });

  // === Header-level import handlers (v3.80 C1) ===
  const fileImport = (handler: (text: string, fileName: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => handler(reader.result as string, file.name);
    reader.readAsText(file); e.target.value = '';
  };

  const importSubjectsHeader = fileImport((text) => {
    try {
      const data = JSON.parse(text);
      const arr: SubjectConfig[] = Array.isArray(data) ? data : data.subjects || [];
      if (arr.length === 0) { alert('Keine gültigen Fachbereiche gefunden.'); return; }
      const ids = new Set(settings.subjects.map(s => s.id));
      const labels = new Set(settings.subjects.map(s => s.label.toLowerCase()));
      const unique = arr.filter(s => !ids.has(s.id) && !labels.has((s.label || '').toLowerCase()));
      const dupes = arr.length - unique.length;
      if (unique.length === 0) { alert(`Alle ${arr.length} bereits vorhanden.`); return; }
      const withIds = unique.map(s => ({ ...s, id: s.id || generateId() }));
      const msg = dupes > 0 ? `${withIds.length} importieren, ${dupes} übersprungen.` : `${withIds.length} Fachbereiche importieren?`;
      if (confirm(msg)) updateSettings({ subjects: [...settings.subjects, ...withIds] });
    } catch { alert('JSON konnte nicht gelesen werden.'); }
  });

  const importCoursesHeader = fileImport((text) => {
    try {
      const data = JSON.parse(text);
      const arr: CourseConfig[] = Array.isArray(data) ? data : data.kurse || data.courses || [];
      if (arr.length === 0) { alert('Keine gültigen Kurse gefunden.'); return; }
      const keys = new Set(settings.courses.map(c => `${c.cls}|${c.day}|${c.from}`));
      const unique = arr.filter(c => !keys.has(`${c.cls}|${c.day}|${c.from}`));
      const dupes = arr.length - unique.length;
      if (unique.length === 0) { alert(`Alle ${arr.length} bereits vorhanden.`); return; }
      const withIds = unique.map(c => ({ ...c, id: c.id || generateId() }));
      const msg = dupes > 0 ? `${withIds.length} importieren, ${dupes} übersprungen.` : `${withIds.length} Kurse importieren?`;
      if (confirm(msg)) updateSettings({ courses: [...settings.courses, ...withIds] });
    } catch { alert('JSON konnte nicht gelesen werden.'); }
  });

  const importSpecialWeeksHeader = fileImport((text, fileName) => {
    try {
      let imported: SpecialWeekConfig[] = [];
      if (fileName.endsWith('.json')) {
        imported = JSON.parse(text) as SpecialWeekConfig[];
        if (!Array.isArray(imported)) { alert('Ungültiges Format.'); return; }
      } else {
        const lines = text.split('\n').filter(l => l.trim());
        for (const line of lines) {
          const parts = line.split(/[,;\t]/).map(p => p.trim());
          if (parts.length >= 2) imported.push({ id: generateId(), label: parts[0], week: parts[1].replace(/^KW\s*/i, '').padStart(2, '0'), type: (parts[2] === 'holiday' ? 'holiday' : 'event') as any, gymLevel: parts[3] || undefined });
        }
      }
      if (imported.length === 0) { alert('Keine gültigen Einträge.'); return; }
      const keys = new Set(settings.specialWeeks.map(w => `${w.label}|${w.week}`));
      const unique = imported.filter(w => !keys.has(`${w.label}|${w.week}`));
      const dupes = imported.length - unique.length;
      if (unique.length === 0) { alert(`Alle ${imported.length} bereits vorhanden.`); return; }
      const msg = dupes > 0 ? `${unique.length} importieren, ${dupes} übersprungen.` : `${unique.length} Sonderwochen importieren?`;
      if (confirm(msg)) updateSettings({ specialWeeks: [...settings.specialWeeks, ...unique] });
    } catch { alert('Datei konnte nicht gelesen werden.'); }
  });

  const importHolidaysHeader = fileImport((text, fileName) => {
    try {
      let imported: HolidayConfig[] = [];
      if (fileName.endsWith('.json')) {
        const data = JSON.parse(text);
        const arr = Array.isArray(data) ? data : data.holidays || [];
        imported = arr.map((h: any) => ({ id: generateId(), label: h.label || h.name || '', startWeek: String(h.startWeek || h.start || '').replace(/^KW\s*/i, '').padStart(2, '0'), endWeek: String(h.endWeek || h.end || '').replace(/^KW\s*/i, '').padStart(2, '0'), ...(h.days ? { days: h.days } : {}) }));
      } else {
        const lines = text.split('\n').filter(l => l.trim());
        for (const line of lines) { const parts = line.split(/[,;\t]/).map(p => p.trim()); if (parts.length >= 3) imported.push({ id: generateId(), label: parts[0], startWeek: parts[1].replace(/^KW\s*/i, '').padStart(2, '0'), endWeek: parts[2].replace(/^KW\s*/i, '').padStart(2, '0') }); }
      }
      if (imported.length === 0) { alert('Keine gültigen Einträge.'); return; }
      const keys = new Set(settings.holidays.map(h => `${h.label}|${h.startWeek}`));
      const unique = imported.filter(h => !keys.has(`${h.label}|${h.startWeek}`));
      const dupes = imported.length - unique.length;
      if (unique.length === 0) { alert(`Alle ${imported.length} bereits vorhanden.`); return; }
      const msg = dupes > 0 ? `${unique.length} importieren, ${dupes} übersprungen.` : `${unique.length} Ferienperioden importieren?`;
      if (confirm(msg)) updateSettings({ holidays: [...settings.holidays, ...unique] });
    } catch { alert('Datei konnte nicht gelesen werden.'); }
  });

  const importLehrplanzieleHeader = fileImport((text) => {
    try {
      const data = JSON.parse(text) as CurriculumGoal[];
      if (!Array.isArray(data) || data.length === 0) { alert('Ungültiges Format.'); return; }
      if (confirm(`${data.length} Lehrplanziele importieren? Bestehende werden ersetzt.`)) updateSettings({ curriculumGoals: data });
    } catch { alert('JSON konnte nicht gelesen werden.'); }
  });

  const importAssessmentHeader = fileImport((text) => {
    try {
      const data = JSON.parse(text);
      const imported: AssessmentRule[] = Array.isArray(data) ? data : data.assessmentRules || data.rules || [];
      if (imported.length === 0) { alert('Keine gültigen Regeln.'); return; }
      const keys = new Set((settings.assessmentRules || []).map(r => `${r.label}|${r.semester}|${r.stufe || ''}`));
      const unique = imported.filter(r => !keys.has(`${r.label}|${r.semester}|${r.stufe || ''}`));
      const dupes = imported.length - unique.length;
      if (unique.length === 0) { alert(`Alle ${imported.length} bereits vorhanden.`); return; }
      const msg = dupes > 0 ? `${unique.length} importieren, ${dupes} übersprungen.` : `${unique.length} Regeln importieren?`;
      if (confirm(msg)) updateSettings({ assessmentRules: [...(settings.assessmentRules || []), ...unique] });
    } catch { alert('JSON konnte nicht gelesen werden.'); }
  });

  const hasCustomSettings = storeSettings !== null || loadSettings() !== null;

  return (
    <div className="flex-1 overflow-y-auto p-3 pb-12 space-y-3" style={{ overscrollBehavior: 'contain' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[11px] font-bold text-gray-200">Einstellungen</h3>
          <p className="text-[8px] text-gray-400 mt-0.5">
            {hasCustomSettings ? 'Eigene Konfiguration aktiv' : 'Standard-Konfiguration'}
          </p>
        </div>
        <div className="flex gap-1 items-center">
          {saveStatus === 'saving' && <span className="text-[9px] text-gray-500">Speichern…</span>}
          {saveStatus === 'saved' && <span className="text-[9px] text-green-400">✓ Gespeichert</span>}
        </div>
      </div>

      {/* v3.80 C2: Hardcoded Stundenplan-Hint entfernt — Import über Kurse-Rubrik */}

      {/* School basics */}
      <Section title="🏫 Schule & Grundeinstellungen" defaultOpen>
        <div className="space-y-1.5">
          <div>
            <label className="text-[8px] text-gray-400 mb-0.5 block">Schulname (optional)</label>
            <SmallInput value={settings.school?.name || ''} onChange={(v) => updateSettings({ school: { ...settings.school!, name: v } })} placeholder="z.B. Gymnasium Hofwil" className="w-full" />
          </div>
          <div>
            <label className="text-[8px] text-gray-400 mb-0.5 block">Schulstufe</label>
            <select value={settings.schoolLevel || ''} onChange={(e) => updateSettings({ schoolLevel: (e.target.value || undefined) as SchoolLevel | undefined })}
              className="bg-slate-700 text-slate-200 border border-slate-600 rounded px-1.5 py-0.5 text-[10px] outline-none focus:border-blue-400 cursor-pointer w-full">
              <option value="">-- Nicht gesetzt --</option>
              <option value="Grundstufe">Grundstufe (Primarstufe)</option>
              <option value="Sek1">Sekundarstufe I</option>
              <option value="Sek2">Sekundarstufe II (Gymnasium)</option>
              <option value="Berufsbildung">Berufsbildung</option>
              <option value="Hochschule">Hochschule</option>
            </select>
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
      <Section title={`🎨 Fachbereiche (${settings.subjects.length})`} actions={
        <SectionActions rubricType="fachbereiche" getData={() => settings.subjects}
          onLoad={(data) => { if (Array.isArray(data) && confirm(`${data.length} Fachbereiche laden? Bestehende werden ersetzt.`)) updateSettings({ subjects: data }); }}
          onAdd={addSubjectHeader} onImport={importSubjectsHeader} />
      }>
        <SubjectsEditor subjects={settings.subjects} onChange={(s) => updateSettings({ subjects: s })} />
      </Section>

      {/* Courses */}
      <Section title={`📚 Kurse / Stundenplan (${settings.courses.length})`} actions={
        <SectionActions rubricType="kurse" getData={() => settings.courses}
          onLoad={(data) => { if (Array.isArray(data) && confirm(`${data.length} Kurse laden? Bestehende werden ersetzt.`)) updateSettings({ courses: data }); }}
          onAdd={addCourseHeader} onImport={importCoursesHeader} />
      }>
        <CourseEditor courses={settings.courses} onChange={(c) => updateSettings({ courses: c })} schoolLevel={settings.schoolLevel} baseDuration={settings.school?.lessonDurationMin || 45} focusCourseId={settingsEditCourseId} subjects={settings.subjects || []} />
      </Section>

      {/* Special Weeks */}
      <Section title={`📅 Sonderwochen (${settings.specialWeeks.length})`} actions={
        <SectionActions rubricType="sonderwochen" getData={() => settings.specialWeeks}
          onLoad={(data) => { if (Array.isArray(data) && confirm(`${data.length} Sonderwochen laden? Bestehende werden ersetzt.`)) updateSettings({ specialWeeks: data }); }}
          onAdd={addSpecialWeekHeader} importAccept=".json,.csv,.txt" onImport={importSpecialWeeksHeader} />
      }>
        <SpecialWeeksEditor weeks={settings.specialWeeks} courses={settings.courses} onChange={(w) => updateSettings({ specialWeeks: w })} />
      </Section>

      {/* Holidays */}
      <Section title={`🏖 Ferien (${settings.holidays.length})`} actions={
        <SectionActions rubricType="ferien" getData={() => settings.holidays}
          onLoad={(data) => { if (Array.isArray(data) && confirm(`${data.length} Ferienperioden laden? Bestehende werden ersetzt.`)) updateSettings({ holidays: data }); }}
          onAdd={addHolidayHeader} importAccept=".csv,.txt,.json" onImport={importHolidaysHeader} />
      }>
        <HolidaysEditor holidays={settings.holidays} onChange={(h) => updateSettings({ holidays: h })} />
      </Section>

      {/* Curriculum Goals */}
      <Section title={`🎯 Lehrplanziele (${settings.curriculumGoals?.length || 0})`} actions={
        <SectionActions rubricType="lehrplanziele" getData={() => settings.curriculumGoals || []}
          onLoad={(data) => { if (Array.isArray(data) && confirm(`${data.length} Lehrplanziele laden? Bestehende werden ersetzt.`)) updateSettings({ curriculumGoals: data }); }}
          onImport={importLehrplanzieleHeader} />
      }>
        <div className="space-y-2">
          <p className="text-[8px] text-gray-400">
            {settings.curriculumGoals?.length
              ? `${settings.curriculumGoals.length} Lehrplanziele konfiguriert.`
              : 'Keine Lehrplanziele konfiguriert. Importiere eigene Ziele als JSON oder lade sie aus der Sammlung.'}
          </p>
          <div className="flex gap-1 flex-wrap">
            {/* v3.81 D1: Import-Button nur noch im Header (⬆). Hier nur Clear-Button */}
            {settings.curriculumGoals && settings.curriculumGoals.length > 0 && (
              <button onClick={() => {
                if (confirm('Eigene Lehrplanziele entfernen? (Standard wird verwendet falls Sek2)')) {
                  updateSettings({ curriculumGoals: undefined as any });
                }
              }} className="px-2 py-1 rounded border border-red-500/30 text-red-400 text-[9px] cursor-pointer hover:bg-red-500/10">
                ✕ Eigene entfernen
              </button>
            )}
          </div>
        </div>
      </Section>

      {/* Assessment Rules */}
      <Section title={`📝 Beurteilungsregeln (${settings.assessmentRules?.length || 0})`} actions={
        <SectionActions rubricType="beurteilungsregeln" getData={() => settings.assessmentRules || []}
          onLoad={(data) => { if (Array.isArray(data) && confirm(`${data.length} Beurteilungsregeln laden? Bestehende werden ersetzt.`)) updateSettings({ assessmentRules: data }); }}
          onAdd={addAssessmentHeader} onImport={importAssessmentHeader} />
      }>
        <AssessmentRulesEditor
          rules={settings.assessmentRules || []}
          onChange={(r) => updateSettings({ assessmentRules: r.length > 0 ? r : undefined as any })}
          schoolLevel={settings.schoolLevel}
        />
      </Section>

      {/* v3.81 D5: «Daten» + «Sammlung» zusammengeführt */}
      <Section title="💾 Daten & Sammlung">
        <div className="space-y-3">
          {/* Konfiguration */}
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
                📤 Exportieren
              </button>
              <label className="flex-1 py-1.5 rounded text-[9px] font-medium bg-slate-700 hover:bg-slate-600 text-gray-200 text-center cursor-pointer transition-all">
                📥 Importieren
                <input type="file" accept=".json" className="hidden" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => {
                    try {
                      const imported = JSON.parse(reader.result as string);
                      if (!imported || typeof imported !== 'object') { alert('Ungültige Datei.'); return; }
                      if (!Array.isArray(imported.courses)) { alert('Feld "courses" fehlt.'); return; }
                      if (!Array.isArray(imported.holidays)) { alert('Feld "holidays" fehlt.'); return; }
                      if (!Array.isArray(imported.specialWeeks)) { alert('Feld "specialWeeks" fehlt.'); return; }
                      if (!confirm(`Einstellungen überschreiben? (${imported.courses.length} Kurse, ${imported.holidays.length} Ferien, ${imported.specialWeeks.length} Sonderwochen)`)) return;
                      setSettings(imported as PlannerSettings);
                      doSave(imported as PlannerSettings);
                    } catch { alert('Fehler beim Lesen der Datei.'); }
                  };
                  reader.readAsText(file);
                  e.target.value = '';
                }} />
              </label>
            </div>
          </div>

          {/* Planerdaten */}
          <div className="border-t border-white/10 pt-3">
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
                      if (success) alert('Planerdaten erfolgreich importiert.');
                      else alert('Keine gültigen Planerdaten gefunden.');
                    } catch { alert('Fehler beim Lesen der Datei.'); }
                  };
                  reader.readAsText(file);
                }} />
              </label>
            </div>
          </div>

          {/* Sammlung */}
          <div className="border-t border-white/10 pt-3">
            <p className="text-[8px] text-gray-400 font-semibold mb-1">Sammlung (Gesamtkonfiguration)</p>
            <p className="text-[8px] text-gray-400 mb-1.5">Konfiguration in der Sammlung sichern oder laden. Einzelne Rubriken können oben separat gespeichert werden.</p>
            <RubricCollectionButtons rubricType="settings" getData={() => settings}
              onLoad={(data) => {
                if (!data || typeof data !== 'object') { alert('Ungültige Konfiguration.'); return; }
                if (!Array.isArray(data.courses) || !Array.isArray(data.holidays) || !Array.isArray(data.specialWeeks)) { alert('Ungültige Konfiguration.'); return; }
                if (!confirm(`Einstellungen überschreiben? (${data.courses.length} Kurse, ${data.holidays.length} Ferien, ${data.specialWeeks.length} Sonderwochen)`)) return;
                setSettings(data as PlannerSettings);
                doSave(data as PlannerSettings);
              }} />
          </div>
        </div>
      </Section>

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
