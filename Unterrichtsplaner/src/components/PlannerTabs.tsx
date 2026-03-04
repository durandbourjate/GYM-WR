/**
 * PlannerTabs — Tab bar for switching between planner instances
 */
import { useState } from 'react';
import { useInstanceStore, instanceStorageKey, generateWeekIds } from '../store/instanceStore';
import { saveToInstance } from '../store/plannerStore';
import { SCHOOL_YEAR_PRESETS, getPresetForYear } from '../data/holidayPresets';
import { generateId, configToCourses, type HolidayConfig, type CourseConfig, type SpecialWeekConfig, type AssessmentRule, type PlannerSettings, getDefaultSettings, applySettingsToWeekData } from '../store/settingsStore';
import type { LessonType } from '../types';

export function PlannerTabs() {
  const { instances, activeId, setActive, createInstance, deleteInstance, renameInstance, exportInstance } = useInstanceStore();
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [templateId, setTemplateId] = useState<string | ''>('');
  const [presetId, setPresetId] = useState<string>('');
  const [autoHolidays, setAutoHolidays] = useState(true);
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

      if (autoHolidays && preset) {
        const presetHolidays: HolidayConfig[] = preset.holidays.map(h => ({
          id: generateId(),
          label: h.label,
          startWeek: h.startWeek,
          endWeek: h.endWeek,
        }));
        const existingLabels = new Set(initialSettings.holidays.map(h => h.label));
        for (const h of presetHolidays) {
          if (!existingLabels.has(h.label)) {
            initialSettings.holidays.push(h);
          }
        }
      }

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
            {(presetId || defaultPresetId) && (
              <label className="flex items-center gap-0.5 text-[10px] text-slate-400 cursor-pointer" title="Schulferien Kt. Bern automatisch eintragen">
                <input type="checkbox" checked={autoHolidays} onChange={e => setAutoHolidays(e.target.checked)} className="cursor-pointer" />
                🏖
              </label>
            )}
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
  const [presetId, setPresetId] = useState('');
  const [autoHolidays, setAutoHolidays] = useState(true);
  // Quick-import state (v3.80 C8)
  const [importedHolidays, setImportedHolidays] = useState<HolidayConfig[]>([]);
  const [importedSpecialWeeks, setImportedSpecialWeeks] = useState<SpecialWeekConfig[]>([]);
  const [importedCourses, setImportedCourses] = useState<CourseConfig[]>([]);
  const [importedRules, setImportedRules] = useState<AssessmentRule[]>([]);

  const defaultPresetId = (() => {
    const now = new Date();
    const year = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
    return getPresetForYear(year)?.id ?? SCHOOL_YEAR_PRESETS[0]?.id ?? '';
  })();

  const handleCreate = () => {
    const preset = SCHOOL_YEAR_PRESETS.find(p => p.id === (presetId || defaultPresetId));
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
      // Always set plannerSettings for new planners (distinguishes from legacy)
      const initialSettings = getDefaultSettings();
      if (autoHolidays && preset) {
        initialSettings.holidays = preset.holidays.map(h => ({
          id: generateId(), label: h.label, startWeek: h.startWeek, endWeek: h.endWeek,
        }));
      }
      // Apply quick-imported data (v3.80 C8)
      if (importedHolidays.length > 0) initialSettings.holidays = [...initialSettings.holidays, ...importedHolidays];
      if (importedSpecialWeeks.length > 0) initialSettings.specialWeeks = [...initialSettings.specialWeeks, ...importedSpecialWeeks];
      if (importedCourses.length > 0) initialSettings.courses = [...initialSettings.courses, ...importedCourses];
      if (importedRules.length > 0) initialSettings.assessmentRules = importedRules;
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

      <div className="flex flex-col gap-4 w-full max-w-sm">
        <input
          className="bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white text-center outline-none focus:border-blue-500"
          placeholder="Name (z.B. SJ 25/26)"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleCreate(); }}
        />
        <div className="flex gap-2 items-center justify-center">
          <select
            className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm outline-none cursor-pointer"
            value={presetId || defaultPresetId}
            onChange={e => setPresetId(e.target.value)}
          >
            {SCHOOL_YEAR_PRESETS.map(p => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
          <label className="flex items-center gap-1.5 text-sm text-slate-400 cursor-pointer" title="Schulferien Kt. Bern automatisch eintragen">
            <input type="checkbox" checked={autoHolidays} onChange={e => setAutoHolidays(e.target.checked)} className="cursor-pointer" />
            🏖 Ferien eintragen
          </label>
        </div>
        <button
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-500 transition-colors cursor-pointer"
          onClick={() => handleCreate()}
        >
          + Neuen Planer erstellen
        </button>
        {/* Quick-import badges (v3.80 C8) */}
        {(importedHolidays.length > 0 || importedSpecialWeeks.length > 0 || importedCourses.length > 0 || importedRules.length > 0) && (
          <div className="flex flex-wrap gap-1.5 justify-center mt-1">
            {importedHolidays.length > 0 && <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-900/30 text-green-400 border border-green-700/50">🏖 {importedHolidays.length} Ferien</span>}
            {importedSpecialWeeks.length > 0 && <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-900/30 text-amber-400 border border-amber-700/50">📅 {importedSpecialWeeks.length} Sonderwochen</span>}
            {importedCourses.length > 0 && <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-900/30 text-blue-400 border border-blue-700/50">📚 {importedCourses.length} Kurse</span>}
            {importedRules.length > 0 && <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-900/30 text-purple-400 border border-purple-700/50">📝 {importedRules.length} Regeln</span>}
          </div>
        )}

        {/* Import-Schnellzugriffe (v3.80 C8) */}
        <div className="mt-4 pt-3 border-t border-slate-700/50">
          <p className="text-slate-500 text-xs mb-2">Direkt importieren (JSON)</p>
          <div className="flex flex-wrap gap-2 justify-center">
            <label className="px-3 py-1.5 rounded border border-slate-600 text-slate-400 text-xs cursor-pointer hover:text-slate-200 hover:border-slate-500 transition-colors">
              📥 Ferien
              <input type="file" accept=".json,.csv,.txt" className="hidden" onChange={(e) => {
                const file = e.target.files?.[0]; if (!file) return;
                const reader = new FileReader();
                reader.onload = () => {
                  try {
                    const data = JSON.parse(reader.result as string);
                    const arr: HolidayConfig[] = (Array.isArray(data) ? data : data.holidays || []).map((h: any) => ({
                      id: generateId(), label: h.label || h.name || '', startWeek: String(h.startWeek || h.start || ''), endWeek: String(h.endWeek || h.end || ''), ...(h.days ? { days: h.days } : {}),
                    }));
                    if (arr.length === 0) { alert('Keine gültigen Ferien.'); return; }
                    setImportedHolidays(arr);
                  } catch { alert('JSON konnte nicht gelesen werden.'); }
                };
                reader.readAsText(file); e.target.value = '';
              }} />
            </label>
            <label className="px-3 py-1.5 rounded border border-slate-600 text-slate-400 text-xs cursor-pointer hover:text-slate-200 hover:border-slate-500 transition-colors">
              📥 Sonderwochen
              <input type="file" accept=".json" className="hidden" onChange={(e) => {
                const file = e.target.files?.[0]; if (!file) return;
                const reader = new FileReader();
                reader.onload = () => {
                  try {
                    const data = JSON.parse(reader.result as string) as SpecialWeekConfig[];
                    const arr = Array.isArray(data) ? data : [];
                    if (arr.length === 0) { alert('Keine gültigen Sonderwochen.'); return; }
                    setImportedSpecialWeeks(arr.map(w => ({ ...w, id: w.id || generateId() })));
                  } catch { alert('JSON konnte nicht gelesen werden.'); }
                };
                reader.readAsText(file); e.target.value = '';
              }} />
            </label>
            <label className="px-3 py-1.5 rounded border border-slate-600 text-slate-400 text-xs cursor-pointer hover:text-slate-200 hover:border-slate-500 transition-colors">
              📥 Stundenplan
              <input type="file" accept=".json" className="hidden" onChange={(e) => {
                const file = e.target.files?.[0]; if (!file) return;
                const reader = new FileReader();
                reader.onload = () => {
                  try {
                    const data = JSON.parse(reader.result as string);
                    const arr: CourseConfig[] = Array.isArray(data) ? data : data.kurse || data.courses || [];
                    if (arr.length === 0) { alert('Keine gültigen Kurse.'); return; }
                    setImportedCourses(arr.map(c => ({ ...c, id: c.id || generateId() })));
                  } catch { alert('JSON konnte nicht gelesen werden.'); }
                };
                reader.readAsText(file); e.target.value = '';
              }} />
            </label>
            <label className="px-3 py-1.5 rounded border border-slate-600 text-slate-400 text-xs cursor-pointer hover:text-slate-200 hover:border-slate-500 transition-colors">
              📥 Beurteilungsregeln
              <input type="file" accept=".json" className="hidden" onChange={(e) => {
                const file = e.target.files?.[0]; if (!file) return;
                const reader = new FileReader();
                reader.onload = () => {
                  try {
                    const data = JSON.parse(reader.result as string);
                    const arr: AssessmentRule[] = Array.isArray(data) ? data : data.assessmentRules || data.rules || [];
                    if (arr.length === 0) { alert('Keine gültigen Regeln.'); return; }
                    setImportedRules(arr);
                  } catch { alert('JSON konnte nicht gelesen werden.'); }
                };
                reader.readAsText(file); e.target.value = '';
              }} />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
