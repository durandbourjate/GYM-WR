# CLAUDE.md — Unterrichtsplaner

## Projekt

Interaktives Unterrichtsplanungs-Tool für einen Gymnasiallehrer (Wirtschaft & Recht) am Gymnasium Hofwil, Münchenbuchsee BE, Schweiz.

**Deploy:** https://durandbourjate.github.io/GYM-WR-DUY/Unterrichtsplaner/
**Repo:** GYM-WR-DUY (GitHub Pages)

## Schnellstart

```bash
npm run dev      # Vite Dev-Server
npm run build    # Produktionsbuild
npx tsc --noEmit # Typcheck ohne Build
```

## Tech-Stack

- **Framework:** React 18 + TypeScript + Vite
- **State:** Zustand (mit localStorage-Persistierung pro Planer-Instanz)
- **Styling:** Tailwind CSS (Utility-Klassen)
- **PWA:** Service Worker, Offline-fähig
- **Deploy:** GitHub Pages (kombinierte Site: Uebungen + Unterrichtsplaner)

## Architektur

### Stores
- `plannerStore.ts` (~1240 Z.): Hauptspeicher — Wochen, Lektionen, Sequenzen, Selektion, SidePanel-State. Persistiert pro Instanz in `planner-data-{id}`.
- `settingsStore.ts` (~256 Z.): Globale Settings (Kurse, Ferien, Sonderwochen). Legacy — wird schrittweise durch `plannerSettings` im plannerStore ersetzt.
- `instanceStore.ts` (~204 Z.): Multi-Planer-Verwaltung (Tabs). Jeder Planer = eine Instanz mit eigenem localStorage-Slot.

### Hook: usePlannerData
Zentraler Daten-Hook. Liest Kurse/Wochen reaktiv aus `plannerStore.plannerSettings` (pro Instanz) → Fallback auf globale Settings → Fallback auf Hardcoded. Gibt `isLegacy`-Flag, `categories`, `allCourses`, `weeksBySemester` zurück.

### Hauptkomponenten
| Datei | Zeilen | Funktion |
|-------|--------|----------|
| WeekRows.tsx | ~1021 | Zoom 3: Wochenansicht (Hauptansicht) |
| SequencePanel.tsx | ~660 | Sequenzen-Tab (FlatBlockCard-Liste) |
| DetailPanel.tsx | ~1027 | UE-Detail-Tab + Batch-Edit |
| ZoomYearView.tsx | ~569 | Zoom 1: Jahresübersicht |
| Toolbar.tsx | ~463 | Kopfzeile, Zoom, Filter, Aktionen |
| SettingsPanel.tsx | ~494 | Einstellungen (Kurse, Ferien, Sonderwochen) |
| CollectionPanel.tsx | ~295 | Materialsammlung |
| PlannerTabs.tsx | ~263 | Multi-Planer-Tabs |

### Datenmodell (Kern)
- **WeekData:** Pro Zelle (Kurs × KW). Enthält type (0=leer, 1=Lektion, 5=Event, 6=Ferien), Fachbereich, Themen, Kategorie etc.
- **SequenceBlock:** Gruppiert zusammengehörige Wochen. Hat label, topicMain/Sub, subjectArea, materialLinks.
- **Sequence:** Container für Blöcke + übergeordnete Reihe (rowLabel, rowId).
- **LessonDetail:** Erweiterte Infos pro Lektion (Notizen, SOL, Material).

### Kategorien-System
`data/categories.ts` ist Single Source of Truth. Standard: W&R (VWL=orange, BWL=blau, Recht=grün, IN=grau). Benutzerdefinierbar via SubjectsEditor in Settings. `generateColorVariants()` erzeugt bg/fg/border aus Primärfarbe.

## Konventionen

### Workflow bei Änderungen
1. **HANDOFF.md lesen** — enthält aktuellen Status, offene Punkte, Architektur
2. Änderungen implementieren
3. `npx tsc --noEmit` → TypeScript-Fehler prüfen
4. `npx vite build` → Build prüfen
5. `git add -A && git commit -m "v3.XX: Kurzbeschreibung"` → Commit
6. `git push` → Deploy (GitHub Pages via Actions)
7. **HANDOFF.md aktualisieren** — Changelog-Eintrag, offene Punkte anpassen

### Versionierung
- Format: `v3.XX` (monoton steigend)
- Commit-Message: `"v3.XX: Feature/Fix-Beschreibung"`
- HANDOFF.md Changelog: Jede Version mit Beschreibung aller Änderungen

### Code-Stil
- TypeScript strict
- Funktionale React-Komponenten mit Hooks
- Zustand für State (kein Context/Redux)
- Tailwind-Klassen direkt in JSX
- Deutsche UI-Texte (Schweizer Hochdeutsch)

## Schulkontext (Kurzfassung)

Detailliertes Kontextwissen in `SCHULKONTEXT.md`.

### Klassenbezeichnungen
- Zahl = Maturjahrgang (z.B. 27 = Matura 2027)
- Buchstabe = Klasse (a–d Regel, f = TaF, s = TaF Sport)
- `WR!` = Schwerpunktfach, `WR` = EWR, `WR!!` = Ergänzungsfach

### Farbcode
- **VWL:** Orange (#f97316)
- **BWL:** Blau (#3b82f6)
- **Recht:** Grün (#22c55e)
- **Informatik:** Grau (#6b7280)

### Kurse DUY (SJ 25/26)
- SF WR GYM1 (29c): Di+Do
- SF WR GYM2 (28bc9f9s): Mi+Do
- SF WR GYM3 (27abcd8f): Mi+Do
- IN: 28c Mo, 29f Di, 30s Mi+Di
- KS 27a: Do

## Offene Punkte

Aktuelle offene Feature-Requests und Bugs stehen in HANDOFF.md unter "Offene UX-Feedback-Punkte" und "Offenes Feedback".

Kurzfassung der nächsten Prioritäten:
1. Sonderwochen hierarchisch pro GYM-Stufe (IW-Konzept)
2. "Aus Sammlung laden" bei Hinzufügen
3. Kurs exportieren/speichern/archivieren
4. Klick&Drag für Mehrfachauswahl/Sequenz-Erstellung
5. Google Calendar Integration (Konzept in HANDOFF.md dokumentiert)

## Verwandte Dokumente
- `HANDOFF.md` — Detaillierter Status, Changelog, Architekturentscheidungen
- `SCHULKONTEXT.md` — Lehrplan, Stundenplan, IW-Plan, Termine
- `Projekt Interaktive Unterrichtsplanung.md` — Komplette Feature-History (V1–V32)
- `ARCHITECTURE_V3.md` — Architektur-Übersicht (ggf. veraltet, HANDOFF.md ist aktueller)
