/**
 * PlannerTabs — Tab bar for switching between planner instances
 */
import { useState, useRef } from 'react';
import { useInstanceStore } from '../store/instanceStore';
import { usePlannerStore, saveToInstance } from '../store/plannerStore';

interface Props {
  onImport: (json: string) => void;
}

export function PlannerTabs({ onImport }: Props) {
  const { instances, activeId, setActive, createInstance, deleteInstance, renameInstance, exportInstance } = useInstanceStore();
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [templateId, setTemplateId] = useState<string | ''>('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [contextMenu, setContextMenu] = useState<{ id: string; x: number; y: number } | null>(null);
  const importRef = useRef<HTMLInputElement>(null);

  const handleCreate = () => {
    if (!newName.trim()) return;
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    const startYear = currentMonth >= 6 ? currentYear : currentYear - 1;

    // Save current instance before switching
    if (activeId) saveToInstance(activeId);

    const newId = createInstance(newName.trim(), {
      startWeek: 33,
      startYear,
      endWeek: 27,
      endYear: startYear + 1,
      semesterBreakWeek: 7,
    });

    // Copy settings (courses, holidays, special weeks) from template planner
    if (templateId && newId) {
      // We need to load the template's plannerSettings
      const templateData = localStorage.getItem(`planner-data-${templateId}`);
      if (templateData) {
        try {
          const parsed = JSON.parse(templateData);
          const data = parsed.state || parsed;
          if (data.plannerSettings) {
            // Apply template settings to new instance after a tick (let switchInstance happen first)
            setTimeout(() => {
              usePlannerStore.getState().setPlannerSettings(data.plannerSettings);
            }, 50);
          }
        } catch { /* ignore parse errors */ }
      }
    }

    setNewName('');
    setTemplateId('');
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

  const handleImportClick = () => {
    importRef.current?.click();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onImport(reader.result);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
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
          <div className="flex items-center gap-1">
            <input
              className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-white text-sm outline-none w-32"
              placeholder="Name des Planers..."
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleCreate();
                if (e.key === 'Escape') { setShowNew(false); setNewName(''); setTemplateId(''); }
              }}
              autoFocus
            />
            {instances.length > 0 && (
              <select
                className="bg-slate-800 border border-slate-600 rounded px-1 py-1 text-slate-400 text-[10px] outline-none cursor-pointer"
                value={templateId}
                onChange={e => setTemplateId(e.target.value)}
                title="Kurse & Ferien übernehmen von..."
              >
                <option value="">Leer starten</option>
                {instances.map(inst => (
                  <option key={inst.id} value={inst.id}>Kurse von: {inst.name}</option>
                ))}
              </select>
            )}
            <button
              className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-500"
              onClick={handleCreate}
            >
              OK
            </button>
            <button
              className="px-2 py-1 text-slate-400 hover:text-white text-xs"
              onClick={() => { setShowNew(false); setNewName(''); setTemplateId(''); }}
            >
              ✕
            </button>
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

        {/* Import button */}
        <button
          className="ml-auto px-2 py-1.5 text-slate-500 hover:text-white text-xs"
          onClick={handleImportClick}
          title="Planer aus JSON importieren"
        >
          📥 Import
        </button>
        <input
          ref={importRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleImportFile}
        />
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

/** Welcome screen shown when no planner exists or planner has no courses */
export function WelcomeScreen() {
  const { createInstance } = useInstanceStore();
  const [name, setName] = useState('');

  const handleCreate = () => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    const startYear = currentMonth >= 6 ? currentYear : currentYear - 1;

    const plannerName = name.trim() || `Planer ${startYear}/${(startYear + 1) % 100}`;

    createInstance(plannerName, {
      startWeek: 33,
      startYear,
      endWeek: 27,
      endYear: startYear + 1,
      semesterBreakWeek: 7,
    });
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
        <button
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-500 transition-colors"
          onClick={() => handleCreate()}
        >
          + Neuen Planer erstellen
        </button>
        <p className="text-slate-500 text-sm mt-2">
          Oder importiere einen bestehenden Planer via JSON-Datei
          (Tab-Leiste → 📥 Import)
        </p>
      </div>
    </div>
  );
}
