import { useState, useCallback } from 'react';
import { useToast } from '@gymhofwil/shared';
import { ladeKurse, getCacheAge, type ZentralerKurs } from '../../services/synergyService';
import { useSynergyKonfiguriert } from '../../store/synergyConfigStore';
import type { CourseConfig } from '../../store/settingsStore';
import { ACT_BTN, ACT_BTN_STYLE } from './shared';

interface Props {
  existingCourses: CourseConfig[];
  onChange: (courses: CourseConfig[]) => void;
}

// Mapping ZentralerKurs → CourseConfig
function mapKurse(zk: ZentralerKurs[]): CourseConfig[] {
  return zk.map((k) => ({
    id: k.kursId,
    cls: k.klassen,
    typ: k.gefaess.toUpperCase(), // sf → SF, in → IN etc.
    day: 'Mo' as const,
    from: '08:05',
    to: '08:50',
    les: 1,
    hk: false,
    semesters: [1, 2] as [1, 2],
  }));
}

export function KursImportButton({ existingCourses, onChange }: Props) {
  const toast = useToast();
  const konfiguriert = useSynergyKonfiguriert();
  const [loading, setLoading] = useState(false);
  const [dialog, setDialog] = useState<ZentralerKurs[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const handleImport = useCallback(async () => {
    setLoading(true);
    try {
      const kurse = await ladeKurse();
      if (kurse.length === 0) {
        toast.warning('Keine Kurse im zentralen Sheet gefunden.');
        setLoading(false);
        return;
      }
      // Duplikate erkennen
      const existingIds = new Set(existingCourses.map((c) => c.id));
      const neueKurse = kurse.filter((k) => !existingIds.has(k.kursId));
      if (neueKurse.length === 0) {
        toast.info(`Alle ${kurse.length} Kurse sind bereits vorhanden.`);
        setLoading(false);
        return;
      }
      setDialog(neueKurse);
      setSelected(new Set(neueKurse.map((k) => k.kursId)));
    } catch {
      toast.error('Fehler beim Laden der Kurse aus dem Sheet.');
    }
    setLoading(false);
  }, [existingCourses]);

  const handleConfirm = useCallback(() => {
    if (!dialog) return;
    const ausgewaehlt = dialog.filter((k) => selected.has(k.kursId));
    const mapped = mapKurse(ausgewaehlt);
    onChange([...existingCourses, ...mapped]);
    setDialog(null);
  }, [dialog, selected, existingCourses, onChange]);

  if (!konfiguriert) return null;

  return (
    <>
      <button
        onClick={handleImport}
        disabled={loading}
        className={ACT_BTN}
        style={ACT_BTN_STYLE}
        title={`Kurse aus zentralem Sheet importieren${getCacheAge('kurse') ? ` (${getCacheAge('kurse')})` : ''}`}
      >
        {loading ? '⟳ ...' : '📥 Sheet'}
      </button>

      {dialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="rounded-lg shadow-xl max-w-md w-full mx-4 p-4 space-y-3" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>
            <h3 className="text-[14px] font-semibold">Kurse aus Sheet importieren</h3>
            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              {dialog.length} neue Kurse gefunden. Zeiten und Tage müssen nach dem Import manuell ergänzt werden.
            </p>

            <div className="max-h-48 overflow-y-auto space-y-1">
              {dialog.map((k) => (
                <label key={k.kursId} className="flex items-center gap-2 text-[12px] py-0.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selected.has(k.kursId)}
                    onChange={() => {
                      const next = new Set(selected);
                      if (next.has(k.kursId)) next.delete(k.kursId);
                      else next.add(k.kursId);
                      setSelected(next);
                    }}
                  />
                  <span className="font-medium">{k.kursId}</span>
                  <span style={{ color: 'var(--text-muted)' }}>({k.label})</span>
                </label>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => setDialog(null)}
                className="px-3 py-1 rounded text-[12px] cursor-pointer"
                style={{ color: 'var(--text-muted)', border: '1px solid var(--border-light)' }}
              >
                Abbrechen
              </button>
              <button
                onClick={handleConfirm}
                disabled={selected.size === 0}
                className="px-3 py-1 rounded text-[12px] font-medium cursor-pointer disabled:opacity-50"
                style={{ background: 'var(--text-link)', color: '#fff' }}
              >
                {selected.size} Kurse importieren
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
