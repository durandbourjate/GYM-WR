import { useState, useRef, useEffect, useMemo } from 'react';
import type { SolDetails, Course } from '../../types';
import { usePlannerStore } from '../../store/plannerStore';

// === Duration presets (dynamic based on standard lesson duration) ===
export function getDurationPresets(baseDuration: number = 45): { key: string; label: string }[] {
  const d = baseDuration || 45;
  return [
    { key: `${d} min`, label: `${d} min` },
    { key: `${d * 2} min`, label: `${d * 2} min` },
    { key: `${d * 3} min`, label: `${d * 3} min` },
    { key: 'Halbtag', label: 'Halbtag' },
    { key: 'Ganztag', label: 'Ganztag' },
  ];
}

// === Components ===

export function PillSelect<T extends string>({
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
            className="px-1.5 py-0.5 rounded text-[11px] font-medium border cursor-pointer transition-all"
            style={{
              background: active ? (color || '#3b82f6') + '40' : 'transparent',
              borderColor: active ? (color || '#3b82f6') : '#4b5563',
              color: active ? (color || '#3b82f6') : '#9ca3af',
            }}>
            {icon && <span className="mr-0.5">{icon}</span>}{label}
          </button>
        );
      })}
    </div>
  );
}

export function DurationSelector({ value, onChange, baseDuration = 45, compact }: { value?: string; onChange: (v: string | undefined) => void; baseDuration?: number; compact?: boolean }) {
  const presets = useMemo(() => {
    const all = getDurationPresets(baseDuration);
    // compact mode: only 1x, 2x base + Andere (for SOL)
    return compact ? all.slice(0, 2) : all;
  }, [baseDuration, compact]);
  const [customMode, setCustomMode] = useState(false);
  const [customValue, setCustomValue] = useState('');
  const isPreset = value && presets.some(p => p.key === value);
  const isCustom = value && !isPreset;

  return (
    <div className="flex flex-wrap gap-1 items-center">
      {presets.map((preset) => (
        <button key={preset.key}
          onClick={() => onChange(value === preset.key ? undefined : preset.key)}
          className={`px-1.5 py-0.5 rounded text-[11px] font-medium border cursor-pointer transition-all ${
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
            className="bg-slate-700 text-slate-200 border border-slate-600 rounded px-1.5 py-0.5 text-[11px] outline-none focus:border-indigo-400 w-20" />
          {isCustom && (
            <button onClick={() => onChange(undefined)} className="text-[11px] text-gray-400 cursor-pointer hover:text-red-400">✕</button>
          )}
        </div>
      ) : (
        <button onClick={() => setCustomMode(true)}
          className="px-1.5 py-0.5 rounded text-[11px] border border-dashed border-gray-600 text-gray-400 hover:text-gray-300 cursor-pointer">
          Andere…
        </button>
      )}
    </div>
  );
}

export function SolSection({ sol, onChange }: { sol?: SolDetails; onChange: (s: SolDetails) => void }) {
  const enabled = sol?.enabled ?? false;
  const update = (patch: Partial<SolDetails>) => onChange({ ...sol, enabled: true, ...patch });

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange({ ...sol, enabled: !enabled, topic: sol?.topic, description: sol?.description, materialLinks: sol?.materialLinks, duration: sol?.duration })}
          className={`px-2 py-0.5 rounded text-[11px] font-medium border cursor-pointer transition-all ${
            enabled ? 'bg-green-900/40 border-green-500 text-green-300' : 'border-gray-600 text-gray-400 hover:border-green-600 hover:text-green-400'
          }`}
        >
          🎒 SOL{enabled ? ' ✓' : ''}
        </button>
        {enabled && sol?.duration && <span className="text-[9px] text-gray-400">{sol.duration}</span>}
      </div>
      {enabled && (
        <div className="pl-2 border-l-2 border-purple-500/30 space-y-1.5">
          <div>
            <label className="text-[9px] text-gray-400 mb-0.5 block">SOL-Thema</label>
            <input value={sol?.topic || ''} onChange={(e) => update({ topic: e.target.value })}
              placeholder="SOL-Thema…"
              className="w-full bg-slate-700 text-slate-200 border border-slate-600 rounded px-2 py-0.5 text-[11px] outline-none focus:border-purple-400" />
          </div>
          <div>
            <label className="text-[9px] text-gray-400 mb-0.5 block">SOL-Dauer</label>
            <DurationSelector value={sol?.duration} onChange={(v) => update({ duration: v })} compact />
          </div>
          <div>
            <label className="text-[9px] text-gray-400 mb-0.5 block">SOL-Beschreibung</label>
            <textarea value={sol?.description || ''} onChange={(e) => update({ description: e.target.value })}
              placeholder="Beschreibung, Auftrag…" rows={2}
              className="w-full bg-slate-700 text-slate-200 border border-slate-600 rounded px-2 py-0.5 text-[11px] outline-none focus:border-purple-400 resize-y" />
          </div>
          <div>
            <label className="text-[9px] text-gray-400 mb-0.5 block">SOL-Material</label>
            <MaterialLinks links={sol?.materialLinks || []} onChange={(links) => update({ materialLinks: links })} />
          </div>
        </div>
      )}
    </div>
  );
}

export function MaterialLinks({ links, onChange }: { links: string[]; onChange: (links: string[]) => void }) {
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
            className="text-[11px] text-indigo-400 hover:text-indigo-300 truncate flex-1">
            {link.length > 50 ? link.slice(0, 50) + '…' : link}
          </a>
          <button onClick={() => onChange(links.filter((_, j) => j !== i))}
            className="text-[11px] text-red-400 opacity-0 group-hover:opacity-100 cursor-pointer">✕</button>
        </div>
      ))}
      {adding ? (
        <div className="flex gap-1">
          <input autoFocus value={newLink} onChange={(e) => setNewLink(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setAdding(false); }}
            placeholder="URL eingeben…"
            className="flex-1 bg-slate-700 text-slate-200 border border-slate-600 rounded px-1.5 py-0.5 text-[11px] outline-none focus:border-indigo-400" />
          <button onClick={handleAdd} className="text-[11px] text-green-400 cursor-pointer">✓</button>
          <button onClick={() => setAdding(false)} className="text-[11px] text-gray-400 cursor-pointer">✕</button>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} className="text-[11px] text-gray-400 hover:text-gray-300 cursor-pointer">
          + Link hinzufügen
        </button>
      )}
    </div>
  );
}

/* Add to Sequence button — shown when lesson is not part of any sequence */
export function AddToSequenceButton({ week, course }: { week: string; course: Course }) {
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
        className="text-[9px] px-1 py-px rounded border border-dashed border-gray-600 text-gray-400 hover:text-gray-300 hover:border-gray-400 cursor-pointer"
        title="Zu Sequenz hinzufügen"
      >+ Sequenz</button>
      {open && (
        <div ref={menuRef} className="absolute left-0 top-full mt-1 z-[90] bg-slate-800 border border-slate-600 rounded-lg shadow-xl py-1 w-52">
          <button onClick={handleNew}
            className="w-full px-3 py-1.5 text-left text-[12px] text-indigo-300 hover:bg-slate-700 cursor-pointer">
            ✨ Neue Sequenz erstellen
          </button>
          {matching.length > 0 && <hr className="border-slate-700 my-0.5" />}
          {matching.map(seq => (
            seq.blocks.map((block, bi) => (
              <button key={`${seq.id}-${bi}`}
                onClick={() => handleAddToExisting(seq.id, bi)}
                className="w-full px-3 py-1.5 text-left text-[12px] text-gray-300 hover:bg-slate-700 cursor-pointer flex items-center gap-1.5"
                disabled={block.weeks.includes(week)}>
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: seq.color || '#16a34a' }} />
                <span className="truncate">{block.label}</span>
                {block.weeks.includes(week) && <span className="text-[9px] text-gray-500 ml-auto">bereits</span>}
              </button>
            ))
          ))}
        </div>
      )}
    </span>
  );
}
