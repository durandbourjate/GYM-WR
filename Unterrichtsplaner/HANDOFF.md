# Unterrichtsplaner – Handoff v3.75

## Status: ✅ Built & Deployed (v3.75)
- **Datum:** 2026-03-03
- **Deploy:** https://durandbourjate.github.io/GYM-WR-DUY/Unterrichtsplaner/

## Erledigte Aufträge (v3.54–v3.63)

| Version | Auftrag | Status |
|---------|---------|--------|
| v3.54 | Kurs-Konfiguration Export/Import | ✅ |
| v3.55 | Aus Sammlung laden für Settings | ✅ |
| v3.56 | Kachel-Badge für Prüfungen | ✅ |
| v3.57 | Warnung bei 1L/2L Rhythmisierung | ✅ |
| v3.58 | Drag&Drop Verschieben | ✅ |
| v3.59 | Doppelklick Kursfilter | ✅ |
| v3.60–63 | Google Calendar Integration (4 Phasen) | ✅ |

## Erledigte Aufträge (v3.73 — Auftrag v3.73, 20 Tasks)

| # | Batch | Beschreibung | Status |
|---|-------|-------------|--------|
| 4 | 1-Bug | Leere Statistik crash fix (keine Kurse) | ✅ |
| 6 | 1-Bug | Phantom-Ferien nach Settings-Änderung | ✅ |
| 13 | 1-Bug | Cursor-Bug: pointer auf Klick-Elemente | ✅ |
| 12 | 1-Bug | Benennung: "Batch"→"Sequenz" durchgängig | ✅ |
| 1 | 2-Settings | Schulstufe wählbar (Grundstufe–Hochschule) | ✅ |
| 2 | 2-Settings | Lektionendauer konfigurierbar (45/50 min) | ✅ |
| 3 | 2-Settings | GYM-Stufe pro Kurs in Settings | ✅ |
| 5 | 2-Settings | Fachbereiche: leerer Default, +Vorlage-Button | ✅ |
| 11 | 3-UX | Doppelklick öffnet direkt Detail-Panel | ✅ |
| 14 | 3-UX | Klick auf Klassenname → Settings mit Kurs | ✅ |
| 15 | 3-UX | "Neue UE"-Button im Side-Panel | ✅ |
| 16 | 3-UX | "+"-Button vor "Alle" für neue Sequenz | ✅ |
| 17 | 3-UX | Legende zeigt nur aktive Kategorien | ✅ |
| 8 | 4-Sonderw | Sonderwochen: Doppelklick=Edit, Rechtsklick=Entfernen | ✅ |
| 9 | 4-Sonderw | "Ausgenommen"→"Nicht betroffen" mit Tooltip | ✅ |
| 10 | 4-Sonderw | Hofwil-Preset entfernt (generisch) | ✅ |
| 7 | 4-Import | Ferien-Import: CSV + JSON Format | ✅ |
| 20 | 5-Feature | Beurteilungsregeln konfigurierbar (Settings) | ✅ |
| 18 | 5-Feature | Lehrplanziele-Text nach Schulstufe | ✅ |
| 19 | 5-Feature | GCal OAuth: besseres Error Handling (403, 404, Netzwerk) | ✅ |

## Erledigte Aufträge (v3.74 — Auftrag v3.74, 12 neue Tasks #21–#32)

| # | Beschreibung | Status |
|---|-------------|--------|
| 21 | Neuer Plan zeigt keine Stale-Daten im UE-Panel (bereits korrekt isoliert) | ✅ |
| 22 | Sequenz Bezeichnung→Oberthema: Sync über ersten Buchstaben hinaus | ✅ |
| 23 | Neue Sequenz: Mini-Dialog + erster Block + Detail öffnet automatisch | ✅ |
| 24 | "Einstellungen öffnen"-Button: Hinweis wenn Panel bereits offen | ✅ |
| 25 | SOL-Dauer: nur 45, 90 und "Andere" (compact-Modus) | ✅ |
| 26 | Endzeit-Berechnung: Hinweis "⚠ ohne Pausen" bei >1 Lektion | ✅ |
| 27 | Semester-Tage: Tooltip für unterschiedliche Tage pro Semester | ✅ |
| 28 | Mehrjahresübersicht: dynamisch statt hardcoded BWL/VWL/Recht | ✅ |
| 29 | Beurteilungsregeln: Deadline als Datepicker, grössere Felder | ✅ |
| 30 | Sonderwochen-Import: Button-Text + Tooltip für Formate aktualisiert | ✅ |
| 31 | Stift-Icon 23✏ → "23 frei" mit besserem Tooltip | ✅ |
| 32 | Mehrjahresübersicht: Leerer Zustand + Import bei neuem Plan | ✅ |

