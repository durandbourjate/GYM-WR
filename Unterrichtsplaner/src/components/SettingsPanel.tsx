import { useState, useCallback, useRef, useEffect } from 'react';
import { usePlannerStore } from '../store/plannerStore';
import {
  loadSettings, saveSettings, getDefaultSettings, generateId,
  applySettingsToWeekData, migrateHolidays,
  type PlannerSettings, type CourseConfig, type SpecialWeekConfig, type HolidayConfig,
  type SubjectConfig, type SchoolLevel, type AssessmentRule,
} from '../store/settingsStore';
import { type CurriculumGoal } from '../data/curriculumGoals';
import { useInstanceStore } from '../store/instanceStore';
import { Section, SmallInput, RubricCollectionButtons, SectionActions } from './settings/shared';
import { SubjectsEditor } from './settings/SubjectsEditor';
import { CourseEditor } from './settings/CourseEditor';
import { SpecialWeeksEditor } from './settings/SpecialWeeksEditor';
import { HolidaysEditor } from './settings/HolidaysEditor';
import { TaFSection } from './TaFPanel';
import { AssessmentRulesEditor } from './settings/AssessmentRulesEditor';
import { GCalSection } from './settings/GCalSection';


// === Main Settings Panel ===
export function SettingsPanel() {
  const storeSettings = usePlannerStore(s => s.plannerSettings);
  const setPlannerSettings = usePlannerStore(s => s.setPlannerSettings);
  const settingsEditCourseId = usePlannerStore(s => s.settingsEditCourseId);

  const [settings, setSettings] = useState<PlannerSettings>(() => {
    if (storeSettings) return storeSettings;
    const global = loadSettings();
    if (global) return global;
    return getDefaultSettings();
  });
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-save with debounce (300ms)
  const doSave = useCallback((s: PlannerSettings) => {
    setPlannerSettings(s);
    saveSettings(s);
    // Auto-apply holidays & special weeks to weekData
    const store = usePlannerStore.getState();
    if (store.weekData.length > 0 && (s.holidays.length > 0 || s.specialWeeks.length > 0)) {
      const applied = applySettingsToWeekData(store.weekData, s);
      store.pushUndo();
      store.setWeekData(applied.weekData);
    }
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 1500);
  }, [setPlannerSettings]);

  const updateSettings = useCallback((patch: Partial<PlannerSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...patch };
      // Debounced auto-save
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      setSaveStatus('saving');
      saveTimerRef.current = setTimeout(() => doSave(next), 400);
      return next;
    });
  }, [doSave]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, []);

  // G6: pendingHolidayKw → auto-add holiday entry with pre-filled KW
  const pendingHolidayKw = usePlannerStore(s => s.pendingHolidayKw);
  const [forceOpenHolidays, setForceOpenHolidays] = useState(false);
  useEffect(() => {
    if (!pendingHolidayKw) return;
    const kw = pendingHolidayKw;
    usePlannerStore.getState().setPendingHolidayKw(null);
    setForceOpenHolidays(true);
    updateSettings({
      holidays: [...settings.holidays, { id: generateId(), label: '', startWeek: kw, endWeek: kw }],
    });
    setTimeout(() => {
      const el = document.querySelector('[data-section="ferien"]');
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 200);
  }, [pendingHolidayKw]);

  const handleReset = useCallback(() => {
    if (confirm('Alle Einstellungen zurücksetzen? Die bestehende Planung bleibt erhalten.')) {
      const fresh = getDefaultSettings();
      setSettings(fresh);
      doSave(fresh);
    }
  }, [doSave]);

  // === Header-level add handlers (v3.80 C1) ===
  const addSubjectHeader = () => updateSettings({ subjects: [...settings.subjects, { id: generateId(), label: '', shortLabel: '', color: '#64748b', courseType: 'SF' as any }] });
  const addCourseHeader = () => updateSettings({ courses: [...settings.courses, { id: generateId(), cls: '', typ: 'SF' as any, day: 'Mo' as any, from: '08:05', to: '08:50', les: 1, hk: false, semesters: [1, 2] }] });
  const addSpecialWeekHeader = () => updateSettings({ specialWeeks: [...settings.specialWeeks, { id: generateId(), label: '', week: '', type: 'event' }] });
  const addHolidayHeader = () => updateSettings({ holidays: [...settings.holidays, { id: generateId(), label: '', startWeek: '', endWeek: '' }] });
  const addAssessmentHeader = () => updateSettings({ assessmentRules: [...(settings.assessmentRules || []), { label: '', deadline: '', minGrades: 1, semester: 'year' }] });

  // === Header-level import handlers (v3.80 C1) ===
  const fileImport = (handler: (text: string, fileName: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => handler(reader.result as string, file.name);
    reader.readAsText(file); e.target.value = '';
  };

  const importSubjectsHeader = fileImport((text) => {
    try {
      const data = JSON.parse(text);
      const arr: SubjectConfig[] = Array.isArray(data) ? data : data.subjects || [];
      if (arr.length === 0) { alert('Keine gültigen Fachbereiche gefunden.'); return; }
      const ids = new Set(settings.subjects.map(s => s.id));
      const labels = new Set(settings.subjects.map(s => s.label.toLowerCase()));
      const unique = arr.filter(s => !ids.has(s.id) && !labels.has((s.label || '').toLowerCase()));
      const dupes = arr.length - unique.length;
      if (unique.length === 0) { alert(`Alle ${arr.length} bereits vorhanden.`); return; }
      const withIds = unique.map(s => ({ ...s, id: s.id || generateId() }));
      const msg = dupes > 0 ? `${withIds.length} importieren, ${dupes} übersprungen.` : `${withIds.length} Fachbereiche importieren?`;
      if (confirm(msg)) updateSettings({ subjects: [...settings.subjects, ...withIds] });
    } catch { alert('JSON konnte nicht gelesen werden.'); }
  });

  const importCoursesHeader = fileImport((text) => {
    try {
      const data = JSON.parse(text);
      const arr: CourseConfig[] = Array.isArray(data) ? data : data.kurse || data.courses || [];
      if (arr.length === 0) { alert('Keine gültigen Kurse gefunden.'); return; }
      const keys = new Set(settings.courses.map(c => `${c.cls}|${c.day}|${c.from}`));
      const unique = arr.filter(c => !keys.has(`${c.cls}|${c.day}|${c.from}`));
      const dupes = arr.length - unique.length;
      if (unique.length === 0) { alert(`Alle ${arr.length} bereits vorhanden.`); return; }
      const withIds = unique.map(c => ({ ...c, id: c.id || generateId() }));
      const msg = dupes > 0 ? `${withIds.length} importieren, ${dupes} übersprungen.` : `${withIds.length} Kurse importieren?`;
      if (confirm(msg)) updateSettings({ courses: [...settings.courses, ...withIds] });
    } catch { alert('JSON konnte nicht gelesen werden.'); }
  });

  const importSpecialWeeksHeader = fileImport((text, fileName) => {
    try {
      let imported: SpecialWeekConfig[] = [];
      if (fileName.endsWith('.json')) {
        imported = JSON.parse(text) as SpecialWeekConfig[];
        if (!Array.isArray(imported)) { alert('Ungültiges Format.'); return; }
      } else {
        const lines = text.split('\n').filter(l => l.trim());
        for (const line of lines) {
          const parts = line.split(/[,;\t]/).map(p => p.trim());
          if (parts.length >= 2) imported.push({ id: generateId(), label: parts[0], week: parts[1].replace(/^KW\s*/i, '').padStart(2, '0'), type: (parts[2] === 'holiday' ? 'holiday' : 'event') as any, gymLevel: parts[3] || undefined });
        }
      }
      if (imported.length === 0) { alert('Keine gültigen Einträge.'); return; }
      const keys = new Set(settings.specialWeeks.map(w => `${w.label}|${w.week}`));
      const unique = imported.filter(w => !keys.has(`${w.label}|${w.week}`));
      const dupes = imported.length - unique.length;
      if (unique.length === 0) { alert(`Alle ${imported.length} bereits vorhanden.`); return; }
      const msg = dupes > 0 ? `${unique.length} importieren, ${dupes} übersprungen.` : `${unique.length} Sonderwochen importieren?`;
      if (confirm(msg)) updateSettings({ specialWeeks: [...settings.specialWeeks, ...unique] });
    } catch { alert('Datei konnte nicht gelesen werden.'); }
  });

  const importHolidaysHeader = fileImport((text, fileName) => {
    try {
      let imported: HolidayConfig[] = [];
      if (fileName.endsWith('.json')) {
        const data = JSON.parse(text);
        const arr = Array.isArray(data) ? data : data.holidays || [];
        imported = arr.map((h: any) => ({ id: generateId(), label: h.label || h.name || '', startWeek: String(h.startWeek || h.start || '').replace(/^KW\s*/i, '').padStart(2, '0'), endWeek: String(h.endWeek || h.end || '').replace(/^KW\s*/i, '').padStart(2, '0'), ...(h.days ? { days: h.days } : {}) }));
      } else {
        const lines = text.split('\n').filter(l => l.trim());
        for (const line of lines) { const parts = line.split(/[,;\t]/).map(p => p.trim()); if (parts.length >= 3) imported.push({ id: generateId(), label: parts[0], startWeek: parts[1].replace(/^KW\s*/i, '').padStart(2, '0'), endWeek: parts[2].replace(/^KW\s*/i, '').padStart(2, '0') }); }
      }
      if (imported.length === 0) { alert('Keine gültigen Einträge.'); return; }
      // v3.86 I1-P4: Legacy-Holidays migrieren (days-Feld ergänzen)
      imported = migrateHolidays(imported);
      const keys = new Set(settings.holidays.map(h => `${h.label}|${h.startWeek}`));
      const unique = imported.filter(h => !keys.has(`${h.label}|${h.startWeek}`));
      const dupes = imported.length - unique.length;
      if (unique.length === 0) { alert(`Alle ${imported.length} bereits vorhanden.`); return; }
      const msg = dupes > 0 ? `${unique.length} importieren, ${dupes} übersprungen.` : `${unique.length} Ferienperioden importieren?`;
      if (confirm(msg)) updateSettings({ holidays: [...settings.holidays, ...unique] });
    } catch { alert('Datei konnte nicht gelesen werden.'); }
  });

  const importLehrplanzieleHeader = fileImport((text) => {
    try {
      const data = JSON.parse(text) as CurriculumGoal[];
      if (!Array.isArray(data) || data.length === 0) { alert('Ungültiges Format.'); return; }
      if (confirm(`${data.length} Lehrplanziele importieren? Bestehende werden ersetzt.`)) updateSettings({ curriculumGoals: data });
    } catch { alert('JSON konnte nicht gelesen werden.'); }
  });

  const importAssessmentHeader = fileImport((text) => {
    try {
      const data = JSON.parse(text);
      const imported: AssessmentRule[] = Array.isArray(data) ? data : data.assessmentRules || data.rules || [];
      if (imported.length === 0) { alert('Keine gültigen Regeln.'); return; }
      const keys = new Set((settings.assessmentRules || []).map(r => `${r.label}|${r.semester}|${r.stufe || ''}`));
      const unique = imported.filter(r => !keys.has(`${r.label}|${r.semester}|${r.stufe || ''}`));
      const dupes = imported.length - unique.length;
      if (unique.length === 0) { alert(`Alle ${imported.length} bereits vorhanden.`); return; }
      const msg = dupes > 0 ? `${unique.length} importieren, ${dupes} übersprungen.` : `${unique.length} Regeln importieren?`;
      if (confirm(msg)) updateSettings({ assessmentRules: [...(settings.assessmentRules || []), ...unique] });
    } catch { alert('JSON konnte nicht gelesen werden.'); }
  });

  const hasCustomSettings = storeSettings !== null || loadSettings() !== null;

  return (
    <div className="flex-1 min-h-0 overflow-y-auto p-3 pb-12 space-y-3" style={{ overscrollBehavior: 'contain' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[13px] font-bold" style={{ color: 'var(--text-primary)' }}>Einstellungen</h3>
          <p className="text-[9px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {hasCustomSettings ? 'Eigene Konfiguration aktiv' : 'Standard-Konfiguration'}
          </p>
        </div>
        <div className="flex gap-1 items-center">
          {saveStatus === 'saving' && <span className="text-[11px]" style={{ color: 'var(--text-dim)' }}>Speichern…</span>}
          {saveStatus === 'saved' && <span className="text-[11px] text-green-400">✓ Gespeichert</span>}
        </div>
      </div>

      {/* v3.80 C2: Hardcoded Stundenplan-Hint entfernt — Import über Kurse-Rubrik */}

      {/* School basics */}
      <Section title="🏫 Schule & Grundeinstellungen" defaultOpen>
        <div className="space-y-1.5">
          <div>
            <label className="text-[9px] mb-0.5 block" style={{ color: 'var(--text-muted)' }}>Schulname (optional)</label>
            <SmallInput value={settings.school?.name || ''} onChange={(v) => updateSettings({ school: { ...settings.school!, name: v } })} placeholder="z.B. Gymnasium Hofwil" className="w-full" />
          </div>
          <div>
            <label className="text-[9px] mb-0.5 block" style={{ color: 'var(--text-muted)' }}>Schulstufe</label>
            <select value={settings.schoolLevel || ''} onChange={(e) => updateSettings({ schoolLevel: (e.target.value || undefined) as SchoolLevel | undefined })}
              className="rounded px-1.5 py-0.5 text-[12px] outline-none focus:border-indigo-400 cursor-pointer w-full"
              style={{ background: 'var(--bg-hover)', color: 'var(--text-primary)', border: '1px solid var(--border-light)' }}>
              <option value="">-- Nicht gesetzt --</option>
              <option value="Grundstufe">Grundstufe (Primarstufe)</option>
              <option value="Sek1">Sekundarstufe I</option>
              <option value="Sek2">Sekundarstufe II (Gymnasium)</option>
              <option value="Berufsbildung">Berufsbildung</option>
              <option value="Hochschule">Hochschule</option>
            </select>
          </div>
          <div>
            <label className="text-[9px] mb-0.5 block" style={{ color: 'var(--text-muted)' }}>Standard-Lektionsdauer (Minuten)</label>
            <SmallInput value={String(settings.school?.lessonDurationMin || 45)} onChange={(v) => {
              const n = parseInt(v) || 45;
              updateSettings({ school: { ...settings.school!, lessonDurationMin: n } });
            }} placeholder="45" className="w-16" type="number" />
          </div>
        </div>
      </Section>

      {/* Subjects / Categories */}
      <Section title={`🎨 Fachbereiche (${settings.subjects.length})`} actions={
        <SectionActions rubricType="fachbereiche" getData={() => settings.subjects}
          onLoad={(data) => { if (Array.isArray(data) && confirm(`${data.length} Fachbereiche laden? Bestehende werden ersetzt.`)) updateSettings({ subjects: data }); }}
          onAdd={addSubjectHeader} onImport={importSubjectsHeader}
          itemCount={settings.subjects.length}
          onClearAll={() => { if (confirm(`Alle ${settings.subjects.length} Fachbereiche entfernen?`)) updateSettings({ subjects: [] }); }} />
      }>
        <SubjectsEditor subjects={settings.subjects} onChange={(s) => updateSettings({ subjects: s })} />
      </Section>

      {/* Courses */}
      <Section title={`📚 Kurse / Stundenplan (${settings.courses.length})`} actions={
        <SectionActions rubricType="kurse" getData={() => settings.courses}
          onLoad={(data) => { if (Array.isArray(data) && confirm(`${data.length} Kurse laden? Bestehende werden ersetzt.`)) updateSettings({ courses: data }); }}
          onAdd={addCourseHeader} onImport={importCoursesHeader}
          itemCount={settings.courses.length}
          onClearAll={() => { if (confirm(`Alle ${settings.courses.length} Kurse entfernen?`)) updateSettings({ courses: [] }); }} />
      }>
        <CourseEditor courses={settings.courses} onChange={(c) => updateSettings({ courses: c })} schoolLevel={settings.schoolLevel} baseDuration={settings.school?.lessonDurationMin || 45} focusCourseId={settingsEditCourseId} subjects={settings.subjects || []} />
      </Section>

      {/* Special Weeks */}
      <Section title={`📅 Sonderwochen (${settings.specialWeeks.length})`} actions={
        <SectionActions rubricType="sonderwochen" getData={() => settings.specialWeeks}
          onLoad={(data) => { if (Array.isArray(data) && confirm(`${data.length} Sonderwochen laden? Bestehende werden ersetzt.`)) updateSettings({ specialWeeks: data }); }}
          onAdd={addSpecialWeekHeader} importAccept=".json,.csv,.txt" onImport={importSpecialWeeksHeader}
          itemCount={settings.specialWeeks.length}
          onClearAll={() => { if (confirm(`Alle ${settings.specialWeeks.length} Sonderwochen entfernen?`)) updateSettings({ specialWeeks: [] }); }} />
      }>
        <SpecialWeeksEditor weeks={settings.specialWeeks} courses={settings.courses} onChange={(w) => updateSettings({ specialWeeks: w })} />
      </Section>

      {/* Holidays */}
      <Section title={`🏖 Ferien (${settings.holidays.length})`} sectionId="ferien" forceOpen={forceOpenHolidays} actions={
        <SectionActions rubricType="ferien" getData={() => settings.holidays}
          onLoad={(data) => { if (Array.isArray(data) && confirm(`${data.length} Ferienperioden laden? Bestehende werden ersetzt.`)) updateSettings({ holidays: data }); }}
          onAdd={addHolidayHeader} importAccept=".csv,.txt,.json" onImport={importHolidaysHeader}
          itemCount={settings.holidays.length}
          onClearAll={() => { if (confirm(`Alle ${settings.holidays.length} Ferienperioden entfernen?`)) updateSettings({ holidays: [] }); }} />
      }>
        <HolidaysEditor holidays={settings.holidays} onChange={(h) => updateSettings({ holidays: h })} />
      </Section>

      {/* Curriculum Goals */}
      <Section title={`🎯 Lehrplanziele (${settings.curriculumGoals?.length || 0})`} actions={
        <SectionActions rubricType="lehrplanziele" getData={() => settings.curriculumGoals || []}
          onLoad={(data) => { if (Array.isArray(data) && confirm(`${data.length} Lehrplanziele laden? Bestehende werden ersetzt.`)) updateSettings({ curriculumGoals: data }); }}
          onImport={importLehrplanzieleHeader}
          itemCount={settings.curriculumGoals?.length || 0}
          onClearAll={() => { if (confirm(`Alle ${settings.curriculumGoals?.length || 0} Lehrplanziele entfernen?`)) updateSettings({ curriculumGoals: undefined as any }); }} />
      }>
        <div className="space-y-2">
          <p className="text-[9px]" style={{ color: 'var(--text-muted)' }}>
            {settings.curriculumGoals?.length
              ? `${settings.curriculumGoals.length} Lehrplanziele konfiguriert.`
              : 'Keine Lehrplanziele konfiguriert. Importiere eigene Ziele als JSON oder lade sie aus der Sammlung.'}
          </p>
          <div className="flex gap-1 flex-wrap">
            {/* v3.81 D1: Import-Button nur noch im Header (⬆). Hier nur Clear-Button */}
            {settings.curriculumGoals && settings.curriculumGoals.length > 0 && (
              <button onClick={() => {
                if (confirm('Eigene Lehrplanziele entfernen? (Standard wird verwendet falls Sek2)')) {
                  updateSettings({ curriculumGoals: undefined as any });
                }
              }} className="px-2 py-1 rounded border border-red-500/30 text-red-400 text-[11px] cursor-pointer hover:bg-red-500/10">
                ✕ Eigene entfernen
              </button>
            )}
          </div>
        </div>
      </Section>

      {/* TaF Phasenmodell (v3.98: aus Toolbar in Settings verschoben) */}
      <Section title="🔄 TaF Phasenmodell">
        <TaFSection />
      </Section>

      {/* Assessment Rules */}
      <Section title={`📝 Beurteilungsregeln (${settings.assessmentRules?.length || 0})`} actions={
        <SectionActions rubricType="beurteilungsregeln" getData={() => settings.assessmentRules || []}
          onLoad={(data) => { if (Array.isArray(data) && confirm(`${data.length} Beurteilungsregeln laden? Bestehende werden ersetzt.`)) updateSettings({ assessmentRules: data }); }}
          onAdd={addAssessmentHeader} onImport={importAssessmentHeader}
          itemCount={settings.assessmentRules?.length || 0}
          onClearAll={() => { if (confirm(`Alle ${settings.assessmentRules?.length || 0} Beurteilungsregeln entfernen?`)) updateSettings({ assessmentRules: undefined as any }); }} />
      }>
        <AssessmentRulesEditor
          rules={settings.assessmentRules || []}
          onChange={(r) => updateSettings({ assessmentRules: r.length > 0 ? r : undefined as any })}
          schoolLevel={settings.schoolLevel}
        />
      </Section>

      {/* v3.81 D5: «Daten» + «Sammlung» zusammengeführt */}
      <Section title="💾 Daten & Sammlung">
        <div className="space-y-3">
          {/* Konfiguration */}
          <div>
            <p className="text-[9px] font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Konfiguration (Kurse, Ferien, Sonderwochen, Fächer)</p>
            <div className="flex gap-1">
              <button onClick={() => {
                const activeMeta = useInstanceStore.getState().getActive();
                const planerName = (activeMeta?.name || 'planer').replace(/[^a-zA-Z0-9äöüÄÖÜ_-]/g, '_');
                const datum = new Date().toISOString().slice(0, 10);
                const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url; a.download = `planer-config-${planerName}-${datum}.json`; a.click();
                URL.revokeObjectURL(url);
              }}
                className="flex-1 py-1.5 rounded text-[11px] font-medium cursor-pointer transition-all"
                style={{ background: 'var(--bg-hover)', color: 'var(--text-primary)' }}>
                📤 Exportieren
              </button>
              <label className="flex-1 py-1.5 rounded text-[11px] font-medium text-center cursor-pointer transition-all" style={{ background: 'var(--bg-hover)', color: 'var(--text-primary)' }}>
                📥 Importieren
                <input type="file" accept=".json" className="hidden" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => {
                    try {
                      const imported = JSON.parse(reader.result as string);
                      if (!imported || typeof imported !== 'object') { alert('Ungültige Datei.'); return; }
                      // v3.86 I1-P2: Typ-Guard — Planerdaten erkennen
                      if ('weekData' in imported && !('courses' in imported)) {
                        alert('Diese Datei enthält Planerdaten (Lektionen/Sequenzen), keine Einstellungen. Bitte unter «Planerdaten» importieren.');
                        return;
                      }
                      // Flexibler Parser: mindestens eines der Kern-Felder muss vorhanden sein
                      const hasCourses = Array.isArray(imported.courses);
                      const hasHolidays = Array.isArray(imported.holidays);
                      const hasSpecialWeeks = Array.isArray(imported.specialWeeks);
                      const hasSubjects = Array.isArray(imported.subjects);
                      if (!hasCourses && !hasHolidays && !hasSpecialWeeks && !hasSubjects) {
                        alert('Keine gültige Konfiguration gefunden. Erwartet: courses, holidays, specialWeeks oder subjects.');
                        return;
                      }
                      // Zusammenfassung für Bestätigung
                      const parts: string[] = [];
                      if (hasCourses) parts.push(`${imported.courses.length} Kurse`);
                      if (hasHolidays) parts.push(`${imported.holidays.length} Ferien`);
                      if (hasSpecialWeeks) parts.push(`${imported.specialWeeks.length} Sonderwochen`);
                      if (hasSubjects) parts.push(`${imported.subjects.length} Fachbereiche`);
                      if (Array.isArray(imported.curriculumGoals)) parts.push(`${imported.curriculumGoals.length} Lehrplanziele`);
                      if (Array.isArray(imported.assessmentRules)) parts.push(`${imported.assessmentRules.length} Beurteilungsregeln`);
                      if (!confirm(`Einstellungen überschreiben?\n${parts.join(', ')}`)) return;
                      // Merge: nur vorhandene Felder übernehmen, Rest beibehalten
                      const merged: PlannerSettings = { ...settings };
                      if (hasCourses) merged.courses = imported.courses;
                      if (hasHolidays) merged.holidays = migrateHolidays(imported.holidays);
                      if (hasSpecialWeeks) merged.specialWeeks = imported.specialWeeks;
                      if (hasSubjects) merged.subjects = imported.subjects;
                      if (Array.isArray(imported.curriculumGoals)) merged.curriculumGoals = imported.curriculumGoals;
                      if (Array.isArray(imported.assessmentRules)) merged.assessmentRules = imported.assessmentRules;
                      if (imported.school) merged.school = imported.school;
                      if (imported.schoolLevel) merged.schoolLevel = imported.schoolLevel;
                      if (imported.semesterBreak !== undefined) merged.semesterBreak = imported.semesterBreak;
                      setSettings(merged);
                      doSave(merged);
                    } catch { alert('Fehler beim Lesen der Datei.'); }
                  };
                  reader.readAsText(file);
                  e.target.value = '';
                }} />
              </label>
            </div>
          </div>

          {/* Planerdaten */}
          <div className="border-t pt-3" style={{ borderColor: 'var(--border)' }}>
            <p className="text-[9px] font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Planerdaten (Lektionen, Sequenzen, Details)</p>
            <div className="flex gap-1">
              <button onClick={() => {
                const json = usePlannerStore.getState().exportData();
                const blob = new Blob([json], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url; a.download = `unterrichtsplaner-daten-${new Date().toISOString().slice(0, 10)}.json`; a.click();
                URL.revokeObjectURL(url);
              }}
                className="flex-1 py-1.5 rounded text-[11px] font-medium cursor-pointer transition-all"
                style={{ background: 'var(--bg-hover)', color: 'var(--text-primary)' }}>
                📤 Exportieren
              </button>
              <label className="flex-1 py-1.5 rounded text-[11px] font-medium text-center cursor-pointer transition-all" style={{ background: 'var(--bg-hover)', color: 'var(--text-primary)' }}>
                📥 Importieren
                <input type="file" accept=".json" className="hidden" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => {
                    try {
                      const text = reader.result as string;
                      const parsed = JSON.parse(text);
                      // v3.86 I1-P2: Typ-Guards — Format erkennen
                      const isPlannerData = typeof parsed === 'object' && parsed !== null && 'weekData' in parsed;
                      const isSettingsExport = typeof parsed === 'object' && parsed !== null && 'courses' in parsed && !('weekData' in parsed);
                      if (isSettingsExport) {
                        alert('Diese Datei enthält Einstellungen (Konfiguration), keine Planerdaten. Bitte unter «Einstellungen» importieren.');
                        return;
                      }
                      if (!isPlannerData) {
                        alert('Unbekanntes Import-Format — bitte aktuellen Export verwenden.');
                        return;
                      }
                      const success = usePlannerStore.getState().importData(text);
                      if (success) alert('Planerdaten erfolgreich importiert.');
                      else alert('Keine gültigen Planerdaten gefunden.');
                    } catch { alert('Fehler beim Lesen der Datei.'); }
                  };
                  reader.readAsText(file);
                }} />
              </label>
            </div>
          </div>

          {/* Sammlung */}
          <div className="border-t pt-3" style={{ borderColor: 'var(--border)' }}>
            <p className="text-[9px] font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Sammlung (Gesamtkonfiguration)</p>
            <p className="text-[9px] mb-1.5" style={{ color: 'var(--text-muted)' }}>Konfiguration in der Sammlung sichern oder laden. Einzelne Rubriken können oben separat gespeichert werden.</p>
            <RubricCollectionButtons rubricType="settings" getData={() => settings}
              onLoad={(data) => {
                if (!data || typeof data !== 'object') { alert('Ungültige Konfiguration.'); return; }
                if (!Array.isArray(data.courses) || !Array.isArray(data.holidays) || !Array.isArray(data.specialWeeks)) { alert('Ungültige Konfiguration.'); return; }
                if (!confirm(`Einstellungen überschreiben? (${data.courses.length} Kurse, ${data.holidays.length} Ferien, ${data.specialWeeks.length} Sonderwochen)`)) return;
                setSettings(data as PlannerSettings);
                doSave(data as PlannerSettings);
              }} />
          </div>
        </div>
      </Section>

      {/* Google Calendar */}
      <GCalSection />

      {/* Danger zone */}
      <div className="pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
        <button onClick={handleReset}
          className="text-[11px] text-red-400 hover:text-red-300 cursor-pointer">
          ⚠ Einstellungen zurücksetzen
        </button>
      </div>
    </div>
  );
}
