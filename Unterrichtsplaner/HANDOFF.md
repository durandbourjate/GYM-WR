# Unterrichtsplaner – Handoff v3.106

## Status: v3.106 — Harmonisierung mit ExamLab (Toast, Lint-Gates)

**Aktuelle Version:** v3.106 (20.05.2026)

---

## Workflow

**Immer `npx tsc --noEmit && npm run build` vor und nach jeder Änderung.**
Commit nach jedem erledigten Task: `git add -A && git commit -m "vX.XX: Beschreibung" && git push`

---

## Offene Punkte

| # | Beschreibung | Priorität |
|---|-------------|-----------|
| UP-4 | **CSS-Variable-Overrides aufräumen** (Rest aus Design-Cleanup). ~~gray→slate~~ + ~~Farbduplikate~~ erledigt in v3.105. | niedrig |
| ~~UP-5~~ | **Bundle 1+2 ✅ erledigt in v3.106** (Toast aus shared, 54 alert→Toast, 80 any-Token migriert, lint:no-alert + lint:as-any aktiv). | erledigt |
| ~~UP-6~~ | **`packages/shared` als Planer-Dependency aktiv ✅** (npm workspaces im Root). `generateColorVariants`-Migration: separate Bundle. | erledigt |
| UP-7 | **vitest-Setup + Unit-Tests** für Utils (`generateColorVariants`, `gradeRequirements`, `hkRotation`). Heute 0 Tests im Planer. | mittel |
| UP-8 | **Apps-Script-URL + LP-E-Mail aus Config laden** statt hardcoded in `synergyService.ts` + `pruefungBridge.ts`. Voraussetzung für Backend-Migration. | mittel |
| UP-9 | **`generateColorVariants` aus Planer nach `packages/shared`** ziehen (UP-6 zweiter Teil — Cross-Tool-Farb-Konsistenz). | niedrig |
| UP-10 | **Spawn-Tasks aus Bundle 1+2**: (a) pre-existing shared-Tests fixen (`BatchTagPicker`, `stabilId`), (b) legacy `ExamLab/node_modules` + `Unterrichtsplaner/node_modules` löschen + Re-Install (Doppel-React-Version), (c) `--if-present` aus `lint:no-alert`-CI-Steps rausnehmen (nach erfolgreichem Merge). | niedrig |

---

## Letzte Sessions

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
- Legacy `ExamLab/node_modules` + `Unterrichtsplaner/node_modules` aus Vor-Workspace-Ära enthalten alte React 19.2.4, Root hat 19.2.6 — Band-Aid via vitest-Aliases, cleaner Cleanup-Task notiert
- pre-existing shared-Tests scheitern unter minimalem shared/vitest.config.ts (React-Plugin fehlt) — Test-Setup-Task notiert
- `tsc -b` Exit-Code lügt bei Phase-2-Test fast übersehen (Memory `feedback_tsc_b_exit_misleading.md` greift)

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
