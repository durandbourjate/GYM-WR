# Excel-Raster-Import einbinden — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Den toten `ExcelImport.tsx`-Wizard im Unterrichtsplaner einbinden und so umbauen, dass er für jeden Planer korrekt in die angezeigten Kurs/Wochen-Zellen schreibt.

**Architecture:** Drei reine Mapping-Helfer aus `ExcelImport.tsx` in eine testbare `utils/`-Datei extrahieren (TDD). Dann den Wizard auf die dynamische Datenquelle `usePlannerData()` umstellen (statt statischer `COURSES`/`WEEKS`) und einen defensiven try/catch + Leer-Hinweis ergänzen. Zuletzt einen Mount-Button in der bestehenden SettingsPanel-Sektion „💾 Daten & Sammlung".

**Tech Stack:** React 19, TypeScript, Vite, Zustand, Tailwind, vitest + @testing-library/react, `xlsx` (lazy).

**Spec:** `Unterrichtsplaner/docs/superpowers/specs/2026-05-30-excel-import-einbinden-design.md`

**Working directory für alle Befehle:** `Unterrichtsplaner/` im Repo-Root `10 Github/GYM-WR-DUY/`. Befehle als `bash -c "cd '<…>/GYM-WR-DUY/Unterrichtsplaner' && <cmd>"` (Repo liegt unter `10 Github/GYM-WR-DUY`, die Harness-CWD hat ein kaputtes `.git`).

**Branch:** `feature/excel-import-einbinden` (existiert, off `main` = `b21f28a`, enthält die Spec-Commits).

---

## File Structure

| Datei | Rolle | Aktion |
|---|---|---|
| `src/utils/excelImportMapping.ts` | Reine Helfer: `detectLessonType`, `matchHeaderToCourse`, `parseWeekFromCell` | **Create** |
| `src/utils/excelImportMapping.test.ts` | Unit-Tests der 3 Helfer | **Create** |
| `src/components/ExcelImport.tsx` | Wizard: Helfer importieren, `usePlannerData()` statt statisch (4 Stellen), try/catch, Leer-Hinweis | **Modify** |
| `src/components/SettingsPanel.tsx` | Button + State + Modal-Mount in „💾 Daten & Sammlung" | **Modify** |

**Wichtige Fakten (verifiziert):**
- `usePlannerData()` (`src/hooks/usePlannerData.ts:117`) gibt u.a. `{ courses: Course[], weeks: Week[] }` zurück. `courses` ist die dynamische Quelle (eigene Kurse → `col` 100+); leerer Planer → `courses = []`.
- `Course` (`src/types.ts:1`): `{ id, col, cls, typ, day, les, … }`. `Week` (`src/types.ts:16`): `{ w: string, lessons: Record<number, LessonEntry> }`.
- `ExcelImport.tsx` ist eine Function-Component; alle Hooks stehen oben (L50-62), erst danach Funktionen/JSX → ein zusätzlicher Hook-Aufruf oben ist rules-of-hooks-sicher.
- Schreib-Pfad (`executeImport`) ist bereits `col`-basiert (`week.lessons[item.col]`) → **nicht** anfassen.

---

## Task 1: Reine Mapping-Helfer extrahieren (TDD)

**Files:**
- Create: `src/utils/excelImportMapping.ts`
- Create: `src/utils/excelImportMapping.test.ts`

Aktuell leben drei reine Logik-Stücke inline in `ExcelImport.tsx`:
- `detectLessonType` (L17-27) — komplett rein.
- Header→col-Matching (im `autoMapColumns`-Loop, L96-106) — liest nur `header` + Kursliste.
- KW-Parsing (im `autoMapRows`-Loop, L116-130) — liest nur Zelltext + erlaubte Wochen.

Wir ziehen sie in eine eigene Datei, damit sie ohne Komponenten-Render testbar sind. Die `autoMap*`-Closures selbst (rufen `setState`) bleiben in der Komponente und rufen künftig diese Helfer.

