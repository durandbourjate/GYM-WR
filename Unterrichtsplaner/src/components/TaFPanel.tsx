import { useState, useEffect } from 'react';
import { usePlannerStore } from '../store/plannerStore';
import { WEEKS } from '../data/weeks';
import type { TaFPhase } from '../types';

const PHASE_COLORS = ['#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#3b82f6', '#ec4899'];
const allWeeks = WEEKS.map(w => w.w);

// Preset: SJ 25/26 Hofwil (v3.80 C7)
const HOFWIL_PRESET: Omit<TaFPhase, 'id'>[] = [
  { name: 'Phase 1', startWeek: '33', endWeek: '44', color: '#8b5cf6', absentClasses: [], presentClasses: [] },
  { name: 'Phase 2', startWeek: '47', endWeek: '04', color: '#f59e0b', absentClasses: [], presentClasses: [] },
  { name: 'Phase 3', startWeek: '07', endWeek: '12', color: '#10b981', absentClasses: [], presentClasses: [] },
  { name: 'Phase 4', startWeek: '17', endWeek: '24', color: '#ef4444', absentClasses: [], presentClasses: [] },
];

/** Einbettbare TaF-Phasen-Verwaltung (für SettingsPanel) */
export function TaFSection() {
  const { tafPhases, addTaFPhase, updateTaFPhase, deleteTaFPhase } = usePlannerStore();
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newStart, setNewStart] = useState(allWeeks[0]);
  const [newEnd, setNewEnd] = useState(allWeeks[5]);
  const [newColor, setNewColor] = useState(PHASE_COLORS[0]);

  const handleAdd = () => {
    if (!newName.trim()) return;
    addTaFPhase({
      name: newName.trim(),
      startWeek: newStart,
      endWeek: newEnd,
      color: newColor,
      absentClasses: [],
      presentClasses: [],
    });
    setNewName('');
    setShowNew(false);
  };

  // Import from JSON (v3.80 C7)
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        const arr = Array.isArray(data) ? data : data.phases || [];
        if (arr.length === 0) { alert('Keine gültigen Phasen gefunden.'); return; }
        const existingKeys = new Set(tafPhases.map(p => `${p.name}|${p.startWeek}`));
        const unique = arr.filter((p: any) => !existingKeys.has(`${p.name}|${p.startKW || p.startWeek}`));
        const dupes = arr.length - unique.length;
        if (unique.length === 0) { alert(`Alle ${arr.length} Phasen sind bereits vorhanden.`); return; }
        const msg = dupes > 0 ? `${unique.length} importieren, ${dupes} übersprungen.` : `${unique.length} Phasen importieren?`;
        if (confirm(msg)) {
          for (const p of unique) {
            addTaFPhase({
              name: p.name || '',
              startWeek: String(p.startKW || p.startWeek || ''),
              endWeek: String(p.endKW || p.endWeek || ''),
              color: p.color || PHASE_COLORS[tafPhases.length % PHASE_COLORS.length],
              absentClasses: p.absentClasses || [],
              presentClasses: p.presentClasses || [],
            });
          }
        }
      } catch { alert('JSON konnte nicht gelesen werden.'); }
    };
    reader.readAsText(file); e.target.value = '';
  };

  // Load preset (v3.80 C7)
  const loadPreset = (preset: Omit<TaFPhase, 'id'>[]) => {
    const existingKeys = new Set(tafPhases.map(p => `${p.name}|${p.startWeek}`));
    const unique = preset.filter(p => !existingKeys.has(`${p.name}|${p.startWeek}`));
    const dupes = preset.length - unique.length;
    if (unique.length === 0) { alert('Alle Phasen bereits vorhanden.'); return; }
    const msg = dupes > 0 ? `${unique.length} Phasen laden, ${dupes} übersprungen.` : `${unique.length} Phasen laden?`;
    if (confirm(msg)) {
      for (const p of unique) addTaFPhase(p);
    }
  };

  return (
    <div className="space-y-3">
      {tafPhases.length === 0 && !showNew && (
        <div className="text-[12px] text-gray-500 text-center py-4">
          Noch keine TaF-Phasen definiert.
        </div>
      )}

      {tafPhases.map((phase) => (
        <PhaseRow key={phase.id} phase={phase}
          onUpdate={(u) => updateTaFPhase(phase.id, u)}
          onDelete={() => {
            if (confirm(`Phase "${phase.name}" löschen?`)) deleteTaFPhase(phase.id);
          }}
        />
      ))}

      {/* Import & Presets (v3.80 C7) */}
      <div className="flex gap-1.5 flex-wrap">
        <label className="text-[11px] px-2 py-1 rounded border border-slate-600 text-gray-400 hover:text-gray-200 cursor-pointer hover:border-slate-500">
          📥 Import (JSON)
          <input type="file" accept=".json" className="hidden" onChange={handleImport} />
        </label>
        <button onClick={() => loadPreset(HOFWIL_PRESET)}
          className="text-[11px] px-2 py-1 rounded border border-blue-500/30 text-blue-400 hover:bg-blue-500/10 cursor-pointer">
          🏫 SJ 25/26 Hofwil
        </button>
      </div>

      {showNew ? (
        <div className="bg-slate-750 rounded-lg p-3 border border-slate-600 space-y-2">
          <input value={newName} onChange={(e) => setNewName(e.target.value)}
            placeholder="Phasenname…" autoFocus
            className="w-full bg-slate-700 text-slate-200 border border-slate-600 rounded px-2 py-1 text-[12px] outline-none focus:border-blue-400"
            onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
          />
          <div className="flex gap-3">
            <div className="flex items-center gap-1">
              <label className="text-[11px] text-gray-400">Von:</label>
              <select value={newStart} onChange={(e) => setNewStart(e.target.value)}
                className="text-[11px] bg-slate-700 border border-slate-600 rounded px-1 py-0.5 text-gray-200">
                {allWeeks.map(w => <option key={w} value={w}>KW {w}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-1">
              <label className="text-[11px] text-gray-400">Bis:</label>
              <select value={newEnd} onChange={(e) => setNewEnd(e.target.value)}
                className="text-[11px] bg-slate-700 border border-slate-600 rounded px-1 py-0.5 text-gray-200">
                {allWeeks.map(w => <option key={w} value={w}>KW {w}</option>)}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[11px] text-gray-400">Farbe:</span>
            {PHASE_COLORS.map(c => (
              <button key={c} onClick={() => setNewColor(c)}
                className="w-4 h-4 rounded-full cursor-pointer border-2"
                style={{ background: c, borderColor: newColor === c ? '#fff' : 'transparent' }}
              />
            ))}
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={handleAdd}
              className="text-[11px] bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded cursor-pointer">
              Hinzufügen
            </button>
            <button onClick={() => setShowNew(false)}
              className="text-[11px] text-gray-400 hover:text-gray-300 cursor-pointer px-2 py-1">
              Abbrechen
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowNew(true)}
          className="text-[11px] text-blue-400 hover:text-blue-300 cursor-pointer">
          + Phase hinzufügen
        </button>
      )}
    </div>
  );
}

