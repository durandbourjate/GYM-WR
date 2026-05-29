# Unterrichtsplaner – Handoff v3.108

## Status: v3.108 — Schuljahr-Helper (getMonth-Konvention zentralisiert)

**Aktuelle Version:** v3.108 (22.05.2026)

---

## Workflow

**Immer `npx tsc -b && npm run build` vor und nach jeder Änderung.**
Commit nach jedem erledigten Task: `git add -A && git commit -m "vX.XX: Beschreibung" && git push`

---

## Offene Punkte

| # | Beschreibung | Priorität |
|---|-------------|-----------|
| ~~UP-4~~ | **CSS-Variable-Overrides ✅ erledigt (2026-05-20)** (doppelte `:root`/`:root.light-mode`-Blöcke in `index.css` zusammengeführt — Basis- + Status-Farben waren getrennt definiert). | erledigt |
| ~~UP-5~~ | **Bundle 1+2 ✅ erledigt in v3.106** (Toast aus shared, 54 alert→Toast, 80 any-Token migriert, lint:no-alert + lint:as-any aktiv). | erledigt |
| ~~UP-6~~ | **`packages/shared` als Planer-Dependency aktiv ✅** (npm workspaces im Root). `generateColorVariants`-Migration: separate Bundle. | erledigt |
| ~~UP-7~~ | **vitest-Setup + Unit-Tests + CI-Gate ✅ erledigt (2026-05-20)** (`generateColorVariants`-Clamp-Bugfix + 27 Tests in 3 Dateien + `deploy.yml`/`pre-push`-Gate, Branch `feature/up7-vitest-tests`). | erledigt |
| ~~UP-8~~ | **Synergy-Config aus globalem Store ✅ erledigt (2026-05-20)** (`synergyConfigStore` + `SynergyConfigSection` UI + Service-Refactor + reaktives Gating, hardcodierte `APPS_SCRIPT_URL`/`LP_EMAIL` entfernt, Branch `feature/up8-synergy-config`). | erledigt |
| UP-9 | **`generateColorVariants` aus Planer nach `packages/shared`** ziehen (UP-6 zweiter Teil — Cross-Tool-Farb-Konsistenz). | niedrig |
| ~~UP-10~~ | **Spawn-Tasks aus Bundle 1+2 ✅ erledigt** — (a) `packages/shared`-Tests laufen grün (263 Tests / 21 Dateien), (b) ~~legacy node_modules~~ ✅, (c) Planer-`lint`-CI-Steps haben kein `--if-present` mehr. (a)+(c) waren bei der Backlog-Audit 20.05.2026 bereits erfüllt (HANDOFF war stale). | erledigt |

---

## Letzte Sessions

### 29.05.2026 — only-export-components Sweep (Fast-Refresh-Hygiene)

Letzte 6 ungegateten react-doctor-Errors abgeräumt (`only-export-components`: Component-Files dürfen nur Components exportieren). Reiner Refactor, kein Verhaltens-Change. **InlineEdit** → `FACHBEREICH_COLORS_PREVIEW`/`getCatColor`/`getCatBorder` nach `data/categories.ts` (zu `WR_CATEGORIES`); Importeure WeekRows + HoverPreview umgeleitet. **DetailPanel** → Re-Export von `blockCategories`-Helpern gelöscht; HoverPreview importiert direkt aus `data/blockCategories`. **SpecialWeeksEditor** → `formatGymLevel` + `normalizeGymLevel` nach neuem `utils/gymLevel.ts`; SpecialWeeksEditor + GCalSection importieren von dort. **PDFEditor (shared)** → `STANDARD_HIGHLIGHT_FARBEN` ist intern-only (kein externer Importeur; ExamLab hat eigene Kopie in `pdf/PDFTypes.ts`) → `export` entfernt. react-doctor `only-export-components` 6→0 (Gesamt-Errors 7→1, Rest nur akzeptierter `no-eval`). tsc beide Apps + vitest (shared 264, Planer 50, ExamLab 2132) + Planer-Build grün. **Lehre:** vor dem Entfernen einer „nur intern genutzten" Funktion grep über die GANZE Datei — `normalizeGymLevel` wurde an Z.102/156/157 noch gebraucht (tsc fing's, Import nachgezogen).

