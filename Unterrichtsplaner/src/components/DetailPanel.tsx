import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { usePlannerStore } from '../store/plannerStore';
import { usePlannerData } from '../hooks/usePlannerData';
import { TYPE_BADGES, getSequenceInfoFromStore } from '../utils/colors';
import { CurriculumGoalPicker } from './CurriculumGoalPicker';
import { SequencePanel } from './SequencePanel';
import { SettingsPanel } from './SettingsPanel';
import { CollectionPanel } from './CollectionPanel';
import { suggestGoals, suggestSubjectArea } from '../utils/autoSuggest';
import { inferSubjectAreaFromLessonType } from '../data/categories';
import type { SubjectArea, BlockCategory, LessonDetail, SolDetails, Course, SequenceBlock } from '../types';

// SUBJECT_AREAS is now provided via usePlannerData().categories — no local constant needed

// === Block-Kategorie / Untertyp-System ===
interface CategoryDef {
  key: BlockCategory;
  label: string;
  labelShort: string;
  icon: string;
  color: string;
}

interface SubtypeDef {
  key: string;
  label: string;
  labelShort: string;
  icon: string;
  custom?: boolean;
}

const CATEGORIES: CategoryDef[] = [
  { key: 'LESSON', label: 'Lektion', labelShort: 'Lekt.', icon: '📖', color: '#3b82f6' },
  { key: 'ASSESSMENT', label: 'Beurteilung', labelShort: 'Beurt.', icon: '📝', color: '#ef4444' },
  { key: 'EVENT', label: 'Event', labelShort: 'Event', icon: '📅', color: '#f59e0b' },
  { key: 'HOLIDAY', label: 'Ferien/Frei', labelShort: 'Frei', icon: '🏖', color: '#6b7280' },
];

const DEFAULT_SUBTYPES: Record<BlockCategory, SubtypeDef[]> = {
  LESSON: [
    { key: 'einfuehrung', label: 'Einführung', labelShort: 'Einf.', icon: '🚀' },
    { key: 'theorie', label: 'Theorie', labelShort: 'Theo.', icon: '📘' },
    { key: 'uebung', label: 'Übung', labelShort: 'Übg.', icon: '✏️' },
    { key: 'sol', label: 'Selbstorganisiertes Lernen', labelShort: 'SOL', icon: '📚' },
    { key: 'diskussion', label: 'Diskussion', labelShort: 'Disk.', icon: '💬' },
  ],
  ASSESSMENT: [
    { key: 'pruefung', label: 'Prüfung schriftlich', labelShort: 'Prüf.', icon: '📝' },
    { key: 'pruefung_muendlich', label: 'Prüfung mündlich', labelShort: 'Mdl.', icon: '🎤' },
    { key: 'praesentation', label: 'Präsentation', labelShort: 'Präs.', icon: '🎯' },
    { key: 'projektabgabe', label: 'Projektabgabe', labelShort: 'Proj.', icon: '📦' },
  ],
  EVENT: [
    { key: 'exkursion', label: 'Exkursion', labelShort: 'Exk.', icon: '🚌' },
    { key: 'tag_offen', label: 'Tag der offenen Tür', labelShort: 'TdoT', icon: '🏫' },
    { key: 'ausfall', label: 'Ausfall', labelShort: 'Ausf.', icon: '❌' },
    { key: 'auftrag', label: 'Auftrag', labelShort: 'Auftr.', icon: '📋' },
  ],
  HOLIDAY: [],
};

// Custom subtypes persistence
const CUSTOM_SUBTYPES_KEY = 'unterrichtsplaner-custom-subtypes';

function loadCustomSubtypes(): Record<string, SubtypeDef[]> {
  try {
    const data = localStorage.getItem(CUSTOM_SUBTYPES_KEY);
    return data ? JSON.parse(data) : {};
  } catch { return {}; }
}

function saveCustomSubtypes(custom: Record<string, SubtypeDef[]>) {
  localStorage.setItem(CUSTOM_SUBTYPES_KEY, JSON.stringify(custom));
}

function getSubtypesForCategory(category: BlockCategory): SubtypeDef[] {
  const defaults = DEFAULT_SUBTYPES[category] || [];
  const custom = loadCustomSubtypes();
  const customForCat = (custom[category] || []).map(s => ({ ...s, custom: true }));
  return [...defaults, ...customForCat];
}

// Migration helper: old BlockType → new category + subtype
function migrateBlockType(blockType?: string): { category?: BlockCategory; subtype?: string } {
  if (!blockType) return {};
  const map: Record<string, { category: BlockCategory; subtype?: string }> = {
    'LESSON': { category: 'LESSON' },
    'INTRO': { category: 'LESSON', subtype: 'einfuehrung' },
    'SELF_STUDY': { category: 'LESSON', subtype: 'sol' },
    'DISCUSSION': { category: 'LESSON', subtype: 'diskussion' },
    'EXAM': { category: 'ASSESSMENT', subtype: 'pruefung' },
    'EXAM_ORAL': { category: 'ASSESSMENT', subtype: 'pruefung_muendlich' },
    'EXAM_LONG': { category: 'ASSESSMENT', subtype: 'pruefung' },
    'PRESENTATION': { category: 'ASSESSMENT', subtype: 'praesentation' },
    'PROJECT_DUE': { category: 'ASSESSMENT', subtype: 'projektabgabe' },
    'EVENT': { category: 'EVENT' },
    'HOLIDAY': { category: 'HOLIDAY' },
  };
  return map[blockType] || {};
}

// Get effective category/subtype from detail (with migration)
function getEffectiveCategorySubtype(detail: LessonDetail): { category?: BlockCategory; subtype?: string } {
  if (detail.blockCategory) return { category: detail.blockCategory, subtype: detail.blockSubtype };
  return migrateBlockType(detail.blockType);
}

// Format display labels
function getCategoryLabel(category: BlockCategory, long = true): string {
  const cat = CATEGORIES.find(c => c.key === category);
  return cat ? (long ? cat.label : cat.labelShort) : category;
}

function getSubtypeLabel(category: BlockCategory, subtype: string, long = true): string {
  const subtypes = getSubtypesForCategory(category);
  const st = subtypes.find(s => s.key === subtype);
  return st ? (long ? st.label : st.labelShort) : subtype;
}

// Export for use in WeekRows etc.
export { CATEGORIES, getSubtypesForCategory, getEffectiveCategorySubtype, getCategoryLabel, getSubtypeLabel };

// === Duration presets ===
const DURATION_PRESETS = [
  { key: '45 min', label: '45 min' },
  { key: '90 min', label: '90 min' },
  { key: '135 min', label: '135 min' },
  { key: 'Halbtag', label: 'Halbtag' },
  { key: 'Ganztag', label: 'Ganztag' },
];

// === Components ===

