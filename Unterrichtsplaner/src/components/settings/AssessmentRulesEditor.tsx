import { useMemo } from 'react';
import { SmallInput, SmallSelect } from './shared';
import { STUFE_OPTIONS, type AssessmentRule, type SchoolLevel } from '../../store/settingsStore';

// === Assessment Rules Editor ===
const DEFAULT_GYM_RULES: AssessmentRule[] = [
  { label: 'Standortbestimmung (Nov)', deadline: 'KW 45', minGrades: 1, semester: 1, stufe: 'GYM1' },
  { label: 'Semesterzeugnis', deadline: 'Ende Semester 1', minGrades: 2, semester: 1, stufe: 'GYM1' },
  { label: 'Jahreszeugnis', deadline: 'Ende Schuljahr', minGrades: 3, semester: 'year', stufe: 'GYM1', weeklyLessonsThreshold: 3, minGradesAboveThreshold: 4 },
  { label: 'Zwischenbericht', deadline: 'Ende Semester 1', minGrades: 1, semester: 1, stufe: 'GYM2' },
  { label: 'Jahreszeugnis', deadline: 'Ende Schuljahr', minGrades: 3, semester: 'year', weeklyLessonsThreshold: 3, minGradesAboveThreshold: 4 },
];

export function AssessmentRulesEditor({ rules, onChange, schoolLevel }: {
  rules: AssessmentRule[];
  onChange: (r: AssessmentRule[]) => void;
  schoolLevel?: SchoolLevel;
}) {
  const addRule = () => {
    onChange([...rules, { label: '', deadline: '', minGrades: 1, semester: 'year' }]);
  };

  const update = (idx: number, patch: Partial<AssessmentRule>) => {
    onChange(rules.map((r, i) => i === idx ? { ...r, ...patch } : r));
  };

  const remove = (idx: number) => {
    onChange(rules.filter((_, i) => i !== idx));
  };

  // Stufe options from school level (v3.77 #11)
  const stufeOptions = useMemo(() => {
    const opts: { key: string; label: string }[] = [{ key: '', label: 'Alle Stufen' }];
    if (schoolLevel && STUFE_OPTIONS[schoolLevel]) {
      opts.push(...STUFE_OPTIONS[schoolLevel]);
    } else {
      // Default GYM levels
      opts.push(
        { key: 'GYM1', label: 'GYM1' }, { key: 'GYM2', label: 'GYM2' },
        { key: 'GYM3', label: 'GYM3' }, { key: 'GYM4', label: 'GYM4' },
        { key: 'GYM5', label: 'GYM5' },
      );
    }
    return opts;
  }, [schoolLevel]);

  // v3.81 D1: handleImport entfernt — Import läuft über SectionActions im Header

  return (
    <div className="space-y-1.5">
      <p className="text-[9px]" style={{ color: 'var(--text-muted)' }}>
        {rules.length > 0
          ? `${rules.length} eigene Beurteilungsregeln aktiv. Prüfungen werden in der Statistik dagegen geprüft.`
          : 'Standard-Regelwerk (GYM1–5, MiSDV Art. 4) wird verwendet. Eigene Regeln überschreiben den Standard.'}
      </p>
      {rules.map((r, i) => (
        <div key={i} className="rounded p-2 space-y-1" style={{ background: 'var(--bg-secondary)' }}>
          <div className="flex gap-1 items-center">
            <SmallInput value={r.label} onChange={(v) => update(i, { label: v })} placeholder="Bezeichnung" className="flex-1" />
            <button onClick={() => remove(i)} className="text-[9px] text-red-400 cursor-pointer">✕</button>
          </div>
          <div className="flex gap-1.5 items-center flex-wrap">
            <span className="text-[8px]" style={{ color: 'var(--text-muted)' }}>Zeitraum:</span>
            <SmallSelect value={String(r.semester)} onChange={(v) => {
              const sem = v === 'year' ? 'year' : v === 'custom' ? 'custom' : parseInt(v) as 1 | 2;
              const deadlineAuto = sem === 1 ? 'Ende Semester 1' : sem === 2 ? 'Ende Semester 2' : sem === 'year' ? 'Ende Schuljahr' : r.deadline;
              update(i, { semester: sem, deadline: sem !== 'custom' ? deadlineAuto : r.deadline });
            }}
              options={[
                { key: '1', label: 'Sem 1' }, { key: '2', label: 'Sem 2' },
                { key: 'year', label: 'Ganz SJ' }, { key: 'custom', label: 'Andere…' },
              ]} />
            {r.semester === 'custom' ? (
              <input type="date" value={r.customDate || ''}
                onChange={(e) => update(i, { customDate: e.target.value, deadline: e.target.value })}
                className="rounded px-1.5 py-0.5 text-[11px] outline-none focus:border-blue-400 cursor-pointer"
                style={{ background: 'var(--bg-hover)', color: 'var(--text-primary)', border: '1px solid var(--border-light)' }} />
            ) : (
              <SmallInput value={r.deadline} onChange={(v) => update(i, { deadline: v })}
                placeholder={r.semester === 'year' ? 'Ende SJ' : `Ende Sem ${r.semester}`} className="w-28" />
            )}
          </div>
          <div className="flex gap-1.5 items-center flex-wrap">
            <span className="text-[8px]" style={{ color: 'var(--text-muted)' }}>Stufe:</span>
            <select value={r.stufe || ''} onChange={(e) => update(i, { stufe: e.target.value || undefined })}
              className="rounded px-1 py-0.5 text-[11px] outline-none focus:border-blue-400 cursor-pointer"
              style={{ background: 'var(--bg-hover)', color: 'var(--text-primary)', border: '1px solid var(--border-light)' }}>
              {stufeOptions.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
            </select>
            <span className="text-[8px] ml-1" style={{ color: 'var(--text-muted)' }}>Min. Noten:</span>
            <SmallInput value={String(r.minGrades)} onChange={(v) => update(i, { minGrades: parseInt(v) || 1 })} className="w-10 text-center" type="number" />
          </div>
          {/* Lektionenzahl-abhängige Regeln (v3.77 #11) */}
          <div className="flex gap-1.5 items-center flex-wrap">
            <span className="text-[8px]" style={{ color: 'var(--text-muted)' }}>Bei &gt;</span>
            <SmallInput value={r.weeklyLessonsThreshold != null ? String(r.weeklyLessonsThreshold) : ''} onChange={(v) => {
              const n = parseInt(v);
              update(i, { weeklyLessonsThreshold: isNaN(n) ? undefined : n });
            }} placeholder="L/W" className="w-10 text-center" type="number" />
            <span className="text-[8px]" style={{ color: 'var(--text-muted)' }}>L/Woche → Min. Noten:</span>
            <SmallInput value={r.minGradesAboveThreshold != null ? String(r.minGradesAboveThreshold) : ''} onChange={(v) => {
              const n = parseInt(v);
              update(i, { minGradesAboveThreshold: isNaN(n) ? undefined : n });
            }} placeholder="—" className="w-10 text-center" type="number" />
            {r.weeklyLessonsThreshold != null && r.minGradesAboveThreshold != null && (
              <span className="text-[8px]" style={{ color: 'var(--text-dim)' }}>
                (≤{r.weeklyLessonsThreshold}L → {r.minGrades}, &gt;{r.weeklyLessonsThreshold}L → {r.minGradesAboveThreshold})
              </span>
            )}
          </div>
        </div>
      ))}
      <div className="flex gap-1">
        <button onClick={addRule}
          className="flex-1 py-1 rounded border border-dashed text-[11px] cursor-pointer"
          style={{ borderColor: 'var(--border-light)', color: 'var(--text-muted)' }}>
          + Regel hinzufügen
        </button>
        {rules.length === 0 && (
          <button onClick={() => onChange([...DEFAULT_GYM_RULES])}
            className="py-1 px-2 rounded border border-blue-500/30 text-blue-400 text-[11px] cursor-pointer hover:bg-blue-500/10">
            📋 GYM-Standard laden
          </button>
        )}
      </div>
    </div>
  );
}