### 29.05.2026 — effect-needs-cleanup Trio (App, SettingsPanel, CourseEditor)

3 `setTimeout`-ohne-Cleanup useEffects aus dem react-doctor-Audit gefixt. **App.tsx:179** (Mount-Scroll, `deps=[]`): trivialer `clearTimeout`-Cleanup. **CourseEditor** + **SettingsPanel** hatten ein Self-Trigger-Muster (Effect cleart `settingsEditKursId`/`pendingHolidayKw` selbst → sofortiger Re-Run): ein naiver `return () => clearTimeout(id)` hätte den Scroll-Timer beim Re-Run (~16ms) abgebrochen, bevor er bei 100/200ms feuert → Scroll verpufft. **CourseEditor:** Trigger erst IM Timer löschen (kein vorzeitiger Re-Run). **SettingsPanel:** in zwei Effects gesplittet — Effect 1 konsumiert `pendingHolidayKw` sofort + legt Ferien-Eintrag an (one-shot, kein Duplikat) + setzt lokales Scroll-Flag; Effect 2 scrollt mit Same-Effect-Cleanup. Verifikation: TDD-Regressionstest `CourseEditor.test.tsx` (Self-Trigger-Scroll feuert + Unmount-Cleanup, red→green bestätigt), react-doctor `effect-needs-cleanup` 3→0, tsc + 50 vitest + build grün, Browser-E2E (App-Reload ohne Error, SettingsPanel legt Ferien-Eintrag an, 0 Console-Errors).

### 29.05.2026 — Bugfix rules-of-hooks (NoteCell + HoverPreview)

react-doctor Voll-Audit fand 3 `rules-of-hooks`-Verletzungen im Planer (beim WeekRows-Split `39a1c9e`/R8-R13 eingeschleppt): `useEffect` lag NACH einem early-return. `NoteCell` wird bedingungslos pro Zelle gerendert (`WeekRows.tsx:736`) → taucht in einer montierten leeren Zelle eine Lektion auf, flippt der Hook-Count am selben Fiber 4→6 → React #310 „Rendered more hooks" (real erreichbar). `HoverPreview` dieselbe Klasse, aber latent (Parent unmountet via `showPreview`). Fix: beide Effekte vor den Early-Return gezogen, verhaltens-identisch (no-op/guarded ohne Entry), regelkonform zu `code-quality.md` S130. TDD-Regressionstest `NoteCell.test.tsx` (entry-Flip am Fiber, red→green). react-doctor `rules-of-hooks` 3→0; Gates state/security 0 Drift. tsc + 48 vitest + build grün. Browser-E2E im echten Planer: Live entry-Flip/Edit-Fokus/HoverPreview ohne Crash, Console leer.

### 22.05.2026 — v3.108: Schuljahr-Helper (getMonth-Konvention zentralisiert)

Die „ab Juli zählt das neue Schuljahr"-Konvention (`getMonth() >= 6`) lag dreifach inline: `gradeRequirements.ts` (Endjahr) + `PlannerTabs.tsx` (2× Startjahr für `defaultPresetId`). Folge-Refactor zu v3.107. Neuer Helper `utils/schuljahr.ts` mit `aktuellesSchuljahrStartjahr()` + `aktuellesSchuljahrEndjahr()` (Endjahr = Startjahr + 1) — die `getMonth()`-Schwelle lebt jetzt an genau einer Stelle. Verhalten unverändert, bestehende `getGymStufe`-Tests bleiben grün. TDD: `schuljahr.test.ts` (3 Tests). tsc + 47 vitest-Tests + build grün.

### 22.05.2026 — v3.107: Bugfix getGymStufe SJ-Default

`getGymStufe` (`utils/gradeRequirements.ts`) hatte das SJ-Endjahr hart auf `2026` verdrahtet (`maturaYear ?? 2026`); alle 4 Produktiv-Aufrufer rufen ohne `maturaYear` auf → ab SJ 26/27 falsche GYM-Stufe (latenter Bug). Fix: neuer Helper `aktuellesSchuljahrEndjahr()` leitet das Endjahr aus dem Datum ab (Konvention wie `PlannerTabs.tsx`: ab Juli zählt das neue Schuljahr). TDD: Regressionstest mit `vi.setSystemTime` (Juli-Rollover); bestehende `getGymStufe`-Tests auf explizites `maturaYear: 2026` gehärtet (datums-unabhängig). tsc + 44 vitest-Tests + build grün.