function PillSelect<T extends string>({
  options, value, onChange, renderOption,
}: {
  options: T[];
  value: T | undefined;
  onChange: (v: T | undefined) => void;
  renderOption: (v: T) => { label: string; color?: string; icon?: string };
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {options.map((opt) => {
        const { label, color, icon } = renderOption(opt);
        const active = value === opt;
        return (
          <button key={opt} onClick={() => onChange(active ? undefined : opt)}
            className="px-1.5 py-0.5 rounded text-[9px] font-medium border cursor-pointer transition-all"
            style={{
              background: active ? (color || '#3b82f6') + '30' : 'transparent',
              borderColor: active ? (color || '#3b82f6') : '#374151',
              color: active ? '#e5e7eb' : '#9ca3af',
            }}>
            {icon && <span className="mr-0.5">{icon}</span>}{label}
          </button>
        );
      })}
    </div>
  );
}

function CategorySubtypeSelector({
  category, subtype, onChangeCategory, onChangeSubtype,
}: {
  category?: BlockCategory;
  subtype?: string;
  onChangeCategory: (v: BlockCategory | undefined) => void;
  onChangeSubtype: (v: string | undefined) => void;
}) {
  const [addingCustom, setAddingCustom] = useState(false);
  const [customLabel, setCustomLabel] = useState('');
  const effectiveCategory = category || 'LESSON';
  const subtypes = getSubtypesForCategory(effectiveCategory);

  const handleAddCustom = () => {
    if (!customLabel.trim()) return;
    const key = customLabel.trim().toLowerCase().replace(/[^a-z0-9äöü]/g, '_');
    const custom = loadCustomSubtypes();
    if (!custom[effectiveCategory]) custom[effectiveCategory] = [];
    custom[effectiveCategory].push({
      key,
      label: customLabel.trim(),
      labelShort: customLabel.trim().slice(0, 5) + '.',
      icon: '🏷️',
    });
    saveCustomSubtypes(custom);
    onChangeSubtype(key);
    setCustomLabel('');
    setAddingCustom(false);
  };

  const handleRemoveCustom = (key: string) => {
    const custom = loadCustomSubtypes();
    if (custom[effectiveCategory]) {
      custom[effectiveCategory] = custom[effectiveCategory].filter(s => s.key !== key);
      saveCustomSubtypes(custom);
      if (subtype === key) onChangeSubtype(undefined);
    }
  };

  return (
    <div className="space-y-2">
      {/* Category row */}
      <div>
        <label className="text-[9px] text-gray-400 font-medium mb-1 block">Kategorie</label>
        <div className="flex flex-wrap gap-1">
          {CATEGORIES.map((cat) => {
            const active = effectiveCategory === cat.key;
            return (
              <button key={cat.key}
                onClick={() => {
                  onChangeCategory(cat.key === 'LESSON' ? undefined : cat.key);
                  onChangeSubtype(undefined);
                }}
                className="px-1.5 py-0.5 rounded text-[9px] font-medium border cursor-pointer transition-all"
                style={{
                  background: active ? cat.color + '30' : 'transparent',
                  borderColor: active ? cat.color : '#374151',
                  color: active ? '#e5e7eb' : '#9ca3af',
                }}>
                <span className="mr-0.5">{cat.icon}</span>{cat.label}
              </button>
            );
          })}
        </div>
      </div>
      {/* Subtype row (only if category has subtypes) */}
      {subtypes.length > 0 && (
        <div>
          <label className="text-[9px] text-gray-400 font-medium mb-1 block">Typ</label>
          <div className="flex flex-wrap gap-1">
            {subtypes.map((st) => {
              const active = subtype === st.key;
              const catDef = CATEGORIES.find(c => c.key === effectiveCategory);
              return (
                <div key={st.key} className="relative group inline-flex">
                  <button
                    onClick={() => onChangeSubtype(active ? undefined : st.key)}
                    className="px-1.5 py-0.5 rounded text-[9px] font-medium border cursor-pointer transition-all"
                    style={{
                      background: active ? (catDef?.color || '#3b82f6') + '20' : 'transparent',
                      borderColor: active ? (catDef?.color || '#3b82f6') + '80' : '#374151',
                      color: active ? '#d1d5db' : '#6b7280',
                    }}>
                    <span className="mr-0.5">{st.icon}</span>{st.label}
                  </button>
                  {st.custom && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleRemoveCustom(st.key); }}
                      className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-600 text-white text-[7px] flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer"
                      title="Eigenes Label entfernen"
                    >✕</button>
                  )}
                </div>
              );
            })}
            {/* Add custom button */}
            {addingCustom ? (
              <div className="flex gap-0.5 items-center">
                <input autoFocus value={customLabel} onChange={(e) => setCustomLabel(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddCustom(); if (e.key === 'Escape') setAddingCustom(false); }}
                  placeholder="Neues Label…"
                  className="bg-slate-700 text-slate-200 border border-blue-400 rounded px-1.5 py-0.5 text-[9px] outline-none w-24" />
                <button onClick={handleAddCustom} className="text-[9px] text-green-400 cursor-pointer">✓</button>
                <button onClick={() => setAddingCustom(false)} className="text-[9px] text-gray-400 cursor-pointer">✕</button>
              </div>
            ) : (
              <button onClick={() => setAddingCustom(true)}
                className="px-1.5 py-0.5 rounded text-[9px] border border-dashed border-gray-600 text-gray-400 hover:text-gray-300 hover:border-gray-400 cursor-pointer transition-all">
                + Eigenes
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function DurationSelector({ value, onChange }: { value?: string; onChange: (v: string | undefined) => void }) {
  const [customMode, setCustomMode] = useState(false);
  const [customValue, setCustomValue] = useState('');
  const isPreset = value && DURATION_PRESETS.some(p => p.key === value);
  const isCustom = value && !isPreset;

  return (
    <div className="flex flex-wrap gap-1 items-center">
      {DURATION_PRESETS.map((preset) => (
        <button key={preset.key}
          onClick={() => onChange(value === preset.key ? undefined : preset.key)}
          className={`px-1.5 py-0.5 rounded text-[9px] font-medium border cursor-pointer transition-all ${
            value === preset.key
              ? 'bg-slate-600/40 border-slate-500 text-gray-200'
              : 'border-gray-700 text-gray-400 hover:text-gray-300'
          }`}>
          {preset.label}
        </button>
      ))}
      {customMode || isCustom ? (
        <div className="flex gap-0.5 items-center">
          <input
            autoFocus={customMode}
            value={isCustom ? value : customValue}
            onChange={(e) => {
              if (isCustom) onChange(e.target.value || undefined);
              else setCustomValue(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && customValue) { onChange(customValue); setCustomMode(false); }
              if (e.key === 'Escape') { setCustomMode(false); setCustomValue(''); }
            }}
            onBlur={() => { if (customValue) { onChange(customValue); } setCustomMode(false); }}
            placeholder="z.B. 60 min"
            className="bg-slate-700 text-slate-200 border border-slate-600 rounded px-1.5 py-0.5 text-[9px] outline-none focus:border-blue-400 w-20" />
          {isCustom && (
            <button onClick={() => onChange(undefined)} className="text-[9px] text-gray-400 cursor-pointer hover:text-red-400">✕</button>
          )}
        </div>
      ) : (
        <button onClick={() => setCustomMode(true)}
          className="px-1.5 py-0.5 rounded text-[9px] border border-dashed border-gray-600 text-gray-400 hover:text-gray-300 cursor-pointer">
          Andere…
        </button>
      )}
    </div>
  );
}

function SolSection({ sol, onChange }: { sol?: SolDetails; onChange: (s: SolDetails) => void }) {
  const enabled = sol?.enabled ?? false;
  const update = (patch: Partial<SolDetails>) => onChange({ ...sol, enabled: true, ...patch });

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange({ ...sol, enabled: !enabled, topic: sol?.topic, description: sol?.description, materialLinks: sol?.materialLinks, duration: sol?.duration })}
          className={`px-2 py-0.5 rounded text-[9px] font-medium border cursor-pointer transition-all ${
            enabled ? 'bg-purple-500/20 border-purple-500 text-purple-300' : 'border-gray-600 text-gray-400 hover:text-gray-300'
          }`}
        >
          📚 {enabled ? 'SOL aktiv' : 'SOL hinzufügen'}
        </button>
        {enabled && sol?.duration && <span className="text-[8px] text-gray-400">{sol.duration}</span>}
      </div>
      {enabled && (
        <div className="pl-2 border-l-2 border-purple-500/30 space-y-1.5">
          <div>
            <label className="text-[8px] text-gray-400 mb-0.5 block">SOL-Thema</label>
            <input value={sol?.topic || ''} onChange={(e) => update({ topic: e.target.value })}
              placeholder="SOL-Thema…"
              className="w-full bg-slate-700 text-slate-200 border border-slate-600 rounded px-2 py-0.5 text-[9px] outline-none focus:border-purple-400" />
          </div>
          <div>
            <label className="text-[8px] text-gray-400 mb-0.5 block">SOL-Dauer</label>
            <DurationSelector value={sol?.duration} onChange={(v) => update({ duration: v })} />
          </div>
          <div>
            <label className="text-[8px] text-gray-400 mb-0.5 block">SOL-Beschreibung</label>
            <textarea value={sol?.description || ''} onChange={(e) => update({ description: e.target.value })}
              placeholder="Beschreibung, Auftrag…" rows={2}
              className="w-full bg-slate-700 text-slate-200 border border-slate-600 rounded px-2 py-0.5 text-[9px] outline-none focus:border-purple-400 resize-y" />
          </div>
          <div>
            <label className="text-[8px] text-gray-400 mb-0.5 block">SOL-Material</label>
            <MaterialLinks links={sol?.materialLinks || []} onChange={(links) => update({ materialLinks: links })} />
          </div>
        </div>
      )}
    </div>
  );
}

function MaterialLinks({ links, onChange }: { links: string[]; onChange: (links: string[]) => void }) {
  const [adding, setAdding] = useState(false);
  const [newLink, setNewLink] = useState('');
  const handleAdd = () => {
    if (newLink.trim()) { onChange([...links, newLink.trim()]); setNewLink(''); setAdding(false); }
  };
  return (
    <div className="space-y-1">
      {links.map((link, i) => (
        <div key={i} className="flex items-center gap-1 group">
          <a href={link} target="_blank" rel="noopener noreferrer"
            className="text-[9px] text-blue-400 hover:text-blue-300 truncate flex-1">
            {link.length > 50 ? link.slice(0, 50) + '…' : link}
          </a>
          <button onClick={() => onChange(links.filter((_, j) => j !== i))}
            className="text-[9px] text-red-400 opacity-0 group-hover:opacity-100 cursor-pointer">✕</button>
        </div>
      ))}
      {adding ? (
        <div className="flex gap-1">
          <input autoFocus value={newLink} onChange={(e) => setNewLink(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setAdding(false); }}
            placeholder="URL eingeben…"
            className="flex-1 bg-slate-700 text-slate-200 border border-slate-600 rounded px-1.5 py-0.5 text-[9px] outline-none focus:border-blue-400" />
          <button onClick={handleAdd} className="text-[9px] text-green-400 cursor-pointer">✓</button>
          <button onClick={() => setAdding(false)} className="text-[9px] text-gray-400 cursor-pointer">✕</button>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} className="text-[9px] text-gray-400 hover:text-gray-300 cursor-pointer">
          + Link hinzufügen
        </button>
      )}
    </div>
  );
}

