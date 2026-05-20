import { useState, useCallback } from 'react';
import { Section } from './shared';
import { useSynergyData } from '../../hooks/useSynergyData';
import { useSynergyKonfiguriert } from '../../store/synergyConfigStore';
import type { NotenStandInfo } from '../../services/pruefungBridge';

// Gefäss-Labels für Anzeige
const GEFAESS_LABELS: Record<string, string> = {
  SF: 'Schwerpunktfach', EWR: 'Ergänzungsfach WR', EF: 'Ergänzungsfach',
  IN: 'Informatik', KS: 'Klassenstunde',
};

function fortschrittFarbe(vorhandene: number, erforderliche: number): string {
  if (erforderliche <= 0) return 'bg-slate-400';
  const ratio = vorhandene / erforderliche;
  if (ratio >= 1) return 'bg-green-500';
  if (ratio >= 0.5) return 'bg-amber-500';
  return 'bg-red-500';
}

function NotenZeile({ info }: { info: NotenStandInfo }) {
  const pct = info.erforderliche > 0
    ? Math.min(100, Math.round((info.vorhandene / info.erforderliche) * 100))
    : 0;
  const label = GEFAESS_LABELS[info.gefaess] || info.gefaess;
  const farbe = fortschrittFarbe(info.vorhandene, info.erforderliche);

  return (
    <div className="flex items-center gap-2 text-[12px]" style={{ color: 'var(--text-primary)' }}>
      <span className="w-28 truncate font-medium" title={label}>{label}</span>
      <span className="w-8 text-center" style={{ color: 'var(--text-muted)' }}>{info.semester}</span>
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-hover)' }}>
        <div className={`h-full rounded-full transition-all ${farbe}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-12 text-right text-[11px]" style={{ color: 'var(--text-muted)' }}>
        {info.vorhandene}/{info.erforderliche}
      </span>
    </div>
  );
}

export function NotenStandSection() {
  const { notenStand, loading, error, cacheAge, refresh } = useSynergyData();
  const konfiguriert = useSynergyKonfiguriert();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    refresh();
    // Kurzer visueller Delay damit der Button-Feedback sichtbar ist
    setTimeout(() => setRefreshing(false), 1000);
  }, [refresh]);

  if (!konfiguriert) {
    return (
      <Section title="📊 Noten-Stand">
        <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
          Nicht konfiguriert. Apps-Script-URL und LP-E-Mail in der Sektion „Synergy-Verbindung" eintragen.
        </p>
      </Section>
    );
  }

  return (
    <Section title="📊 Noten-Stand" actions={
      <button
        onClick={handleRefresh}
        disabled={refreshing || loading}
        className="text-[11px] px-2 py-0.5 rounded cursor-pointer disabled:opacity-50"
        style={{ color: 'var(--text-muted)', border: '1px solid var(--border-light)' }}
        title="Daten neu laden"
      >
        {refreshing || loading ? '⟳ ...' : '⟳'}
      </button>
    }>
      {loading && notenStand.length === 0 && (
        <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>Lade Noten-Stand...</p>
      )}

      {error && (
        <p className="text-[12px] text-red-400">{error}</p>
      )}

      {notenStand.length === 0 && !loading && !error && (
        <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>Keine Noten-Daten vorhanden.</p>
      )}

      {notenStand.length > 0 && (
        <div className="space-y-1.5">
          {notenStand.map((info, i) => (
            <NotenZeile key={`${info.gefaess}-${info.semester}-${i}`} info={info} />
          ))}
        </div>
      )}

      {cacheAge && (
        <p className="text-[10px] mt-2" style={{ color: 'var(--text-muted)' }}>
          Aktualisiert: {cacheAge}
        </p>
      )}
    </Section>
  );
}
