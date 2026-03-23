import { useState, useRef, useEffect } from 'react';
import type { Course } from '../types';
import { getSequenceInfoFromStore } from '../utils/colors';
import { usePlannerStore } from '../store/plannerStore';
import { getEffectiveCategorySubtype, getCategoryLabel, getSubtypeLabel, CATEGORIES } from './DetailPanel';
import { FACHBEREICH_COLORS_PREVIEW } from './InlineEdit';

export function HoverPreview({ week, col, courses, courseIndex, totalCourses }: { week: string; col: number; courses: Course[]; courseIndex: number; totalCourses: number }) {
  const { lessonDetails, weekData, sequences } = usePlannerStore();
  const previewRef = useRef<HTMLDivElement>(null);
  const [showAbove, setShowAbove] = useState(false);
  const key = `${week}-${col}`;
  const detail = lessonDetails[key];
  const weekEntry = weekData.find(w => w.w === week);
  const entry = weekEntry?.lessons[col];
  const course = courses.find(c => c.col === col);
  if (!entry || !course) return null;

  const seq = getSequenceInfoFromStore(course.id, week, sequences);
  const parentBlock = seq ? (() => {
    const parentSeq = sequences.find(s => s.id === seq.sequenceId);
    return parentSeq?.blocks.find(b => b.weeks.includes(week));
  })() : null;

  // Inherited values
  const effectiveFachbereich = detail?.fachbereich || parentBlock?.fachbereich;
  const effectiveTopicMain = detail?.thema || parentBlock?.thema;
  const effectiveTopicSub = detail?.unterthema || parentBlock?.unterthema;
  const accentColor = effectiveFachbereich ? FACHBEREICH_COLORS_PREVIEW[effectiveFachbereich] || '#64748b' : '#64748b';

  // Smart positioning: show left if course is in the right third of columns
  const showLeft = courseIndex > totalCourses * 0.6;

  // Vertical positioning: check on mount if parent cell is near viewport bottom
  useEffect(() => {
    if (previewRef.current?.parentElement) {
      const rect = previewRef.current.parentElement.getBoundingClientRect();
      setShowAbove(rect.bottom > window.innerHeight * 0.65);
    }
  }, []);

  // Check if there's meaningful content beyond title/topic
  const hasNotes = !!(detail?.notes);
  const hasDescription = !!(detail?.description);
  const hasMaterialLinks = !!(detail?.materialLinks && detail.materialLinks.length > 0);
  const hasSol = !!(detail?.sol?.enabled);
  const hasCurriculumGoal = !!(detail?.curriculumGoal);
  const hasExtras = hasNotes || hasDescription || hasMaterialLinks || hasSol || hasCurriculumGoal;

  return (
    <div
      ref={previewRef}
      className="absolute bg-slate-800 border border-slate-600 rounded-lg shadow-2xl z-[80] pointer-events-none"
      style={{
        width: hasExtras ? 280 : 224,
        ...(showAbove
          ? { bottom: '100%', top: 'auto', marginBottom: 4 }
          : { top: 0 }),
        ...(showLeft
          ? { right: '100%', left: 'auto', marginRight: 4 }
          : { left: '100%', right: 'auto', marginLeft: 4 }),
      }}
    >
      {/* Colored header bar */}
      <div className="rounded-t-lg px-2.5 py-1.5" style={{ background: accentColor + '20', borderBottom: `2px solid ${accentColor}40` }}>
        <div className="text-[12px] font-bold text-gray-200 leading-tight">{entry.title}</div>
        {effectiveTopicMain && (
          <div className="text-[11px] text-gray-400 mt-0.5">
            📌 {effectiveTopicMain}{effectiveTopicSub ? ` › ${effectiveTopicSub}` : ''}
          </div>
        )}
      </div>

      <div className="px-2.5 py-1.5">
        {/* Badges row */}
        <div className="flex flex-wrap gap-1 mb-1">
          {effectiveFachbereich && (
            <span className="text-[9px] px-1 py-px rounded border text-gray-300 font-medium"
              style={{ borderColor: accentColor + '60', background: accentColor + '15' }}>
              {effectiveFachbereich}
            </span>
          )}
          {(() => {
            const { category, subtype } = getEffectiveCategorySubtype(detail || {});
            const catDef = category ? CATEGORIES.find(c => c.key === category) : null;
            return <>
              {catDef && catDef.key !== 'LESSON' && (
                <span className="text-[9px] px-1 py-px rounded border border-gray-600 text-gray-400">{catDef.icon} {getCategoryLabel(catDef.key, false)}</span>
              )}
              {subtype && category && (
                <span className="text-[9px] px-1 py-px rounded border border-gray-600 text-gray-400">{getSubtypeLabel(category, subtype, false)}</span>
              )}
            </>;
          })()}
          {detail?.duration && (
            <span className="text-[9px] px-1 py-px rounded border border-gray-600 text-gray-400">⏱ {detail.duration}</span>
          )}
        </div>

        {/* Sequence info */}
        {seq && (() => {
          const parentSeq = sequences.find(s => s.id === seq.sequenceId);
          return (
            <div className="text-[9px] text-gray-500 mb-1">
              ▧ {seq.label} ({seq.index + 1}/{seq.total})
              {parentSeq?.sol?.enabled && <span className="text-emerald-500 ml-1" title={`SOL: ${parentSeq.sol.topic || ''} ${parentSeq.sol.duration || ''}`}>📚 SOL</span>}
            </div>
          );
        })()}

        {/* Curriculum goal */}
        {hasCurriculumGoal && (
          <div className="text-[9px] text-gray-500 mb-1 leading-relaxed" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            🎯 {detail!.curriculumGoal}
          </div>
        )}

        {/* Description */}
        {hasDescription && (
          <div className="text-[9px] text-gray-400 mb-1 leading-relaxed" style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {detail!.description}
          </div>
        )}

        {/* Notes — the main value-add, shown prominently */}
        {hasNotes && (
          <div className="mt-1 pt-1 border-t border-slate-700">
            <div className="text-[8px] font-semibold text-gray-500 uppercase tracking-wide mb-0.5">Notizen</div>
            <div className="text-[11px] text-gray-300 leading-relaxed whitespace-pre-line" style={{ display: '-webkit-box', WebkitLineClamp: 6, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {detail!.notes}
            </div>
          </div>
        )}

        {/* SOL details */}
        {hasSol && (
          <div className="text-[9px] text-gray-500 mt-1">
            📚 SOL{detail!.sol!.topic ? `: ${detail!.sol!.topic}` : ''}{detail!.sol!.duration ? ` (${detail!.sol!.duration})` : ''}
          </div>
        )}

        {/* Material links */}
        {hasMaterialLinks && (
          <div className="mt-1 pt-1 border-t border-slate-700 flex flex-wrap gap-1">
            {detail!.materialLinks!.slice(0, 4).map((link, i) => {
              const isLV = link.includes('learningview');
              const label = isLV ? 'LV' : link.replace(/^https?:\/\//, '').split('/')[0].slice(0, 20);
              return (
                <span key={i} className="text-[8px] px-1 py-px rounded bg-slate-700 text-gray-400">
                  📎 {label}
                </span>
              );
            })}
            {detail!.materialLinks!.length > 4 && (
              <span className="text-[8px] px-1 py-px text-gray-500">+{detail!.materialLinks!.length - 4}</span>
            )}
          </div>
        )}

        {/* Hint if no extras */}
        {!hasExtras && !seq && (
          <div className="text-[9px] text-gray-600 italic">Doppelklick für Details</div>
        )}
      </div>
    </div>
  );
}