/* Add to Sequence button — shown when lesson is not part of any sequence */
function AddToSequenceButton({ week, course }: { week: string; course: Course }) {
  const [open, setOpen] = useState(false);
  const { sequences, addSequence, updateBlockInSequence, setEditingSequenceId, setSidePanelTab } = usePlannerStore();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Filter sequences that match this course
  const matching = sequences.filter(s =>
    s.courseId === course.id || (s.courseIds && s.courseIds.includes(course.id))
  );

  const handleNew = () => {
    const seqId = addSequence({ courseId: course.id, title: `Neue Sequenz ${course.cls}`, blocks: [{ weeks: [week], label: '' }] });
    setEditingSequenceId(`${seqId}-0`);
    setSidePanelTab('sequences');
    setOpen(false);
  };

  const handleAddToExisting = (seqId: string, blockIdx: number) => {
    const seq = sequences.find(s => s.id === seqId);
    if (!seq) return;
    const block = seq.blocks[blockIdx];
    if (block.weeks.includes(week)) return;
    updateBlockInSequence(seqId, blockIdx, { weeks: [...block.weeks, week] });
    setEditingSequenceId(`${seqId}-${blockIdx}`);
    setOpen(false);
  };

  return (
    <span className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        className="text-[8px] px-1 py-px rounded border border-dashed border-gray-600 text-gray-400 hover:text-gray-300 hover:border-gray-400 cursor-pointer"
        title="Zu Sequenz hinzufügen"
      >+ Sequenz</button>
      {open && (
        <div ref={menuRef} className="absolute left-0 top-full mt-1 z-[90] bg-slate-800 border border-slate-600 rounded-lg shadow-xl py-1 w-52">
          <button onClick={handleNew}
            className="w-full px-3 py-1.5 text-left text-[10px] text-blue-300 hover:bg-slate-700 cursor-pointer">
            ✨ Neue Sequenz erstellen
          </button>
          {matching.length > 0 && <hr className="border-slate-700 my-0.5" />}
          {matching.map(seq => (
            seq.blocks.map((block, bi) => (
              <button key={`${seq.id}-${bi}`}
                onClick={() => handleAddToExisting(seq.id, bi)}
                className="w-full px-3 py-1.5 text-left text-[10px] text-gray-300 hover:bg-slate-700 cursor-pointer flex items-center gap-1.5"
                disabled={block.weeks.includes(week)}>
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: seq.color || '#16a34a' }} />
                <span className="truncate">{block.label}</span>
                {block.weeks.includes(week) && <span className="text-[8px] text-gray-500 ml-auto">bereits</span>}
              </button>
            ))
          ))}
        </div>
      )}
    </span>
  );
}

const BADGE_PRESETS: { label: string; color: string; title: string }[] = [
  { label: 'P', color: '#ef4444', title: 'Prüfung' },
  { label: 'HK', color: '#7c3aed', title: 'Halbklasse' },
  { label: '!', color: '#f59e0b', title: 'Wichtig' },
  { label: '📎', color: '#6b7280', title: 'Material' },
];

