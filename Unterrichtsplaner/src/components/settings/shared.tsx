import { useState, useRef, useEffect } from 'react';
import { usePlannerStore } from '../../store/plannerStore';
import { useInstanceStore } from '../../store/instanceStore';

// === Helper Components ===
export function Section({ title, children, defaultOpen = false, actions, sectionId, forceOpen }: { title: string; children: React.ReactNode; defaultOpen?: boolean; actions?: React.ReactNode; sectionId?: string; forceOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  // G6: Section von aussen öffnen
  useEffect(() => { if (forceOpen) setOpen(true); }, [forceOpen]);
  return (
    <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }} data-section={sectionId}>
      <div className="flex items-center" style={{ background: 'var(--bg-secondary)' }}>
        <button onClick={() => setOpen(!open)}
          className="flex-1 px-3 py-2 text-left text-[13px] font-semibold cursor-pointer flex items-center justify-between"
          style={{ color: 'var(--text-primary)' }}>
          {title}
          <span style={{ color: 'var(--text-muted)' }}>{open ? '▾' : '▸'}</span>
        </button>
        {open && actions && (
          <div className="flex items-center gap-1 pr-2" onClick={(e) => e.stopPropagation()}>
            {actions}
          </div>
        )}
      </div>
      {open && <div className="p-3 space-y-2" style={{ background: 'var(--bg-primary)' }}>{children}</div>}
    </div>
  );
}

export function SmallInput({ value, onChange, placeholder, className = '', type = 'text' }: {
  value: string; onChange: (v: string) => void; placeholder?: string; className?: string; type?: string;
}) {
  // Use local state to prevent cursor jump on re-render (debounce pattern)
  const [local, setLocal] = useState(value);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { if (ref.current !== document.activeElement) setLocal(value); }, [value]);
  return (
    <input ref={ref} value={local} onChange={(e) => setLocal(e.target.value)}
      onBlur={() => { if (local !== value) onChange(local); }}
      onKeyDown={(e) => { if (e.key === 'Enter') { (e.target as HTMLInputElement).blur(); } }}
      placeholder={placeholder} type={type}
      className={`rounded px-1.5 py-0.5 text-[12px] outline-none focus:border-indigo-400 ${type === 'time' ? 'min-w-[5rem]' : ''} ${className}`}
      style={{ background: 'var(--bg-hover)', color: 'var(--text-primary)', border: '1px solid var(--border-light)' }} />
  );
}

export function SmallSelect<T extends string>({ value, onChange, options }: {
  value: T; onChange: (v: T) => void; options: { key: T; label: string }[];
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value as T)}
      className="rounded px-1 py-0.5 text-[11px] outline-none focus:border-indigo-400 cursor-pointer"
      style={{ background: 'var(--bg-hover)', color: 'var(--text-primary)', border: '1px solid var(--border-light)' }}>
      {options.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
    </select>
  );
}

// === Rubric Collection Save/Load (v3.77 #8/#9/#10) ===
export type RubricType = 'fachbereiche' | 'kurse' | 'sonderwochen' | 'ferien' | 'lehrplanziele' | 'beurteilungsregeln' | 'settings';
export const RUBRIC_LABELS: Record<RubricType, string> = {
  fachbereiche: 'Fachbereiche', kurse: 'Kurse', sonderwochen: 'Sonderwochen',
  ferien: 'Ferien', lehrplanziele: 'Lehrplanziele', beurteilungsregeln: 'Beurteilungsregeln', settings: 'Konfiguration',
};