### 20.05.2026 — UP-4 + Backlog-Audit (erledigt)

- **UP-4:** Doppelte `:root`/`:root.light-mode`-Blöcke in `index.css` zusammengeführt (Basis-Variablen + Status-Farben waren getrennt definiert). Rein additive CSS-Konsolidierung, kein Rendering-Unterschied — verifiziert via `getComputedStyle` aller Variablen + Browser-Test Light/Dark.
- **Backlog-Audit:** UP-10a (`packages/shared`-Tests) und UP-10c (`--if-present` in Planer-CI-Steps) waren bereits erfüllt — HANDOFF war stale, jetzt korrigiert. UP-9 (`generateColorVariants` → `packages/shared`) bewusst offengelassen: kein ExamLab-Konsument, daher YAGNI.

### 20.05.2026 — UP-8: Synergy-Config aus globalem Store (erledigt)

**5 Tasks auf Branch `feature/up8-synergy-config`.**

- **Task 1 — `synergyConfigStore`:** Globaler, persistierter Zustand-Store (`appsScriptUrl`, `lpEmail`) + `istSynergyKonfiguriert`-Predicate + `useSynergyKonfiguriert`-Hook.
- **Task 2 — `validateSynergyConfig`:** Pure Validierungsfunktion (URL-Format + E-Mail-Syntaxcheck) in `src/utils/synergyConfigValidation.ts`.
- **Task 3 — `SynergyConfigSection`:** Config-Eingabe-UI (URL + E-Mail, Inline-Validierung), in `SettingsPanel` eingehängt.
- **Task 4 — Service-Refactor:** `synergyService.ts` + `pruefungBridge.ts` lesen Config reaktiv aus dem Store; hardcodierte `APPS_SCRIPT_URL` + `LP_EMAIL` entfernt.
- **Task 5 — Reaktives Gating:** `KursImportButton`, `NotenStandSection`, `useSynergyData` gaten reaktiv via `useSynergyKonfiguriert()`; veraltete `istKonfiguriert()`-Exports entfernt.
- **Gesamt:** 5 Testdateien, 43 Tests, alle grün. `tsc -b` + Build sauber.

### 20.05.2026 — UP-7: vitest-Setup + Unit-Tests + CI-Gate (erledigt)

**6 Tasks auf Branch `feature/up7-vitest-tests`.**

- **Task 1 — vitest-Infrastruktur:** `vitest.config.ts` + `src/test-setup.ts` (jsdom + testing-library, ExamLab-Parität). `test`/`test:watch`-Scripts in `package.json`.
- **Task 2 — `generateColorVariants`-Tests + Clamp-Bugfix:** 4 Unit-Tests (TDD). Bugfix: `bg`-Kanäle wurden nicht auf 255 geclampt → ungültiger 9-Zeichen-Hex bei satten Farben.
- **Task 3 — `gradeRequirements.ts`-Tests:** 17 Charakterisierungs-Tests für 5 Funktionen (`getGymStufe`, `getGradeRequirements`, `getCourseGroups`, `countAssessments`, `checkGradeRequirements`).
- **Task 4 — `hkRotation.ts`-Tests:** 6 Charakterisierungs-Tests für `getHKGroup` + `getHKSchedule`.
- **Task 5 — CI-Gate:** `npm test`-Step in `deploy.yml` (Production + Staging) + `.githooks/pre-push`-Hook.
- **Gesamt:** 3 Testdateien, 27 Tests, alle grün. `tsc -b` + Build sauber.

### 20.05.2026 — UP-7: Brainstorming → Spec → Plan (bereit zur Umsetzung)

Brainstorming-, Spec- und Plan-Phase für UP-7 abgeschlossen auf Branch
`feature/up7-vitest-tests`. Beide Dokumente Reviewer-approved und committet:
- Spec: `docs/superpowers/specs/2026-05-20-up7-vitest-design.md`
- Plan: `docs/superpowers/plans/2026-05-20-up7-vitest.md` — 6 Tasks