function BadgeEditor({ badges, onChange }: { badges: import('../types').CellBadge[]; onChange: (b: import('../types').CellBadge[]) => void }) {
  const [customLabel, setCustomLabel] = useState('');
  const [customColor, setCustomColor] = useState('#3b82f6');

  const addBadge = (label: string, color: string) => {
    if (!label || badges.some(b => b.label === label)) return;
    onChange([...badges, { label, color }]);
  };

  const removeBadge = (idx: number) => {
    onChange(badges.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-1.5">
      {/* Current badges */}
      {badges.length > 0 && (
        <div className="flex gap-1 flex-wrap">
          {badges.map((b, i) => (
            <span key={i} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold"
              style={{ background: b.color + '30', color: b.color, border: `1px solid ${b.color}60` }}>
              {b.label}
              <button onClick={() => removeBadge(i)} className="text-[8px] opacity-60 hover:opacity-100 cursor-pointer ml-0.5">✕</button>
            </span>
          ))}
        </div>
      )}
      {/* Presets */}
      <div className="flex gap-1 flex-wrap">
        {BADGE_PRESETS.map(p => (
          <button key={p.label} onClick={() => addBadge(p.label, p.color)}
            className="px-1.5 py-0.5 rounded text-[8px] border border-dashed cursor-pointer hover:opacity-80"
            style={{ borderColor: p.color + '60', color: p.color + 'cc' }}
            title={p.title}
            disabled={badges.some(b => b.label === p.label)}
          >+ {p.label}</button>
        ))}
      </div>
      {/* Custom */}
      <div className="flex gap-1 items-center">
        <input value={customLabel} onChange={e => setCustomLabel(e.target.value.slice(0, 3))}
          placeholder="1-3 Z." maxLength={3}
          className="w-12 bg-slate-700 text-slate-200 border border-slate-600 rounded px-1 py-0.5 text-[9px] outline-none focus:border-blue-400" />
        <input type="color" value={customColor} onChange={e => setCustomColor(e.target.value)}
          className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent" />
        <button onClick={() => { if (customLabel.trim()) { addBadge(customLabel.trim(), customColor); setCustomLabel(''); } }}
          disabled={!customLabel.trim()}
          className="px-1.5 py-0.5 rounded text-[8px] border border-dashed border-gray-600 text-gray-400 hover:text-gray-200 cursor-pointer disabled:opacity-30">+</button>
      </div>
    </div>
  );
}

function DetailsTab() {
  const {
    selection,
    lessonDetails, updateLessonDetail,
    weekData, sequences,
  } = usePlannerStore();
  const { categories } = usePlannerData();

  const c = selection?.course;
  const detailKey = selection && c ? `${selection.week}-${c.col}` : '';
  const detail: LessonDetail = (detailKey && lessonDetails[detailKey]) || {};
  const currentWeek = selection ? weekData.find((w) => w.w === selection.week) : undefined;
  const currentLesson = c ? currentWeek?.lessons[c.col] : undefined;

  // Block inheritance: find parent block for this week and merge as defaults
  const parentBlock = selection && c ? (() => {
    for (const seq of sequences) {
      const matchesCourse = seq.courseId === c.id ||
        (seq.courseIds && seq.courseIds.includes(c.id));
      if (!matchesCourse) continue;
      for (const block of seq.blocks) {
        if (block.weeks.includes(selection.week)) return block;
      }
    }
    return null;
  })() : null;

  // Effective detail = own detail with block defaults for empty fields
  const effectiveDetail: LessonDetail = {
    topicMain: detail.topicMain || parentBlock?.topicMain,
    topicSub: detail.topicSub || parentBlock?.topicSub,
    subjectArea: detail.subjectArea || parentBlock?.subjectArea,
    curriculumGoal: detail.curriculumGoal || parentBlock?.curriculumGoal,
    blockCategory: detail.blockCategory,
    blockSubtype: detail.blockSubtype,
    blockType: detail.blockType,
    description: detail.description || parentBlock?.description,
    materialLinks: detail.materialLinks?.length ? detail.materialLinks : parentBlock?.materialLinks,
    learningviewUrl: detail.learningviewUrl,
    duration: detail.duration,
    notes: detail.notes,
  };

  // Get effective category/subtype (with legacy migration)
  const { category: effectiveCategory, subtype: effectiveSubtype } = getEffectiveCategorySubtype(effectiveDetail);

  const updateField = useCallback(
    <K extends keyof LessonDetail>(field: K, value: LessonDetail[K]) => {
      if (!selection || !c) return;
      updateLessonDetail(selection.week, c.col, { [field]: value });
    },
    [selection?.week, c?.col, updateLessonDetail]
  );

  const handleCategoryChange = useCallback((cat: BlockCategory | undefined) => {
    if (!selection || !c) return;
    updateLessonDetail(selection.week, c.col, {
      blockCategory: cat || 'LESSON',
      blockSubtype: undefined,
      blockType: undefined, // clear legacy
    });
  }, [selection?.week, c?.col, updateLessonDetail]);

  const handleSubtypeChange = useCallback((st: string | undefined) => {
    if (!selection || !c) return;
    updateLessonDetail(selection.week, c.col, {
      blockSubtype: st,
      blockCategory: effectiveCategory || 'LESSON',
      blockType: undefined, // clear legacy
    });
  }, [selection?.week, c?.col, updateLessonDetail, effectiveCategory]);

  // Auto-detect subjectArea from LessonType (unambiguous types only)
  useEffect(() => {
    if (!selection || !c || detail.subjectArea || !currentLesson) return;
    // Only auto-set for unambiguous types (from categories.ts mapping)
    // Type 2 (Recht/VWL) is ambiguous → handled by topic-based detection below
    const detected = inferSubjectAreaFromLessonType(currentLesson.type) as SubjectArea | undefined;
    if (detected) updateLessonDetail(selection.week, c.col, { subjectArea: detected });
  }, [selection?.week, c?.col, currentLesson?.type, detail.subjectArea]);

  // Auto-detect subjectArea from topicMain (for ambiguous lesson types: 0, 2)
  useEffect(() => {
    if (!selection || !c || detail.subjectArea) return;
    // Only run when lesson type is ambiguous (0=other, 2=Recht/VWL) or undefined
    const lessonType = currentLesson?.type;
    if (lessonType !== undefined && lessonType !== 0 && lessonType !== 2) return;
    const topic = detail.topicMain || effectiveDetail.topicMain;
    if (!topic || topic.length < 3) return;
    const suggested = suggestSubjectArea(topic);
    if (suggested) updateLessonDetail(selection.week, c.col, { subjectArea: suggested });
  }, [selection?.week, c?.col, detail.topicMain, effectiveDetail.topicMain, detail.subjectArea, currentLesson?.type]);

  // Auto-suggest curriculum goals
  const goalSuggestions = useMemo(() => {
    const topic = detail.topicMain || effectiveDetail.topicMain;
    if (!topic || topic.length < 2) return [];
    return suggestGoals(topic, effectiveDetail.subjectArea, 3, 0.2);
  }, [detail.topicMain, effectiveDetail.topicMain, effectiveDetail.subjectArea]);

  // Mismatch warning: inherited subjectArea doesn't match topic
  const subjectAreaMismatch = useMemo(() => {
    const effective = effectiveDetail.subjectArea;
    if (!effective) return null;
    const topic = detail.topicMain || effectiveDetail.topicMain;
    if (!topic || topic.length < 3) return null;
    const suggested = suggestSubjectArea(topic);
    if (!suggested || suggested === effective) return null;
    // Only warn if the mismatch is from inheritance (not own value)
    return { current: effective, suggested, isInherited: !detail.subjectArea };
  }, [effectiveDetail.subjectArea, detail.subjectArea, detail.topicMain, effectiveDetail.topicMain]);

  if (!selection || !c) {
    return (
      <div className="flex-1 flex items-center justify-center text-[10px] text-gray-400 p-4">
        Wähle eine Lektion aus, um Details zu bearbeiten.
      </div>
    );
  }

  const badge = TYPE_BADGES[c.typ];
  const seqInfo = getSequenceInfoFromStore(c.id, selection.week, sequences);
  const parentSeq = seqInfo ? sequences.find(s => s.id === seqInfo.sequenceId) : null;
  const catDef = CATEGORIES.find(ct => ct.key === (effectiveCategory || 'LESSON'));
  const subtypes = effectiveCategory ? getSubtypesForCategory(effectiveCategory) : [];
  const subtypeDef = effectiveSubtype ? subtypes.find(s => s.key === effectiveSubtype) : null;

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-3">
      {/* Header info */}
      <div>
        <div className="flex gap-2 items-center mb-1">
          <span className="text-xs font-bold text-gray-100">{c.cls}</span>
          <span className="text-[9px] px-1.5 py-px rounded text-white" style={{ background: badge?.bg }}>{c.typ}</span>
          <span className="text-[9px] text-gray-400">{c.day} {c.from}–{c.to} · KW {selection.week}</span>
        </div>
        <div className="text-sm text-gray-200">{selection.title}</div>
        {/* Tags */}
        <div className="flex gap-1 mt-1.5 flex-wrap">
          {effectiveDetail.subjectArea && (
            <span className={`text-[8px] px-1 py-px rounded border ${!detail.subjectArea && parentBlock?.subjectArea ? 'opacity-60' : ''}`}
              style={{ borderColor: categories.find(s => s.key === effectiveDetail.subjectArea)?.color, color: categories.find(s => s.key === effectiveDetail.subjectArea)?.color }}
              title={!detail.subjectArea && parentBlock?.subjectArea ? 'Vom Block geerbt' : undefined}>
              {effectiveDetail.subjectArea}
            </span>
          )}
          {catDef && catDef.key !== 'LESSON' && (
            <span className="text-[8px] px-1 py-px rounded border" style={{ borderColor: catDef.color + '80', color: catDef.color }}>
              {catDef.icon} {catDef.label}
            </span>
          )}
          {subtypeDef && (
            <span className="text-[8px] px-1 py-px rounded border border-gray-600 text-gray-400">
              {subtypeDef.icon} {subtypeDef.label}
            </span>
          )}
          {effectiveDetail.duration && (
            <span className="text-[8px] px-1 py-px rounded border border-gray-600 text-gray-400">
              ⏱ {effectiveDetail.duration}
            </span>
          )}
          {detail.sol?.enabled && (
            <span className="text-[8px] px-1 py-px rounded border border-purple-500/50 text-purple-400">
              📚 SOL{detail.sol.duration ? ` (${detail.sol.duration})` : ''}
            </span>
          )}
          {seqInfo && (
            <span className="text-[8px] px-1 py-px rounded border cursor-pointer hover:opacity-80"
              style={{ borderColor: seqInfo.color || '#16a34a', color: seqInfo.color || '#4ade80' }}
              onClick={() => {
                if (parentSeq && seqInfo) {
                  // Set block-precise editing ID
                  const blockIdx = parentSeq.blocks.findIndex(b => b.weeks.includes(selection!.week));
                  const editId = blockIdx >= 0 ? `${parentSeq.id}-${blockIdx}` : parentSeq.id;
                  usePlannerStore.getState().setEditingSequenceId(editId);
                  usePlannerStore.getState().setSidePanelTab('sequences');
                }
              }}
              title="Zur Sequenz wechseln">
              ▧ {seqInfo.label} ({seqInfo.index + 1}/{seqInfo.total})
            </span>
          )}
          {!seqInfo && (
            <AddToSequenceButton week={selection.week} course={c} />
          )}
          {/* Apply UE fields to parent block/sequence */}
          {seqInfo && parentSeq && parentBlock && (
            <button onClick={() => {
              const fieldsToApply: string[] = [];
              if (detail.subjectArea && detail.subjectArea !== parentBlock.subjectArea) fieldsToApply.push(`Fachbereich: ${detail.subjectArea}`);
              if (detail.topicMain && detail.topicMain !== parentBlock.topicMain) fieldsToApply.push(`Oberthema: ${detail.topicMain}`);
              if (detail.duration) fieldsToApply.push(`Dauer: ${detail.duration}`);
              if (fieldsToApply.length === 0) { alert('Keine UE-Felder gesetzt, die sich vom Block unterscheiden.'); return; }
              if (!confirm(`Folgende Felder auf den Sequenz-Block übertragen?\n\n${fieldsToApply.join('\n')}`)) return;
              const blockIdx = parentSeq.blocks.findIndex(b => b.weeks.includes(selection!.week));
              if (blockIdx < 0) return;
              const patch: Partial<SequenceBlock> = {};
              if (detail.subjectArea) patch.subjectArea = detail.subjectArea;
              if (detail.topicMain) patch.topicMain = detail.topicMain;
              usePlannerStore.getState().updateBlockInSequence(parentSeq.id, blockIdx, patch);
              // Also update sequence title if it matches old topic
              if (detail.topicMain && (!parentSeq.title || parentSeq.title === parentBlock.topicMain || parentSeq.title === 'Neue Reihe')) {
                usePlannerStore.getState().updateSequence(parentSeq.id, { title: detail.topicMain });
              }
            }}
              className="text-[8px] px-1 py-px rounded border border-dashed border-blue-500/40 text-blue-400 hover:bg-blue-900/20 cursor-pointer"
              title="UE-Felder (Fachbereich, Oberthema) auf den Sequenz-Block übertragen">
              ↑ Auf Sequenz
            </button>
          )}
        </div>
      </div>
      <hr className="border-slate-700" />
      {/* Form fields */}
      <div className="space-y-2.5">
        <div>
          <label className="text-[9px] text-gray-400 font-medium mb-1 block">
            Fachbereich
            {!detail.subjectArea && effectiveDetail.subjectArea && (
              <span className="text-[8px] text-gray-500 font-normal ml-1">(geerbt von Sequenz)</span>
            )}
          </label>
          <PillSelect options={categories.map(s => s.key)} value={detail.subjectArea}
            onChange={(v) => updateField('subjectArea', v as SubjectArea)}
            renderOption={(v) => { const s = categories.find(x => x.key === v)!; return { label: s.label, color: s.color }; }} />
          {subjectAreaMismatch && (
            <div className="mt-1 flex items-center gap-1 text-[8px]">
              <span className="text-amber-400">⚠</span>
              <span className="text-amber-400/80">
                Topic passt zu <strong>{subjectAreaMismatch.suggested}</strong>{subjectAreaMismatch.isInherited ? ' (geerbt: ' + subjectAreaMismatch.current + ')' : ''}
              </span>
              <button
                onClick={() => updateField('subjectArea', subjectAreaMismatch.suggested)}
                className="text-[8px] text-blue-400 hover:text-blue-300 cursor-pointer underline ml-1">
                Korrigieren
              </button>
            </div>
          )}
        </div>
        <CategorySubtypeSelector
          category={effectiveCategory}
          subtype={effectiveSubtype}
          onChangeCategory={handleCategoryChange}
          onChangeSubtype={handleSubtypeChange}
        />
        <div>
          <label className="text-[9px] text-gray-400 font-medium mb-1 block">Dauer</label>
          <DurationSelector value={detail.duration} onChange={(v) => updateField('duration', v)} />
        </div>
        <div>
          <label className="text-[9px] text-gray-400 font-medium mb-1 block">SOL (Selbstorganisiertes Lernen)</label>
          <SolSection sol={detail.sol} onChange={(s) => updateField('sol', s)} />
        </div>
        <div>
          <label className="text-[9px] text-gray-400 font-medium mb-1 block">Thema</label>
          {parentBlock?.topicMain && !detail.topicMain && (
            <div className="text-[8px] text-blue-400/60 mb-0.5">↳ Block: {parentBlock.topicMain}</div>
          )}
          <input value={detail.topicMain || ''} onChange={(e) => updateField('topicMain', e.target.value)}
            placeholder={effectiveDetail.topicMain || 'Hauptthema…'}
            className="w-full bg-slate-700 text-slate-200 border border-slate-600 rounded px-2 py-1 text-[10px] outline-none focus:border-blue-400" />
          <input value={detail.topicSub || ''} onChange={(e) => updateField('topicSub', e.target.value)}
            placeholder={effectiveDetail.topicSub || 'Unterthema (optional)…'}
            className="w-full bg-slate-700 text-slate-200 border border-slate-600 rounded px-2 py-1 text-[10px] outline-none focus:border-blue-400 mt-1" />
          {goalSuggestions.length > 0 && !detail.curriculumGoal && !effectiveDetail.curriculumGoal && (
            <div className="mt-1.5 space-y-0.5">
              <span className="text-[8px] text-amber-500/70">💡 Vorgeschlagene Lehrplanziele:</span>
              {goalSuggestions.map(s => (
                <button key={s.goal.id}
                  onClick={() => updateField('curriculumGoal', `${s.goal.id}: ${s.goal.goal}`)}
                  className="w-full text-left px-1.5 py-1 rounded bg-amber-900/20 hover:bg-amber-900/40 border border-amber-700/30 hover:border-amber-600/50 transition-colors cursor-pointer"
                  title={`${s.matchReason}\nScore: ${(s.score * 100).toFixed(0)}%\n${s.goal.contents.join(', ')}`}>
                  <div className="flex items-center gap-1">
                    <span className="text-[7px] font-mono text-amber-400/80 shrink-0">{s.goal.id}</span>
                    <span className="text-[8px] text-amber-200/80 truncate">{s.goal.topic}</span>
                    <span className="text-[7px] text-amber-600/60 shrink-0 ml-auto">{(s.score * 100).toFixed(0)}%</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        <div>
          <label className="text-[9px] text-gray-400 font-medium mb-1 block">Lehrplanziel (LP17)</label>
          {parentBlock?.curriculumGoal && !detail.curriculumGoal && (
            <div className="text-[8px] text-blue-400/60 mb-0.5">↳ Block: {parentBlock.curriculumGoal}</div>
          )}
          <CurriculumGoalPicker value={detail.curriculumGoal || effectiveDetail.curriculumGoal} onChange={(v) => updateField('curriculumGoal', v)} subjectArea={effectiveDetail.subjectArea} />
        </div>
        <div>
          <label className="text-[9px] text-gray-400 font-medium mb-1 block">Material</label>
          <MaterialLinks links={[
            ...(detail.learningviewUrl ? [detail.learningviewUrl] : []),
            ...(detail.materialLinks || []),
          ]} onChange={(links) => {
            // First link that's a learningview URL goes to learningviewUrl, rest to materialLinks
            const lvIdx = links.findIndex(l => l.includes('learningview'));
            if (lvIdx >= 0) {
              updateField('learningviewUrl', links[lvIdx]);
              updateField('materialLinks', links.filter((_, i) => i !== lvIdx));
            } else {
              updateField('learningviewUrl', undefined);
              updateField('materialLinks', links.length > 0 ? links : undefined);
            }
          }} />
        </div>
        {/* Badges */}
        <div>
          <label className="text-[9px] text-gray-400 font-medium mb-1 block">Badges</label>
          <BadgeEditor badges={detail.badges || []} onChange={(badges) => updateField('badges', badges.length > 0 ? badges : undefined)} />
        </div>

        <div>
          <label className="text-[9px] text-gray-400 font-medium mb-1 block">Notizen</label>
          <textarea value={detail.notes || ''} onChange={(e) => updateField('notes', e.target.value)}
            placeholder="Notizen, Hinweise…" rows={3}
            className="w-full bg-slate-700 text-slate-200 border border-slate-600 rounded px-2 py-1 text-[10px] outline-none focus:border-blue-400 resize-y" />
        </div>
      </div>
    </div>
  );
}

// Switcher: show batch edit when multiple cells selected, else normal details
function BatchOrDetailsTab() {
  const { multiSelection } = usePlannerStore();
  if (multiSelection.length > 1) return <BatchEditTab />;
  return <DetailsTab />;
}

// Batch editing for multiple selected cells
function BatchEditTab() {
  const { multiSelection, updateLessonDetail, pushUndo, lessonDetails, sequences, addSequence, updateBlockInSequence, setEditingSequenceId, setSidePanelTab } = usePlannerStore();
  const { courses: COURSES, categories } = usePlannerData();
  const [applied, setApplied] = useState<string | null>(null);
  const [showSeqMenu, setShowSeqMenu] = useState(false);
  const seqMenuRef = useRef<HTMLDivElement>(null);

  // Parse multi-selection keys to week-col pairs
  const cells = multiSelection.map(key => {
    const [week, courseId] = key.split('-');
    const course = COURSES.find(c => c.id === courseId);
    return course ? { week, col: course.col, courseId } : null;
  }).filter(Boolean) as { week: string; col: number; courseId: string }[];

  // Close seq menu on outside click
  useEffect(() => {
    if (!showSeqMenu) return;
    const handler = (e: MouseEvent) => {
      if (seqMenuRef.current && !seqMenuRef.current.contains(e.target as Node)) setShowSeqMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showSeqMenu]);

  // Determine shared course for sequence creation
  const sharedCourseId = useMemo(() => {
    const ids = new Set(cells.map(c => c.courseId));
    if (ids.size === 1) return [...ids][0];
    // Check if all are linked (same cls+typ)
    const courses = [...ids].map(id => COURSES.find(c => c.id === id)).filter(Boolean) as Course[];
    if (courses.length > 0 && courses.every(c => c.cls === courses[0].cls && c.typ === courses[0].typ)) {
      return courses[0].id; // Use first course as primary
    }
    return null;
  }, [cells, COURSES]);

  const matchingSequences = useMemo(() => {
    if (!sharedCourseId) return [];
    return sequences.filter(s =>
      s.courseId === sharedCourseId || (s.courseIds?.includes(sharedCourseId))
    );
  }, [sharedCourseId, sequences]);

  const selectedWeeks = useMemo(() => cells.map(c => c.week), [cells]);

  const handleNewSequence = () => {
    if (!sharedCourseId) return;
    const course = COURSES.find(c => c.id === sharedCourseId);
    pushUndo();
    const seqId = addSequence({ courseId: sharedCourseId, title: `Neue Sequenz ${course?.cls || ''}`, blocks: [{ weeks: selectedWeeks, label: '' }] });
    setEditingSequenceId(`${seqId}-0`);
    setSidePanelTab('sequences');
    setShowSeqMenu(false);
  };

  const handleAddToBlock = (seqId: string, blockIdx: number) => {
    const seq = sequences.find(s => s.id === seqId);
    if (!seq) return;
    const block = seq.blocks[blockIdx];
    pushUndo();
    const newWeeks = [...new Set([...block.weeks, ...selectedWeeks])];
    updateBlockInSequence(seqId, blockIdx, { weeks: newWeeks });
    setEditingSequenceId(`${seqId}-${blockIdx}`);
    setShowSeqMenu(false);
  };

  // Determine current values across selection (for highlighting active state)
  const currentValues = useMemo(() => {
    const areas = new Set<string>();
    const cats = new Set<string>();
    const durations = new Set<string>();
    const sols = new Set<boolean>();
    for (const cell of cells) {
      const d = lessonDetails[`${cell.week}-${cell.col}`];
      if (d?.subjectArea) areas.add(d.subjectArea);
      if (d?.blockCategory) cats.add(d.blockCategory);
      if (d?.duration) durations.add(d.duration);
      sols.add(!!d?.sol?.enabled);
    }
    return {
      subjectArea: areas.size === 1 ? [...areas][0] : null,
      blockCategory: cats.size === 1 ? [...cats][0] : null,
      duration: durations.size === 1 ? [...durations][0] : null,
      sol: sols.size === 1 ? [...sols][0] : null,
      mixedArea: areas.size > 1,
      mixedCat: cats.size > 1,
      mixedDur: durations.size > 1,
      mixedSol: sols.size > 1,
    };
  }, [cells, lessonDetails]);

  const applyToAll = (field: keyof LessonDetail, value: unknown) => {
    pushUndo();
    for (const cell of cells) {
      updateLessonDetail(cell.week, cell.col, { [field]: value });
    }
    setApplied(`${field}: Auf ${cells.length} Zellen angewandt`);
    setTimeout(() => setApplied(null), 2000);
  };

  return (
    <div className="p-3 space-y-3 overflow-y-auto flex-1">
      <div className="text-[11px] font-bold text-amber-300">
        ✏ Batch-Bearbeitung ({cells.length} Zellen)
      </div>
      {applied && (
        <div className="text-[9px] text-green-400 bg-green-900/20 rounded px-2 py-1">✅ {applied}</div>
      )}

      {/* Subject Area */}
      <div className="space-y-1">
        <label className="text-[9px] text-gray-400 font-medium">Fachbereich setzen {currentValues.mixedArea && <span className="text-amber-400">(gemischt)</span>}</label>
        <div className="flex gap-1 flex-wrap">
          {categories.map(sa => {
            const isActive = currentValues.subjectArea === sa.key;
            return (
              <button key={sa.key} onClick={() => applyToAll('subjectArea', sa.key)}
                className={`px-2 py-0.5 rounded text-[9px] font-medium border cursor-pointer hover:opacity-80 ${isActive ? 'ring-1 ring-offset-1 ring-offset-slate-800' : ''}`}
                style={{ background: isActive ? sa.color + '40' : sa.color + '20', borderColor: isActive ? sa.color : sa.color + '60', color: sa.color }}>
                {sa.label}
              </button>
            );
          })}
          <button onClick={() => applyToAll('subjectArea', undefined)}
            className="px-2 py-0.5 rounded text-[9px] border border-gray-600 text-gray-400 cursor-pointer hover:text-gray-300">✕</button>
        </div>
      </div>

      {/* Category */}
      <div className="space-y-1">
        <label className="text-[9px] text-gray-400 font-medium">Kategorie setzen {currentValues.mixedCat && <span className="text-amber-400">(gemischt)</span>}</label>
        <div className="flex gap-1 flex-wrap">
          {CATEGORIES.map(cat => {
            const isActive = currentValues.blockCategory === cat.key;
            return (
              <button key={cat.key} onClick={() => applyToAll('blockCategory', cat.key)}
                className={`px-2 py-0.5 rounded text-[9px] border cursor-pointer ${isActive ? 'bg-blue-900/40 border-blue-500 text-blue-300 ring-1 ring-blue-500/30' : 'border-gray-600 text-gray-300 hover:bg-slate-700'}`}>
                {cat.icon} {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Duration */}
      <div className="space-y-1">
        <label className="text-[9px] text-gray-400 font-medium">Dauer setzen {currentValues.mixedDur && <span className="text-amber-400">(gemischt)</span>}</label>
        <div className="flex gap-1 flex-wrap">
          {[1, 2, 3].map(d => {
            const isActive = currentValues.duration !== null && (
              currentValues.duration === String(d) || currentValues.duration === `${d}` ||
              (d === 1 && currentValues.duration === '45 min') ||
              (d === 2 && (currentValues.duration === '90 min' || currentValues.duration === '2 Lektionen')) ||
              (d === 3 && (currentValues.duration === '135 min' || currentValues.duration === '3 Lektionen'))
            );
            return (
              <button key={d} onClick={() => applyToAll('duration', d)}
                className={`px-2 py-0.5 rounded text-[9px] border cursor-pointer ${isActive ? 'bg-blue-900/40 border-blue-500 text-blue-300 ring-1 ring-blue-500/30' : 'border-gray-600 text-gray-300 hover:bg-slate-700'}`}>
                {d}L
              </button>
            );
          })}
        </div>
      </div>

      {/* SOL toggle */}
      <div className="space-y-1">
        <label className="text-[9px] text-gray-400 font-medium">SOL (Selbstorganisiertes Lernen) {currentValues.mixedSol && <span className="text-amber-400">(gemischt)</span>}</label>
        <div className="flex gap-1">
          <button onClick={() => applyToAll('sol', { enabled: true })}
            className={`px-2 py-0.5 rounded text-[9px] border cursor-pointer ${currentValues.sol === true ? 'bg-green-900/40 border-green-500 text-green-300 ring-1 ring-green-500/30' : 'border-green-600 text-green-400 hover:bg-green-900/30'}`}>SOL ✓</button>
          <button onClick={() => applyToAll('sol', { enabled: false })}
            className={`px-2 py-0.5 rounded text-[9px] border cursor-pointer ${currentValues.sol === false ? 'bg-slate-700 border-gray-500 text-gray-300' : 'border-gray-600 text-gray-400 hover:bg-slate-700'}`}>SOL ✕</button>
        </div>
      </div>

      {/* Sequence actions */}
      {sharedCourseId && (
        <div className="space-y-1 pt-2 border-t border-slate-700">
          <label className="text-[9px] text-gray-400 font-medium">Sequenz</label>
          <div className="relative" ref={seqMenuRef}>
            <div className="flex gap-1 flex-wrap">
              <button
                onClick={handleNewSequence}
                className="px-2 py-1 rounded text-[9px] font-medium border border-dashed border-green-600 text-green-400 hover:bg-green-900/20 cursor-pointer"
              >✨ Neue Sequenz ({cells.length} UE)</button>
              {matchingSequences.length > 0 && (
                <button
                  onClick={() => setShowSeqMenu(!showSeqMenu)}
                  className="px-2 py-1 rounded text-[9px] font-medium border border-dashed border-blue-600 text-blue-400 hover:bg-blue-900/20 cursor-pointer"
                >+ Zu bestehender ({matchingSequences.length})</button>
              )}
            </div>
            {showSeqMenu && matchingSequences.length > 0 && (
              <div className="absolute left-0 top-full mt-1 z-[90] bg-slate-800 border border-slate-600 rounded-lg shadow-xl py-1 w-56 max-h-48 overflow-y-auto">
                {matchingSequences.map(seq => (
                  seq.blocks.map((block, bi) => {
                    const allIncluded = selectedWeeks.every(w => block.weeks.includes(w));
                    return (
                      <button key={`${seq.id}-${bi}`}
                        onClick={() => handleAddToBlock(seq.id, bi)}
                        className="w-full px-3 py-1.5 text-left text-[10px] text-gray-300 hover:bg-slate-700 cursor-pointer flex items-center gap-1.5"
                        disabled={allIncluded}>
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: seq.color || '#16a34a' }} />
                        <span className="truncate">{seq.title} → {block.label}</span>
                        {allIncluded && <span className="text-[8px] text-gray-500 ml-auto shrink-0">bereits</span>}
                      </button>
                    );
                  })
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      {!sharedCourseId && cells.length > 0 && (
        <div className="text-[8px] text-amber-400/70 pt-2 border-t border-slate-700">
          ⚠ Sequenzen nur innerhalb desselben Kurses erstellbar. Auswahl enthält verschiedene Kurse.
        </div>
      )}

      <div className="text-[8px] text-gray-500 pt-2 border-t border-slate-700">
        Tipp: Wähle mehrere Zellen mit Shift+Klick oder Cmd+Klick, dann setze Eigenschaften hier.
      </div>
    </div>
  );
}

export function DetailPanel() {
  const {
    sidePanelOpen, setSidePanelOpen,
    sidePanelTab, setSidePanelTab,
    sequencePanelOpen,
  } = usePlannerStore();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sidePanelOpen) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        const target = e.target as HTMLElement;
        if (target.closest('table') || target.closest('.app-header')) return;
        setSidePanelOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [sidePanelOpen, setSidePanelOpen]);

  const isOpen = sidePanelOpen || sequencePanelOpen;
  const { panelWidth, setPanelWidth } = usePlannerStore();
  const resizing = useRef(false);

  // Resize handle
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!resizing.current) return;
      const newWidth = Math.min(Math.max(window.innerWidth - e.clientX, 320), 700);
      setPanelWidth(newWidth);
    };
    const onMouseUp = () => { resizing.current = false; document.body.style.cursor = ''; document.body.style.userSelect = ''; };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => { window.removeEventListener('mousemove', onMouseMove); window.removeEventListener('mouseup', onMouseUp); };
  }, []);

  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      className="fixed right-0 top-0 bottom-0 bg-slate-850 border-l border-slate-600 z-[65] flex flex-col shadow-[-4px_0_16px_rgba(0,0,0,0.4)] overflow-y-auto"
      style={{ overscrollBehavior: 'contain', width: panelWidth, background: '#151b2e' }}
      onWheel={(e) => e.stopPropagation()}
    >
      {/* Resize handle */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-blue-500/30 active:bg-blue-500/50 z-10 transition-colors"
        onMouseDown={() => { resizing.current = true; document.body.style.cursor = 'col-resize'; document.body.style.userSelect = 'none'; }}
      />
      <div className="px-3 py-2 border-b border-slate-600 flex items-center justify-between shrink-0">
        <div className="flex gap-1">
          <button
            onClick={() => setSidePanelTab('details')}
            className={`px-2.5 py-1 rounded text-[10px] font-semibold border cursor-pointer transition-colors ${
              sidePanelTab === 'details'
                ? 'bg-blue-500/25 border-blue-400 text-blue-200'
                : 'border-gray-600 text-gray-400 hover:text-gray-200'
            }`}
            title="Lektionsdetails anzeigen"
          >
            📖 Unterrichtseinheit
          </button>
          <button
            onClick={() => setSidePanelTab('sequences')}
            className={`px-2.5 py-1 rounded text-[10px] font-semibold border cursor-pointer transition-colors ${
              sidePanelTab === 'sequences'
                ? 'bg-green-500/25 border-green-400 text-green-200'
                : 'border-gray-600 text-gray-400 hover:text-gray-200'
            }`}
            title="Sequenzen verwalten"
          >
            ▧ Sequenzen
          </button>
          <button
            onClick={() => setSidePanelTab('collection')}
            className={`px-2.5 py-1 rounded text-[10px] font-semibold border cursor-pointer transition-colors ${
              sidePanelTab === 'collection'
                ? 'bg-amber-500/25 border-amber-400 text-amber-200'
                : 'border-gray-600 text-gray-400 hover:text-gray-200'
            }`}
            title="Materialsammlung"
          >
            📚 Sammlung
          </button>
          <button
            onClick={() => setSidePanelTab('settings')}
            className={`px-2.5 py-1 rounded text-[10px] font-semibold border cursor-pointer transition-colors ${
              sidePanelTab === 'settings'
                ? 'bg-gray-500/25 border-gray-400 text-gray-200'
                : 'border-gray-600 text-gray-400 hover:text-gray-200'
            }`}
            title="Einstellungen"
          >
            ⚙
          </button>
        </div>
        <button
          onClick={() => {
            setSidePanelOpen(false);
            usePlannerStore.getState().setSequencePanelOpen(false);
          }}
          className="text-gray-400 hover:text-gray-200 cursor-pointer text-xs px-1"
          title="Panel schliessen (Esc)"
        >
          ✕
        </button>
      </div>
      {sidePanelTab === 'details' ? <BatchOrDetailsTab /> : sidePanelTab === 'sequences' ? <SequencePanel embedded /> : sidePanelTab === 'collection' ? <CollectionPanel /> : <SettingsPanel />}
    </div>
  );
}
