import { useState, useCallback, useEffect, useMemo } from 'react';
import { usePlannerStore } from '../../store/plannerStore';
import { usePlannerData } from '../../hooks/usePlannerData';
import { TYPE_BADGES, getSequenceInfoFromStore } from '../../utils/colors';
import { CurriculumGoalPicker } from '../CurriculumGoalPicker';
import { suggestGoals, suggestSubjectArea } from '../../utils/autoSuggest';
import { inferSubjectAreaFromLessonType } from '../../data/categories';
import type { SubjectArea, BlockCategory, LessonDetail, SequenceBlock } from '../../types';
import { CATEGORIES, getSubtypesForCategory, getEffectiveCategorySubtype, loadCustomSubtypes, saveCustomSubtypes } from '../../data/blockCategories';
import { PillSelect, DurationSelector, MaterialLinks, AddToSequenceButton } from './shared';

/**
 * v3.100 #3a: Vereinfachte Typ-Auswahl (flache 5 Buttons statt 2-stufig Kategorie+Subtype).
 * Mapping: Lektion, SOL, Auftrag, Ausfall → bestehendes category/subtype-System.
 * + Eigenes: Custom-Subtype-System beibehalten.
 */
const SIMPLE_TYPES = [
  { key: 'lektion', label: 'Lektion', icon: '📖', category: 'LESSON' as BlockCategory, subtype: undefined },
  { key: 'sol', label: 'SOL', icon: '📚', category: 'LESSON' as BlockCategory, subtype: 'sol' },
  { key: 'auftrag', label: 'Auftrag', icon: '📋', category: 'EVENT' as BlockCategory, subtype: 'auftrag' },
  { key: 'ausfall', label: 'Ausfall', icon: '❌', category: 'EVENT' as BlockCategory, subtype: 'ausfall' },
] as const;

function SimpleTypeSelector({
  category, subtype, onChangeCategory, onChangeSubtype,
}: {
  category?: BlockCategory;
  subtype?: string;
  onChangeCategory: (v: BlockCategory | undefined) => void;
  onChangeSubtype: (v: string | undefined) => void;
}) {
  const [addingCustom, setAddingCustom] = useState(false);
  const [customLabel, setCustomLabel] = useState('');

  // Determine active simple type
  const activeKey = SIMPLE_TYPES.find(t =>
    t.category === (category || 'LESSON') && t.subtype === subtype
  )?.key;
  const isCustom = !activeKey && subtype;

  const handleAddCustom = () => {
    if (!customLabel.trim()) return;
    const key = customLabel.trim().toLowerCase().replace(/[^a-z0-9äöü]/g, '_');
    const custom = loadCustomSubtypes();
    const cat = category || 'LESSON';
    if (!custom[cat]) custom[cat] = [];
    custom[cat].push({ key, label: customLabel.trim(), labelShort: customLabel.trim().slice(0, 5) + '.', icon: '🏷️' });
    saveCustomSubtypes(custom);
    onChangeSubtype(key);
    setCustomLabel('');
    setAddingCustom(false);
  };

  return (
    <div>
      <label className="text-[11px] font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>Typ</label>
      <div className="flex flex-wrap gap-1">
        {SIMPLE_TYPES.map((t) => {
          const active = activeKey === t.key;
          return (
            <button key={t.key}
              onClick={() => {
                onChangeCategory(t.category === 'LESSON' ? undefined : t.category);
                onChangeSubtype(t.subtype);
              }}
              className="px-1.5 py-0.5 rounded text-[11px] font-medium border cursor-pointer transition-all"
              style={{
                background: active ? '#3b82f620' : 'transparent',
                borderColor: active ? '#3b82f6' : 'var(--border)',
                color: active ? 'var(--text-primary)' : 'var(--text-muted)',
              }}>
              <span className="mr-0.5">{t.icon}</span>{t.label}
            </button>
          );
        })}
        {/* Eigenes label (custom subtype) */}
        {isCustom && (
          <span className="px-1.5 py-0.5 rounded text-[11px] font-medium border"
            style={{ borderColor: '#3b82f6', background: '#3b82f620', color: 'var(--text-primary)' }}>
            🏷️ {subtype}
          </span>
        )}
        {addingCustom ? (
          <div className="flex gap-0.5 items-center">
            <input autoFocus value={customLabel} onChange={(e) => setCustomLabel(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddCustom(); if (e.key === 'Escape') setAddingCustom(false); }}
              placeholder="Neues Label…"
              className="border border-indigo-400 rounded px-1.5 py-0.5 text-[11px] outline-none w-24"
              style={{ background: 'var(--bg-input)', color: 'var(--text-primary)' }} />
            <button onClick={handleAddCustom} className="text-[11px] text-green-400 cursor-pointer">✓</button>
            <button onClick={() => setAddingCustom(false)} className="text-[11px] cursor-pointer" style={{ color: 'var(--text-muted)' }}>✕</button>
          </div>
        ) : (
          <button onClick={() => setAddingCustom(true)}
            className="px-1.5 py-0.5 rounded text-[11px] border border-dashed cursor-pointer transition-all"
            style={{ borderColor: 'var(--border-light)', color: 'var(--text-muted)' }}>
            + Eigenes
          </button>
        )}
      </div>
    </div>
  );
}

