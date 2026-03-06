# CLAUDE.md — Unterrichtsplaner

Webbasierter Semesterplaner für W&R-Unterricht. React PWA, deployed auf GitHub Pages.

**Live:** https://durandbourjate.github.io/GYM-WR-DUY/Unterrichtsplaner/

## Schnellstart

```bash
cd Unterrichtsplaner
npm install
npm run dev          # Dev-Server localhost:5173
npm run build        # Produktionsbuild → dist/
npx tsc --noEmit     # Typcheck (muss fehlerfrei sein vor Commit)
```

## Stack

React 19 + TypeScript + Vite + Zustand (State) + Tailwind (Utility-Klassen) + PWA (Service Worker)

## Architektur

### Stores
- **plannerStore.ts** — Hauptspeicher: Wochen, Lektionen, Sequenzen, Selektion, SidePanel. Persistiert pro Instanz (`planner-data-{id}`).
- **instanceStore.ts** — Multi-Planer-Verwaltung (Tabs). Jeder Planer = eigener localStorage-Slot.
- **settingsStore.ts** — Legacy-Settings, wird schrittweise durch plannerStore.plannerSettings ersetzt.

### Hook: usePlannerData
Zentraler Daten-Hook. Liest Kurse/Wochen reaktiv aus plannerStore.plannerSettings → Fallback auf globale Settings → Fallback auf Hardcoded.

### Hauptkomponenten
| Datei | Funktion |
|-------|----------|
| WeekRows.tsx | Wochendetail-Ansicht (Hauptansicht) |
| ZoomYearView.tsx | Jahresübersicht |
| SequencePanel.tsx | Sequenzen-Tab |
| DetailPanel.tsx | UE-Detail + Batch-Edit |
| SettingsPanel.tsx | Einstellungen (Kurse, Ferien, Sonderwochen) |
| Toolbar.tsx | Kopfzeile, Zoom, Filter, Aktionen |
| CollectionPanel.tsx | Materialsammlung |
| PlannerTabs.tsx | Multi-Planer-Tabs |

### Datenmodell
- **WeekData:** Pro Zelle (Kurs × KW). type: 0=leer, 1=Lektion, 5=Event, 6=Ferien
- **SequenceBlock:** Gruppiert Wochen. Hat label, topicMain/Sub, subjectArea, materialLinks
- **Sequence:** Container für Blöcke + Reihe (rowLabel, rowId)
- **LessonDetail:** Erweiterte Infos pro Lektion (Notizen, SOL, Material)

### Kategorien
`data/categories.ts` = Single Source of Truth. Standard: VWL=orange, BWL=blau, Recht=grün, IN=grau. Benutzerdefinierbar via SubjectsEditor. `generateColorVariants()` erzeugt bg/fg/border.

### Preset-Dateien
Schulspezifische Konfiguration in `public/presets/Hofwil/` (JSON): Ferien, Sonderwochen, Stundenplan, Lehrplanziele, Fachbereiche, Beurteilungsregeln.

## Workflow

1. **HANDOFF.md lesen** — Aktueller Status, offene Tasks, Architekturentscheidungen
2. Änderungen implementieren
3. `npx tsc --noEmit` — TypeScript-Fehler = 0
4. `npm run build` — Build muss durchlaufen
5. `git add -A && git commit -m "v3.XX: Beschreibung" && git push`
6. **HANDOFF.md aktualisieren** — Changelog + offene Punkte anpassen

WICHTIG: Immer committen + pushen nach Änderungen. Verlorene Sessions ohne Commits haben Rework verursacht.

## Code-Stil

- TypeScript strict, funktionale React-Komponenten mit Hooks
- Zustand für State (kein Context/Redux)
- Tailwind-Klassen direkt in JSX
- Deutsche UI-Texte (Schweizer Hochdeutsch)

## Aktueller Stand

Siehe HANDOFF.md für Version, Changelog und nächste Schritte.
