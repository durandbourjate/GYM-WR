import { useState } from 'react';
import { SmallInput } from './shared';
import { generateId, type HolidayConfig } from '../../store/settingsStore';

// === Holidays Editor (mit Tagesauswahl für partielle Wochen) ===
export function HolidaysEditor({ holidays, onChange }: { holidays: HolidayConfig[]; onChange: (h: HolidayConfig[]) => void }) {
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());

  const addHoliday = () => {
    onChange([...holidays, { id: generateId(), label: '', startWeek: '', endWeek: '' }]);
  };

  const update = (id: string, patch: Partial<HolidayConfig>) => {
    onChange(holidays.map(h => h.id === id ? { ...h, ...patch } : h));
  };

  const remove = (id: string) => {
    onChange(holidays.filter(h => h.id !== id));
  };

  const toggleExpanded = (id: string) => {
    setExpandedDays(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-1.5">
      <p className="text-[8px]" style={{ color: 'var(--text-muted)' }}>Ferienperioden als KW-Bereiche. Tagesauswahl erscheint automatisch bei Einzelwochen (z.B. Auffahrt).</p>
      {holidays.map(h => {
        const isSingleWeek = h.startWeek && h.endWeek && h.startWeek === h.endWeek;
        const hasPartialDays = h.days && h.days.length < 5;
        const showDays = isSingleWeek || hasPartialDays || expandedDays.has(h.id);
        return (
        <div key={h.id} className="rounded p-2 space-y-1.5" style={{ background: 'var(--bg-secondary)' }}>
          <div className="flex gap-1 items-center">
            <SmallInput value={h.label} onChange={(v) => update(h.id, { label: v })} placeholder="Name (z.B. Herbstferien)" className="flex-1" />
            <span className="text-[8px]" style={{ color: 'var(--text-muted)' }}>KW</span>
            <SmallInput value={h.startWeek} onChange={(v) => update(h.id, { startWeek: v })} placeholder="von" className="w-10" />
            <span className="text-[8px]" style={{ color: 'var(--text-muted)' }}>–</span>
            <SmallInput value={h.endWeek} onChange={(v) => update(h.id, { endWeek: v })} placeholder="bis" className="w-10" />
            {!isSingleWeek && !hasPartialDays && (
              <button onClick={() => toggleExpanded(h.id)}
                className="w-5 h-5 flex items-center justify-center text-[10px] cursor-pointer rounded"
                style={{ color: 'var(--text-dim)' }}
                title="Tagesauswahl anzeigen">
                {expandedDays.has(h.id) ? '▾' : '▸'}
              </button>
            )}
            <button onClick={() => remove(h.id)} className="ml-1 w-5 h-5 flex items-center justify-center text-[9px] text-red-400 cursor-pointer hover:bg-red-900/30 rounded" title="Entfernen">✕</button>
          </div>
          {/* Day selector — auto-shown for single weeks, toggled for multi-week */}
          {showDays && (
          <div className="flex items-center gap-1">
            <span className="text-[7px]" style={{ color: 'var(--text-muted)' }}>Tage:</span>
            {['Mo', 'Di', 'Mi', 'Do', 'Fr'].map((day, di) => {
              const dayNum = di + 1;
              const days = h.days || [1,2,3,4,5];
              const active = days.includes(dayNum);
              return (
                <button key={day} onClick={() => {
                  const current = h.days || [1,2,3,4,5];
                  const next = active ? current.filter(d => d !== dayNum) : [...current, dayNum].sort();
                  update(h.id, { days: next.length === 5 ? undefined : next });
                }}
                  className={`px-1.5 py-px rounded text-[8px] cursor-pointer transition-all border ${
                    active ? '' : 'border-transparent'
                  }`}
                  style={active ? { background: 'var(--bg-hover)', borderColor: 'var(--border-light)', color: 'var(--text-primary)' } : { background: 'var(--bg-hover)', color: 'var(--text-dim)' }}>
                  {day}
                </button>
              );
            })}
            {(h.days && h.days.length < 5) && (
              <button onClick={() => update(h.id, { days: undefined })}
                className="text-[7px] cursor-pointer ml-1" style={{ color: 'var(--text-dim)' }}>Ganze Woche</button>
            )}
          </div>
          )}
        </div>
        );
      })}
      <button onClick={addHoliday}
        className="w-full py-1 rounded border border-dashed text-[9px] cursor-pointer"
        style={{ borderColor: 'var(--border-light)', color: 'var(--text-muted)' }}>
        + Ferienperiode hinzufügen
      </button>
    </div>
  );
}
