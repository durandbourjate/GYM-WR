import { useState } from 'react';
import { SmallInput } from './shared';
import { generateId, type SubjectConfig } from '../../store/settingsStore';
import { generateColorVariants } from '../../data/categories';
import { SUBJECT_PRESETS, SUBJECT_GROUPS } from '../../data/subjectPresets';

// === Subjects / Categories Editor ===
export function SubjectsEditor({ subjects, onChange }: { subjects: SubjectConfig[]; onChange: (s: SubjectConfig[]) => void }) {
  const [editingId, setEditingId] = useState<string | null>(null);

  const addSubject = () => {
    const newSubj: SubjectConfig = {
      id: generateId(), label: '', shortLabel: '', color: '#64748b', courseType: 'SF',
    };
    onChange([...subjects, newSubj]);
    setEditingId(newSubj.id);
  };

  const update = (id: string, patch: Partial<SubjectConfig>) => {
    onChange(subjects.map(s => s.id === id ? { ...s, ...patch } : s));
  };

  const remove = (id: string) => {
    if (confirm('Fachbereich wirklich entfernen? Bestehende Zuordnungen bleiben erhalten, werden aber nicht mehr farbig angezeigt.')) {
      onChange(subjects.filter(s => s.id !== id));
      if (editingId === id) setEditingId(null);
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-[9px]" style={{ color: 'var(--text-muted)' }}>Fachbereiche definieren die Farben und Kategorien für die Unterrichtsplanung. INTERDISZ wird automatisch ergänzt.</p>
      {subjects.length === 0 && (
        <p className="text-[11px] text-amber-400/80 bg-amber-900/20 border border-amber-700/30 rounded px-2 py-1.5">
          Keine Fachbereiche konfiguriert. Füge einen Fachbereich hinzu oder wähle eine Vorlage.
        </p>
      )}
      {subjects.map(s => (
        <div key={s.id}>
          {editingId === s.id ? (
            <div className="rounded p-2 space-y-1.5" style={{ background: 'var(--bg-secondary)' }}>
              <div className="flex gap-1 items-center">
                <input type="color" value={s.color} onChange={(e) => update(s.id, { color: e.target.value })}
                  className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent" />
                <SmallInput value={s.label} onChange={(v) => update(s.id, { label: v })} placeholder="Name (z.B. Mathematik)" className="flex-1" />
                <SmallInput value={s.shortLabel} onChange={(v) => update(s.id, { shortLabel: v })} placeholder="Kürzel" className="w-12" />
              </div>
              <div className="flex gap-1 items-center">
                <span className="text-[8px]" style={{ color: 'var(--text-muted)' }}>Vorschau:</span>
                {(() => { const cv = generateColorVariants(s.color); return (
                  <span className="text-[9px] px-1.5 py-0.5 rounded font-semibold" style={{ background: cv.bg, color: cv.fg, border: `1px solid ${cv.border}` }}>
                    {s.shortLabel || s.label || '?'}
                  </span>
                ); })()}
              </div>
              <div className="flex gap-1 mt-1">
                <button onClick={() => setEditingId(null)} className="text-[9px] text-indigo-400 cursor-pointer">✓ Fertig</button>
                <button onClick={() => remove(s.id)} className="text-[9px] text-red-400 cursor-pointer ml-auto">Entfernen</button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-[11px] cursor-pointer group px-1 py-0.5"
              style={{ color: 'var(--text-muted)' }}
              onClick={() => setEditingId(s.id)}>
              <div className="w-3 h-3 rounded-sm shrink-0" style={{ background: s.color }} />
              <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>{s.label || '(unbenennt)'}</span>
              <span style={{ color: 'var(--text-dim)' }}>{s.shortLabel}</span>
            </div>
          )}
        </div>
      ))}
      <div className="flex gap-1 flex-wrap">
        <button onClick={addSubject}
          className="flex-1 py-1 rounded border border-dashed text-[11px] cursor-pointer transition-all"
          style={{ borderColor: 'var(--border-light)', color: 'var(--text-muted)' }}>
          + Fachbereich hinzufügen
        </button>
      </div>
      {/* Fach-Dropdown (v3.82 E5: Einzelfächer statt Gruppen) */}
      <div className="flex gap-1 items-center">
        <span className="text-[9px]" style={{ color: 'var(--text-dim)' }}>Vorlage:</span>
        <select
          className="rounded px-1.5 py-0.5 text-[11px] outline-none cursor-pointer flex-1"
          style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', color: 'var(--text-secondary)' }}
          value=""
          onChange={(e) => {
            const preset = SUBJECT_PRESETS.find(p => p.id === e.target.value);
            if (!preset) return;
            const ids = new Set(subjects.map(s => s.id));
            const labels = new Set(subjects.map(s => s.label.toLowerCase()));
            const unique = preset.subjects.filter(s => !ids.has(s.id) && !labels.has(s.label.toLowerCase()));
            const dupes = preset.subjects.length - unique.length;
            if (unique.length === 0) { alert(`«${preset.label}» ist bereits vorhanden.`); return; }
            if (subjects.length === 0) {
              // Leer → direkt laden
              onChange([...unique]);
            } else {
              // Dialog: Ergänzen oder Ersetzen
              const choice = confirm(
                `«${preset.label}» laden:\n\n` +
                `• OK = Bestehende ersetzen (${subjects.length} → ${preset.subjects.length})\n` +
                `• Abbrechen = Ergänzen (${unique.length} hinzufügen${dupes > 0 ? `, ${dupes} Duplikate übersprungen` : ''})`
              );
              if (choice) {
                onChange([...preset.subjects]);
              } else {
                onChange([...subjects, ...unique]);
              }
            }
          }}
        >
          <option value="">Fach wählen…</option>
          {SUBJECT_GROUPS.map(group => (
            <optgroup key={group} label={`── ${group} ──`}>
              {SUBJECT_PRESETS.filter(p => p.group === group).map(p => (
                <option key={p.id} value={p.id}>{p.icon} {p.label}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>
    </div>
  );
}