Entscheidungen: volle vitest-Parität zu ExamLab (jsdom + testing-library),
CI-Gate in `deploy.yml` + `pre-push`, Mini-Fix für einen Clamp-Bug in
`generateColorVariants` (ungültiger Hex bei satten Farben mit 255-Kanal).
**Nächster Schritt: Plan umsetzen via subagent-driven-development.**

### 19.–20.05.2026 — Bundle 1+2: Toast + Lint-Gates Harmonisierung (v3.106)

**~35 Commits auf Branch `feature/bundle-1-2-toast-shared`.**

**Phase 1 — npm-Workspaces (5 Commits):**
- Root `package.json` mit `workspaces: [packages/shared, Unterrichtsplaner, ExamLab]` + Single `setup: npm install`
- `@gymhofwil/shared` als Dep in Planer + ExamLab eingetragen
- Sub-Lockfiles gelöscht, Root-Lockfile (435 KB) erzeugt
- `npm ls react` zeigt single dedup-Version
- `deploy.yml`: 3× `npm ci` → 1× Root-Install, `cache-dependency-path` auf Root-Lockfile

**Phase 2 — Toast → packages/shared (10 Commits):**
- Toast-System (60+21+47 = 128 LOC) nach `packages/shared/src/toast/` verschoben
- Barrel `toast/index.ts` + Re-Export aus `shared/index.ts` als flache Public-API
- vitest in shared + 3 Smoke-Tests (später durch 19 migrierte ExamLab-Tests ersetzt)
- 24 ExamLab-Imports + 3 Test-Files via sed/git-mv migriert (`useToast`, `useToastStore`, `ToastContainer`)
- 3 orphan Toast-Source-Files in ExamLab gelöscht
- Hotfix: 4 sibling-relative Imports (`./useToast`, `./toastStore`) die der sed missed
- ExamLab ci-check grün (1994+4 todo Tests, alle 9 Lint-Gates clean)

**Phase 3 — Planer-Touch (~25 Commits):**
- `ToastContainer` im Planer-`App.tsx` mounted (beide Return-Branches: WelcomeScreen + PlannerContent)
- Tailwind v4 `@source "../../packages/shared/src"` in `index.css` (statt separater `tailwind.config.ts`)
- `audit-as-any.sh` + `audit-no-alert.sh` um `--target=<dir>`-Parameter erweitert (Backwards-Compat erhalten)
- **54× `alert()` → Toast** in 10 Files (10 Commits): SettingsPanel (29), PlannerTabs (9), TaFPanel (4), settings/KursImportButton (3), settings/shared (2), ZoomMultiYearView (2), SequencePanel (2), settings/SubjectsEditor (1), settings/GCalSection (1), detail/DetailsTab (1). `confirm()`-Aufrufe (37 verbleiben) bewusst unangetastet.
- **80× `any`-Token** migriert in 17 Files (17 Commits) — **100% via echter Type-Guard-Fix** (Strategy 1), keine Defensive-Marker nötig. Top-Konzentrationen: gcal.ts (13, neue `GISOAuth2`+`GCalEvent`+`CalendarListItem`-Interfaces), WeekRows/ZoomYearView/ZoomBlockView (8/8/7, LessonEntry-Type-Guards), SettingsPanel (8), PlannerTabs (7), settings/CourseEditor (7), settings/GCalSection (6).
- `lint:as-any` + `lint:no-alert` in `Unterrichtsplaner/package.json` aktiviert (--strict, beide aktuell 0 Treffer)
- `.github/workflows/deploy.yml`: 2 neue Steps in Production + Staging (Staging mit `--if-present`)
- HANDOFF auf v3.106 nachgezogen

**Erkenntnisse (Spawn-Tasks UP-10):**
- ExamLab Toast hatte bereits 3 umfangreiche Test-Files (19 Tests) — wurden mit-migriert (P2.T1-Inventur war unvollständig)
- pre-existing shared-Tests scheitern unter minimalem shared/vitest.config.ts (React-Plugin fehlt) — Test-Setup-Task notiert (UP-10a)
- `tsc -b` Exit-Code lügt bei Phase-2-Test fast übersehen (Memory `feedback_tsc_b_exit_misleading.md` greift)

