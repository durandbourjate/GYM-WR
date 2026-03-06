import { useState, useEffect, useRef, useMemo } from 'react';
import { usePlannerStore } from '../store/plannerStore';
import { usePlannerData } from '../hooks/usePlannerData';
import { SUBJECT_AREA_COLORS } from '../utils/colors';
import { computeSeqSolTotal } from '../utils/solTotal';
import type { Course, SubjectArea, SequenceBlock, CollectionItem } from '../types';
import { CollectionPickerList } from './CollectionPicker';


// === Inline Lessons List for Sequence Panel ===
function LessonsList({ block, fb, courses }: { block: SequenceBlock; fb: FlatBlockInfo; courses: Course[] }) {
  const [expandedWeek, setExpandedWeek] = useState<string | null>(null);
  const { lessonDetails, updateLessonDetail } = usePlannerStore();

  return (
    <div className="space-y-0.5 p-1.5 bg-slate-800/30 rounded max-h-64 overflow-y-auto">
      {block.weeks.map((weekW, wi) => {
        const course = courses.find(c => c.id === fb.courseId);
        const weekData = usePlannerStore.getState().weekData.find(w => w.w === weekW);
        const entry = course && weekData?.lessons[course.col];

        // Skip holiday weeks (type 6) — they shouldn't be editable in sequence context
        if (entry && (entry as any).type === 6) {
          return (
            <div key={wi} className="flex items-center gap-1 text-[9px] px-1 text-gray-600 italic">
              <span className="text-[8px]">🏖</span>
              <span className="font-mono w-8">KW{weekW}</span>
              <span>{entry.title || 'Ferien'}</span>
            </div>
          );
        }

        const isExpanded = expandedWeek === weekW;
        const key = course ? `${weekW}-${course.col}` : '';
        const detail = key ? lessonDetails[key] : undefined;
        const inheritSA = block.subjectArea || fb.seqSubjectArea;

        return (
          <div key={wi}>
            <div className={`flex items-center gap-1 text-[9px] cursor-pointer px-1 rounded ${isExpanded ? 'bg-slate-700/50' : 'hover:bg-slate-700/30'}`}
              onClick={() => {
                setExpandedWeek(isExpanded ? null : weekW);
                // Scroll to week in planner
                const row = document.querySelector(`tr[data-week="${weekW}"]`);
                if (row) row.scrollIntoView({ behavior: 'smooth', block: 'center' });
                // Select cell
                if (course) {
                  const store = usePlannerStore.getState();
                  store.setSelection({ week: weekW, courseId: course.id, title: entry?.title || '', course });
                }
              }}
              onDoubleClick={() => {
                if (!course) return;
                const store = usePlannerStore.getState();
                store.setSelection({ week: weekW, courseId: course.id, title: entry?.title || '', course });
                store.setSidePanelOpen(true);
                store.setSidePanelTab('details');
              }}>
              <span className="text-[8px] text-gray-500">{isExpanded ? '▾' : '▸'}</span>
              <span className="text-gray-400 font-mono w-8">KW{weekW}</span>
              <span className={`truncate ${entry?.title && entry.title !== 'UE' && entry.title !== 'Neue UE' ? 'text-gray-300' : 'text-gray-500 italic'}`}>{(() => {
                const isPlaceholder = !entry?.title || entry.title === 'UE' || entry.title === 'Neue UE';
                const thematic = detail?.topicMain || detail?.topicSub || block.topicSub || block.topicMain;
                return isPlaceholder ? (thematic || entry?.title || '—') : entry.title;
              })()}</span>
              {detail?.topicMain && !(entry?.title && entry.title !== 'UE' && entry.title !== 'Neue UE') && <span className="text-[7px] text-gray-400 ml-auto truncate max-w-20" title="Zugewiesenes Thema">📌{detail.topicMain}</span>}
            </div>
            {isExpanded && course && (
              <div className="ml-5 mr-1 my-1 p-1.5 bg-slate-900/50 rounded space-y-1 border-l-2 border-blue-500/30">
                <div>
                  <label className="text-[7px] text-gray-500">Thema</label>
                  <input value={detail?.topicMain || ''} onChange={(e) => updateLessonDetail(weekW, course.col, { topicMain: e.target.value || undefined })}
                    placeholder={block.topicMain || 'Thema…'}
                    className="w-full bg-slate-700/50 text-slate-200 border border-slate-600 rounded px-1.5 py-0.5 text-[8px] outline-none focus:border-blue-400" />
                </div>
                <div>
                  <label className="text-[7px] text-gray-500">Notizen</label>
                  <textarea value={detail?.notes || ''} onChange={(e) => updateLessonDetail(weekW, course.col, { notes: e.target.value || undefined })}
                    placeholder="Notizen…" rows={2}
                    className="w-full bg-slate-700/50 text-slate-200 border border-slate-600 rounded px-1.5 py-0.5 text-[8px] outline-none focus:border-blue-400 resize-y" />
                </div>
                {!detail?.subjectArea && inheritSA && (
                  <div className="text-[7px] text-gray-500">Fachbereich: <span className="text-gray-400">{inheritSA}</span> <span className="text-gray-700">(geerbt)</span></div>
                )}
                <div className="flex justify-end">
                  <button onClick={() => {
                    const store = usePlannerStore.getState();
                    store.setSelection({ week: weekW, courseId: course.id, title: entry?.title || '', course });
                    store.setSidePanelOpen(true);
                    store.setSidePanelTab('details');
                  }} className="text-[7px] text-blue-400 cursor-pointer hover:text-blue-300">
                    Alle Details →
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
      {block.weeks.length === 0 && <div className="text-[8px] text-gray-500 italic">Keine Wochen zugewiesen</div>}
    </div>
  );
}

// === Flat Block Card (new flat view) ===
type FlatBlockInfo = {
  seqId: string;
  seqTitle: string;
  seqColor?: string;
  seqSubjectArea?: SubjectArea;
  block: SequenceBlock;
  blockIndex: number;
  totalBlocks: number;
  courseId: string;
  courseIds?: string[];
  cls: string;
  typ: string;
};

function FlatBlockCard({ fb }: { fb: FlatBlockInfo }) {
  const {
    editingSequenceId, setEditingSequenceId,
    updateBlockInSequence, removeBlockFromSequence,
    sequences, updateSequence, lessonDetails,
  } = usePlannerStore();
  const { courses: COURSES, categories } = usePlannerData();
  const blockKey = `${fb.seqId}-${fb.blockIndex}`;
  const isActive = editingSequenceId === blockKey;
  const [showFields, setShowFields] = useState(true);
  const [showLessons, setShowLessons] = useState(true);
  const [showSeriesFields, setShowSeriesFields] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // SOL-Total: Sum all lesson-level SOL durations across all blocks of the parent sequence
  const parentSeqForSol = sequences.find(s => s.id === fb.seqId);
  const solTotal = useMemo(() => {
    if (!parentSeqForSol) return { count: 0, totalMinutes: 0, formatted: '' };
    return computeSeqSolTotal(parentSeqForSol, lessonDetails, COURSES);
  }, [parentSeqForSol, lessonDetails, COURSES]);

  // Scroll active card into view (e.g. when clicked from Zoom 2 Year View)
  useEffect(() => {
    if (isActive && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [isActive]);

  const block = fb.block;
  const sa = block.subjectArea || fb.seqSubjectArea;
  const blockColor = sa ? SUBJECT_AREA_COLORS[sa]?.bg : fb.seqColor;
  const kwRange = block.weeks.length > 0
    ? `KW ${block.weeks[0]}–${block.weeks[block.weeks.length - 1]}`
    : '—';

  // Navigate to first lesson in planner
  const navigateToBlock = () => {
    if (block.weeks.length === 0) return;
    const course = COURSES.find(c => c.id === fb.courseId);
    if (!course) return;
    const row = document.querySelector(`tr[data-week="${block.weeks[0]}"]`);
    if (row) row.scrollIntoView({ behavior: 'smooth', block: 'center' });
    usePlannerStore.getState().setSelection({
      week: block.weeks[0], courseId: course.id, title: block.label, course,
    });
  };

  // Get parent sequence for series-level editing
  const parentSeq = sequences.find(s => s.id === fb.seqId);

  return (
    <div ref={cardRef} data-seq-block={blockKey} className={`border rounded-lg overflow-hidden transition-colors ${isActive ? 'border-slate-600' : 'border-slate-700'}`}
      style={{
        ...(isActive && blockColor ? { borderColor: blockColor, background: blockColor + '08' } : {}),
        ...(!isActive ? {} : !blockColor ? { background: 'var(--bg-secondary)' } : {}),
      }}>
      {/* Compact header — always visible */}
      <div className="px-3 py-2 flex items-center gap-2 cursor-pointer hover:bg-slate-800/30"
        onClick={() => {
          const willActivate = !isActive;
          setEditingSequenceId(willActivate ? blockKey : null);
          if (willActivate) navigateToBlock();
        }}>
        <div className="w-1 h-6 rounded-full shrink-0" style={{ background: blockColor || fb.seqColor || '#16a34a' }} />
        <div className="flex-1 min-w-0">
          <div className="text-[12px] font-semibold text-gray-200 truncate">{block.label || block.topicMain || <span className="text-gray-500 italic font-normal">Block {fb.blockIndex + 1}</span>}</div>
          <div className="text-[10px] text-gray-400 flex items-center gap-1.5">
            <span className="font-mono">{kwRange}</span>
            <span>· {block.weeks.length}W</span>
            {sa && <span style={{ color: SUBJECT_AREA_COLORS[sa]?.fg }}>{sa}</span>}
            {parentSeq?.sol?.enabled && <span className="text-emerald-500" title={`SOL: ${parentSeq.sol.topic || 'aktiv'}${parentSeq.sol.duration ? ' (' + parentSeq.sol.duration + ')' : ''}`}>📚</span>}
            <span className="text-gray-500">· {fb.seqTitle}</span>
          </div>
        </div>
        <span className="text-[11px] text-gray-400">{isActive ? '▾' : '▸'}</span>
      </div>

      {/* Expanded content */}
      {isActive && (
        <div className="px-3 pb-3 pt-1 border-t border-slate-700/50 space-y-2">
          {/* Quick actions + tab-style toggles */}
          <div className="flex gap-0.5 items-center">
            <button onClick={navigateToBlock} className="text-[10px] text-blue-400 hover:text-blue-300 cursor-pointer px-2 py-1">↗ Im Planer</button>
            <span className="text-slate-700 mx-0.5">│</span>
            <button onClick={() => setShowFields(!showFields)}
              className={`text-[10px] cursor-pointer px-2 py-1 rounded-t border-b-2 transition-colors ${showFields ? 'text-gray-200 bg-slate-800/50 border-blue-400 font-medium' : 'text-gray-400 hover:text-gray-300 border-transparent'}`}>
              Felder
            </button>
            <button onClick={() => setShowLessons(!showLessons)}
              className={`text-[10px] cursor-pointer px-2 py-1 rounded-t border-b-2 transition-colors ${showLessons ? 'text-gray-200 bg-slate-800/50 border-blue-400 font-medium' : 'text-gray-400 hover:text-gray-300 border-transparent'}`}>
              Lektionen ({block.weeks.length})
            </button>
            <button onClick={() => setShowSeriesFields(!showSeriesFields)}
              className={`text-[10px] cursor-pointer px-2 py-1 rounded-t border-b-2 transition-colors ml-auto ${showSeriesFields ? 'text-amber-300 bg-amber-900/20 border-amber-400 font-medium' : 'text-amber-600 hover:text-amber-400 border-transparent'}`}>
              Reihe
            </button>
          </div>

          {/* Block-level fields */}
          {showFields && (
            <div className="space-y-2 p-2 bg-slate-800/30 rounded">
              {/* Hierarchy indicator (v3.78 #20: flache Struktur) */}
              <div className="flex items-center gap-1 text-[8px] text-gray-500 pb-0.5 border-b border-slate-700/50">
                <span className="text-blue-400 font-medium">Sequenz</span>
                <span>›</span>
                <span className="text-gray-400">Unterrichtseinheit</span>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                <span className="text-[10px] text-gray-400 w-full">Fachbereich:</span>
                {categories.map((s) => (
                  <button key={s.key} onClick={() => updateBlockInSequence(fb.seqId, fb.blockIndex, {
                    subjectArea: block.subjectArea === s.key ? undefined : s.key as SubjectArea
                  })}
                    className={`px-2 py-1 rounded text-[10px] font-medium border cursor-pointer ${block.subjectArea === s.key ? 'text-gray-200' : 'text-gray-500 border-gray-700'}`}
                    style={{
                      background: block.subjectArea === s.key ? s.color + '30' : 'transparent',
                      ...(block.subjectArea === s.key ? { borderColor: s.color } : {}),
                    }}>
                    {s.label}
                  </button>
                ))}
              </div>
              <div>
                <label className="text-[10px] text-gray-400">Bezeichnung</label>
                <input value={block.label || ''} onChange={(e) => {
                  const val = e.target.value;
                  // Sync: wenn Oberthema leer ist oder noch dem alten Label entspricht (= nicht manuell editiert)
                  if (!block.topicMain || block.topicMain === block.label) {
                    updateBlockInSequence(fb.seqId, fb.blockIndex, { label: val, topicMain: val });
                  } else {
                    updateBlockInSequence(fb.seqId, fb.blockIndex, { label: val });
                  }
                }}
                  placeholder={block.topicMain || `Block ${fb.blockIndex + 1}`}
                  className="w-full bg-slate-700/50 text-slate-200 border border-slate-600 rounded px-2 py-1 text-[11px] outline-none focus:border-blue-400 placeholder:text-gray-500 placeholder:italic" />
                <p className="text-[8px] text-gray-500 mt-0.5">Interner Name der Sequenz (z.B. für Sammlung und Navigation). Wird aus Oberthema übernommen falls leer.</p>
              </div>
              <div>
                <label className="text-[10px] text-gray-400">Oberthema</label>
                <input value={block.topicMain || ''} onChange={(e) => {
                  const val = e.target.value || undefined;
                  updateBlockInSequence(fb.seqId, fb.blockIndex, { topicMain: val });
                  // Sync: Sequenz-/Reihen-Titel = Oberthema (wenn Titel leer oder gleich dem alten Oberthema)
                  if (parentSeq && val && (!parentSeq.title || parentSeq.title === block.topicMain || parentSeq.title === 'Neue Reihe')) {
                    updateSequence(fb.seqId, { title: val });
                  }
                }}
                  className="w-full bg-slate-700/50 text-slate-200 border border-slate-600 rounded px-2 py-1 text-[11px] outline-none focus:border-blue-400" />
              </div>
              <div>
                <label className="text-[10px] text-gray-400">Unterthema</label>
                <input value={block.topicSub || ''} onChange={(e) => updateBlockInSequence(fb.seqId, fb.blockIndex, { topicSub: e.target.value || undefined })}
                  className="w-full bg-slate-700/50 text-slate-200 border border-slate-600 rounded px-2 py-1 text-[11px] outline-none focus:border-blue-400" />
              </div>
              <div>
                <label className="text-[10px] text-gray-400">Beschreibung</label>
                <textarea value={block.description || ''} onChange={(e) => updateBlockInSequence(fb.seqId, fb.blockIndex, { description: e.target.value || undefined })}
                  rows={2} className="w-full bg-slate-700/50 text-slate-200 border border-slate-600 rounded px-2 py-1 text-[11px] outline-none focus:border-blue-400 resize-y" />
              </div>
              <div>
                <label className="text-[9px] text-gray-500">Lehrplanziel</label>
                <input value={block.curriculumGoal || ''} onChange={(e) => updateBlockInSequence(fb.seqId, fb.blockIndex, { curriculumGoal: e.target.value || undefined })}
                  placeholder="LP17-Ziel…"
                  className="w-full bg-slate-700/50 text-slate-200 border border-slate-600 rounded px-2 py-1 text-[10px] outline-none focus:border-blue-400 text-gray-400" />
              </div>
              <div>
                <label className="text-[10px] text-gray-400">Materiallinks</label>
                {(block.materialLinks || []).map((link, li) => (
                  <div key={li} className="flex gap-1 items-center mt-0.5">
                    <input value={link} onChange={(e) => {
                      const updated = [...(block.materialLinks || [])]; updated[li] = e.target.value;
                      updateBlockInSequence(fb.seqId, fb.blockIndex, { materialLinks: updated });
                    }} className="flex-1 bg-slate-700/50 text-slate-200 border border-slate-600 rounded px-2 py-1 text-[10px] outline-none font-mono" />
                    <button onClick={() => {
                      const updated = (block.materialLinks || []).filter((_, i) => i !== li);
                      updateBlockInSequence(fb.seqId, fb.blockIndex, { materialLinks: updated.length > 0 ? updated : undefined });
                    }} className="text-[10px] text-red-400 cursor-pointer">✕</button>
                  </div>
                ))}
                <button onClick={() => updateBlockInSequence(fb.seqId, fb.blockIndex, { materialLinks: [...(block.materialLinks || []), ''] })}
                  className="text-[10px] text-blue-400 cursor-pointer mt-0.5">+ Link</button>
              </div>
              {/* Apply block fields to all lessons */}
              {block.weeks.length > 0 && (
                <button onClick={() => {
                  const course = COURSES.find(c => c.id === fb.courseId);
                  if (!course) return;
                  const fieldsToApply: string[] = [];
                  if (sa) fieldsToApply.push(`Fachbereich: ${sa}`);
                  if (block.topicMain) fieldsToApply.push(`Oberthema: ${block.topicMain}`);
                  if (fieldsToApply.length === 0) { alert('Keine Sequenz-Felder gesetzt, die übertragen werden können.'); return; }
                  if (!confirm(`Folgende Felder auf alle ${block.weeks.length} Lektionen übertragen?\n\n${fieldsToApply.join('\n')}\n\nBestehende Werte werden überschrieben.`)) return;
                  const store = usePlannerStore.getState();
                  for (const weekW of block.weeks) {
                    const weekData = store.weekData.find(w => w.w === weekW);
                    const entry = weekData?.lessons[course.col];
                    if (!entry || (entry as any).type === 6) continue; // skip holidays
                    const patch: Record<string, any> = {};
                    if (sa) patch.subjectArea = sa;
                    if (block.topicMain) patch.topicMain = block.topicMain;
                    store.updateLessonDetail(weekW, course.col, patch);
                  }
                }}
                  className="w-full py-1.5 rounded text-[10px] font-medium border border-dashed border-blue-500/40 text-blue-400 hover:bg-blue-900/20 cursor-pointer transition-all mt-1">
                  ↓ Auf alle {block.weeks.length} Lektionen anwenden
                </button>
              )}
            </div>
          )}

          {/* Lessons list */}
          {showLessons && (
            <LessonsList block={block} fb={fb} courses={COURSES} />
          )}

          {/* Series-level fields (parent ManagedSequence) */}
          {showSeriesFields && parentSeq && (
            <div className="space-y-2 p-2 bg-amber-900/10 border border-amber-700/30 rounded">
              <div className="text-[10px] text-amber-400 font-medium mb-1">
                📂 Reihe: {parentSeq.title}
                <span className="text-gray-400 font-normal ml-1">({parentSeq.blocks.length} Sequenz{parentSeq.blocks.length !== 1 ? 'en' : ''})</span>
              </div>
              <div className="text-[8px] text-gray-500 mb-1.5 space-y-0.5">
                <p>Reihe = übergreifende Einheit mehrerer Sequenzen (z.B. ein ganzes Semester oder Themenblock). Optional.</p>
                <p>Reihen-Einstellungen (Fachbereich, SOL) gelten für alle Sequenzen darin.</p>
              </div>
              <div>
                <label className="text-[10px] text-gray-400">Reihen-Titel</label>
                <input value={parentSeq.title} onChange={(e) => updateSequence(fb.seqId, { title: e.target.value })}
                  className="w-full bg-slate-700/50 text-slate-200 border border-slate-600 rounded px-2 py-1 text-[11px] outline-none focus:border-amber-400" />
              </div>
              <div className="flex gap-1.5 flex-wrap">
                <span className="text-[10px] text-gray-400 w-full">Fachbereich (Reihe):</span>
                {categories.map((s) => (
                  <button key={s.key} onClick={() => updateSequence(fb.seqId, {
                    subjectArea: parentSeq.subjectArea === s.key ? undefined : s.key as SubjectArea
                  })}
                    className={`px-1.5 py-0.5 rounded text-[8px] font-medium border cursor-pointer ${parentSeq.subjectArea === s.key ? 'text-gray-200' : 'text-gray-500 border-gray-700'}`}
                    style={{
                      background: parentSeq.subjectArea === s.key ? s.color + '30' : 'transparent',
                      ...(parentSeq.subjectArea === s.key ? { borderColor: s.color } : {}),
                    }}>
                    {s.label}
                  </button>
                ))}
              </div>
              <div>
                <label className="text-[10px] text-gray-400">Notizen (Reihe)</label>
                <textarea value={parentSeq.notes || ''} onChange={(e) => updateSequence(fb.seqId, { notes: e.target.value || undefined })}
                  rows={2} className="w-full bg-slate-700/50 text-slate-200 border border-slate-600 rounded px-2 py-1 text-[11px] outline-none focus:border-blue-400 resize-y" />
              </div>
              {/* SOL auf Reihen-Ebene */}
              <div className="border-t border-slate-700 pt-1.5 mt-1">
                <div className="flex items-center gap-2 mb-1">
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input type="checkbox" checked={!!parentSeq.sol?.enabled}
                      onChange={(e) => updateSequence(fb.seqId, {
                        sol: { ...parentSeq.sol, enabled: e.target.checked } as any
                      })}
                      className="accent-emerald-500 w-3 h-3" />
                    <span className="text-[9px] text-gray-300 font-medium">📚 SOL (Reihe)</span>
                  </label>
                  {solTotal.count > 0 && (
                    <span className="text-[8px] px-1.5 py-0.5 rounded bg-emerald-900/40 text-emerald-300 border border-emerald-700/50"
                      title={`SOL-Total: ${solTotal.count} Einträge aus ${parentSeqForSol?.blocks.reduce((n, b) => n + b.weeks.length, 0) || 0} Lektionen`}>
                      Σ {solTotal.formatted || `${solTotal.count}×`}
                    </span>
                  )}
                </div>
                {parentSeq.sol?.enabled && (
                  <div className="space-y-1 pl-0.5">
                    <div>
                      <label className="text-[10px] text-gray-400">SOL-Thema</label>
                      <input value={parentSeq.sol?.topic || ''} onChange={(e) => updateSequence(fb.seqId, {
                        sol: { ...parentSeq.sol, enabled: true, topic: e.target.value || undefined }
                      })}
                        placeholder="SOL-Thema…"
                        className="w-full bg-slate-700/50 text-slate-200 border border-slate-600 rounded px-2 py-1 text-[11px] outline-none focus:border-emerald-400" />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-400">Beschreibung / Auftrag</label>
                      <textarea value={parentSeq.sol?.description || ''} onChange={(e) => updateSequence(fb.seqId, {
                        sol: { ...parentSeq.sol, enabled: true, description: e.target.value || undefined }
                      })}
                        placeholder="SOL-Auftrag…" rows={2}
                        className="w-full bg-slate-700/50 text-slate-200 border border-slate-600 rounded px-2 py-1 text-[11px] outline-none focus:border-emerald-400 resize-y" />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-400">Gesamtdauer</label>
                      <input value={parentSeq.sol?.duration || ''} onChange={(e) => updateSequence(fb.seqId, {
                        sol: { ...parentSeq.sol, enabled: true, duration: e.target.value || undefined }
                      })}
                        placeholder="z.B. 4h, 2 Wochen…"
                        className="w-full bg-slate-700/50 text-slate-200 border border-slate-600 rounded px-2 py-1 text-[11px] outline-none focus:border-emerald-400" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Save + Delete buttons */}
          <div className="flex justify-between pt-0.5">
            <div className="flex gap-1">
              <button onClick={() => {
                const store = usePlannerStore.getState();
                store.archiveBlock(fb.seqId, fb.blockIndex, undefined);
                // Brief feedback
                const btn = document.activeElement as HTMLButtonElement;
                if (btn) { btn.textContent = '✓ Gespeichert'; setTimeout(() => { btn.textContent = '📥 In Sammlung'; }, 1200); }
              }} className="text-[10px] text-amber-400 hover:text-amber-300 cursor-pointer px-1" title="Unterrichtseinheit in Sammlung archivieren">
                📥 In Sammlung
              </button>
              {fb.totalBlocks > 1 && (
                <button onClick={() => {
                  const store = usePlannerStore.getState();
                  store.archiveSequence(fb.seqId, undefined);
                  const btn = document.activeElement as HTMLButtonElement;
                  if (btn) { btn.textContent = '✓ Gespeichert'; setTimeout(() => { btn.textContent = '📥 Reihe → Sammlung'; }, 1200); }
                }} className="text-[10px] text-amber-400 hover:text-amber-300 cursor-pointer px-1" title="Ganze Reihe in Sammlung archivieren">
                  📥 Reihe → Sammlung
                </button>
              )}
            </div>
            <button onClick={() => {
              if (confirm(`Sequenz "${block.label || block.topicMain || `Block ${fb.blockIndex + 1}`}" auflösen? (UEs bleiben erhalten)`)) {
                removeBlockFromSequence(fb.seqId, fb.blockIndex);
              }
            }} className="text-[10px] text-amber-400 hover:text-amber-300 cursor-pointer px-1" title="Gruppierung entfernen, UEs behalten">🔗 Auflösen</button>
            <button onClick={() => {
              if (confirm(`Sequenz "${block.label || block.topicMain || `Block ${fb.blockIndex + 1}`}" + alle UEs komplett löschen?`)) {
                usePlannerStore.getState().removeBlockWithLessons(fb.seqId, fb.blockIndex);
              }
            }} className="text-[10px] text-red-400 hover:text-red-300 cursor-pointer px-1" title="Sequenz + alle UEs löschen">🗑 Komplett entfernen</button>
          </div>
        </div>
      )}
    </div>
  );
}


// Get unique classes from courses, preserving order
function getUniqueClasses(courses: Course[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const c of courses) {
    if (!seen.has(c.cls)) { seen.add(c.cls); result.push(c.cls); }
  }
  return result;
}

// Get course types for a class
function getCourseTypesForClass(cls: string, courses: Course[]): { typ: string; courseIds: string[] }[] {
  const typMap = new Map<string, string[]>();
  for (const c of courses) {
    if (c.cls !== cls) continue;
    const key = c.typ;
    if (!typMap.has(key)) typMap.set(key, []);
    typMap.get(key)!.push(c.id);
  }
  return [...typMap.entries()].map(([typ, courseIds]) => ({ typ, courseIds }));
}

export function SequencePanel({ embedded = false }: { embedded?: boolean }) {
  const {
    sequences, sequencePanelOpen, setSequencePanelOpen,
    addSequence, addBlockToSequence, editingSequenceId, setEditingSequenceId,
  } = usePlannerStore();
  const { courses: COURSES, getLinkedCourseIds, categories } = usePlannerData();

  const [filterClass, setFilterClass] = useState<string>('ALL');
  const [showNewForm, setShowNewForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCourseId, setNewCourseId] = useState(COURSES[0]?.id || '');
  // T10: Collection import state
  const [showCollectionImport, setShowCollectionImport] = useState(false);
  const [pendingImportItem, setPendingImportItem] = useState<CollectionItem | null>(null);
  const [importStartWeek, setImportStartWeek] = useState('');
  const [importCourseId, setImportCourseId] = useState(COURSES[0]?.id || '');

  if (!embedded && !sequencePanelOpen) return null;

  const uniqueClasses = getUniqueClasses(COURSES);

  // Group sequences by class → course type → subject area


  // Subject area color helper
  const saColor = (sa?: SubjectArea) => sa ? (SUBJECT_AREA_COLORS[sa] || {}).bg || 'var(--bg-secondary)' : 'var(--bg-secondary)';
  const saFg = (sa?: SubjectArea) => sa ? (SUBJECT_AREA_COLORS[sa] || {}).fg || 'var(--text-muted)' : 'var(--text-muted)';

  const handleCreateSequence = () => {
    if (!newTitle.trim() || !newCourseId) return;
    const course = COURSES.find(c => c.id === newCourseId);
    const autoColor: Record<string, string> = { SF: '#16a34a', EWR: '#d97706', IN: '#0ea5e9', KS: '#7c3aed', EF: '#ec4899' };
    const linkedIds = getLinkedCourseIds(newCourseId);
    // Use multi-selection weeks if they match the course (v3.76 #9)
    const store = usePlannerStore.getState();
    const selWeeks = store.multiSelection
      .filter(k => k.endsWith(`-${newCourseId}`))
      .map(k => k.split('-').slice(0, -1).join('-'));
    const seqId = addSequence({
      courseId: newCourseId,
      courseIds: linkedIds.length > 1 ? linkedIds : undefined,
      title: newTitle.trim(),
      blocks: [],
      color: course ? autoColor[course.typ] || '#16a34a' : '#16a34a',
    });
    // Auto-add first block with selected weeks (or empty)
    addBlockToSequence(seqId, { weeks: selWeeks, label: newTitle.trim() });
    // Auto-create placeholder lessons for assigned weeks (v3.76 #9)
    if (course && selWeeks.length > 0) {
      store.pushUndo();
      for (const w of selWeeks) {
        const existing = store.weekData.find(wd => wd.w === w)?.lessons[course.col];
        if (!existing?.title) {
          store.updateLesson(w, course.col, { title: 'UE', type: 1 });
        }
      }
    }
    setEditingSequenceId(`${seqId}-0`);
    setNewTitle(''); setShowNewForm(false);
  };

  // T10: Handle import from collection with start-KW auto-place (T11)
  const handleCollectionImport = () => {
    if (!pendingImportItem || !importStartWeek || !importCourseId) return;
    const store = usePlannerStore.getState();
    const allWeekOrder = store.weekData.map(w => w.w);
    // Total weeks needed from collection item
    const totalNeeded = pendingImportItem.units.reduce((n, u) => n + Math.max(u.lessonTitles.length, 1), 0);
    // Find available weeks from start KW
    const available = store.getAvailableWeeks(importCourseId, importStartWeek, allWeekOrder);
    const targetWeeks = available.slice(0, totalNeeded);
    if (targetWeeks.length === 0) { alert('Keine verfügbaren Wochen ab dieser KW gefunden.'); return; }
    store.pushUndo();
    const seqId = store.importFromCollection(pendingImportItem.id, importCourseId, {
      includeNotes: true, includeMaterialLinks: true, targetWeeks,
    });
    if (seqId) {
      setEditingSequenceId(`${seqId}-0`);
    }
    setPendingImportItem(null);
    setShowCollectionImport(false);
    setImportStartWeek('');
  };

  // === Flat block listing ===
  // Collect all blocks from all sequences, enriched with parent sequence info
  type FlatBlock = {
    seqId: string;
    seqTitle: string;
    seqColor?: string;
    seqSubjectArea?: SubjectArea;
    block: SequenceBlock;
    blockIndex: number;
    totalBlocks: number;
    courseId: string;
    courseIds?: string[];
    cls: string;
    typ: string;
  };

  const flatBlocks: FlatBlock[] = [];
  for (const seq of sequences) {
    const course = COURSES.find(c => c.id === seq.courseId);
    if (!course) continue;
    // Apply class filter
    if (filterClass !== 'ALL' && course.cls !== filterClass) continue;
    for (let i = 0; i < seq.blocks.length; i++) {
      flatBlocks.push({
        seqId: seq.id,
        seqTitle: seq.title,
        seqColor: seq.color,
        seqSubjectArea: seq.subjectArea,
        block: seq.blocks[i],
        blockIndex: i,
        totalBlocks: seq.blocks.length,
        courseId: seq.courseId,
        courseIds: seq.courseIds,
        cls: course.cls,
        typ: course.typ,
      });
    }
  }

  // Group by class → subject area
  const groupedByClass = new Map<string, Map<string, FlatBlock[]>>();
  for (const fb of flatBlocks) {
    const sa = fb.block.subjectArea || fb.seqSubjectArea || 'ANDERE';
    if (!groupedByClass.has(fb.cls)) groupedByClass.set(fb.cls, new Map());
    const saMap = groupedByClass.get(fb.cls)!;
    if (!saMap.has(sa)) saMap.set(sa, []);
    saMap.get(sa)!.push(fb);
  }

  const renderFlatBlocks = () => {
    const classes = filterClass === 'ALL' ? uniqueClasses : [filterClass];
    return classes.map(cls => {
      const saMap = groupedByClass.get(cls);
      if (!saMap || saMap.size === 0) {
        if (filterClass !== cls && filterClass !== 'ALL') return null;
        return (
          <div key={cls} className="space-y-1">
            <div className="text-[10px] font-bold text-gray-300 px-1">{cls}</div>
            <div className="text-[9px] text-gray-500 ml-2 italic">Keine Sequenzen</div>
          </div>
        );
      }
      return (
        <div key={cls} className="space-y-2">
          <div className="text-[10px] font-bold text-gray-300 px-1 flex items-center gap-2">
            <span>{cls}</span>
            {getCourseTypesForClass(cls, COURSES).map(ct => {
              const course = COURSES.find(c => c.id === ct.courseIds[0]);
              return (
                <span key={ct.typ} className="text-[8px] px-1 py-px rounded bg-slate-800/80 text-gray-400 font-normal">
                  {ct.typ} {course?.day}{ct.courseIds.length > 1 ? `+${COURSES.find(c => c.id === ct.courseIds[1])?.day}` : ''}
                </span>
              );
            })}
          </div>
          {[...saMap.entries()].map(([sa, blocks]) => {
            // Sort: active (editing) block first, but exclude it from the list if it's pinned above
            const filtered = editingSequenceId
              ? blocks.filter(fb => `${fb.seqId}-${fb.blockIndex}` !== editingSequenceId)
              : blocks;
            if (filtered.length === 0) return null;
            return (
            <div key={sa} className="ml-1">
              {sa !== 'ANDERE' && (
                <div className="text-[8px] font-medium px-1 py-0.5 mb-1 rounded flex items-center gap-1"
                  style={{ color: saFg(sa as SubjectArea), background: saColor(sa as SubjectArea) + '15' }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: saFg(sa as SubjectArea) }} />
                  {categories.find(s => s.key === sa)?.label || sa}
                </div>
              )}
              <div className="space-y-1">
                {filtered.map((fb) => (
                  <FlatBlockCard key={`${fb.seqId}-${fb.blockIndex}`} fb={fb} />
                ))}
              </div>
            </div>
            );
          })}
        </div>
      );
    });
  };

  const content = (
    <>
      {/* Class filter buttons */}
      <div className="px-3 py-1.5 border-b border-slate-700/50 flex gap-1 flex-wrap shrink-0">
        <button onClick={() => setFilterClass('ALL')}
          className={`px-1.5 py-0.5 rounded text-[8px] border cursor-pointer ${filterClass === 'ALL' ? 'bg-blue-500/20 border-blue-500 text-blue-300' : 'border-gray-600 text-gray-400'}`}>
          Alle
        </button>
        {uniqueClasses.map((cls) => (
          <button key={cls} onClick={() => setFilterClass(cls)}
            className={`px-1.5 py-0.5 rounded text-[8px] border cursor-pointer ${filterClass === cls ? 'bg-blue-500/20 border-blue-500 text-blue-300' : 'border-gray-600 text-gray-400'}`}>
            {cls}
          </button>
        ))}
      </div>

      {/* v3.91 N2: Ein einziger Scroll-Container für alles (aktive Sequenz + Blockliste) */}
      <div className="flex-1 min-h-0 overflow-y-auto px-3 py-2 pb-8 space-y-3" style={{ overscrollBehavior: 'contain' }}>
        {/* Active sequence pinned at top — inside scroll container */}
        {editingSequenceId && (() => {
          const activeFb = flatBlocks.find(fb => `${fb.seqId}-${fb.blockIndex}` === editingSequenceId);
          if (!activeFb) return null;
          return (
            <div className="pt-1 pb-2 mb-2 border-b border-purple-500/30 bg-slate-900/50 rounded max-h-[40vh] overflow-y-auto -mx-3 px-3">
              <div className="text-[8px] text-purple-400 font-medium mb-1">▶ Aktive Sequenz</div>
              <FlatBlockCard fb={activeFb} />
            </div>
          );
        })()}
        {/* New sequence form — inline at top */}
        <div>
          {showNewForm ? (
            <div className="space-y-2 bg-slate-800/50 rounded p-3 border border-slate-600/50 w-full">
              <input autoFocus value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleCreateSequence(); if (e.key === 'Escape') setShowNewForm(false); }}
                placeholder="Titel der Sequenz…"
                className="w-full bg-slate-800 text-slate-200 border border-slate-600 rounded px-2.5 py-2 text-[12px] outline-none focus:border-blue-400" />
              <select value={newCourseId} onChange={(e) => {
                  setNewCourseId(e.target.value);
                  const course = COURSES.find(c => c.id === e.target.value);
                  if (course && !newTitle.trim()) setNewTitle(`${course.cls} – `);
                }}
                className="w-full bg-slate-800 text-slate-200 border border-slate-600 rounded px-2.5 py-2 text-[12px] outline-none focus:border-blue-400">
                {COURSES.map((c) => (
                  <option key={c.id} value={c.id}>{c.cls} – {c.typ} {c.day} {c.from}–{c.to} ({c.les}L)</option>
                ))}
              </select>
              <div className="flex gap-1 justify-end">
                <button onClick={() => setShowNewForm(false)}
                  className="px-2.5 py-1 rounded text-[10px] text-gray-400 border border-gray-700 cursor-pointer hover:text-gray-200">Abbrechen</button>
                <button onClick={handleCreateSequence}
                  className="px-2.5 py-1 rounded text-[10px] text-white bg-green-600 border border-green-500 cursor-pointer hover:bg-green-500">Erstellen</button>
              </div>
            </div>
          ) : showCollectionImport ? (
            /* T10: Collection import flow */
            <div className="space-y-2 bg-amber-900/10 rounded p-3 border border-amber-700/30 w-full">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-amber-400 font-medium">📥 Aus Sammlung importieren</span>
                <button onClick={() => { setShowCollectionImport(false); setPendingImportItem(null); }}
                  className="text-gray-500 hover:text-gray-300 cursor-pointer text-[10px]">✕</button>
              </div>
              {!pendingImportItem ? (
                /* Step 1: Pick collection item */
                <div className="bg-slate-800/50 rounded max-h-48 overflow-y-auto">
                  <CollectionPickerList
                    onSelect={(item) => {
                      setPendingImportItem(item);
                      setImportCourseId(COURSES[0]?.id || '');
                      // Default start week: first available in weekData
                      const firstWeek = usePlannerStore.getState().weekData[0]?.w || '';
                      setImportStartWeek(firstWeek);
                    }}
                  />
                </div>
              ) : (
                /* Step 2: Pick course + start KW */
                <div className="space-y-1.5">
                  <div className="text-[9px] text-gray-300">
                    <span className="font-medium">{pendingImportItem.title}</span>
                    <span className="text-gray-500 ml-1">
                      ({pendingImportItem.units.reduce((n, u) => n + Math.max(u.lessonTitles.length, 1), 0)} Lektionen)
                    </span>
                  </div>
                  <div>
                    <label className="text-[8px] text-gray-400">Kurs</label>
                    <select value={importCourseId} onChange={(e) => setImportCourseId(e.target.value)}
                      className="w-full bg-slate-800 text-slate-200 border border-slate-600 rounded px-2.5 py-2 text-[12px] outline-none focus:border-amber-400">
                      {COURSES.map((c) => (
                        <option key={c.id} value={c.id}>{c.cls} – {c.typ} {c.day} {c.from}–{c.to}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[8px] text-gray-400">Ab welcher KW platzieren?</label>
                    <select value={importStartWeek} onChange={(e) => setImportStartWeek(e.target.value)}
                      className="w-full bg-slate-800 text-slate-200 border border-slate-600 rounded px-2.5 py-2 text-[12px] outline-none focus:border-amber-400">
                      {usePlannerStore.getState().weekData.map(w => (
                        <option key={w.w} value={w.w}>KW {w.w}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-1 justify-end">
                    <button onClick={() => setPendingImportItem(null)}
                      className="px-2.5 py-1 rounded text-[10px] text-gray-400 border border-gray-700 cursor-pointer hover:text-gray-200">← Zurück</button>
                    <button onClick={handleCollectionImport}
                      className="px-2.5 py-1 rounded text-[10px] text-white bg-amber-600 border border-amber-500 cursor-pointer hover:bg-amber-500">Importieren</button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex gap-1">
              <button onClick={() => setShowNewForm(true)}
                className="flex-1 px-2 py-1.5 rounded text-[10px] text-green-400 border border-dashed border-green-700 cursor-pointer hover:bg-green-900/20 hover:text-green-300">
                + Neue Sequenz
              </button>
              <button onClick={() => { setShowCollectionImport(true); setPendingImportItem(null); }}
                className="px-2 py-1.5 rounded text-[10px] text-amber-400 border border-dashed border-amber-700 cursor-pointer hover:bg-amber-900/20 hover:text-amber-300">
                📥 Sammlung
              </button>
            </div>
          )}
        </div>
        {renderFlatBlocks()}
        {flatBlocks.length === 0 && sequences.length === 0 && (
          <div className="text-[10px] text-gray-400 text-center py-4">Noch keine Sequenzen erstellt</div>
        )}
      </div>
    </>
  );

  if (embedded) {
    return <div className="flex flex-col flex-1 min-h-0">{content}</div>;
  }

  return (
    <div className="fixed right-0 top-0 bottom-0 w-[320px] border-l border-slate-600 z-[65] flex flex-col shadow-[-4px_0_16px_rgba(0,0,0,0.4)]" style={{ background: 'var(--panel-bg)', overscrollBehavior: 'contain' }} onWheel={(e) => e.stopPropagation()}>
      <div className="px-3 py-2 border-b border-slate-600 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-gray-200">▧ Sequenzen</span>
          <span className="text-[9px] text-gray-400">{sequences.length}</span>
        </div>
        <button onClick={() => setSequencePanelOpen(false)}
          className="text-gray-400 hover:text-gray-300 cursor-pointer text-xs px-1">✕</button>
      </div>
      {content}
    </div>
  );
}