- [ ] **Step 1: Failing test schreiben**

`src/utils/excelImportMapping.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { detectLessonType, matchHeaderToCourse, parseWeekFromCell } from './excelImportMapping';
import type { Course } from '../types';

// Minimal-Kurse mit dynamischen col-Werten (100+), wie sie configToCourses für
// selbst-definierte Kurse erzeugt — der Regressions-Kern dieses Features.
const COURSES_DYN: Course[] = [
  { id: 'a', col: 100, cls: '29c', typ: 'SF', day: 'Di', from: '', to: '', les: 2, hk: false, semesters: [1, 2] },
  { id: 'b', col: 101, cls: '27a', typ: 'IN', day: 'Mo', from: '', to: '', les: 1, hk: false, semesters: [1] },
];

describe('detectLessonType', () => {
  it('erkennt die Lektionstypen pro Branch', () => {
    expect(detectLessonType('Herbstferien')).toBe(6);
    expect(detectLessonType('Prüfung FIBU')).toBe(4);
    expect(detectLessonType('Sporttag')).toBe(5);
    expect(detectLessonType('BYOD Projekt')).toBe(3);
    expect(detectLessonType('Einführung BWL')).toBe(1);
    expect(detectLessonType('OR AT Verträge')).toBe(2);
    expect(detectLessonType('Irgendwas Neutrales')).toBe(0);
    expect(detectLessonType('')).toBe(0);
  });
});

describe('matchHeaderToCourse', () => {
  it('matcht Header gegen dynamische col-Werte (100+), nicht gegen statische COURSES', () => {
    // Klassenname im Header → dynamische col
    expect(matchHeaderToCourse('29c Di', COURSES_DYN)).toBe(100);
    expect(matchHeaderToCourse('Mo 27a', COURSES_DYN)).toBe(101);
    // Teilstring-Match (h.includes(cls))
    expect(matchHeaderToCourse('Kurs 29c SF', COURSES_DYN)).toBe(100);
  });
  it('gibt null bei keinem Match', () => {
    expect(matchHeaderToCourse('Unbekannt', COURSES_DYN)).toBeNull();
    expect(matchHeaderToCourse('', COURSES_DYN)).toBeNull();
  });
  it('gibt null bei leerer Kursliste (Planer ohne konfigurierte Kurse)', () => {
    expect(matchHeaderToCourse('29c', [])).toBeNull();
  });
});

describe('parseWeekFromCell', () => {
  const allowed = ['33', '34', '35'];
  it('parst KW-Muster und reine Zahlen, padded auf 2 Stellen', () => {
    expect(parseWeekFromCell('KW 33', allowed)).toBe('33');
    expect(parseWeekFromCell('Woche 34', allowed)).toBe('34');
    expect(parseWeekFromCell('35', allowed)).toBe('35');
  });
  it('gibt null wenn die Woche ausserhalb des erlaubten Bereichs liegt', () => {
    expect(parseWeekFromCell('KW 50', allowed)).toBeNull();
    expect(parseWeekFromCell('1', allowed)).toBeNull();
  });
  it('gibt null bei Nicht-Wochen-Text', () => {
    expect(parseWeekFromCell('Thema', allowed)).toBeNull();
    expect(parseWeekFromCell('', allowed)).toBeNull();
  });
});
```

- [ ] **Step 2: Test laufen lassen, Fehlschlag bestätigen**

Run: `bash -c "cd '<…>/GYM-WR-DUY/Unterrichtsplaner' && npx vitest run src/utils/excelImportMapping.test.ts"`
Expected: FAIL — „Failed to resolve import './excelImportMapping'" (Modul existiert noch nicht).

- [ ] **Step 3: Helfer implementieren**

`src/utils/excelImportMapping.ts` — die Logik 1:1 aus `ExcelImport.tsx` übernommen, nur parametrisiert (Kursliste / erlaubte Wochen als Argument statt statisch):