**CI-Nachgang (20.05.2026 — 3 Fix-Commits nach erstem Merge):**

Der erste Bundle-Merge auf `main` (`05eb485`) lief im GitHub-Actions-CI rot — die lokale macOS-Verifikation deckte das Linux-CI-Verhalten der npm-Workspace-Migration nicht ab. Drei Folge-Fixes:
- `6477330` + `c1c9cdd`: **npm-Bug 4828** — `npm ci` materialisiert plattformfremde rollup-native-Binaries (`@rollup/rollup-linux-x64-gnu`) nicht. Fix: CI-Workflow macht `rm -f package-lock.json && npm install` (frische plattformkorrekte Resolution auf Linux). Staging-Block auf einen Root-Install konsolidiert.
- `908d165`: **hardcodierte `ExamLab/node_modules`-Aliases** in `vite.config.ts`, `vitest.config.ts`, `tsconfig.app.json`, `packages/shared/tsconfig.json` — Vor-Workspace-Band-Aid (Cluster G Phase 3c). Nach dem Workspace-Hoisting existiert `ExamLab/node_modules/` im CI nicht mehr. Alle Aliases entfernt (Hoisting dedupliziert auf Root-Kopie, `dedupe` bleibt). Legacy-`node_modules` lokal gelöscht + sauberer Root-Install — damit Spawn-Task UP-10b (legacy node_modules) **erledigt**.
- Endstand: CI grün (`908d165`, build 6m44s + deploy), `main` + `preview` synchron, deployed.

**Prozess-Lehre:** Bei Migrationen die das `node_modules`-Layout ändern (Workspace-Einführung) ist `macOS-lokal ≠ Linux-CI` ein strukturelles Risiko. Lokale `ci-check` ist nur aussagekräftig nach `rm -rf node_modules && npm install` (CI-identische Umgebung). Pushes hätten zuerst auf `preview` gehen müssen — wobei diese CI-Architektur (Production-Block baut immer `main`) eine echte preview-only-Validierung erschwert.

### Vorher (19.05.2026): HANDOFF-Nachzug + Analyse Harmonisierung

- HANDOFF auf v3.105 nachgezogen (Header, Status, Aktuelle Version).
- Cross-Repo-Analyse: 5 strukturelle Defizite ggü. ExamLab dokumentiert in UP-5 bis UP-8 (54× `alert()`, 51× `as any`, 0 Tests, `packages/shared` ungenutzt, hardcoded Apps-Script-Config).
- Bundle 1+2 (Toast nach Shared + Lint-Gates) als nächstes priorisiert.

### v3.105 — Design-Cleanup slate + Farbduplikate (25.03.2026)

Commit `fd85cd9` — 22 Files, 324 Stellen migriert.
- `text-gray-*` / `bg-gray-*` / `border-gray-*` → `slate-*` (Projekt nutzt slate-basierte CSS Variables, gray war inkonsistent).
- Fachbereich-Farb-Duplikate aufgelöst: Geschichte #b45309 → #92400e (amber-800, war Konflikt mit Italienisch). Geografie #0891b2 → #0e7490 (cyan-700, Konflikt mit Französisch). Mathematik #1d4ed8 → #2563eb (blue-600, Konflikt mit Deutsch).
- UP-4 weitgehend abgeräumt — Rest: CSS-Variable-Overrides aufräumen.

### 24.03.2026 — Bugfixes + Versionsticker

- **UP-1 behoben:** PlannerTabs Kontextmenü "Löschen" reagierte nicht — Event-Bubbling-Bug (stopPropagation + Click-Outside-Handler), Disabled-Styling
- **UP-2 behoben:** Versionsticker zeigte v3.102 statt v3.104 — `src/version.ts` aktualisiert
- **UP-3 erledigt:** Versionsticker für alle Tools eingeführt (Prüfungstool v1.0, Übungspools v2.0)
- HANDOFFs getrimmt (Unterrichtsplaner 1736→85 Zeilen, Prüfung 1319→130 Zeilen)

### v3.104 — Tool-Synergien UI-Integration (23.03.2026)

