import { useState } from 'react';
import { usePlannerStore } from '../store/plannerStore';
import { usePlannerData } from '../hooks/usePlannerData';
import { SUBJECT_AREA_COLORS } from '../utils/colors';
import type { CollectionItem, CollectionItemType, SubjectArea, CourseType } from '../types';

const TYPE_LABELS: Record<CollectionItemType, { label: string; icon: string }> = {
  unit: { label: 'Unterrichtseinheit', icon: '📄' },
  sequence: { label: 'Sequenz', icon: '📋' },
  schoolyear: { label: 'Schuljahr', icon: '📅' },
  curriculum: { label: 'Bildungsgang', icon: '🎓' },
  settings: { label: 'Konfiguration', icon: '⚙️' },
};


// === Import Dialog ===
function ImportDialog({ item, onClose }: { item: CollectionItem; onClose: () => void }) {
  const { courses: COURSES } = usePlannerData();
  const { importFromCollection } = usePlannerStore();
  const [targetCourseId, setTargetCourseId] = useState(COURSES[0]?.id || '');
  const [includeNotes, setIncludeNotes] = useState(false);
  const [includeMaterialLinks, setIncludeMaterialLinks] = useState(true);
  const [imported, setImported] = useState(false);

  const handleImport = () => {
    const seqId = importFromCollection(item.id, targetCourseId, { includeNotes, includeMaterialLinks });
    if (seqId) {
      setImported(true);
      setTimeout(onClose, 1200);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center" onClick={onClose}>
      <div className="bg-slate-800 border border-slate-600 rounded-lg p-4 w-80 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="text-[11px] font-bold text-gray-200 mb-3">
          {TYPE_LABELS[item.type].icon} Import: {item.title}
        </div>
        <div className="space-y-2">
          <div>
            <label className="text-[9px] text-gray-400">Zielkurs</label>
            <select value={targetCourseId} onChange={(e) => setTargetCourseId(e.target.value)}
              className="w-full bg-slate-700 text-slate-200 border border-slate-600 rounded px-2 py-1 text-[10px] outline-none focus:border-blue-400">
              {COURSES.map((c) => (
                <option key={c.id} value={c.id}>{c.cls} – {c.typ} {c.day} {c.from}–{c.to}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="flex items-center gap-1.5 text-[9px] text-gray-300 cursor-pointer">
              <input type="checkbox" checked={includeMaterialLinks} onChange={(e) => setIncludeMaterialLinks(e.target.checked)}
                className="rounded border-slate-600" />
              Materiallinks übernehmen
            </label>
            <label className="flex items-center gap-1.5 text-[9px] text-gray-300 cursor-pointer">
              <input type="checkbox" checked={includeNotes} onChange={(e) => setIncludeNotes(e.target.checked)}
                className="rounded border-slate-600" />
              Notizen & Reflexionen übernehmen
            </label>
          </div>
          <div className="text-[8px] text-gray-400 bg-slate-900/50 rounded p-1.5">
            ℹ Wochen werden nicht importiert — du weist sie nach dem Import manuell oder per AutoPlace zu.
            {item.units.length > 1 && ` ${item.units.length} Blöcke werden als neue Sequenz erstellt.`}
          </div>
          <div className="flex gap-1 justify-end pt-1">
            <button onClick={onClose}
              className="px-2 py-1 rounded text-[9px] text-gray-400 border border-gray-700 cursor-pointer hover:text-gray-200">
              Abbrechen
            </button>
            <button onClick={handleImport} disabled={imported}
              className={`px-2 py-1 rounded text-[9px] border cursor-pointer ${imported ? 'bg-green-700 border-green-600 text-green-200' : 'bg-blue-600 border-blue-500 text-white hover:bg-blue-500'}`}>
              {imported ? '✓ Importiert' : `Importieren (${item.units.length} UE)`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// === Archive Dialog ===
function ArchiveDialog({ onClose }: { onClose: () => void }) {
  const { sequences } = usePlannerStore();
  const { courses: COURSES } = usePlannerData();
  const [mode, setMode] = useState<'schoolyear' | 'curriculum'>('schoolyear');
  const [schoolYear, setSchoolYear] = useState('25/26');
  const [gymYears, setGymYears] = useState('GYM1-GYM4');
  const [selectedCls, setSelectedCls] = useState('');
  const [selectedType, setSelectedType] = useState<CourseType>('SF');
  const [archived, setArchived] = useState(false);

  // Get unique class+type combos that have sequences
  const combos = Array.from(new Set(sequences.map((s) => {
    const c = COURSES.find((co) => co.id === s.courseId);
    return c ? `${c.typ}|${c.cls}` : null;
  }).filter(Boolean) as string[])).map((combo) => {
    const [typ, cls] = combo.split('|');
    return { typ: typ as CourseType, cls };
  });

  const handleArchive = () => {
    const store = usePlannerStore.getState();
    if (mode === 'schoolyear') {
      store.archiveSchoolYear(selectedType, selectedCls, schoolYear);
    } else {
      store.archiveCurriculum(selectedType, selectedCls, schoolYear, gymYears);
    }
    setArchived(true);
    setTimeout(onClose, 1200);
  };

  // Auto-select first combo
  if (!selectedCls && combos.length > 0) {
    setSelectedCls(combos[0].cls);
    setSelectedType(combos[0].typ);
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center" onClick={onClose}>
      <div className="bg-slate-800 border border-slate-600 rounded-lg p-4 w-80 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="text-[11px] font-bold text-gray-200 mb-3">📦 Archivieren</div>
        <div className="space-y-2">
          <div className="flex gap-1">
            <button onClick={() => setMode('schoolyear')}
              className={`flex-1 px-2 py-1 rounded text-[9px] border cursor-pointer ${mode === 'schoolyear' ? 'bg-blue-500/20 border-blue-500 text-blue-300' : 'border-gray-600 text-gray-400'}`}>
              📅 Schuljahr
            </button>
            <button onClick={() => setMode('curriculum')}
              className={`flex-1 px-2 py-1 rounded text-[9px] border cursor-pointer ${mode === 'curriculum' ? 'bg-purple-500/20 border-purple-500 text-purple-300' : 'border-gray-600 text-gray-400'}`}>
              🎓 Bildungsgang
            </button>
          </div>
          <div>
            <label className="text-[9px] text-gray-400">Kurs</label>
            <select value={`${selectedType}|${selectedCls}`}
              onChange={(e) => { const [t, c] = e.target.value.split('|'); setSelectedType(t as CourseType); setSelectedCls(c); }}
              className="w-full bg-slate-700 text-slate-200 border border-slate-600 rounded px-2 py-1 text-[10px] outline-none">
              {combos.map((co) => (
                <option key={`${co.typ}|${co.cls}`} value={`${co.typ}|${co.cls}`}>{co.typ} {co.cls}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[9px] text-gray-400">Schuljahr</label>
            <input value={schoolYear} onChange={(e) => setSchoolYear(e.target.value)}
              className="w-full bg-slate-700 text-slate-200 border border-slate-600 rounded px-2 py-1 text-[10px] outline-none" />
          </div>
          {mode === 'curriculum' && (
            <div>
              <label className="text-[9px] text-gray-400">GYM-Jahre</label>
              <input value={gymYears} onChange={(e) => setGymYears(e.target.value)}
                className="w-full bg-slate-700 text-slate-200 border border-slate-600 rounded px-2 py-1 text-[10px] outline-none" />
            </div>
          )}
          <div className="flex gap-1 justify-end pt-1">
            <button onClick={onClose} className="px-2 py-1 rounded text-[9px] text-gray-400 border border-gray-700 cursor-pointer hover:text-gray-200">Abbrechen</button>
            <button onClick={handleArchive} disabled={archived || !selectedCls}
              className={`px-2 py-1 rounded text-[9px] border cursor-pointer ${archived ? 'bg-green-700 border-green-600 text-green-200' : 'bg-amber-600 border-amber-500 text-white hover:bg-amber-500'}`}>
              {archived ? '✓ Archiviert' : 'Archivieren'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// === Collection Item Card ===
function CollectionCard({ item, onImport }: { item: CollectionItem; onImport: (item: CollectionItem) => void }) {
  const { deleteCollectionItem, updateCollectionItem } = usePlannerStore();
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(item.title);
  const [editTags, setEditTags] = useState(item.tags?.join(', ') || '');

  const typeInfo = TYPE_LABELS[item.type];
  const saColor = item.subjectArea ? SUBJECT_AREA_COLORS[item.subjectArea] : null;
  const dateStr = new Date(item.createdAt).toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: '2-digit' });

  const handleSave = () => {
    updateCollectionItem(item.id, {
      title: editTitle,
      tags: editTags.split(',').map((t) => t.trim()).filter(Boolean),
    });
    setEditing(false);
  };

  return (
    <div className="border rounded-lg overflow-hidden transition-colors"
      style={{ borderColor: expanded ? (saColor?.bg || '#475569') : '#334155' }}>
      <div className="px-2 py-1.5 flex items-center gap-1.5 cursor-pointer hover:bg-slate-800/30"
        onClick={() => setExpanded(!expanded)}>
        <span className="text-[9px]">{typeInfo.icon}</span>
        {saColor && <div className="w-1 h-4 rounded-full shrink-0" style={{ background: saColor.bg }} />}
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-semibold text-gray-200 truncate">{item.title}</div>
          <div className="text-[8px] text-gray-400 flex items-center gap-1.5">
            <span>{typeInfo.label}</span>
            {item.type === 'settings' ? (
              <span>· {(() => { try { const s = JSON.parse(item.settingsSnapshot || '{}'); return `${s.courses?.length || 0} Kurse`; } catch { return ''; } })()}</span>
            ) : (
              <span>· {item.units.length} UE</span>
            )}
            {item.courseType && <span>· {item.courseType}</span>}
            {item.schoolYear && <span>· SJ {item.schoolYear}</span>}
            <span className="ml-auto">{dateStr}</span>
          </div>
        </div>
        <span className="text-[9px] text-gray-400">{expanded ? '▾' : '▸'}</span>
      </div>

      {expanded && (
        <div className="px-2 pb-2 pt-0.5 border-t border-slate-700/50 space-y-1.5">
          {/* Content — settings summary or unit list */}
          {item.type === 'settings' && item.settingsSnapshot ? (
            <div className="text-[8px] text-gray-400 space-y-0.5 px-1">
              {(() => { try { const s = JSON.parse(item.settingsSnapshot);
                return (<>
                  <div>📚 {s.courses?.length || 0} Kurse</div>
                  <div>🏖 {s.holidays?.length || 0} Ferienperioden</div>
                  <div>📅 {s.specialWeeks?.length || 0} Sonderwochen</div>
                  <div>🎨 {s.subjects?.length || 0} Fachbereiche</div>
                </>); } catch { return <div>Fehler beim Lesen</div>; } })()}
            </div>
          ) : (
            <div className="space-y-0.5 max-h-40 overflow-y-auto">
              {item.units.map((u, i) => (
                <div key={i} className="flex items-center gap-1 text-[8px] px-1 py-0.5 rounded hover:bg-slate-700/30">
                  <span className="text-gray-600">{i + 1}.</span>
                  <span className="text-gray-300 truncate">{u.block.label || '(ohne Titel)'}</span>
                  {u.block.subjectArea && (
                    <span className="ml-auto text-[7px] px-1 rounded" style={{
                      color: SUBJECT_AREA_COLORS[u.block.subjectArea]?.fg,
                      background: SUBJECT_AREA_COLORS[u.block.subjectArea]?.bg + '20',
                    }}>{u.block.subjectArea}</span>
                  )}
                  <span className="text-gray-600">{u.lessonTitles.filter(Boolean).length}L</span>
                </div>
              ))}
            </div>
          )}

          {/* Tags */}
          {item.tags && item.tags.length > 0 && (
            <div className="flex flex-wrap gap-0.5">
              {item.tags.map((t, i) => (
                <span key={i} className="text-[7px] px-1 py-px rounded bg-slate-700 text-gray-400">#{t}</span>
              ))}
            </div>
          )}

          {/* Edit mode */}
          {editing ? (
            <div className="space-y-1 p-1.5 bg-slate-800/50 rounded">
              <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
                className="w-full bg-slate-700/50 text-slate-200 border border-slate-600 rounded px-1.5 py-0.5 text-[9px] outline-none" />
              <input value={editTags} onChange={(e) => setEditTags(e.target.value)}
                placeholder="Tags (kommagetrennt)…"
                className="w-full bg-slate-700/50 text-slate-200 border border-slate-600 rounded px-1.5 py-0.5 text-[9px] outline-none" />
              <div className="flex gap-1 justify-end">
                <button onClick={() => setEditing(false)} className="text-[8px] text-gray-400 cursor-pointer">Abbrechen</button>
                <button onClick={handleSave} className="text-[8px] text-blue-400 cursor-pointer">Speichern</button>
              </div>
            </div>
          ) : (
            <div className="flex gap-1 justify-between items-center">
              <div className="flex gap-1">
                {item.type !== 'settings' && (
                  <button onClick={() => onImport(item)} className="text-[8px] text-blue-400 hover:text-blue-300 cursor-pointer">↗ Importieren</button>
                )}
                {item.type === 'settings' && (
                  <span className="text-[8px] text-gray-500">Laden via Einstellungen-Tab</span>
                )}
                <button onClick={() => setEditing(true)} className="text-[8px] text-gray-400 hover:text-gray-300 cursor-pointer">✏ Bearbeiten</button>
              </div>
              <button onClick={() => { if (confirm(`"${item.title}" aus Sammlung löschen?`)) deleteCollectionItem(item.id); }}
                className="text-[8px] text-red-400 hover:text-red-300 cursor-pointer">🗑</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// === Main Collection Panel ===
export function CollectionPanel() {
  const { collection } = usePlannerStore();
  const { categories } = usePlannerData();
  const [filterType, setFilterType] = useState<CollectionItemType | 'ALL'>('ALL');
  const [filterSA, setFilterSA] = useState<SubjectArea | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [importItem, setImportItem] = useState<CollectionItem | null>(null);
  const [showArchive, setShowArchive] = useState(false);

  // Filter collection
  const filtered = collection.filter((item) => {
    if (filterType !== 'ALL' && item.type !== filterType) return false;
    if (filterSA !== 'ALL' && item.subjectArea !== filterSA) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const inTitle = item.title.toLowerCase().includes(q);
      const inTags = item.tags?.some((t) => t.toLowerCase().includes(q));
      const inUnits = item.units.some((u) => u.block.label?.toLowerCase().includes(q));
      if (!inTitle && !inTags && !inUnits) return false;
    }
    return true;
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt)); // newest first

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Filters */}
      <div className="px-3 py-1.5 border-b border-slate-700/50 space-y-1 shrink-0">
        {/* Search */}
        <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Suche in Sammlung…"
          className="w-full bg-slate-800/50 text-slate-200 border border-slate-600 rounded px-2 py-1 text-[9px] outline-none focus:border-amber-400" />
        {/* Type filter */}
        <div className="flex gap-0.5 flex-wrap">
          {(['ALL', 'unit', 'sequence', 'schoolyear', 'curriculum', 'settings'] as const).map((t) => (
            <button key={t} onClick={() => setFilterType(t)}
              className={`px-1.5 py-0.5 rounded text-[8px] border cursor-pointer ${filterType === t ? 'bg-amber-500/20 border-amber-500 text-amber-300' : 'border-gray-600 text-gray-400'}`}>
              {t === 'ALL' ? 'Alle' : TYPE_LABELS[t].icon + ' ' + TYPE_LABELS[t].label}
            </button>
          ))}
        </div>
        {/* Subject area filter */}
        <div className="flex gap-0.5">
          <button onClick={() => setFilterSA('ALL')}
            className={`px-1.5 py-0.5 rounded text-[8px] border cursor-pointer ${filterSA === 'ALL' ? 'bg-slate-600 border-slate-500 text-gray-200' : 'border-gray-700 text-gray-400'}`}>
            Alle FB
          </button>
          {categories.map((sa) => (
            <button key={sa.key} onClick={() => setFilterSA(filterSA === sa.key ? 'ALL' : sa.key as SubjectArea)}
              className={`px-1.5 py-0.5 rounded text-[8px] border cursor-pointer ${filterSA === sa.key ? 'bg-opacity-20 border-current' : 'border-gray-700'}`}
              style={{ color: filterSA === sa.key ? sa.color : '#6b7280', borderColor: filterSA === sa.key ? sa.color : undefined }}>
              {sa.label}
            </button>
          ))}
        </div>
      </div>

      {/* Collection list */}
      <div className="flex-1 overflow-y-auto px-3 py-2 pb-12 space-y-1.5"
        style={{ overscrollBehavior: 'contain' }}
        onWheel={(e) => e.stopPropagation()}>
        {filtered.length === 0 && (
          <div className="text-center py-8 space-y-2">
            <div className="text-[24px]">📚</div>
            <div className="text-[10px] text-gray-400">
              {collection.length === 0
                ? 'Noch keine Einträge in der Sammlung'
                : 'Keine Treffer für diese Filter'}
            </div>
            <div className="text-[8px] text-gray-600">
              Speichere Unterrichtseinheiten, Sequenzen oder ganze Schuljahre
              über den 💾-Button im Sequenzen-Tab.
            </div>
          </div>
        )}
        {filtered.map((item) => (
          <CollectionCard key={item.id} item={item} onImport={setImportItem} />
        ))}
      </div>

      {/* Archive button */}
      <div className="px-3 py-2 border-t border-slate-600 shrink-0">
        <button onClick={() => setShowArchive(true)}
          className="w-full px-2 py-1.5 rounded text-[10px] text-amber-400 border border-dashed border-amber-700 cursor-pointer hover:bg-amber-900/20 hover:text-amber-300">
          📦 Schuljahr / Bildungsgang archivieren
        </button>
      </div>

      {/* Dialogs */}
      {importItem && <ImportDialog item={importItem} onClose={() => setImportItem(null)} />}
      {showArchive && <ArchiveDialog onClose={() => setShowArchive(false)} />}
    </div>
  );
}