const BADGE_PRESETS: { label: string; color: string; title: string }[] = [
  { label: 'P', color: '#ef4444', title: 'Prüfung' },
  { label: 'PW', color: '#ea580c', title: 'Prüfungswoche' },
  { label: 'HK', color: '#7c3aed', title: 'Halbklasse' },
  { label: '!', color: '#f59e0b', title: 'Wichtig' },
  { label: '📎', color: '#6b7280', title: 'Material' },
];

function BadgeEditor({ badges, onChange }: { badges: import('../../types').CellBadge[]; onChange: (b: import('../../types').CellBadge[]) => void }) {
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
            <span key={i} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] font-bold"
              style={{ background: b.color + '30', color: b.color, border: `1px solid ${b.color}60` }}>
              {b.label}
              <button onClick={() => removeBadge(i)} className="text-[9px] opacity-60 hover:opacity-100 cursor-pointer ml-0.5">✕</button>
            </span>
          ))}
        </div>
      )}
      {/* Presets */}
      <div className="flex gap-1 flex-wrap">
        {BADGE_PRESETS.map(p => (
          <button key={p.label} onClick={() => addBadge(p.label, p.color)}
            className="px-1.5 py-0.5 rounded text-[9px] border border-dashed cursor-pointer hover:opacity-80"
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
          className="w-12 bg-slate-700 text-slate-200 border border-slate-600 rounded px-1 py-0.5 text-[11px] outline-none focus:border-indigo-400" />
        <input type="color" value={customColor} onChange={e => setCustomColor(e.target.value)}
          className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent" />
        <button onClick={() => { if (customLabel.trim()) { addBadge(customLabel.trim(), customColor); setCustomLabel(''); } }}
          disabled={!customLabel.trim()}
          className="px-1.5 py-0.5 rounded text-[9px] border border-dashed border-gray-600 text-gray-400 hover:text-gray-200 cursor-pointer disabled:opacity-30">+</button>
      </div>
    </div>
  );
}

/** Button to create a new UE in the next available empty cell */
function NewUEButton() {
  const { weekData, pushUndo, updateLesson, updateLessonDetail, setSelection, setSidePanelOpen, setSidePanelTab } = usePlannerStore();
  const { courses, settings } = usePlannerData();

  const handleCreate = () => {
    if (courses.length === 0 || weekData.length === 0) return;
    // Find first empty cell across all courses and weeks
    for (const week of weekData) {
      for (const course of courses) {
        const entry = week.lessons[course.col];
        if (!entry || (!entry.title && entry.type === 0)) {
          pushUndo();
          updateLesson(week.w, course.col, { title: 'Neue UE', type: 1 });
          // J4: Dauer-Default aus Kurs-Config
          const dur = course.les * (settings?.school?.lessonDurationMin || 45);
          updateLessonDetail(week.w, course.col, { blockCategory: 'LESSON', duration: `${dur} min` });
          setSelection({ week: week.w, courseId: course.id, title: 'Neue UE', course });
          setSidePanelOpen(true);
          setSidePanelTab('details');
          // Scroll the grid row into view
          setTimeout(() => {
            const row = document.querySelector(`tr[data-week="${week.w}"]`);
            if (row) row.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 100);
          return;
        }
      }
    }
  };

  return (
    <button
      onClick={handleCreate}
      className="px-3 py-1.5 rounded text-[12px] text-green-400 border border-dashed border-green-700 cursor-pointer hover:bg-green-900/20 hover:text-green-300"
      title="Neue Unterrichtseinheit in nächster freier Zelle erstellen"
    >
      + Neue UE
    </button>
  );
}

export function DetailsTab() {
  const {
    selection,
    lessonDetails, updateLessonDetail,
    weekData, sequences,
    collection, addCollectionItem, pushUndo,
  } = usePlannerStore();
  const { categories, effectiveGoals, settings } = usePlannerData();
  const [showCollectionPicker, setShowCollectionPicker] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

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

  // J4: Default-Dauer aus Kurs-Config (les × lessonDurationMin)
  const defaultDuration = c?.les ? `${c.les * (settings?.school?.lessonDurationMin || 45)} min` : undefined;

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
    duration: detail.duration || defaultDuration,
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
    const patch: Partial<LessonDetail> = {
      blockCategory: cat || 'LESSON',
      blockSubtype: undefined,
      blockType: undefined, // clear legacy
    };
    // Auto-badge: set "P" badge when switching to ASSESSMENT (if no badges yet)
    if (cat === 'ASSESSMENT' && !(detail.badges?.length)) {
      patch.badges = [{ label: 'P', color: '#ef4444' }];
    }
    // Remove auto-badge when switching away from ASSESSMENT
    if (cat !== 'ASSESSMENT' && detail.badges?.length === 1 && detail.badges[0].label === 'P' && detail.badges[0].color === '#ef4444') {
      patch.badges = undefined;
    }
    updateLessonDetail(selection.week, c.col, patch);
  }, [selection?.week, c?.col, updateLessonDetail, detail.badges]);

  const handleSubtypeChange = useCallback((st: string | undefined) => {
    if (!selection || !c) return;
    const patch: Partial<LessonDetail> = {
      blockSubtype: st,
      blockCategory: effectiveCategory || 'LESSON',
      blockType: undefined, // clear legacy
    };
    // Auto-badge: set "P" badge for written exams if no badges yet
    if (effectiveCategory === 'ASSESSMENT' && st === 'EXAM' && !(detail.badges?.length)) {
      patch.badges = [{ label: 'P', color: '#ef4444' }];
    }
    updateLessonDetail(selection.week, c.col, patch);
  }, [selection?.week, c?.col, updateLessonDetail, effectiveCategory, detail.badges]);

  // Auto-detect subjectArea from LessonType (unambiguous types only)
  useEffect(() => {
    if (!selection || !c || detail.subjectArea || !currentLesson) return;
    const detected = inferSubjectAreaFromLessonType(currentLesson.type) as SubjectArea | undefined;
    if (detected) updateLessonDetail(selection.week, c.col, { subjectArea: detected });
  }, [selection?.week, c?.col, currentLesson?.type, detail.subjectArea]);

  // Auto-detect subjectArea from topicMain (for ambiguous lesson types: 0, 2)
  useEffect(() => {
    if (!selection || !c || detail.subjectArea) return;
    const lessonType = currentLesson?.type;
    if (lessonType !== undefined && lessonType !== 0 && lessonType !== 2) return;
    const topic = detail.topicMain || effectiveDetail.topicMain;
    if (!topic || topic.length < 3) return;
    const suggested = suggestSubjectArea(topic, effectiveGoals);
    if (suggested) updateLessonDetail(selection.week, c.col, { subjectArea: suggested });
  }, [selection?.week, c?.col, detail.topicMain, effectiveDetail.topicMain, detail.subjectArea, currentLesson?.type, effectiveGoals]);

  // Auto-suggest curriculum goals
  const goalSuggestions = useMemo(() => {
    const topic = detail.topicMain || effectiveDetail.topicMain;
    if (!topic || topic.length < 2) return [];
    return suggestGoals(topic, effectiveDetail.subjectArea, 3, 0.2, effectiveGoals);
  }, [detail.topicMain, effectiveDetail.topicMain, effectiveDetail.subjectArea, effectiveGoals]);

  // Mismatch warning: inherited subjectArea doesn't match topic
  const subjectAreaMismatch = useMemo(() => {
    const effective = effectiveDetail.subjectArea;
    if (!effective) return null;
    const topic = detail.topicMain || effectiveDetail.topicMain;
    if (!topic || topic.length < 3) return null;
    const suggested = suggestSubjectArea(topic, effectiveGoals);
    if (!suggested || suggested === effective) return null;
    return { current: effective, suggested, isInherited: !detail.subjectArea };
  }, [effectiveDetail.subjectArea, detail.subjectArea, detail.topicMain, effectiveDetail.topicMain]);

  if (!selection || !c) {
    return (
      <div className="flex-1 flex flex-col items-center justify-start text-[12px] text-gray-400 p-4 pt-8 gap-3">
        <NewUEButton />
        <span>Wähle eine Unterrichtseinheit aus, um Details zu bearbeiten.</span>
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
    <div className="flex-1 min-h-0 overflow-y-auto p-3 pb-12 space-y-3" style={{ overscrollBehavior: 'contain' }}>
      {/* Header info */}
      <div>
        <div className="flex gap-2 items-center mb-1">
          <span className="text-xs font-bold text-gray-100">{c.cls}</span>
          <span className="text-[11px] px-1.5 py-px rounded text-white" style={{ background: badge?.bg }}>{c.typ}</span>
          <span className="text-[11px] text-gray-400">{c.day} {c.from}–{c.to} · KW {selection.week}</span>
        </div>
        <div className="text-sm text-gray-200">{selection.title}</div>
        {/* Tags */}
        <div className="flex gap-1 mt-1.5 flex-wrap">
          {effectiveDetail.subjectArea && (() => {
            const isInherited = !detail.subjectArea && parentBlock?.subjectArea;
            const catColor = categories.find(s => s.key === effectiveDetail.subjectArea)?.color;
            return (
              <span className={`text-[9px] px-1 py-px rounded border ${isInherited ? 'opacity-60 border-dashed' : ''}`}
                style={{ borderColor: catColor, color: catColor }}
                title={isInherited ? 'Vom Sequenz-Block geerbt' : 'Direkt gesetzt'}>
                {isInherited && '↓ '}{effectiveDetail.subjectArea}
              </span>
            );
          })()}
          {catDef && catDef.key !== 'LESSON' && (
            <span className="text-[9px] px-1 py-px rounded border" style={{ borderColor: catDef.color + '80', color: catDef.color }}>
              {catDef.icon} {catDef.label}
            </span>
          )}
          {subtypeDef && (
            <span className="text-[9px] px-1 py-px rounded border border-gray-600 text-gray-400">
              {subtypeDef.icon} {subtypeDef.label}
            </span>
          )}
          {effectiveDetail.duration && (
            <span className="text-[9px] px-1 py-px rounded border border-gray-600 text-gray-400">
              ⏱ {effectiveDetail.duration}
            </span>
          )}
          {detail.sol?.enabled && (
            <span className="text-[9px] px-1 py-px rounded border border-purple-500/50 text-purple-400">
              📚 SOL{detail.sol.duration ? ` (${detail.sol.duration})` : ''}
            </span>
          )}
          {seqInfo && (
            <span className="text-[9px] px-1 py-px rounded border cursor-pointer hover:opacity-80"
              style={{ borderColor: seqInfo.color || '#16a34a', color: seqInfo.color || '#4ade80' }}
              onClick={() => {
                if (parentSeq && seqInfo) {
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
              if (detail.topicMain && (!parentSeq.title || parentSeq.title === parentBlock.topicMain || parentSeq.title === 'Neue Reihe')) {
                usePlannerStore.getState().updateSequence(parentSeq.id, { title: detail.topicMain });
              }
            }}
              className="text-[9px] px-1 py-px rounded border border-dashed border-indigo-500/40 text-indigo-400 hover:bg-indigo-900/20 cursor-pointer"
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
          <label className="text-[11px] text-gray-400 font-medium mb-1 block">
            Fachbereich
            {!detail.subjectArea && effectiveDetail.subjectArea && (
              <span className="text-[9px] text-gray-500 font-normal ml-1">(geerbt von Sequenz)</span>
            )}
          </label>
          <PillSelect options={categories.map(s => s.key)} value={detail.subjectArea}
            onChange={(v) => updateField('subjectArea', v as SubjectArea)}
            renderOption={(v) => { const s = categories.find(x => x.key === v)!; return { label: s.label, color: s.color }; }} />
          {subjectAreaMismatch && (
            <div className="mt-1 flex items-center gap-1 text-[9px]">
              <span className="text-amber-400">⚠</span>
              <span className="text-amber-400/80">
                Topic passt zu <strong>{subjectAreaMismatch.suggested}</strong>{subjectAreaMismatch.isInherited ? ' (geerbt: ' + subjectAreaMismatch.current + ')' : ''}
              </span>
              <button
                onClick={() => updateField('subjectArea', subjectAreaMismatch.suggested)}
                className="text-[9px] text-indigo-400 hover:text-indigo-300 cursor-pointer underline ml-1">
                Korrigieren
              </button>
            </div>
          )}
        </div>
        <SimpleTypeSelector
          category={effectiveCategory}
          subtype={effectiveSubtype}
          onChangeCategory={handleCategoryChange}
          onChangeSubtype={handleSubtypeChange}
        />
        <div>
          <label className="text-[11px] text-gray-400 font-medium mb-1 block">Dauer</label>
          <DurationSelector value={effectiveDetail.duration} onChange={(v) => updateField('duration', v)} baseDuration={settings?.school?.lessonDurationMin} />
        </div>
        {/* v3.100 #3b: SOL-Section entfernt (wird jetzt pro Kurs in Einstellungen konfiguriert) */}
        <div>
          <label className="text-[11px] text-gray-400 font-medium mb-1 block">Thema</label>
          {parentBlock?.topicMain && !detail.topicMain && (
            <div className="text-[9px] text-indigo-400/60 mb-0.5">↳ Block: {parentBlock.topicMain}</div>
          )}
          <input value={detail.topicMain || ''} onChange={(e) => updateField('topicMain', e.target.value)}
            placeholder={effectiveDetail.topicMain || 'Hauptthema…'}
            className="w-full bg-slate-700 text-slate-200 border border-slate-600 rounded px-2 py-1 text-[12px] outline-none focus:border-indigo-400" />
          <input value={detail.topicSub || ''} onChange={(e) => updateField('topicSub', e.target.value)}
            placeholder={effectiveDetail.topicSub || 'Unterthema (optional)…'}
            className="w-full bg-slate-700 text-slate-200 border border-slate-600 rounded px-2 py-1 text-[12px] outline-none focus:border-indigo-400 mt-1" />
          {goalSuggestions.length > 0 && !detail.curriculumGoal && !effectiveDetail.curriculumGoal && (
            <div className="mt-1.5 space-y-0.5">
              <span className="text-[9px] text-amber-500/70">💡 Vorgeschlagene Lehrplanziele:</span>
              {goalSuggestions.map(s => (
                <button key={s.goal.id}
                  onClick={() => updateField('curriculumGoal', `${s.goal.id}: ${s.goal.goal}`)}
                  className="w-full text-left px-1.5 py-1 rounded bg-amber-900/20 hover:bg-amber-900/40 border border-amber-700/30 hover:border-amber-600/50 transition-colors cursor-pointer"
                  title={`${s.matchReason}\nScore: ${(s.score * 100).toFixed(0)}%\n${s.goal.contents.join(', ')}`}>
                  <div className="flex items-center gap-1">
                    <span className="text-[8px] font-mono text-amber-400/80 shrink-0">{s.goal.id}</span>
                    <span className="text-[9px] text-amber-200/80 truncate">{s.goal.topic}</span>
                    <span className="text-[8px] text-amber-600/60 shrink-0 ml-auto">{(s.score * 100).toFixed(0)}%</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        {/* v3.100 #4: Notizen vor Lehrplanziel (häufiger genutzt) */}
        <div>
          <label className="text-[11px] text-gray-400 font-medium mb-1 block">Notizen</label>
          <textarea value={detail.notes || ''} onChange={(e) => updateField('notes', e.target.value)}
            placeholder="Notizen, Hinweise…" rows={3}
            className="w-full bg-slate-700 text-slate-200 border border-slate-600 rounded px-2 py-1 text-[12px] outline-none focus:border-indigo-400 resize-y" />
        </div>
        <div>
          <label className="text-[11px] text-gray-400 font-medium mb-1 block">Lehrplanziel (LP17)</label>
          {parentBlock?.curriculumGoal && !detail.curriculumGoal && (
            <div className="text-[9px] text-indigo-400/60 mb-0.5">↳ Block: {parentBlock.curriculumGoal}</div>
          )}
          <CurriculumGoalPicker value={detail.curriculumGoal || effectiveDetail.curriculumGoal} onChange={(v) => updateField('curriculumGoal', v)} subjectArea={effectiveDetail.subjectArea} goals={effectiveGoals} />
        </div>
        <div>
          <label className="text-[11px] text-gray-400 font-medium mb-1 block">Material</label>
          <MaterialLinks links={[
            ...(detail.learningviewUrl ? [detail.learningviewUrl] : []),
            ...(detail.materialLinks || []),
          ]} onChange={(links) => {
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
          <label className="text-[11px] text-gray-400 font-medium mb-1 block">Badges</label>
          <BadgeEditor badges={detail.badges || []} onChange={(badges) => updateField('badges', badges.length > 0 ? badges : undefined)} />
        </div>

        {/* Collection: Save / Load */}
        <div className="border-t border-slate-700 pt-2 space-y-1.5">
          <label className="text-[11px] text-gray-400 font-medium block">Sammlung</label>
          <div className="flex gap-1.5">
            <button onClick={() => {
              if (!selection || !c) return;
              const title = currentLesson?.title || effectiveDetail.topicMain || 'UE';
              addCollectionItem({
                type: 'unit',
                title,
                subjectArea: effectiveDetail.subjectArea,
                courseType: c.typ as any,
                cls: c.cls,
                units: [{
                  block: { weeks: [], label: '', topicMain: effectiveDetail.topicMain, topicSub: effectiveDetail.topicSub, subjectArea: effectiveDetail.subjectArea, curriculumGoal: effectiveDetail.curriculumGoal, description: effectiveDetail.description, materialLinks: effectiveDetail.materialLinks },
                  lessonDetails: { '0': { ...detail } },
                  lessonTitles: [currentLesson?.title || ''],
                }],
              });
              setSavedMsg('✅ In Sammlung gespeichert');
              setTimeout(() => setSavedMsg(null), 2500);
            }}
              className="flex-1 px-2 py-1 rounded text-[11px] border border-amber-600/60 text-amber-300 hover:bg-amber-900/20 cursor-pointer transition-all">
              💾 In Sammlung
            </button>
            <button onClick={() => setShowCollectionPicker(!showCollectionPicker)}
              className="flex-1 px-2 py-1 rounded text-[11px] border border-indigo-600/60 text-indigo-300 hover:bg-indigo-900/20 cursor-pointer transition-all">
              📥 Aus Sammlung
            </button>
          </div>
          {savedMsg && <div className="text-[9px] text-green-400">{savedMsg}</div>}
          {showCollectionPicker && (() => {
            const area = effectiveDetail.subjectArea;
            const unitItems = collection.filter(item => item.type === 'unit');
            const sorted = [...unitItems].sort((a, b) => {
              const aMatch = a.subjectArea === area ? 0 : 1;
              const bMatch = b.subjectArea === area ? 0 : 1;
              if (aMatch !== bMatch) return aMatch - bMatch;
              return (b.createdAt || '').localeCompare(a.createdAt || '');
            });
            return (
              <div className="bg-slate-800 border border-slate-600 rounded p-1.5 max-h-48 overflow-y-auto space-y-1">
                {sorted.length === 0 && <p className="text-[9px] text-gray-500 italic px-1">Keine UEs in der Sammlung.</p>}
                {sorted.map(item => {
                  const unit = item.units[0];
                  if (!unit) return null;
                  return (
                    <button key={item.id} onClick={() => {
                      if (!selection || !c) return;
                      pushUndo();
                      const srcDetail = unit.lessonDetails['0'] || {};
                      const patch: Partial<LessonDetail> = {};
                      if (srcDetail.subjectArea) patch.subjectArea = srcDetail.subjectArea;
                      if (srcDetail.topicMain) patch.topicMain = srcDetail.topicMain;
                      if (srcDetail.topicSub) patch.topicSub = srcDetail.topicSub;
                      if (srcDetail.curriculumGoal) patch.curriculumGoal = srcDetail.curriculumGoal;
                      if (srcDetail.description) patch.description = srcDetail.description;
                      if (srcDetail.materialLinks?.length) patch.materialLinks = srcDetail.materialLinks;
                      if (srcDetail.notes) patch.notes = srcDetail.notes;
                      if (srcDetail.sol) patch.sol = srcDetail.sol;
                      if (srcDetail.blockCategory) patch.blockCategory = srcDetail.blockCategory;
                      if (srcDetail.blockSubtype) patch.blockSubtype = srcDetail.blockSubtype;
                      if (srcDetail.duration) patch.duration = srcDetail.duration;
                      if (srcDetail.badges) patch.badges = srcDetail.badges;
                      updateLessonDetail(selection.week, c.col, patch);
                      setShowCollectionPicker(false);
                      setSavedMsg('📥 Aus Sammlung geladen');
                      setTimeout(() => setSavedMsg(null), 2500);
                    }}
                      className="w-full text-left px-2 py-1.5 rounded text-[11px] hover:bg-slate-700 cursor-pointer transition-all flex items-center gap-2">
                      <span className={`px-1 py-px rounded text-[8px] ${item.subjectArea === area ? 'bg-indigo-900/40 text-indigo-300' : 'bg-slate-700 text-gray-400'}`}>
                        {item.subjectArea || '—'}
                      </span>
                      <span className="text-gray-200 truncate flex-1">{item.title}</span>
                      {item.cls && <span className="text-[8px] text-gray-500">{item.cls}</span>}
                    </button>
                  );
                })}
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