```ts
import type { Course, LessonType } from '../types';

/** Erkennt den LessonType aus dem Zellinhalt (Heuristik, nur Vorbelegung). */
export function detectLessonType(text: string): LessonType {
  const t = text.toLowerCase();
  if (!t || t === '-' || t === '—') return 0;
  if (/(ferien|auffahrt|pfingst)/.test(t)) return 6;
  if (/(prüfung|test|pw |prüf\.)/.test(t)) return 4;
  if (/(studienreise|sporttag|iw\d|besuchstag|tag d\.|fachschaftstag|schneesport|aufnahme|intensiv|orientierungslauf|konferenz|ma präs)/.test(t)) return 5;
  if (/(progr|krypto|rtpp|byod|vsc |excel|projekt|vortrag|darknet|metadaten|rastergr|vektorgr|gesichtser)/.test(t)) return 3;
  if (/(bwl|market|fibu|swot|porter|csr|standort|untern|st\. galler|selbstbeurteil|nwa)/.test(t)) return 1;
  if (/(recht|vwl|or at|grundr|miete|person|gesellsch|genossensch|sozial|sozv|bip|preis|lorenzkurve|staats|marktversagen|wohnungsm|elastiz|gefangenen|ökon|dollar|gerechtigkeit|iconomix|ungleich|kosten-gewinn)/.test(t)) return 2;
  return 0;
}

/**
 * Matcht einen Excel-Spalten-Header gegen die (dynamischen) Kurse und gibt die
 * `col` des ersten Treffers zurück, sonst null. Quelle der Kurse ist bewusst ein
 * Parameter (nicht statische COURSES), damit der Import in dieselben col-Keys
 * schreibt, die die Anzeige liest — auch bei selbst-definierten Kursen (col 100+).
 */
export function matchHeaderToCourse(header: string, courses: Course[]): number | null {
  const h = String(header).toLowerCase().trim();
  if (!h) return null;
  for (const c of courses) {
    const cls = c.cls.toLowerCase();
    const dayMatch = c.day.toLowerCase();
    if (h.includes(cls) || h === `${cls} ${dayMatch}` || h === `${dayMatch} ${cls}`) {
      return c.col;
    }
  }
  return null;
}

/**
 * Parst eine Kalenderwoche aus dem Zellinhalt (KW-Muster oder reine Zahl 1-52),
 * padded auf 2 Stellen. Gibt null, wenn die Woche nicht im erlaubten Bereich
 * (`allowedWeeks`, aus der aktiven Planer-Instanz) liegt.
 */
export function parseWeekFromCell(firstCell: string, allowedWeeks: string[]): string | null {
  const cell = String(firstCell || '').trim();
  let weekW: string | null = null;
  const kwMatch = cell.match(/(?:kw|woche)\s*(\d{1,2})/i);
  if (kwMatch) {
    weekW = kwMatch[1].padStart(2, '0');
  } else {
    const num = parseInt(cell);
    if (num >= 1 && num <= 52) {
      weekW = String(num).padStart(2, '0');
    }
  }
  if (weekW && !allowedWeeks.includes(weekW)) weekW = null;
  return weekW;
}
```

- [ ] **Step 4: Test laufen lassen, grün bestätigen**

Run: `bash -c "cd '<…>/GYM-WR-DUY/Unterrichtsplaner' && npx vitest run src/utils/excelImportMapping.test.ts"`
Expected: PASS (alle 3 describe-Blöcke grün).

- [ ] **Step 5: Commit**

```bash
git add src/utils/excelImportMapping.ts src/utils/excelImportMapping.test.ts
git commit -m "feat(planer): reine Excel-Mapping-Helfer extrahieren (TDD)

detectLessonType + matchHeaderToCourse + parseWeekFromCell aus ExcelImport.tsx
in utils/ gezogen, courses/allowedWeeks als Parameter (Vorbereitung dynamische
Datenquelle). Unit-Tests inkl. dynamischer col-100+-Regression."
```

---

## Task 2: ExcelImport auf dynamische Datenquelle umstellen

