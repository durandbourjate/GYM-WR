/**
 * PlannerTabs — Tab bar for switching between planner instances
 */
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useInstanceStore, instanceStorageKey, generateWeekIds } from '../store/instanceStore';
import { saveToInstance } from '../store/plannerStore';
import { SCHOOL_YEAR_PRESETS, getPresetForYear } from '../data/holidayPresets';
import { configToCourses, type PlannerSettings, type CourseConfig, type SpecialWeekConfig, type HolidayConfig, getDefaultSettings, applySettingsToWeekData } from '../store/settingsStore';
import type { SubjectConfig } from '../store/settingsStore';
import type { CurriculumGoal } from '../data/curriculumGoals';
import type { AssessmentRule } from '../store/settingsStore';
import type { LessonType } from '../types';

export function PlannerTabs() {
  const { instances, activeId, setActive, createInstance, deleteInstance, renameInstance, exportInstance } = useInstanceStore();
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [presetId, setPresetId] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [contextMenu, setContextMenu] = useState<{ id: string; x: number; y: number } | null>(null);
  // G7: Import-State für Setup-Wizard im +Tab-Dialog
  const [importedConfig, setImportedConfig] = useState<PlannerSettings | null>(null);
  const [importedFileName, setImportedFileName] = useState('');
  const [partialImports, setPartialImports] = useState<PartialImports>({});
  const [partialFileNames, setPartialFileNames] = useState<Record<string, string>>({});
  const [showPartial, setShowPartial] = useState(false);

  // Auto-detect best preset based on current date
  const defaultPresetId = (() => {
    const now = new Date();
    const year = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
    const preset = getPresetForYear(year);
    return preset?.id ?? '';
  })();

  // G7: Import-Handler für Setup-Wizard
  const handleConfigImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        if (!parsed || typeof parsed !== 'object') { alert('Ungültige Datei.'); return; }
        setImportedConfig(parsed as PlannerSettings);
        setImportedFileName(file.name);
      } catch { alert('Fehler beim Lesen der Datei.'); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handlePartialImport = (key: keyof PartialImports, label: string) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const text = reader.result as string;
          let data: any[];
          if (file.name.endsWith('.json')) {
            const parsed = JSON.parse(text);
            data = Array.isArray(parsed) ? parsed : parsed[key] || parsed.kurse || parsed.rules || [];
          } else {
            const lines = text.split('\n').filter(l => l.trim());
            if (key === 'holidays') {
              data = lines.map(line => {
                const p = line.split(/[,;\t]/).map(s => s.trim());
                return p.length >= 3 ? { id: crypto.randomUUID(), label: p[0], startWeek: p[1].replace(/^KW\s*/i, '').padStart(2, '0'), endWeek: p[2].replace(/^KW\s*/i, '').padStart(2, '0') } : null;
              }).filter(Boolean);
            } else if (key === 'specialWeeks') {
              data = lines.map(line => {
                const p = line.split(/[,;\t]/).map(s => s.trim());
                return p.length >= 2 ? { id: crypto.randomUUID(), label: p[0], week: p[1].replace(/^KW\s*/i, '').padStart(2, '0'), type: (p[2] === 'holiday' ? 'holiday' : 'event'), gymLevel: p[3] || undefined } : null;
              }).filter(Boolean);
            } else { data = []; }
          }
          if (!data || data.length === 0) { alert(`Keine gültigen ${label} gefunden.`); return; }
          setPartialImports(prev => ({ ...prev, [key]: data }));
          setPartialFileNames(prev => ({ ...prev, [key]: file.name }));
        } catch { alert('Datei konnte nicht gelesen werden.'); }
      };
      reader.readAsText(file);
      e.target.value = '';
    };

  const partialButtons: { key: keyof PartialImports; label: string; icon: string; accept: string }[] = [
    { key: 'holidays', label: 'Schulferien', icon: '🏖️', accept: '.json,.csv,.txt' },
    { key: 'specialWeeks', label: 'Sonderwochen', icon: '📅', accept: '.json,.csv,.txt' },
    { key: 'courses', label: 'Stundenplan / Kurse', icon: '📋', accept: '.json' },
    { key: 'subjects', label: 'Fachbereiche', icon: '🎨', accept: '.json' },
    { key: 'curriculumGoals', label: 'Lehrplanziele', icon: '🎯', accept: '.json' },
    { key: 'assessmentRules', label: 'Beurteilungsregeln', icon: '📊', accept: '.json' },
  ];

  const resetNewDialog = () => {
    setShowNew(false); setNewName(''); setPresetId('');
    setImportedConfig(null); setImportedFileName('');
    setPartialImports({}); setPartialFileNames({}); setShowPartial(false);
  };

  const handleCreate = () => {
    if (!newName.trim()) return;

    // Determine school year parameters from preset or defaults
    const preset = SCHOOL_YEAR_PRESETS.find(p => p.id === (presetId || defaultPresetId));
    const startWeek = preset?.startWeek ?? 33;
    const startYear = preset?.startYear ?? new Date().getFullYear();
    const endWeek = preset?.endWeek ?? 32;
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

      initialSettings = getDefaultSettings();

      // G7: Gesamtkonfiguration übernehmen
      if (importedConfig) {
        if (Array.isArray(importedConfig.courses)) initialSettings.courses = importedConfig.courses;
        if (Array.isArray(importedConfig.holidays)) initialSettings.holidays = importedConfig.holidays;
        if (Array.isArray(importedConfig.specialWeeks)) initialSettings.specialWeeks = importedConfig.specialWeeks;
        if (Array.isArray(importedConfig.subjects)) initialSettings.subjects = importedConfig.subjects;
        if (Array.isArray((importedConfig as any).curriculumGoals)) initialSettings.curriculumGoals = (importedConfig as any).curriculumGoals;
        if (Array.isArray((importedConfig as any).assessmentRules)) initialSettings.assessmentRules = (importedConfig as any).assessmentRules;
        if (importedConfig.school) initialSettings.school = importedConfig.school;
      }
      // G7: Einzel-Imports überschreiben Gesamtkonfiguration
      if (partialImports.courses) initialSettings.courses = partialImports.courses;
      if (partialImports.holidays) initialSettings.holidays = partialImports.holidays;
      if (partialImports.specialWeeks) initialSettings.specialWeeks = partialImports.specialWeeks;
      if (partialImports.subjects) initialSettings.subjects = partialImports.subjects;
      if (partialImports.curriculumGoals) initialSettings.curriculumGoals = partialImports.curriculumGoals;
      if (partialImports.assessmentRules) initialSettings.assessmentRules = partialImports.assessmentRules;

      const weekIds = generateWeekIds(
        preset?.startWeek ?? 33, startYear,
        endWeek, endYear
      );
      const courses = initialSettings.courses.length > 0 ? configToCourses(initialSettings.courses) : [];
      const emptyLessons: Record<number, { type: LessonType; title: string }> = {};
      for (const c of courses) {
        emptyLessons[c.col] = { type: 0 as LessonType, title: '' };
      }
      let initWeekData = weekIds.map(w => ({ w, lessons: { ...emptyLessons } }));

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

    resetNewDialog();
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

  // ESC schliesst Setup-Wizard Modal
  useEffect(() => {
    if (!showNew) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') resetNewDialog(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showNew]);

  // Click-Outside schliesst Context-Menu
  useEffect(() => {
    if (!contextMenu) return;
    const handler = () => setContextMenu(null);
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, [contextMenu]);

  return (
    <>
      {/* Inline tabs für die Toolbar */}
      <div className="flex items-center gap-0.5 overflow-x-auto max-w-[30vw] flex-shrink">
        {instances.map(inst => (
          <button
            key={inst.id}
            className={`px-2 py-0.5 rounded text-[12px] whitespace-nowrap transition-colors cursor-pointer ${
              inst.id === activeId
                ? 'bg-slate-700 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
            }`}
            onClick={() => setActive(inst.id)}
            onContextMenu={(e) => handleContextMenu(e, inst.id)}
            onDoubleClick={() => handleRename(inst.id)}
          >
            {editingId === inst.id ? (
              <input
                className="bg-transparent border-b border-indigo-400 text-white outline-none w-24 text-[12px]"
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

        <button
          className="px-1.5 py-0.5 text-[12px] text-slate-500 hover:text-white hover:bg-slate-700/50 rounded cursor-pointer"
          onClick={() => setShowNew(!showNew)}
          title="Neuen Planer erstellen"
        >
          +
        </button>
      </div>

      {/* Setup-Wizard als zentriertes Modal (v3.98) */}
      {showNew && createPortal(
        <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center"
          onClick={resetNewDialog}>
          <div className="bg-slate-800 rounded-xl shadow-2xl border border-slate-700 w-[480px] max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}>
            <div className="px-4 py-3 border-b border-slate-700 flex justify-between items-center">
              <h2 className="text-sm font-bold text-gray-200">Neuer Planer erstellen</h2>
              <button onClick={resetNewDialog} className="text-gray-500 hover:text-gray-300 cursor-pointer text-lg">✕</button>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex gap-2 items-center flex-wrap">
                <input
                  className="bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-white text-sm outline-none flex-1 min-w-[120px]"
                  placeholder="Name (z.B. SJ 25/26)"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleCreate();
                    if (e.key === 'Escape') resetNewDialog();
                  }}
                  autoFocus
                />
                <select
                  className="bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-slate-300 text-[12px] outline-none cursor-pointer"
                  value={presetId || defaultPresetId}
                  onChange={e => setPresetId(e.target.value)}
                  title="Schuljahr"
                >
                  {SCHOOL_YEAR_PRESETS.map(p => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                  <option value="">Manuell</option>
                </select>
              </div>
              <label className={`block px-3 py-2 rounded-lg text-[12px] font-medium transition-colors cursor-pointer text-center ${
                importedConfig
                  ? 'bg-green-800/50 text-green-300 border border-green-600'
                  : 'bg-slate-700 text-slate-400 border border-slate-600 hover:border-slate-500 hover:text-slate-300'
              }`}>
                {importedConfig ? `✅ ${importedFileName}` : '📥 Gesamtkonfiguration importieren'}
                <input type="file" accept=".json" className="hidden" onChange={handleConfigImport} />
              </label>
              <button
                className="text-[12px] text-slate-500 hover:text-slate-300 cursor-pointer transition-colors"
                onClick={() => setShowPartial(!showPartial)}
              >
                {showPartial ? '▾' : '▸'} Einzelne Rubriken importieren {Object.keys(partialImports).length > 0 && `(${Object.keys(partialImports).length})`}
              </button>
              {showPartial && (
                <div className="grid grid-cols-3 gap-1.5">
                  {partialButtons.map(({ key, label, icon, accept }) => {
                    const isLoaded = !!partialImports[key];
                    return (
                      <label key={key} className={`px-2 py-1.5 rounded-md text-[11px] font-medium transition-colors cursor-pointer text-center ${
                        isLoaded
                          ? 'bg-green-800/40 text-green-300 border border-green-700'
                          : 'bg-slate-700/80 text-slate-400 border border-slate-700 hover:border-slate-500 hover:text-slate-300'
                      }`} title={isLoaded ? partialFileNames[key] : `${label} importieren`}>
                        {isLoaded ? `✅ ${label}` : `${icon} ${label}`}
                        <input type="file" accept={accept} className="hidden"
                          onChange={handlePartialImport(key, label)} />
                      </label>
                    );
                  })}
                </div>
              )}
              <div className="flex gap-2 justify-end pt-2">
                <button className="px-3 py-1.5 text-slate-400 hover:text-white text-xs cursor-pointer" onClick={resetNewDialog}>Abbrechen</button>
                <button className="px-4 py-1.5 bg-indigo-600 text-white rounded text-xs hover:bg-indigo-500 cursor-pointer font-medium" onClick={handleCreate}>
                  + Erstellen
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Context menu */}
      {contextMenu && createPortal(
        <div
          className="fixed z-[9999] bg-slate-800 border border-slate-600 rounded shadow-lg py-1 text-sm"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button className="w-full px-4 py-1.5 text-left text-slate-200 hover:bg-slate-700 cursor-pointer"
                  onClick={(e) => { e.stopPropagation(); handleRename(contextMenu.id); }}>
            ✏️ Umbenennen
          </button>
          <button className="w-full px-4 py-1.5 text-left text-slate-200 hover:bg-slate-700 cursor-pointer"
                  onClick={(e) => { e.stopPropagation(); handleExport(contextMenu.id); }}>
            📤 Exportieren
          </button>
          <hr className="border-slate-700 my-1" />
          <button className={`w-full px-4 py-1.5 text-left cursor-pointer ${instances.length <= 1 ? 'text-slate-600 cursor-not-allowed' : 'text-red-400 hover:bg-slate-700'}`}
                  onClick={(e) => { e.stopPropagation(); handleDelete(contextMenu.id); }}
                  disabled={instances.length <= 1}>
            🗑️ Löschen
          </button>
        </div>,
        document.body
      )}
    </>
  );
}

/** v3.83 F4: Einzel-Import-Typen für Startseite */
type PartialImports = {
  holidays?: HolidayConfig[];
  specialWeeks?: SpecialWeekConfig[];
  courses?: CourseConfig[];
  subjects?: SubjectConfig[];
  curriculumGoals?: CurriculumGoal[];
  assessmentRules?: AssessmentRule[];
};

/** Welcome screen shown when no planner exists */
export function WelcomeScreen() {
  const { createInstance } = useInstanceStore();
  const [name, setName] = useState('');
  const [importedConfig, setImportedConfig] = useState<PlannerSettings | null>(null);
  const [importedFileName, setImportedFileName] = useState('');
  // v3.83 F4: Einzel-Imports
  const [partialImports, setPartialImports] = useState<PartialImports>({});
  const [partialFileNames, setPartialFileNames] = useState<Record<string, string>>({});
  const [showPartial, setShowPartial] = useState(false);

  const defaultPresetId = (() => {
    const now = new Date();
    const year = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
    return getPresetForYear(year)?.id ?? SCHOOL_YEAR_PRESETS[0]?.id ?? '';
  })();

  const handleConfigImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        if (!parsed || typeof parsed !== 'object') { alert('Ungültige Datei.'); return; }
        if (!Array.isArray(parsed.courses) && !Array.isArray(parsed.subjects) && !Array.isArray(parsed.holidays)) {
          alert('Keine gültige Konfiguration gefunden.');
          return;
        }
        setImportedConfig(parsed as PlannerSettings);
        setImportedFileName(file.name);
      } catch { alert('Fehler beim Lesen der Datei.'); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // v3.83 F4: Generischer Einzel-Import-Handler
  const handlePartialImport = (key: keyof PartialImports, label: string, _accept?: string) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const text = reader.result as string;
          let data: any[];
          if (file.name.endsWith('.json')) {
            const parsed = JSON.parse(text);
            data = Array.isArray(parsed) ? parsed : parsed[key] || parsed.kurse || parsed.rules || [];
          } else {
            // CSV/TXT: Zeilen splitten
            const lines = text.split('\n').filter(l => l.trim());
            if (key === 'holidays') {
              data = lines.map(line => {
                const p = line.split(/[,;\t]/).map(s => s.trim());
                return p.length >= 3 ? { id: crypto.randomUUID(), label: p[0], startWeek: p[1].replace(/^KW\s*/i, '').padStart(2, '0'), endWeek: p[2].replace(/^KW\s*/i, '').padStart(2, '0') } : null;
              }).filter(Boolean);
            } else if (key === 'specialWeeks') {
              data = lines.map(line => {
                const p = line.split(/[,;\t]/).map(s => s.trim());
                return p.length >= 2 ? { id: crypto.randomUUID(), label: p[0], week: p[1].replace(/^KW\s*/i, '').padStart(2, '0'), type: (p[2] === 'holiday' ? 'holiday' : 'event'), gymLevel: p[3] || undefined } : null;
              }).filter(Boolean);
            } else {
              data = [];
            }
          }
          if (!data || data.length === 0) { alert(`Keine gültigen ${label} gefunden.`); return; }
          setPartialImports(prev => ({ ...prev, [key]: data }));
          setPartialFileNames(prev => ({ ...prev, [key]: file.name }));
        } catch { alert('Datei konnte nicht gelesen werden.'); }
      };
      reader.readAsText(file);
      e.target.value = '';
    };

  const handleCreate = () => {
    const preset = SCHOOL_YEAR_PRESETS.find(p => p.id === defaultPresetId);
    const startYear = preset?.startYear ?? new Date().getFullYear();
    const plannerName = name.trim() || `Planer ${startYear}/${(startYear + 1) % 100}`;

    const newId = createInstance(plannerName, {
      startWeek: preset?.startWeek ?? 33,
      startYear,
      endWeek: preset?.endWeek ?? 32,
      endYear: preset?.endYear ?? startYear + 1,
      semesterBreakWeek: preset?.semesterBreakWeek ?? 7,
    });

    if (newId) {
      let initialSettings = getDefaultSettings();
      // v3.82 E6: Gesamtkonfiguration übernehmen
      if (importedConfig) {
        if (Array.isArray(importedConfig.courses)) initialSettings.courses = importedConfig.courses;
        if (Array.isArray(importedConfig.holidays)) initialSettings.holidays = importedConfig.holidays;
        if (Array.isArray(importedConfig.specialWeeks)) initialSettings.specialWeeks = importedConfig.specialWeeks;
        if (Array.isArray(importedConfig.subjects)) initialSettings.subjects = importedConfig.subjects;
        if (Array.isArray((importedConfig as any).curriculumGoals)) initialSettings.curriculumGoals = (importedConfig as any).curriculumGoals;
        if (Array.isArray((importedConfig as any).assessmentRules)) initialSettings.assessmentRules = (importedConfig as any).assessmentRules;
        if (importedConfig.school) initialSettings.school = importedConfig.school;
        if ((importedConfig as any).schoolLevel) initialSettings.schoolLevel = (importedConfig as any).schoolLevel;
      }
      // v3.83 F4: Einzel-Imports überschreiben Gesamtkonfiguration
      if (partialImports.courses) initialSettings.courses = partialImports.courses;
      if (partialImports.holidays) initialSettings.holidays = partialImports.holidays;
      if (partialImports.specialWeeks) initialSettings.specialWeeks = partialImports.specialWeeks;
      if (partialImports.subjects) initialSettings.subjects = partialImports.subjects;
      if (partialImports.curriculumGoals) initialSettings.curriculumGoals = partialImports.curriculumGoals;
      if (partialImports.assessmentRules) initialSettings.assessmentRules = partialImports.assessmentRules;

      // Build initial weekData with courses
      const weekIds = generateWeekIds(
        preset?.startWeek ?? 33, startYear,
        preset?.endWeek ?? 32, preset?.endYear ?? startYear + 1
      );
      const courses = initialSettings.courses.length > 0 ? configToCourses(initialSettings.courses) : [];
      const emptyLessons: Record<number, { type: import('../types').LessonType; title: string }> = {};
      for (const c of courses) {
        emptyLessons[c.col] = { type: 0 as import('../types').LessonType, title: '' };
      }
      let initWeekData = weekIds.map(w => ({ w, lessons: { ...emptyLessons } }));

      // Auto-apply holidays & special weeks
      if (initialSettings.holidays.length > 0 || initialSettings.specialWeeks.length > 0) {
        const applied = applySettingsToWeekData(initWeekData, initialSettings);
        initWeekData = applied.weekData;
      }

      // Pre-seed localStorage
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
  };

  const importCount = Object.keys(partialImports).length;
  const hasAnyImport = importedConfig || importCount > 0;

  // v3.83 F4: Einzel-Import-Buttons Definition
  const partialButtons: { key: keyof PartialImports; label: string; icon: string; accept: string }[] = [
    { key: 'holidays', label: 'Schulferien', icon: '🏖️', accept: '.json,.csv,.txt' },
    { key: 'specialWeeks', label: 'Sonderwochen', icon: '📅', accept: '.json,.csv,.txt' },
    { key: 'courses', label: 'Stundenplan / Kurse', icon: '📋', accept: '.json' },
    { key: 'subjects', label: 'Fachbereiche', icon: '🎨', accept: '.json' },
    { key: 'curriculumGoals', label: 'Lehrplanziele', icon: '🎯', accept: '.json' },
    { key: 'assessmentRules', label: 'Beurteilungsregeln', icon: '📊', accept: '.json' },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-8">
      <h1 className="text-3xl font-bold text-white mb-2">Unterrichtsplaner</h1>
      <p className="text-slate-400 mb-8 max-w-md">
        Erstelle einen neuen Planer, um mit der Unterrichtsplanung zu beginnen.
        Du kannst mehrere Planer für verschiedene Schuljahre oder Anstellungen verwalten.
      </p>

      <div className="flex flex-col gap-4 w-full max-w-sm">
        <input
          className="bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white text-center outline-none focus:border-indigo-500"
          placeholder="Name (z.B. SJ 25/26)"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleCreate(); }}
        />
        {/* v3.82 E6: Gesamtkonfiguration importieren */}
        <label className={`px-4 py-2.5 rounded-lg font-medium transition-colors cursor-pointer text-center ${
          importedConfig
            ? 'bg-green-800/50 text-green-300 border border-green-600'
            : 'bg-slate-800 text-slate-400 border border-slate-600 hover:border-slate-500 hover:text-slate-300'
        }`}>
          {importedConfig ? `✅ ${importedFileName}` : '📥 Gesamtkonfiguration importieren'}
          <input type="file" accept=".json" className="hidden" onChange={handleConfigImport} />
        </label>

        {/* v3.83 F4: Einzelne Rubriken importieren */}
        <button
          className="text-[12px] text-slate-500 hover:text-slate-300 cursor-pointer transition-colors"
          onClick={() => setShowPartial(!showPartial)}
        >
          {showPartial ? '▾' : '▸'} Einzelne Rubriken importieren {importCount > 0 && `(${importCount})`}
        </button>
        {showPartial && (
          <div className="grid grid-cols-2 gap-2">
            {partialButtons.map(({ key, label, icon, accept }) => {
              const isLoaded = !!partialImports[key];
              const fileName = partialFileNames[key];
              return (
                <label key={key} className={`px-2 py-1.5 rounded-md text-[12px] font-medium transition-colors cursor-pointer text-center ${
                  isLoaded
                    ? 'bg-green-800/40 text-green-300 border border-green-700'
                    : 'bg-slate-800/80 text-slate-400 border border-slate-700 hover:border-slate-500 hover:text-slate-300'
                }`} title={isLoaded ? fileName : `${label} importieren`}>
                  {isLoaded ? `✅ ${label}` : `${icon} ${label}`}
                  <input type="file" accept={accept} className="hidden"
                    onChange={handlePartialImport(key, label, accept)} />
                </label>
              );
            })}
          </div>
        )}

        <button
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-500 transition-colors cursor-pointer"
          onClick={() => handleCreate()}
        >
          + Neuen Planer erstellen
        </button>
        <p className="text-slate-500 text-xs text-center">
          {hasAnyImport
            ? 'Konfiguration wird beim Erstellen übernommen. Einzelne Rubriken können auch später in den Einstellungen angepasst werden.'
            : 'Ferien, Kurse und Fachbereiche kannst du anschliessend in den Einstellungen importieren.'}
        </p>
      </div>
    </div>
  );
}