4 Features:
- **useSynergyData Hook** (`src/hooks/useSynergyData.ts`) — Shared async data loading mit Cache für Prüfungs-/Synergy-Daten.
- **PruefungBadge in WeekRows** (`src/components/WeekRows.tsx`) — KW-Badges für anstehende/durchgeführte Prüfungen.
- **NotenStandSection** (`src/components/settings/NotenStandSection.tsx`) — Fortschrittsbalken pro Gefäss/Semester.
- **KursImportButton** (`src/components/settings/KursImportButton.tsx`) — Kurse aus zentralem Google Sheet importieren.

Konfiguration: `APPS_SCRIPT_URL` und `LP_EMAIL` in `synergyService.ts` und `pruefungBridge.ts`.

### v3.103 — Tool-Synergien Backend + Variablen-Harmonisierung (24.03.2026)

Neue Dateien:
- `src/services/synergyService.ts` — Zentrale Daten via Apps Script, localStorage-Caching (24h TTL).
- `src/services/pruefungBridge.ts` — Prüfungs-Badges + Noten-Stand.

Variablen-Harmonisierung (~510 Stellen in 45 Dateien):
- `subjectArea` → `fachbereich`, `topicMain` → `thema`, `topicSub` → `unterthema`, `courseId` → `kursId`
- Enum-Werte: `'RECHT'` → `'Recht'`, `'IN'` → `'Informatik'`, `'INTERDISZ'` → `'Interdisziplinaer'`

### v3.100 — UI-Verbesserungen & Bugfixes (23.03.2026)

8 Tasks erledigt: Light-Mode Kontrast, flache Typ-Buttons, SOL nach Settings, Sequenz-Löschung Fix, Toolbar-Reihenfolge, TaF-Preset korrigiert.

### v3.99 — Sommerferien + weekData-Migration

Schuljahr bis KW 32 verlängert, weekData-Migration für bestehende Instanzen.

### v3.98 — Toolbar-Redesign

Tabs in Kopfzeile, Kursfilter als Dropdown, TaF nach Settings, Legend→HelpBar.

---

## Versionshistorie (Kurzfassung)

| Version | Datum | Beschreibung |
|---------|-------|-------------|
| v3.107 | 22.05.2026 | Bugfix getGymStufe: dynamisches SJ-Endjahr statt hardcoded 2026 |
| v3.106 | 20.05.2026 | Bundle 1+2: Toast → shared, 54 alert→Toast, 80 any-Token migriert, Lint-Gates aktiv, npm workspaces |
| v3.105 | 25.03.2026 | Design-Cleanup: gray→slate (322 Stellen) + Farbduplikate behoben |
| v3.104+ | 24.03.2026 | Bugfixes (Kontextmenü, Versionsticker), HANDOFF-Trim |
| v3.104 | 23.03.2026 | Tool-Synergien UI (Badges, Import, Notenstand) |
| v3.103 | 24.03.2026 | Synergy-Backend, Variablen-Harmonisierung |
| v3.100 | 23.03.2026 | UI-Fixes, Light-Mode, SOL-Config |
| v3.99 | — | Sommerferien bis KW 32 |
| v3.98 | — | Toolbar-Redesign |
| v3.97 | — | Ferien ohne rowSpan, Sonderwochen-Fix |
| v3.96 | — | 11 Bug-Fixes + UX |
| v3.95 | — | Refactoring Phase 2 (plannerStore Slices) |
| v3.94 | — | Refactoring P3+P4 (WeekRows + DetailPanel) |
| v3.93 | — | Refactoring P1 (SettingsPanel) |
| v3.92 | — | Zoom + Light-Mode Fix |
| v3.91 | — | Zoom-Funktion, Sequenz-Panel Fix |
| v3.90 | — | Light-Mode, Dropdown-Fix, Scroll-Fix |
| v3.89 | — | 7 Bug-Fixes + Light/Dark Toggle |
| v3.88 | — | Sonderwochen, Panel-Scroll, TaF-Phasen |
| v3.87 | — | Toolbar-Layout, Sequenz-UE, Defaults |

*Detaillierte Session-Logs früherer Versionen: siehe Git-History.*
