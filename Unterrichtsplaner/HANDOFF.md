# Unterrichtsplaner – Handoff v3.105

## Status: v3.105 — Design-Cleanup (slate-Harmonisierung)

**Aktuelle Version:** v3.105 (25.03.2026, seither keine Code-Änderungen am Planer)

---

## Workflow

**Immer `npx tsc --noEmit && npm run build` vor und nach jeder Änderung.**
Commit nach jedem erledigten Task: `git add -A && git commit -m "vX.XX: Beschreibung" && git push`

---

## Offene Punkte

| # | Beschreibung | Priorität |
|---|-------------|-----------|
| UP-4 | **CSS-Variable-Overrides aufräumen** (Rest aus Design-Cleanup). ~~gray→slate~~ + ~~Farbduplikate~~ erledigt in v3.105. | niedrig |
| UP-5 | **Harmonisierung mit ExamLab — Bundle 1+2** (geplant 19.05.2026): Toast-System aus ExamLab nach `packages/shared` ziehen + alle 54 `alert()`-Stellen im Planer ersetzen. Lint-Gates `lint:as-any` (51 Stellen) + `lint:no-alert` adoptieren. Vorbereitung Backend-Migration ab Aug 2026. | hoch |
| UP-6 | **`packages/shared` als Planer-Dependency aktivieren** (Voraussetzung für UP-5). `generateColorVariants` als ersten Shared-Move. | mittel |
| UP-7 | **vitest-Setup + Unit-Tests** für Utils (`generateColorVariants`, `gradeRequirements`, `hkRotation`). Heute 0 Tests vs. ExamLab 1994+. | mittel |
| UP-8 | **Apps-Script-URL + LP-E-Mail aus Config laden** statt hardcoded in `synergyService.ts` + `pruefungBridge.ts`. Voraussetzung für Backend-Migration. | mittel |

---

## Letzte Sessions

### 19.05.2026 — HANDOFF-Nachzug + Analyse Harmonisierung

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