## Erledigte Aufträge (v3.75 — Auftrag v3.75, 4 Tasks)

| # | Beschreibung | Status |
|---|-------------|--------|
| 1 | Fachbereiche überall dynamisch (6+ Stellen: WeekRows, StatsPanel, CurriculumGoalPicker, ZoomMultiYearView, SettingsPanel, plannerStore) | ✅ |
| 2 | Sequenz im Planer sichtbar auf allen zugewiesenen KW (selectRange + WeekRows Rendering) | ✅ |
| 3 | Schnelles Klick/Drag: Interpolation bei mouseenter füllt übersprungene Zellen | ✅ |
| 4 | HANDOFF.md Status-Update + Commit/Push | ✅ |

## Erledigte Aufträge (v3.64–v3.70, UX-Feedback Runde 2)

| Version | Auftrag | Status |
|---------|---------|--------|
| v3.64 | Bugfixes & Defaults (Dauer min, SOL/Kategorie/Dauer Defaults, Sequenz-Persistenz) | ✅ |
| v3.65 | Toolbar aufräumen (dynamische Kursfilter, DataMenu/+Neu entfernt) | ✅ |
| v3.66 | Kurs-Settings (Endzeit auto, + Tag Button, grössere Zeitfelder) | ✅ |
| v3.67 | Ferien vereinfacht (Tage nur bei Einzelwochen, ReapplyButton entfernt) | ✅ |
| v3.68 | Batch→Sequenz (Fachbereich übertragen, floating Toolbar) | ✅ |
| v3.69 | Sammlung im Detail-Tab (Speichern/Laden einzelner UE) | ✅ |
| v3.70 | Sequenz-Felder (Erklärtexte, Hierarchie-Indikator) | ✅ |

**Hinweis:** Google Calendar benötigt Google Cloud Projekt mit OAuth Client ID.

---

## Backlog (niedrigere Priorität)

1. **Template-System erweitern:** Komplette Planer-Daten als Template, Vorlagen-Bibliothek.
2. **Event-Overlay Name-Verschiebung:** Bei partiellen Sonderwochen Name verschieben.
3. **IW-Plan Auto-Verknüpfung:** Automatische IW-Event-Erkennung im DetailPanel.
4. **Automatischer Lehrplanbezug:** Lehrplanziele aus Thema/Fachbereich vorschlagen.
5. **Zoom 1 (Multi-Year):** Weitere Verbesserungen der Jahrgänge-Ansicht.

---

## Architektur

- **Stack:** React + TypeScript + Vite + Zustand + PWA
- **Build & Deploy:** GitHub Actions (`.github/workflows/deploy.yml`) baut und deployed automatisch bei Push auf `main`. `dist/` ist in .gitignore — Build-Artefakte werden NICHT committet. Für lokale Entwicklung: `npm run dev` (nutzt `src/index.dev.html` als Vite-Entry). `deploy.sh` ist nur für lokale Tests.
- **Wiki:** `wiki.html` (Standalone-HTML, kein Build nötig). Erreichbar über 📖-Button in der Toolbar.
- **Store:** `plannerStore.ts` (~1260 Z.), `settingsStore.ts` (~323 Z.), `instanceStore.ts` (~204 Z.)
- **Hook:** `usePlannerData.ts` — liest Kurse/Wochen reaktiv aus `plannerStore.plannerSettings` (pro Instanz) → Fallback auf globale Settings → Fallback auf hardcoded WEEKS/COURSES. Gibt `isLegacy`-Flag zurück.
- **Multi-Planer:** `instanceStore.ts` verwaltet Planer-Instanzen (Tabs). Jeder Planer hat eigenen localStorage-Slot (`planner-data-{id}`) inkl. `plannerSettings`. `plannerStore.ts` speichert/lädt Daten pro Instanz via `switchInstance()`.
- **Hauptkomponenten:** WeekRows (~1200 Z.), SequencePanel (~708 Z.), DetailPanel (~1370 Z.), ZoomYearView (~569 Z.), Toolbar (~460 Z.), SettingsPanel (~1550 Z.), CollectionPanel (~295 Z.), PlannerTabs (~263 Z.)

### Architektur-Details