**Files:**
- Modify: `src/components/ExcelImport.tsx`

Ziel: Wizard nutzt die extrahierten Helfer und bezieht Kurse/Wochen aus `usePlannerData()` statt aus statischem `COURSES`/`WEEKS`. Plus defensiver try/catch beim Datei-Parsen und ein Leer-Hinweis.

- [ ] **Step 1: Imports & Modul-Ebene anpassen**

In `ExcelImport.tsx`:
- Zeile 3-4 entfernen: `import { COURSES } from '../data/courses';` und `import { WEEKS } from '../data/weeks';`
- Inline `detectLessonType` (L17-27) entfernen.
- Modul-Konstante `const WEEK_ORDER = WEEKS.map(w => w.w);` (L14) entfernen.
- Neuen Import ergänzen (bei den anderen Hooks/Utils):

```ts
import { usePlannerData } from '../hooks/usePlannerData';
import { detectLessonType, matchHeaderToCourse, parseWeekFromCell } from '../utils/excelImportMapping';
```

`import type { LessonType, LessonEntry, BlockType } from '../types';` (L12) bleibt — `LessonType` wird weiter referenziert; `Course` muss nicht importiert werden (kommt typisiert aus dem Hook).

- [ ] **Step 2: Hook + abgeleitete Wochenliste in der Komponente**

Direkt nach der bestehenden Store-Zeile (`const { weekData, setWeekData, pushUndo, updateLessonDetail } = usePlannerStore();`, L50) ergänzen:

```ts
  const { courses, weeks } = usePlannerData();
  const weekOrder = useMemo(() => weeks.map(w => w.w), [weeks]);
```

`useMemo` zu den React-Imports in Zeile 1 hinzufügen: `import { useState, useRef, useMemo } from 'react';`

- [ ] **Step 3: Die 4 statischen Stellen auf dynamisch umstellen**

1. **`autoMapColumns`** (~L92-110): den Inline-Matching-Loop durch den Helfer ersetzen:

```ts
  const autoMapColumns = (data: string[][]) => {
    if (data.length === 0) return;
    const headerRow = data[0];
    const mappings: ColMapping[] = headerRow.map((header, idx) => ({
      excelCol: idx,
      excelHeader: String(header),
      courseCol: matchHeaderToCourse(String(header), courses),
    }));
    setColMappings(mappings);
  };
```

2. **`autoMapRows`** (~L113-134): KW-Parsing durch den Helfer ersetzen (gegen `weekOrder`):

```ts
  const autoMapRows = (data: string[][]) => {
    const mappings: RowMapping[] = [];
    for (let i = 1; i < data.length; i++) { // skip header
      const firstCell = String(data[i][0] || '').trim();
      mappings.push({ excelRow: i, weekW: parseWeekFromCell(firstCell, weekOrder), firstCell });
    }
    setRowMappings(mappings);
  };
```

3. **Spalten-Dropdown** (~L249-251): `{COURSES.map(...)}` → `{courses.map(...)}` (JSX-Template unverändert):

```tsx
                        {courses.map(c => (
                          <option key={c.col} value={c.col}>{c.cls} {c.day} {c.typ} ({c.les}L)</option>
                        ))}
```

4. **Zeilen-Dropdown** (~L276): `{WEEK_ORDER.map(...)}` → `{weekOrder.map(...)}`:

```tsx
                      {weekOrder.map(w => <option key={w} value={w}>KW {w}</option>)}
```

5. **Vorschau-Label** (~L330): `COURSES.find(...)` → `courses.find(...)`:

```tsx
                      const course = courses.find(c => c.col === p.col);
```

- [ ] **Step 4: Defensiver try/catch + Leer-Hinweis**

`handleFile` (~L65-79): den Parse-Block in try/catch wrappen, Fehler über Toast statt Silent-Fail. Toast-Hook oben ergänzen (`const toast = useToast();` zu den Hooks; Import `import { useToast } from '../hooks/useToast';`):