/** Save-to-collection dialog: replace existing or create new (v3.77 #10) */
function SaveToCollectionDialog({ rubricType, data, onClose }: { rubricType: RubricType; data: any; onClose: () => void }) {
  const { collection, addCollectionItem } = usePlannerStore();
  const label = RUBRIC_LABELS[rubricType];
  const existing = collection.filter(item => item.type === rubricType && item.settingsSnapshot);
  const [mode, setMode] = useState<'new' | 'replace'>(existing.length > 0 ? 'replace' : 'new');
  const [selectedId, setSelectedId] = useState(existing[0]?.id || '');
  const activeMeta = useInstanceStore.getState().getActive();
  const datum = new Date().toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: '2-digit' });
  const [newName, setNewName] = useState(`${label} ${activeMeta?.name || 'Planer'} ${datum}`);

  const handleSave = () => {
    const snapshot = JSON.stringify(data);
    if (mode === 'replace' && selectedId) {
      const item = existing.find(e => e.id === selectedId);
      if (item) {
        // Update the existing collection item's snapshot
        // We need to reach into the store directly since updateCollectionItem only updates title/tags/notes/fachbereich
        const store = usePlannerStore.getState();
        const updated = store.collection.map(c => c.id === selectedId ? { ...c, settingsSnapshot: snapshot, title: c.title } : c);
        usePlannerStore.setState({ collection: updated });
      }
    } else {
      addCollectionItem({ type: rubricType as any, title: newName.trim() || `${label} ${datum}`, units: [], settingsSnapshot: snapshot });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center" onClick={onClose}>
      <div className="rounded-lg p-4 w-80 shadow-xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-light)' }} onClick={(e) => e.stopPropagation()}>
        <div className="text-[13px] font-bold mb-3" style={{ color: 'var(--text-primary)' }}>📥 {label} in Sammlung speichern</div>
        <div className="space-y-2">
          {existing.length > 0 && (
            <div className="flex gap-2 text-[11px]">
              <label className={`flex items-center gap-1 cursor-pointer ${mode === 'replace' ? 'text-indigo-300' : ''}`}
                style={mode === 'replace' ? undefined : { color: 'var(--text-muted)' }}>
                <input type="radio" checked={mode === 'replace'} onChange={() => setMode('replace')} className="cursor-pointer" />
                Bestehende ersetzen
              </label>
              <label className={`flex items-center gap-1 cursor-pointer ${mode === 'new' ? 'text-indigo-300' : ''}`}
                style={mode === 'new' ? undefined : { color: 'var(--text-muted)' }}>
                <input type="radio" checked={mode === 'new'} onChange={() => setMode('new')} className="cursor-pointer" />
                Als neue speichern
              </label>
            </div>
          )}
          {mode === 'replace' && existing.length > 0 ? (
            <select value={selectedId} onChange={e => setSelectedId(e.target.value)}
              className="w-full rounded px-2 py-1.5 text-[12px] outline-none cursor-pointer"
              style={{ background: 'var(--bg-hover)', color: 'var(--text-primary)', border: '1px solid var(--border-light)' }}>
              {existing.map(item => (
                <option key={item.id} value={item.id}>{item.title}</option>
              ))}
            </select>
          ) : (
            <input value={newName} onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSave(); }}
              placeholder="Name…" autoFocus
              className="w-full rounded px-2 py-1.5 text-[12px] outline-none focus:border-indigo-400"
              style={{ background: 'var(--bg-hover)', color: 'var(--text-primary)', border: '1px solid var(--border-light)' }} />
          )}
        </div>
        <div className="flex gap-1 mt-3">
          <button onClick={handleSave} className="flex-1 py-1.5 rounded text-[11px] font-medium bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer">Speichern</button>
          <button onClick={onClose} className="flex-1 py-1.5 rounded text-[11px] cursor-pointer" style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}>Abbrechen</button>
        </div>
      </div>
    </div>
  );
}

/** Load-from-collection picker for a specific rubric type (v3.77 #9) */
function RubricCollectionPicker({ rubricType, onLoad, onClose }: { rubricType: RubricType; onLoad: (snapshot: string) => void; onClose: () => void }) {
  const { collection } = usePlannerStore();
  const label = RUBRIC_LABELS[rubricType];
  // Show both rubric-specific items AND full 'settings' items (since those contain all rubrics)
  const items = collection.filter(item => (item.type === rubricType || item.type === 'settings') && item.settingsSnapshot);

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center" onClick={onClose}>
      <div className="rounded-lg p-4 w-80 max-h-[60vh] shadow-xl flex flex-col" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-light)' }} onClick={(e) => e.stopPropagation()}>
        <div className="text-[13px] font-bold mb-3" style={{ color: 'var(--text-primary)' }}>📚 {label} aus Sammlung laden</div>
        {items.length === 0 ? (
          <div className="text-[11px] text-center py-4" style={{ color: 'var(--text-muted)' }}>
            Keine gespeicherten {label} in der Sammlung.
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-1.5 mb-3">
            {items.map(item => {
              const dateStr = new Date(item.createdAt).toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: '2-digit' });
              const isFullConfig = item.type === 'settings';
              return (
                <button key={item.id} onClick={() => onLoad(item.settingsSnapshot!)}
                  className="w-full text-left px-3 py-2 rounded hover:border-indigo-500 cursor-pointer transition-all"
                  style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-light)' }}>
                  <div className="text-[12px] font-semibold" style={{ color: 'var(--text-primary)' }}>{item.title}</div>
                  <div className="text-[9px]" style={{ color: 'var(--text-muted)' }}>{isFullConfig ? '(Gesamtkonfiguration)' : label} · {dateStr}</div>
                </button>
              );
            })}
          </div>
        )}
        <button onClick={onClose} className="w-full py-1.5 rounded text-[11px] cursor-pointer" style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}>Abbrechen</button>
      </div>
    </div>
  );
}