- **editingSequenceId Format:** `seqId-blockIndex` (z.B. `abc123-0`). WeekRows parsed mit Regex und highlightet nur den spezifischen Block.
- **panelWidth:** Im plannerStore persistiert, über Resize-Handle (320–700px) einstellbar.
- **allWeeks Prop:** WeekRows erhält optionale `allWeeks`-Prop für Cross-Semester Shift-Select.
- **BatchOrDetailsTab:** Switcher — zeigt BatchEditTab bei multiSelection.length > 1, sonst DetailsTab.
- **FlatBlockCard:** Ersetzt alte SequenceCard. Aufklappbare Sections: Felder, Lektionen, Reihen-Einstellungen.
- **CollectionPanel:** Datenmodell `CollectionItem` mit `CollectionUnit[]`. Archiv-Hierarchie: UE < Sequenz < Schuljahr < Bildungsgang.
- **ZoomYearView:** rowSpan für zusammenhängende Sequenz-Blöcke. BlockSpan-Datenstruktur mit skipSet.
- **sidePanelTab:** `'details' | 'sequences' | 'collection' | 'settings'`.

---

## Changelog

- v3.0–v3.7: Grundfunktionen (siehe frühere Handoffs)
- v3.8–v3.10: Lektionsliste, Settings→Weeks, Print-Optimierung
- v3.11–v3.14: Kontrast, Panel-Resize, FlatBlockCard, Batch-Editing, Legende
- v3.15–v3.18: Kontextmenü, Tag-Vererbung, Mismatch-Warnung, HoverPreview, Delete-Taste
- v3.19: Materialsammlung (CollectionPanel)
- v3.20–v3.21: Zoom 2 (KW-Zeilen, rowSpan, BlockSpan)
- v3.22: Zoom 1 Ist-Zustand, Deutsch, Feiertag-Erkennung
- v3.23–v3.24: Enhanced HoverPreview, UX-Kontrast, Bundle halbiert, Deploy-Fix
- v3.25–v3.27: Notizen-Spalte, Zoom 2 Farben, Resizable
- v3.28–v3.29: Zoom 2→Jahresansicht, SOL-Total
- v3.30–v3.34: SidePanel-Fixes, Noten-Vorgaben, Batch-Active-State, dimPastWeeks, Pin-Card
- v3.35–v3.41: Sequenz-Bar Farbcode, Ferien/Events Overhaul (Zoom 2+3), Batch-Sequenzen
- v3.42–v3.46: Multi-Planer, Settings pro Instanz, Templates, Presets, Legacy-Migration
- v3.47–v3.49: Flexible Kategorien (3 Phasen), Block-Label UX
- v3.50–v3.53: UX-Feedback Runde 1 (Zoom 2 entfernt, Auto-Save, UE-Workflow, Sonderwochen, Drag)
- v3.54: Kurs-Konfiguration Export/Import in Settings
- v3.55: Aus Sammlung laden für Settings-Konfigurationen
- v3.56: Kachel-Badge für Prüfungen und Spezialanlässe
- v3.57: Warnung bei gestörter 1L/2L Rhythmisierung nach Push
- v3.58: Drag&Drop Verschieben von Lektionen innerhalb eines Kurses
- v3.59: Doppelklick auf Spaltentitel als Kursfilter
- v3.60–63: Google Calendar Integration (OAuth, Sync, Import, Kollisionen)
- v3.64: Bugfixes — Dauer in min, SOL/Kategorie/Dauer Defaults, Sequenz-Persistenz
- v3.65: Toolbar aufräumen — dynamische Kursfilter, DataMenu/+Neu entfernt
- v3.66: Kurs-Settings — Endzeit auto, + Tag Button, grössere Zeitfelder
- v3.67: Ferien vereinfacht — Tage nur bei Einzelwochen, ReapplyButton entfernt
- v3.68: Batch→Sequenz — Fachbereich übertragen, floating Toolbar
- v3.69: Sammlung im Detail-Tab — Speichern/Laden einzelner UE
- v3.70: Sequenz-Felder — Erklärtexte und Feld-Hierarchie
- v3.71: Wiki-Anleitung (wiki.html), Build-Pipeline (deploy.sh, dist/ ignoriert), 📖-Button in Toolbar
- v3.73: Auftrag v3.73 — 20 Tasks in 5 Batches (Bugs, Settings, UX, Sonderwochen, Features)
- v3.74: Auftrag v3.74 — 12 neue Tasks #21–#32 (Sync-Bug, Sequenz-UX, Mehrjahresübersicht generisch, Assessment-UI, Import-Hints)
- v3.75: Auftrag v3.75 — 4 Tasks (Fachbereiche dynamisch, Sequenz-Sichtbarkeit, Drag-Interpolation, HANDOFF)
