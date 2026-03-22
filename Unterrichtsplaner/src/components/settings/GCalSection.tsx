import { useState, useCallback } from 'react';
import type { Course, CourseType, DayOfWeek, Semester } from '../../types';
import { usePlannerStore } from '../../store/plannerStore';
import { saveSettings, applySettingsToWeekData, type SpecialWeekConfig } from '../../store/settingsStore';
import { useInstanceStore, weekToDate } from '../../store/instanceStore';
import { useGCalStore } from '../../store/gcalStore';
import { loginWithGoogle, logout as gcalLogout, fetchCalendarList, syncPlannerToCalendar, buildWeekYearMap, scanCalendarsForSpecialWeeks, checkCollisions, type SyncProgress, type ImportCandidate } from '../../services/gcal';
import { Section } from './shared';
import { formatGymLevel } from './SpecialWeeksEditor';

// === Google Calendar Section (v3.60) ===
export function GCalSection() {
  const { clientId, setClientId, calendars, setCalendars,
    writeCalendarId, setWriteCalendarId, readCalendarIds, toggleReadCalendar } = useGCalStore();
  const isAuth = useGCalStore(s => s.isAuthenticated());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editClientId, setEditClientId] = useState(clientId);
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<SyncProgress | null>(null);
  const [syncResult, setSyncResult] = useState<SyncProgress | null>(null);
  const [importing, setImporting] = useState(false);
  const [importCandidates, setImportCandidates] = useState<ImportCandidate[] | null>(null);
  const [selectedImports, setSelectedImports] = useState<Set<string>>(new Set());
  const [checkingCollisions, setCheckingCollisions] = useState(false);
  const collisionCount = Object.keys(useGCalStore(s => s.collisions)).length;

  const handleLogin = useCallback(async () => {
    if (!editClientId.trim()) { setError('Client ID erforderlich'); return; }
    setClientId(editClientId.trim());
    setLoading(true); setError(null);
    try {
      await loginWithGoogle(editClientId.trim());
      const cals = await fetchCalendarList();
      setCalendars(cals);
      // Auto-select primary calendar as write calendar
      const primary = cals.find((c: any) => c.primary);
      if (primary && !writeCalendarId) setWriteCalendarId(primary.id);
    } catch (e: any) {
      setError(e.message || 'Login fehlgeschlagen');
    }
    setLoading(false);
  }, [editClientId, setClientId, setCalendars, writeCalendarId, setWriteCalendarId]);

  const handleLogout = useCallback(() => {
    gcalLogout();
    setError(null);
  }, []);

  const handleRefreshCalendars = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const cals = await fetchCalendarList();
      setCalendars(cals);
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  }, [setCalendars]);

  const handleSync = useCallback(async () => {
    if (!writeCalendarId) { setError('Kein Schreib-Kalender ausgewählt'); return; }
    const activeMeta = useInstanceStore.getState().getActive();
    if (!activeMeta) { setError('Kein aktiver Planer'); return; }
    const store = usePlannerStore.getState();
    const weekData = store.weekData;
    const settings = store.plannerSettings;
    if (!settings || !weekData.length) { setError('Keine Planerdaten vorhanden'); return; }

    // Build courses from settings (same logic as usePlannerData)
    const courses: Course[] = settings.courses.map((cc, i) => ({
      id: cc.id || `c${i}`,
      col: i,
      cls: cc.cls,
      typ: cc.typ as CourseType,
      day: cc.day as DayOfWeek,
      from: cc.from,
      to: cc.to,
      les: cc.les as 1 | 2 | 3,
      hk: cc.hk ?? false,
      semesters: cc.semesters as Semester[],
      note: cc.note,
    }));

    const weekYearMap = buildWeekYearMap(
      activeMeta.startWeek, activeMeta.startYear,
      activeMeta.endWeek, activeMeta.endYear,
    );

    setSyncing(true); setSyncProgress(null); setSyncResult(null); setError(null);
    try {
      const result = await syncPlannerToCalendar(
        writeCalendarId, weekData, courses, weekYearMap,
        (p) => setSyncProgress({ ...p }),
      );
      setSyncResult(result);
      if (result.errors.length > 0) {
        setError(`${result.errors.length} Fehler beim Sync`);
      }
    } catch (e: any) {
      setError(e.message || 'Sync fehlgeschlagen');
    }
    setSyncing(false);
  }, [writeCalendarId]);

  const handleScanImport = useCallback(async () => {
    if (readCalendarIds.length === 0) { setError('Keine Lese-Kalender ausgewählt'); return; }
    const activeMeta = useInstanceStore.getState().getActive();
    if (!activeMeta) { setError('Kein aktiver Planer'); return; }

    // Build time range from planner meta
    const weekYearMap = buildWeekYearMap(activeMeta.startWeek, activeMeta.startYear, activeMeta.endWeek, activeMeta.endYear);
    const weeks = Object.entries(weekYearMap);
    if (weeks.length === 0) return;
    const firstWeek = weeks[0];
    const lastWeek = weeks[weeks.length - 1];
    const timeMin = new Date(weekToDate(parseInt(firstWeek[0]), firstWeek[1])).toISOString();
    const lastMon = weekToDate(parseInt(lastWeek[0]), lastWeek[1]);
    lastMon.setDate(lastMon.getDate() + 6);
    const timeMax = lastMon.toISOString();

    setImporting(true); setError(null); setImportCandidates(null);
    try {
      const candidates = await scanCalendarsForSpecialWeeks(readCalendarIds, timeMin, timeMax);
      setImportCandidates(candidates);
      // Pre-select all
      setSelectedImports(new Set(candidates.map(c => c.event.id)));
    } catch (e: any) {
      setError(e.message || 'Scan fehlgeschlagen');
    }
    setImporting(false);
  }, [readCalendarIds]);

  const handleConfirmImport = useCallback(() => {
    if (!importCandidates) return;
    const store = usePlannerStore.getState();
    const settings = store.plannerSettings;
    if (!settings) { setError('Keine Planer-Settings'); return; }

    const toImport = importCandidates.filter(c => selectedImports.has(c.event.id));
    if (toImport.length === 0) return;

    // Merge with existing specialWeeks, avoid duplicates by week+label
    const existing = settings.specialWeeks || [];
    const existingKeys = new Set(existing.map(s => `${s.week}-${s.label}`));
    const newWeeks: SpecialWeekConfig[] = [];
    for (const c of toImport) {
      const key = `${c.suggestedConfig.week}-${c.suggestedConfig.label}`;
      if (!existingKeys.has(key)) {
        newWeeks.push(c.suggestedConfig);
        existingKeys.add(key);
      }
    }

    if (newWeeks.length === 0) {
      setError('Alle ausgewählten Events sind bereits als Sonderwochen vorhanden.');
      return;
    }

    store.setPlannerSettings({ ...settings, specialWeeks: [...existing, ...newWeeks] });
    // Also save to global settings
    saveSettings({ ...settings, specialWeeks: [...existing, ...newWeeks] });
    // Apply to weekData
    if (store.weekData.length > 0) {
      const applied = applySettingsToWeekData(store.weekData, { ...settings, specialWeeks: [...existing, ...newWeeks] });
      store.pushUndo();
      store.setWeekData(applied.weekData);
    }

    setImportCandidates(null);
    setSelectedImports(new Set());
    alert(`${newWeeks.length} Sonderwoche(n) importiert.`);
  }, [importCandidates, selectedImports]);

  const handleCheckCollisions = useCallback(async () => {
    if (readCalendarIds.length === 0) { setError('Keine Lese-Kalender ausgewählt'); return; }
    const activeMeta = useInstanceStore.getState().getActive();
    if (!activeMeta) { setError('Kein aktiver Planer'); return; }
    const store = usePlannerStore.getState();
    const weekData = store.weekData;
    const settings = store.plannerSettings;
    if (!settings || !weekData.length) { setError('Keine Planerdaten vorhanden'); return; }

    const courses: Course[] = settings.courses.map((cc, i) => ({
      id: cc.id || `c${i}`,
      col: i,
      cls: cc.cls,
      typ: cc.typ as CourseType,
      day: cc.day as DayOfWeek,
      from: cc.from,
      to: cc.to,
      les: cc.les as 1 | 2 | 3,
      hk: cc.hk ?? false,
      semesters: cc.semesters as Semester[],
      note: cc.note,
    }));

    const weekYearMap = buildWeekYearMap(activeMeta.startWeek, activeMeta.startYear, activeMeta.endWeek, activeMeta.endYear);

    setCheckingCollisions(true); setError(null);
    try {
      const collisions = await checkCollisions(readCalendarIds, weekData, courses, weekYearMap);
      useGCalStore.getState().setCollisions(collisions);
    } catch (e: any) {
      setError(e.message || 'Kollisionsprüfung fehlgeschlagen');
    }
    setCheckingCollisions(false);
  }, [readCalendarIds]);

  return (
    <Section title="📅 Google Calendar">
      <div className="space-y-2">
        <p className="text-[9px]" style={{ color: 'var(--text-muted)' }}>
          Verbinde einen Google Kalender, um Lektionen als Events zu synchronisieren und Kollisionen zu erkennen.
        </p>

        {/* Client ID */}
        <div>
          <label className="text-[9px] block mb-0.5" style={{ color: 'var(--text-muted)' }}>OAuth Client ID</label>
          <input
            type="text"
            value={editClientId}
            onChange={(e) => setEditClientId(e.target.value)}
            placeholder="xxxx.apps.googleusercontent.com"
            className="w-full text-[11px] px-2 py-1 rounded outline-none focus:border-indigo-500"
            style={{ background: 'var(--bg-hover)', color: 'var(--text-primary)', border: '1px solid var(--border-light)' }}
          />
          <p className="text-[8px] mt-0.5" style={{ color: 'var(--text-dim)' }}>
            Erstelle eine OAuth Client ID in der <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener" className="text-indigo-400 hover:underline">Google Cloud Console</a>.
          </p>
        </div>

        {/* Login/Logout */}
        <div className="flex gap-1">
          {!isAuth ? (
            <button onClick={handleLogin} disabled={loading}
              className="flex-1 py-1.5 rounded text-[11px] font-medium bg-indigo-700 hover:bg-indigo-600 text-white cursor-pointer transition-all disabled:opacity-50">
              {loading ? '⏳ Verbinde…' : '🔑 Mit Google anmelden'}
            </button>
          ) : (
            <>
              <div className="flex-1 py-1.5 rounded text-[11px] font-medium bg-green-900/40 text-green-300 text-center border border-green-800/50">
                ✅ Verbunden
              </div>
              <button onClick={handleLogout}
                className="px-2 py-1.5 rounded text-[11px] hover:bg-red-900/60 hover:text-red-300 cursor-pointer transition-all"
                style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)' }}>
                Abmelden
              </button>
            </>
          )}
        </div>

        {error && <div className="text-[9px] text-red-400 bg-red-900/20 px-2 py-1 rounded">❌ {error}</div>}

        {/* Calendar selection (when authenticated) */}
        {isAuth && calendars.length > 0 && (
          <div className="space-y-2 pt-1 border-t" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold" style={{ color: 'var(--text-secondary)' }}>Kalender</span>
              <button onClick={handleRefreshCalendars} disabled={loading}
                className="text-[9px] text-indigo-400 hover:text-indigo-300 cursor-pointer">
                🔄 Aktualisieren
              </button>
            </div>

            {/* Write calendar */}
            <div>
              <label className="text-[9px] block mb-0.5" style={{ color: 'var(--text-muted)' }}>Schreib-Kalender (Planer → Kalender)</label>
              <select
                value={writeCalendarId || ''}
                onChange={(e) => setWriteCalendarId(e.target.value || null)}
                className="w-full text-[11px] px-2 py-1 rounded"
                style={{ background: 'var(--bg-hover)', color: 'var(--text-primary)', border: '1px solid var(--border-light)' }}
              >
                <option value="">— Kein Kalender —</option>
                {calendars
                  .filter(c => c.accessRole === 'owner' || c.accessRole === 'writer')
                  .map(c => (
                    <option key={c.id} value={c.id}>{c.summary}{c.primary ? ' (Primär)' : ''}</option>
                  ))}
              </select>
            </div>

            {/* Read calendars */}
            <div>
              <label className="text-[9px] block mb-0.5" style={{ color: 'var(--text-muted)' }}>Lese-Kalender (Kalender → Planer / Kollisionen)</label>
              <div className="max-h-32 overflow-y-auto space-y-0.5">
                {calendars.map(c => (
                  <label key={c.id} className="flex items-center gap-1.5 px-1.5 py-0.5 rounded cursor-pointer text-[11px]">
                    <input
                      type="checkbox"
                      checked={readCalendarIds.includes(c.id)}
                      onChange={() => toggleReadCalendar(c.id)}
                      className="accent-indigo-500 w-3 h-3"
                    />
                    <span className="truncate" style={{ color: 'var(--text-primary)' }}>{c.summary}</span>
                    {c.primary && <span className="text-[8px] text-indigo-400">Primär</span>}
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {isAuth && calendars.length === 0 && !loading && (
          <button onClick={handleRefreshCalendars}
            className="w-full py-1.5 rounded text-[11px] cursor-pointer transition-all"
            style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)' }}>
            📋 Kalender laden
          </button>
        )}

        {/* Sync section (v3.61) */}
        {isAuth && writeCalendarId && (
          <div className="space-y-1.5 pt-1.5 border-t" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold" style={{ color: 'var(--text-secondary)' }}>Planer → Kalender Sync</span>
            </div>
            <p className="text-[8px]" style={{ color: 'var(--text-dim)' }}>
              Erstellt/aktualisiert Google Calendar Events für alle Lektionen. Events werden mit einem <code>planer-managed</code>-Tag markiert.
            </p>
            <button onClick={handleSync} disabled={syncing}
              className="w-full py-1.5 rounded text-[11px] font-medium bg-indigo-700 hover:bg-indigo-600 text-white cursor-pointer transition-all disabled:opacity-50">
              {syncing ? '⏳ Synchronisiere…' : '🔄 Jetzt synchronisieren'}
            </button>

            {/* Progress bar */}
            {syncing && syncProgress && (
              <div className="space-y-0.5">
                <div className="w-full rounded-full h-1.5" style={{ background: 'var(--bg-hover)' }}>
                  <div className="bg-indigo-500 h-1.5 rounded-full transition-all"
                    style={{ width: `${syncProgress.total > 0 ? (syncProgress.done / syncProgress.total * 100) : 0}%` }} />
                </div>
                <p className="text-[8px]" style={{ color: 'var(--text-dim)' }}>
                  {syncProgress.done} / {syncProgress.total} — {syncProgress.created} erstellt, {syncProgress.updated} aktualisiert, {syncProgress.deleted} gelöscht
                </p>
              </div>
            )}

            {/* Result */}
            {syncResult && !syncing && (
              <div className={`text-[9px] px-2 py-1 rounded ${syncResult.errors.length > 0 ? 'bg-amber-900/20 text-amber-300' : 'bg-green-900/20 text-green-300'}`}>
                ✅ Sync abgeschlossen: {syncResult.created} erstellt, {syncResult.updated} aktualisiert, {syncResult.deleted} gelöscht
                {syncResult.errors.length > 0 && (
                  <div className="mt-1 text-[8px] text-red-400">
                    {syncResult.errors.slice(0, 5).map((e, i) => <div key={i}>• {e}</div>)}
                    {syncResult.errors.length > 5 && <div>… und {syncResult.errors.length - 5} weitere</div>}
                  </div>
                )}
              </div>
            )}

            {/* Clear event mapping */}
            <button onClick={() => {
              if (confirm('Event-Mapping zurücksetzen? Beim nächsten Sync werden alle Events neu erstellt (bestehende Events im Kalender werden nicht gelöscht).')) {
                useGCalStore.getState().clearEventMap();
                setSyncResult(null);
              }
            }}
              className="text-[8px] cursor-pointer" style={{ color: 'var(--text-dim)' }}>
              🗑 Event-Mapping zurücksetzen
            </button>
          </div>
        )}

        {/* Import section (v3.62) */}
        {isAuth && readCalendarIds.length > 0 && (
          <div className="space-y-1.5 pt-1.5 border-t" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold" style={{ color: 'var(--text-secondary)' }}>Kalender → Planer Import</span>
            </div>
            <p className="text-[8px]" style={{ color: 'var(--text-dim)' }}>
              Scannt Lese-Kalender nach Sonderwochen (IW, Besuchstag, Studienreise etc.) und importiert sie als Sonderwochen-Einstellungen.
            </p>
            <button onClick={handleScanImport} disabled={importing}
              className="w-full py-1.5 rounded text-[11px] font-medium cursor-pointer transition-all disabled:opacity-50"
              style={{ background: 'var(--bg-hover)', color: 'var(--text-primary)' }}>
              {importing ? '⏳ Scanne Kalender…' : '📥 Sonderwochen aus Kalender importieren'}
            </button>

            {/* Import candidates list */}
            {importCandidates !== null && (
              <div className="space-y-1">
                {importCandidates.length === 0 ? (
                  <p className="text-[9px] italic" style={{ color: 'var(--text-dim)' }}>Keine passenden Events gefunden.</p>
                ) : (
                  <>
                    <p className="text-[9px]" style={{ color: 'var(--text-muted)' }}>{importCandidates.length} Events gefunden:</p>
                    <div className="max-h-48 overflow-y-auto space-y-0.5">
                      {importCandidates.map(c => (
                        <label key={c.event.id} className="flex items-start gap-1.5 px-1.5 py-1 rounded cursor-pointer text-[11px]">
                          <input
                            type="checkbox"
                            checked={selectedImports.has(c.event.id)}
                            onChange={() => setSelectedImports(prev => {
                              const next = new Set(prev);
                              if (next.has(c.event.id)) next.delete(c.event.id);
                              else next.add(c.event.id);
                              return next;
                            })}
                            className="accent-indigo-500 w-3 h-3 mt-0.5"
                          />
                          <div>
                            <div style={{ color: 'var(--text-primary)' }}>{c.event.summary}</div>
                            <div className="text-[8px]" style={{ color: 'var(--text-dim)' }}>
                              KW {c.suggestedConfig.week} · {c.matchedKeyword}
                              {c.suggestedConfig.gymLevel && ` · ${formatGymLevel(c.suggestedConfig.gymLevel)}`}
                              {c.suggestedConfig.days && ` · Tage: ${c.suggestedConfig.days.map(d => ['Mo','Di','Mi','Do','Fr'][d-1]).join(',')}`}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                    <div className="flex gap-1">
                      <button onClick={handleConfirmImport} disabled={selectedImports.size === 0}
                        className="flex-1 py-1 rounded text-[11px] font-medium bg-indigo-700 hover:bg-indigo-600 text-white cursor-pointer transition-all disabled:opacity-50">
                        ✅ {selectedImports.size} importieren
                      </button>
                      <button onClick={() => { setImportCandidates(null); setSelectedImports(new Set()); }}
                        className="px-2 py-1 rounded text-[11px] cursor-pointer transition-all"
                        style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)' }}>
                        Abbrechen
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Collision check section (v3.63) */}
        {isAuth && readCalendarIds.length > 0 && (
          <div className="space-y-1.5 pt-1.5 border-t" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold" style={{ color: 'var(--text-secondary)' }}>Kollisionswarnungen</span>
              {collisionCount > 0 && (
                <span className="text-[9px] text-amber-400 font-bold">⚠️ {collisionCount}</span>
              )}
            </div>
            <p className="text-[8px]" style={{ color: 'var(--text-dim)' }}>
              Prüft ob externe Kalender-Events (Sitzungen, Konferenzen) mit Lektionszeiten kollidieren. Kollisionen werden als ⚠️ im Wochenplan angezeigt.
            </p>
            <button onClick={handleCheckCollisions} disabled={checkingCollisions}
              className="w-full py-1.5 rounded text-[11px] font-medium cursor-pointer transition-all disabled:opacity-50"
              style={{ background: 'var(--bg-hover)', color: 'var(--text-primary)' }}>
              {checkingCollisions ? '⏳ Prüfe Kollisionen…' : '⚠️ Kollisionen prüfen'}
            </button>
            {collisionCount > 0 && (
              <div className="text-[9px] text-amber-300 bg-amber-900/20 px-2 py-1 rounded">
                {collisionCount} Lektion(en) haben Zeitkonflikte mit externen Kalender-Events. Siehe ⚠️ im Wochenplan.
              </div>
            )}
            {collisionCount > 0 && (
              <button onClick={() => useGCalStore.getState().clearCollisions()}
                className="text-[8px] cursor-pointer" style={{ color: 'var(--text-dim)' }}>
                ✕ Warnungen ausblenden
              </button>
            )}
          </div>
        )}
      </div>
    </Section>
  );
}