/** Inline buttons for rubric-level collection save/load (v3.77 #9) */
export function RubricCollectionButtons({ rubricType, getData, onLoad }: {
  rubricType: RubricType; getData: () => any; onLoad: (data: any) => void;
}) {
  const [showSave, setShowSave] = useState(false);
  const [showLoad, setShowLoad] = useState(false);

  const handleLoad = (snapshot: string) => {
    try {
      const parsed = JSON.parse(snapshot);
      // For full 'settings' items, extract just the rubric we need
      const rubricData = extractRubricData(rubricType, parsed);
      if (rubricData === undefined) { alert('Keine passenden Daten in dieser Konfiguration gefunden.'); return; }
      onLoad(rubricData);
      setShowLoad(false);
    } catch { alert('Fehler beim Lesen der Konfiguration.'); }
  };

  return (
    <>
      <div className="flex gap-1">
        <button onClick={() => setShowSave(true)}
          className="px-1.5 py-0.5 rounded text-[9px] cursor-pointer transition-all"
          style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-light)', color: 'var(--text-muted)' }}
          title={`${RUBRIC_LABELS[rubricType]} in Sammlung speichern`}>
          📥 Speichern
        </button>
        <button onClick={() => setShowLoad(true)}
          className="px-1.5 py-0.5 rounded text-[9px] cursor-pointer transition-all"
          style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-light)', color: 'var(--text-muted)' }}
          title={`${RUBRIC_LABELS[rubricType]} aus Sammlung laden`}>
          📚 Laden
        </button>
      </div>
      {showSave && <SaveToCollectionDialog rubricType={rubricType} data={getData()} onClose={() => setShowSave(false)} />}
      {showLoad && <RubricCollectionPicker rubricType={rubricType} onLoad={handleLoad} onClose={() => setShowLoad(false)} />}
    </>
  );
}

/** Compact action button style for Section headers (v3.80 C1) */
export const ACT_BTN = "px-1.5 py-0.5 rounded text-[9px] cursor-pointer transition-all";
export const ACT_BTN_STYLE: React.CSSProperties = { background: 'var(--bg-hover)', border: '1px solid var(--border-light)', color: 'var(--text-muted)' };

/** Combined header actions for a settings rubric: [+ Hinzufügen] [💾 Speichern] [📂 Laden] [📥 Import] */
export function SectionActions({ rubricType, getData, onLoad, onAdd, importAccept, onImport, onClearAll, itemCount }: {
  rubricType: RubricType; getData: () => any; onLoad: (data: any) => void;
  onAdd?: () => void; importAccept?: string; onImport?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearAll?: () => void; itemCount?: number;
}) {
  return (
    <>
      {onAdd && <button onClick={onAdd} className={ACT_BTN} style={ACT_BTN_STYLE} title="Hinzufügen">+</button>}
      <RubricCollectionButtons rubricType={rubricType} getData={getData} onLoad={onLoad} />
      {onImport && (
        <label className={ACT_BTN} style={ACT_BTN_STYLE} title="Aus Datei importieren">
          ⬆<input type="file" accept={importAccept || '.json'} className="hidden" onChange={onImport} />
        </label>
      )}
      {onClearAll && (
        <button
          onClick={onClearAll}
          disabled={!itemCount || itemCount === 0}
          className={`${ACT_BTN} ${!itemCount || itemCount === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:text-red-300 hover:border-red-500/50'}`}
          style={ACT_BTN_STYLE}
          title={itemCount ? `Alle ${itemCount} Einträge entfernen` : 'Keine Einträge vorhanden'}
        >✕ Alle</button>
      )}
    </>
  );
}

/** Extract rubric-specific data from a parsed settings snapshot */
export function extractRubricData(rubricType: RubricType, parsed: any): any {
  switch (rubricType) {
    case 'fachbereiche': return parsed.subjects ?? parsed;
    case 'kurse': return parsed.courses ?? parsed;
    case 'sonderwochen': return parsed.specialWeeks ?? parsed;
    case 'ferien': return parsed.holidays ?? parsed;
    case 'lehrplanziele': return parsed.curriculumGoals ?? parsed;
    case 'beurteilungsregeln': return parsed.assessmentRules ?? parsed;
    case 'settings': return parsed;
    default: return undefined;
  }
}
