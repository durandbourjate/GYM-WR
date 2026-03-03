import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { CURRICULUM_GOALS, searchGoals } from '../data/curriculumGoals';
import type { CurriculumGoal } from '../data/curriculumGoals';
import type { SubjectArea } from '../types';
import { WR_CATEGORIES } from '../data/categories';

/** Dynamic color lookup — reads from WR_CATEGORIES instead of hardcoded map */
const AREA_COLORS: Record<string, string> = Object.fromEntries(WR_CATEGORIES.map(c => [c.key, c.color]));

interface CurriculumGoalPickerProps {
  value: string | undefined;
  onChange: (value: string) => void;
  subjectArea?: SubjectArea;
  goals?: CurriculumGoal[];
}

export function CurriculumGoalPicker({ value, onChange, subjectArea, goals }: CurriculumGoalPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [cycleFilter, setCycleFilter] = useState<1 | 2 | null>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Position dropdown above trigger using fixed positioning
  useLayoutEffect(() => {
    if (open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.top - 4, // 4px gap above trigger
        left: rect.left,
        width: rect.width,
      });
    }
  }, [open]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        dropdownRef.current && !dropdownRef.current.contains(target) &&
        triggerRef.current && !triggerRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const source = goals ?? CURRICULUM_GOALS;

  // Filter goals
  const filtered = (() => {
    let result: CurriculumGoal[];
    if (search.trim()) {
      result = searchGoals(search, subjectArea, source);
    } else if (subjectArea) {
      result = source.filter((g) => g.area === subjectArea);
    } else {
      result = [...source];
    }
    if (cycleFilter !== null) {
      result = result.filter((g) => g.cycle === cycleFilter);
    }
    return result;
  })();

  // Find currently selected goal
  const selectedGoal = source.find(
    (g) => g.id === value || `${g.id}: ${g.goal}` === value
  );

  const handleSelect = (goal: CurriculumGoal) => {
    onChange(`${goal.id}: ${goal.goal}`);
    setOpen(false);
    setSearch('');
  };

  const handleClear = () => {
    onChange('');
    setOpen(false);
  };

  return (
    <div className="relative">
      {/* Display / trigger area */}
      <div
        ref={triggerRef}
        className="w-full bg-slate-700 text-slate-200 border border-slate-600 rounded px-2 py-1 text-[10px] cursor-pointer hover:border-blue-400 transition-colors min-h-[28px] flex items-start gap-1"
        onClick={() => { setOpen(!open); setTimeout(() => inputRef.current?.focus(), 50); }}
      >
        {selectedGoal ? (
          <div className="flex-1">
            <span className="text-[8px] font-mono mr-1 px-1 py-px rounded"
              style={{ background: (AREA_COLORS[selectedGoal.area] || '#555') + '30', color: AREA_COLORS[selectedGoal.area] }}>
              {selectedGoal.id}
            </span>
            <span className="text-gray-200">{selectedGoal.goal}</span>
          </div>
        ) : value ? (
          <span className="text-gray-300 flex-1">{value}</span>
        ) : source.length === 0 ? (
          <span className="text-gray-600 flex-1 italic">Keine Lehrplanziele konfiguriert</span>
        ) : (
          <span className="text-gray-500 flex-1">Lehrplanziel wählen oder eingeben…</span>
        )}
        <span className="text-gray-500 text-[8px] shrink-0 mt-0.5">{open ? '▾' : '▸'}</span>
      </div>

      {/* Dropdown */}
      {open && dropdownPos && (
        <div
          ref={dropdownRef}
          className="fixed bg-slate-800 border border-slate-600 rounded shadow-xl z-[200] max-h-[300px] flex flex-col"
          style={{
            bottom: `${window.innerHeight - dropdownPos.top}px`,
            left: `${dropdownPos.left}px`,
            width: `${dropdownPos.width}px`,
          }}
        >
          {/* Search + filters */}
          <div className="p-1.5 border-b border-slate-700 space-y-1">
            <input
              ref={inputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') { setOpen(false); e.stopPropagation(); }
                if (e.key === 'Enter' && filtered.length === 1) { handleSelect(filtered[0]); }
              }}
              placeholder="Suchen… (Thema, Inhalt, ID)"
              className="w-full bg-slate-700 text-slate-200 border border-slate-600 rounded px-2 py-1 text-[10px] outline-none focus:border-blue-400"
            />
            <div className="flex gap-1 items-center">
              <span className="text-[8px] text-gray-500">Zyklus:</span>
              {([null, 1, 2] as const).map((c) => (
                <button
                  key={String(c)}
                  onClick={() => setCycleFilter(c)}
                  className={`px-1.5 py-px rounded text-[8px] border cursor-pointer transition-colors ${
                    cycleFilter === c
                      ? 'bg-blue-600/30 border-blue-500 text-blue-300'
                      : 'border-slate-600 text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {c === null ? 'Alle' : `Z${c}`}
                </button>
              ))}
              {value && (
                <button onClick={handleClear}
                  className="ml-auto text-[8px] text-red-400 hover:text-red-300 cursor-pointer">
                  ✕ Löschen
                </button>
              )}
            </div>
          </div>

          {/* Results list */}
          <div className="overflow-y-auto flex-1 p-1">
            {filtered.length === 0 ? (
              <div className="text-[9px] text-gray-500 p-2 text-center">
                Keine Treffer.
                {search.trim() && (
                  <button
                    onClick={() => { onChange(search.trim()); setOpen(false); setSearch(''); }}
                    className="block mx-auto mt-1 text-blue-400 hover:text-blue-300 cursor-pointer">
                    «{search}» als Freitext übernehmen
                  </button>
                )}
              </div>
            ) : (
              filtered.map((goal) => {
                const isSelected = selectedGoal?.id === goal.id;
                return (
                  <div
                    key={goal.id}
                    onClick={() => handleSelect(goal)}
                    className={`p-1.5 rounded cursor-pointer transition-colors mb-0.5 ${
                      isSelected
                        ? 'bg-blue-600/20 border border-blue-500/50'
                        : 'hover:bg-slate-700 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-[8px] font-mono px-1 py-px rounded shrink-0"
                        style={{ background: (AREA_COLORS[goal.area] || '#555') + '20', color: AREA_COLORS[goal.area] }}>
                        {goal.id}
                      </span>
                      <span className="text-[8px] text-gray-500 shrink-0">Z{goal.cycle}</span>
                      <span className="text-[9px] font-medium text-gray-200 truncate">{goal.topic}</span>
                      {goal.semester && (
                        <span className="text-[7px] text-gray-500 shrink-0 ml-auto">{goal.semester}</span>
                      )}
                    </div>
                    <div className="text-[9px] text-gray-400 mt-0.5 leading-tight">{goal.goal}</div>
                    <div className="text-[8px] text-gray-600 mt-0.5 truncate">
                      {goal.contents.slice(0, 3).join(' · ')}{goal.contents.length > 3 ? ' …' : ''}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Freitext fallback */}
          {search.trim() && filtered.length > 0 && (
            <div className="border-t border-slate-700 p-1.5">
              <button
                onClick={() => { onChange(search.trim()); setOpen(false); setSearch(''); }}
                className="text-[8px] text-gray-500 hover:text-gray-300 cursor-pointer">
                ↳ «{search}» als Freitext übernehmen
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