```ts
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const XLSX = await import('xlsx');
        const data = new Uint8Array(evt.target!.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        setWorkbook(wb);
        setSheetNames(wb.SheetNames);
        setSelectedSheet(wb.SheetNames[0]);
        await loadSheet(wb, wb.SheetNames[0]);
      } catch {
        toast.error('Datei konnte nicht gelesen werden. Ist es eine gültige Excel-Datei (.xlsx/.xls)?');
      }
    };
    reader.readAsArrayBuffer(file);
  };
```

Im Upload-Schritt (Step 1 der UI, `{step === 'upload' && …}`, ~L201-212) unter dem `<input type="file">` einen konditionalen Hinweis bei leerer Kursliste ergänzen:

```tsx
              {courses.length === 0 && (
                <p className="text-[11px] text-amber-400">
                  Dieser Planer hat noch keine Kurse. Erst unter Einstellungen Kurse anlegen, dann importieren.
                </p>
              )}
```

- [ ] **Step 5: tsc + Tests + Build**

Run: `bash -c "cd '<…>/GYM-WR-DUY/Unterrichtsplaner' && npx tsc -b && npx vitest run && npm run build"`
Expected: tsc 0 Fehler, alle Tests grün, Build erfolgreich.

(Falls tsc meckert, dass `detectLessonType`/`COURSES`/`WEEKS`/`WEEK_ORDER` ungenutzt oder doppelt sind → Reste aus Step 1 vollständig entfernen.)

- [ ] **Step 6: Commit**

```bash
git add src/components/ExcelImport.tsx
git commit -m "feat(planer): ExcelImport auf dynamische Kurse/Wochen umstellen

Wizard liest courses/weeks aus usePlannerData() statt statischem COURSES/WEEKS
(4 Stellen: Auto-Map, beide Dropdowns, Vorschau-Label) → Import schreibt in
dieselben col-Keys, die die Anzeige liest, auch bei eigenen Kursen (col 100+).
Defensiver try/catch beim Parsen (Toast statt Silent-Fail) + Leer-Hinweis."
```

---

## Task 3: Mount-Button in SettingsPanel

**Files:**
- Modify: `src/components/SettingsPanel.tsx`

Button in der bestehenden Sektion „💾 Daten & Sammlung" (zwischen „Planerdaten"-Div, endet ~L495, und „Sammlung"-Div, ~L496). State + Modal-Mount.

- [ ] **Step 1: Import + State**

Oben den Wizard importieren (bei den anderen Komponenten-Imports, ~L8-12):

```ts
import { ExcelImport } from './ExcelImport';
```

Im Komponenten-Body (bei den anderen `useState`-Deklarationen) ergänzen:

```ts
  const [showExcelImport, setShowExcelImport] = useState(false);
```

- [ ] **Step 2: Button-Unterzeile einfügen**

Nach dem schliessenden `</div>` des „Planerdaten"-Blocks (~L495) und vor `{/* Sammlung */}` (~L496) einfügen:

```tsx
          {/* Stundenplan-Raster (Excel) */}
          <div className="border-t pt-3" style={{ borderColor: 'var(--border)' }}>
            <p className="text-[9px] font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Stundenplan-Raster (Excel)</p>
            <p className="text-[9px] mb-1.5" style={{ color: 'var(--text-muted)' }}>Eine Excel-Tabelle (Kurse × Kalenderwochen) mit Lektionstiteln in den Planer importieren.</p>
            <button onClick={() => setShowExcelImport(true)}
              className="w-full py-1.5 rounded text-[11px] font-medium cursor-pointer transition-all"
              style={{ background: 'var(--bg-hover)', color: 'var(--text-primary)' }}>
              📊 Excel importieren
            </button>
          </div>
```

- [ ] **Step 3: Modal-Mount**

Am Ende der Komponente, unmittelbar vor dem äussersten schliessenden Tag des `return` (dort wo andere Modals/Overlays gerendert würden), einfügen — der Wizard bringt sein eigenes `fixed inset-0`-Overlay mit:

```tsx
      {showExcelImport && <ExcelImport onClose={() => setShowExcelImport(false)} />}
```

(Konkrete Stelle: direkt vor dem letzten `</…>`, das das Komponenten-`return` schliesst. Wenn das Panel von einem Fragment/Div umschlossen ist, innerhalb davon.)

- [ ] **Step 4: tsc + Tests + Build**

Run: `bash -c "cd '<…>/GYM-WR-DUY/Unterrichtsplaner' && npx tsc -b && npx vitest run && npm run build"`
Expected: tsc 0 Fehler, Tests grün, Build erfolgreich.

- [ ] **Step 5: Commit**

```bash
git add src/components/SettingsPanel.tsx
git commit -m "feat(planer): Excel-Import-Button in «Daten & Sammlung» mounten

Button + Modal-Mount in der bestehenden Settings-Sektion; ExcelImport war
bisher toter Code. Damit ist das Feature erreichbar."
```

---

## Task 4: Browser-Verifikation (Pflicht vor Merge)

**Kein Code** — manuelle E2E-Verifikation gemäss `regression-prevention.md`. Erst Test-Plan notieren, dann im Browser (Production-`vite preview` oder Dev-Server) prüfen.

- [ ] **Step 1: Test-xlsx vorbereiten** — kleine `.xlsx` mit erster Zeile = Kurs-Header (Klassennamen wie im aktiven Planer), erster Spalte = KW-Zahlen, ein paar Lektionstitel in den Zellen.

- [ ] **Step 2: Legacy-/Standard-Planer** — Einstellungen → „💾 Daten & Sammlung" → „📊 Excel importieren" → Datei hochladen → Auto-Map prüfen → ggf. manuell korrigieren → Vorschau → Importieren → **Raster zeigt die Titel an den richtigen Kurs/KW-Zellen** → Undo (Ctrl+Z) macht rückgängig.

- [ ] **Step 3: Planer mit EIGENEN Kursen (col 100+)** — derselbe Ablauf in einem Planer mit selbst-definierten Kursen. **Der eigentliche Regressions-Beweis:** die importierten Titel müssen erscheinen (nicht „Import erfolgreich, aber leer"). Dropdown-Optionen zeigen die eigenen Kurse.

- [ ] **Step 4: Leerer Planer** — Planer ohne Kurse: Upload-Schritt zeigt den Amber-Hinweis „Erst Kurse anlegen"; Spalten-Dropdown leer; kein Crash.

- [ ] **Step 5: Konsole + Light/Dark** — keine Console-Errors; Modal in beiden Themes kurz sichten (Theming ist zurückgestellt, muss aber lesbar/bedienbar sein).

- [ ] **Step 6:** Ergebnis im Chat dokumentieren (was getestet, was beobachtet) → LP-Freigabe einholen → erst dann Merge nach `main` gemäss `deployment-workflow.md`.

---

## Reihenfolge & Abhängigkeiten

Task 1 → 2 → 3 → 4, strikt sequentiell (Task 2 nutzt die Helfer aus Task 1; Task 3 mountet die Komponente aus Task 2; Task 4 testet das Ganze).

## Risiken / Hinweise

- **Hook-Sicherheit:** `usePlannerData()` + `useMemo` werden oben bei den anderen Hooks aufgerufen, vor jedem Early-Return → rules-of-hooks-konform (`code-quality.md` § Hooks-vor-Early-Return).
- **Kein neues `any`**, kein `alert()` (CI-Gates). Toast über `useToast()`.
- **xlsx** bleibt lazy (`await import('xlsx')`) — kein Haupt-Bundle-Impact, keine neue Dependency.
- **Build-Verifikation:** Falls `node_modules`-Layout-Themen auftreten, gilt der CLAUDE.md-Hinweis (`rm -rf node_modules && npm install` im Repo-Root für CI-Aussagekraft) — für reine Quell-Edits hier i.d.R. nicht nötig.
