import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ladePruefungsDaten,
  getPruefungsCacheAlter,
  type PruefungBadge,
  type NotenStandInfo,
} from '../services/pruefungBridge';
import { useSynergyKonfiguriert } from '../store/synergyConfigStore';

interface SynergyData {
  badges: PruefungBadge[];
  notenStand: NotenStandInfo[];
  loading: boolean;
  error: string | null;
  cacheAge: string | null;
  getBadgesFuerKW: (kw: number) => PruefungBadge[];
  refresh: () => void;
}

export function useSynergyData(): SynergyData {
  const [badges, setBadges] = useState<PruefungBadge[]>([]);
  const [notenStand, setNotenStand] = useState<NotenStandInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cacheAge, setCacheAge] = useState<string | null>(null);
  const konfiguriert = useSynergyKonfiguriert();

  const laden = useCallback(async () => {
    if (!konfiguriert) return;
    setLoading(true);
    setError(null);
    try {
      const result = await ladePruefungsDaten();
      if (result) {
        setBadges(result.badges);
        setNotenStand(result.notenStand);
      }
      setCacheAge(getPruefungsCacheAlter());
    } catch {
      setError('Prüfungsdaten konnten nicht geladen werden');
    } finally {
      setLoading(false);
    }
  }, [konfiguriert]);

  useEffect(() => { laden(); }, [laden]);

  const getBadgesFuerKW = useCallback((kw: number): PruefungBadge[] => {
    return badges.filter((b) => b.kw === kw);
  }, [badges]);

  const refresh = useCallback(() => {
    try {
      localStorage.removeItem('synergy-pruefungen');
      localStorage.removeItem('synergy-notenstand');
    } catch { /* ignorieren */ }
    laden();
  }, [laden]);

  return useMemo(() => ({
    badges, notenStand, loading, error, cacheAge, getBadgesFuerKW, refresh,
  }), [badges, notenStand, loading, error, cacheAge, getBadgesFuerKW, refresh]);
}