/** Modal-Variante (Legacy, wird nicht mehr verwendet) */
export function TaFPanel({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center"
      onClick={onClose}>
      <div className="bg-slate-800 rounded-xl shadow-2xl border border-slate-700 w-[480px] max-h-[70vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}>
        <div className="px-4 py-3 border-b border-slate-700 flex justify-between items-center">
          <h2 className="text-sm font-bold text-gray-200">TaF Phasenmodell</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 cursor-pointer text-lg">✕</button>
        </div>
        <div className="p-4">
          <TaFSection />
        </div>
      </div>
    </div>
  );
}

function PhaseRow({ phase, onUpdate, onDelete }: {
  phase: TaFPhase;
  onUpdate: (u: Partial<TaFPhase>) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <div className="bg-slate-750 rounded-lg p-2.5 border border-slate-700">
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full shrink-0" style={{ background: phase.color }} />
        {editing ? (
          <input value={phase.name} onChange={(e) => onUpdate({ name: e.target.value })}
            onBlur={() => setEditing(false)} autoFocus
            className="flex-1 bg-slate-700 text-slate-200 border border-blue-400 rounded px-1.5 py-0.5 text-[12px] outline-none"
          />
        ) : (
          <span className="text-[12px] font-semibold text-gray-200 flex-1 cursor-pointer"
            onDoubleClick={() => setEditing(true)}>{phase.name}</span>
        )}
        <span className="text-[9px] text-gray-500">KW {phase.startWeek}–{phase.endWeek}</span>
        <button onClick={onDelete}
          className="text-[11px] text-red-400 hover:text-red-300 cursor-pointer px-1">✕</button>
      </div>
      <div className="mt-1.5 flex gap-3">
        <div className="flex items-center gap-1">
          <label className="text-[9px] text-gray-500">Von:</label>
          <select value={phase.startWeek} onChange={(e) => onUpdate({ startWeek: e.target.value })}
            className="text-[9px] bg-slate-700 border border-slate-600 rounded px-1 py-0.5 text-gray-300">
            {allWeeks.map(w => <option key={w} value={w}>KW {w}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-1">
          <label className="text-[9px] text-gray-500">Bis:</label>
          <select value={phase.endWeek} onChange={(e) => onUpdate({ endWeek: e.target.value })}
            className="text-[9px] bg-slate-700 border border-slate-600 rounded px-1 py-0.5 text-gray-300">
            {allWeeks.map(w => <option key={w} value={w}>KW {w}</option>)}
          </select>
        </div>
      </div>
      {(phase.absentClasses.length > 0 || phase.presentClasses.length > 0) && (
        <div className="mt-1 text-[9px] text-gray-500">
          {phase.absentClasses.length > 0 && <span>Abwesend: {phase.absentClasses.join(', ')} </span>}
          {phase.presentClasses.length > 0 && <span>Anwesend: {phase.presentClasses.join(', ')}</span>}
        </div>
      )}
    </div>
  );
}
