/**
 * PlannerTabs — Tab bar for switching between planner instances
 */
import { useState } from 'react';
import { useInstanceStore, instanceStorageKey, generateWeekIds } from '../store/instanceStore';
import { saveToInstance } from '../store/plannerStore';
import { SCHOOL_YEAR_PRESETS, getPresetForYear } from '../data/holidayPresets';
import { configToCourses, type PlannerSettings, getDefaultSettings, applySettingsToWeekData } from '../store/settingsStore';
import type { LessonType } from '../types';

export function PlannerTabs() {
  const { instances, activeId, setActive, createInstance, deleteInstance, renameInstance, exportInstance } = useInstanceStore();
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [templateId, setTemplateId] = useState<string | ''>('');
  const [presetId, setPresetId] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [contextMenu, setContextMenu] = useState<{ id: string; x: number; y: number } | null>(null);

  // Auto-detect best preset based on current date
  const defaultPresetId = (() => {
    const now = new Date();
    const year = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
    const preset = getPresetForYear(year);
    return preset?.id ?? '';
  })();

  const handleCreate = () => {
    if (!newName.trim()) return;

    // Determine school year parameters from preset or defaults
    const preset = SCHOOL_YEAR_PRESETS.find(p => p.id === (presetId || defaultPresetId));
    const startWeek = preset?.startWeek ?? 33;
    const startYear = preset?.startYear ?? new Date().getFullYear();
    const endWeek = preset?.endWeek ?? 27;
    const endYear = preset?.endYear ?? startYear + 1;
    const semesterBreakWeek = preset?.semesterBreakWeek ?? 7;

    // Save current instance before switching
    if (activeId) saveToInstance(activeId);

    const newId = createInstance(newName.trim(), {
      startWeek, startYear, endWeek, endYear, semesterBreakWeek,
    });

    if (newId) {
      // Build initial settings
      let initialSettings: PlannerSettings | null = null;

      if (templateId) {
        // Copy settings from template planner
        const templateData = localStorage.getItem(`planner-data-${templateId}`);
        if (templateData) {
          try {
            const parsed = JSON.parse(templateData);
            const data = parsed.state || parsed;
            if (data.plannerSettings) {
              initialSettings = { ...data.plannerSettings };
            }
          } catch { /* ignore */ }
        }
      }

      // Always set plannerSettings for new planners (even if empty).
      // This distinguishes new planners (storeSettings !== null) from legacy ones.
      if (!initialSettings) {
        initialSettings = getDefaultSettings();
      }
      // v3.81 D3: Keine automatischen Ferien mehr — Import nur über Einstellungen

      // Pre-seed the new instance's localStorage BEFORE switchInstance runs,
      // so loadFromInstance() picks up settings immediately (no setTimeout race).
      // Also generate initial weekData so Zoom 3 works immediately.
      const weekIds = generateWeekIds(
        preset?.startWeek ?? 33, startYear,
        preset?.endWeek ?? endWeek, endYear
      );
      // Build initial weekData with proper columns from courses
      const courses = initialSettings.courses.length > 0 ? configToCourses(initialSettings.courses) : [];
      const emptyLessons: Record<number, { type: LessonType; title: string }> = {};
      for (const c of courses) {
        emptyLessons[c.col] = { type: 0 as LessonType, title: '' };
      }
      let initWeekData = weekIds.map(w => ({ w, lessons: { ...emptyLessons } }));

      // Auto-apply holidays & special weeks to the initial weekData
      if (initialSettings.holidays.length > 0 || initialSettings.specialWeeks.length > 0) {
        const applied = applySettingsToWeekData(initWeekData, initialSettings);
        initWeekData = applied.weekData;
      }

      localStorage.setItem(instanceStorageKey(newId), JSON.stringify({
        state: {
          plannerSettings: initialSettings,
          weekData: initWeekData,
          sequences: [],
          lessonDetails: {},
          collection: [],
        },
      }));
    }

    setNewName('');
    setTemplateId('');
    setPresetId('');
    setShowNew(false);
  };

  const handleExport = (id: string) => {
    const json = exportInstance(id);
    if (!json) return;
    const meta = instances.find(i => i.id === id);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `planer_${meta?.name?.replace(/\s+/g, '_') || id}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setContextMenu(null);
  };

  const handleContextMenu = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setContextMenu({ id, x: e.clientX, y: e.clientY });
  };

  const handleRename = (id: string) => {
    const meta = instances.find(i => i.id === id);
    if (!meta) return;
    setEditingId(id);
    setEditName(meta.name);
    setContextMenu(null);
  };

  const commitRename = () => {
    if (editingId && editName.trim()) {
      renameInstance(editingId, editName.trim());
    }
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    const meta = instances.find(i => i.id === id);
    if (!meta) return;
    if (confirm(`Planer "${meta.name}" wirklich löschen? Dies kann nicht rückgängig gemacht werden.`)) {
      deleteInstance(id);
    }
    setContextMenu(null);
  };

  return (
    <>
      <div className="flex items-center gap-1 px-2 py-1 bg-slate-900 border-b border-slate-700 text-sm overflow-x-auto"
           onClick={() => setContextMenu(null)}>
        {instances.map(inst => (
          <button
            key={inst.id}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t-md whitespace-nowrap transition-colors ${
              inst.id === activeId
                ? 'bg-slate-800 text-white border-t border-x border-slate-600'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
            onClick={() => setActive(inst.id)}
            onContextMenu={(e) => handleContextMenu(e, inst.id)}
            onDoubleClick={() => handleRename(inst.id)}
          >
            {editingId === inst.id ? (
              <input
                className="bg-transparent border-b border-blue-400 text-white outline-none w-32"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                onBlur={commitRename}
                onKeyDown={e => {
                  if (e.key === 'Enter') commitRename();
                  if (e.key === 'Escape') setEditingId(null);
                }}
                autoFocus
                onClick={e => e.stopPropagation()}
              />
            ) : (
              <span>{inst.name}</span>
            )}
          </button>
        ))}

        {/* New planner button */}
        {showNew ? (
          <div className="flex items-center gap-1 flex-wrap">
            <input
              className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-white text-sm outline-none w-28"
              placeholder="Name..."
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleCreate();
                if (e.key === 'Escape') { setShowNew(false); setNewName(''); setTemplateId(''); setPresetId(''); }
              }}
              autoFocus
            />
            <select
              className="bg-slate-800 border border-slate-600 rounded px-1 py-1 text-slate-300 text-[10px] outline-none cursor-pointer"
              value={presetId || defaultPresetId}
              onChange={e => setPresetId(e.target.value)}
              title="Schuljahr"
            >
              {SCHOOL_YEAR_PRESETS.map(p => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
              <option value="">Manuell</option>
            </select>
            {instances.length > 0 && (
              <select
                className="bg-slate-800 border border-slate-600 rounded px-1 py-1 text-slate-400 text-[10px] outline-none cursor-pointer"
                value={templateId}
                onChange={e => setTemplateId(e.target.value)}
                title="Kurse übernehmen von..."
              >
                <option value="">Ohne Vorlage</option>
                {instances.map(inst => (
                  <option key={inst.id} value={inst.id}>Kurse von: {inst.name}</option>
                ))}
              </select>
            )}
            <button className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-500 cursor-pointer" onClick={handleCreate}>OK</button>
            <button className="px-2 py-1 text-slate-400 hover:text-white text-xs cursor-pointer" onClick={() => { setShowNew(false); setNewName(''); setTemplateId(''); setPresetId(''); }}>✕</button>
          </div>
        ) : (
          <button
            className="px-2 py-1.5 text-slate-500 hover:text-white hover:bg-slate-800/50 rounded-t-md"
            onClick={() => setShowNew(true)}
            title="Neuen Planer erstellen"
          >
            +
          </button>
        )}

        {/* Import moved to Settings panel (v3.77 #7) */}
      </div>

      {/* Context menu */}
      {contextMenu && (
        <div
          className="fixed z-50 bg-slate-800 border border-slate-600 rounded shadow-lg py-1 text-sm"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={() => setContextMenu(null)}
        >
          <button className="w-full px-4 py-1.5 text-left text-slate-200 hover:bg-slate-700"
                  onClick={() => handleRename(contextMenu.id)}>
            ✏️ Umbenennen
          </button>
          <button className="w-full px-4 py-1.5 text-left text-slate-200 hover:bg-slate-700"
                  onClick={() => handleExport(contextMenu.id)}>
            📤 Exportieren
          </button>
          <hr className="border-slate-700 my-1" />
          <button className="w-full px-4 py-1.5 text-left text-red-400 hover:bg-slate-700"
                  onClick={() => handleDelete(contextMenu.id)}
                  disabled={instances.length <= 1}>
            🗑️ Löschen
          </button>
        </div>
      )}
    </>
  );
}

/** Welcome screen shown when no planner exists */
export function WelcomeScreen() {
  const { createInstance } = useInstanceStore();
  const [name, setName] = useState('');
  // v3.81 D3: Ferien-Preset-Dropdown und autoHolidays entfernt — Ferien nur noch via Einstellungen
  const defaultPresetId = (() => {
    const now = new Date();
    const year = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
    return getPresetForYear(year)?.id ?? SCHOOL_YEAR_PRESETS[0]?.id ?? '';
  })();

  const handleCreate = () => {
    const preset = SCHOOL_YEAR_PRESETS.find(p => p.id === defaultPresetId);
    const startYear = preset?.startYear ?? new Date().getFullYear();
    const plannerName = name.trim() || `Planer ${startYear}/${(startYear + 1) % 100}`;

    const newId = createInstance(plannerName, {
      startWeek: preset?.startWeek ?? 33,
      startYear,
      endWeek: preset?.endWeek ?? 27,
      endYear: preset?.endYear ?? startYear + 1,
      semesterBreakWeek: preset?.semesterBreakWeek ?? 7,
    });

    if (newId) {
      // v3.81 D3: Neuer Planer startet mit leeren Ferien (kein automatischer Preset)
      const initialSettings = getDefaultSettings();
      // Pre-seed localStorage so loadFromInstance() picks up settings immediately
      localStorage.setItem(instanceStorageKey(newId), JSON.stringify({
        state: { plannerSettings: initialSettings },
      }));
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-8">
      <h1 className="text-3xl font-bold text-white mb-2">Unterrichtsplaner</h1>
      <p className="text-slate-400 mb-8 max-w-md">
        Erstelle einen neuen Planer, um mit der Unterrichtsplanung zu beginnen.
        Du kannst mehrere Planer für verschiedene Schuljahre oder Anstellungen verwalten.
      </p>

      {/* v3.81 D3: Vereinfacht — nur Name + Button, kein Ferien-Preset */}
      <div className="flex flex-col gap-4 w-full max-w-sm">
        <input
          className="bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white text-center outline-none focus:border-blue-500"
          placeholder="Name (z.B. SJ 25/26)"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleCreate(); }}
        />
        <button
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-500 transition-colors cursor-pointer"
          onClick={() => handleCreate()}
        >
          + Neuen Planer erstellen
        </button>
        <p className="text-slate-500 text-xs text-center">
          Ferien, Kurse und Fachbereiche kannst du anschliessend in den Einstellungen importieren.
        </p>
      </div>
    </div>
  );
}
