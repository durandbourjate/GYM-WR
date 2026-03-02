# Unterrichtsplaner – Handoff v3.63

## Status: ✅ Deployed (v3.63)
- **Commit:** Alle v3.54–v3.63 committed & pushed
- **Datum:** 2026-03-02
- **Deploy:** https://durandbourjate.github.io/GYM-WR-DUY/Unterrichtsplaner/

## Erledigte Aufträge (v3.54–v3.63)

| Version | Auftrag | Status |
|---------|---------|--------|
| v3.54 | A: Kurs-Konfiguration Export/Import | ✅ |
| v3.55 | B: Aus Sammlung laden für Settings | ✅ |
| v3.56 | C: Kachel-Badge für Prüfungen | ✅ |
| v3.57 | D: Warnung bei 1L/2L Rhythmisierung | ✅ |
| v3.58 | E: Drag&Drop Verschieben | ✅ |
| v3.59 | F: Doppelklick Kursfilter | ✅ |
| v3.60–63 | G: Google Calendar Integration (4 Phasen) | ✅ |

**Hinweis:** Google Calendar benötigt Google Cloud Projekt mit OAuth Client ID.

---

## Auftrags-Warteschlange (UX-Feedback Runde 2)

Aufträge in empfohlener Reihenfolge. Jeden Auftrag einzeln umsetzen, dann committen und pushen. HANDOFF.md nach jedem Auftrag aktualisieren.

**Wichtig: Nach jeder Umsetzung `git add -A && git commit -m "v3.XX: Kurzbeschreibung" && git push` ausführen.**

**Hinweis:** Die Screenshots stammen teils von v2.9 — einige Punkte (Zoom 2 entfernt, Auto-Save, SOL-Checkbox, Ferien-Tagesauswahl, Zeit-Inputs) wurden bereits in v3.50 umgesetzt. Die folgenden Aufträge betreffen nur **noch offene** Punkte.

---

### Auftrag A: Bugfixes & Defaults (Klein)

**Kontext:** Mehrere kleine Bugs und Default-Werte-Probleme aus User-Testing.

**Aufgabe:**

1. **Dauer-Buttons konsistent in Minuten:** Überall wo Dauer gesetzt wird (DetailPanel, BatchEditTab, SOL-Dauer) einheitlich "45 min", "90 min", "135 min" anzeigen (nicht "1L", "2L", "3L"). Zusätzlich "Halbtag", "Ganztag", "Andere…" wie im DetailPanel. Im BatchEditTab aktuell "1L/2L/3L" → umbenennen.
2. **SOL default abgewählt:** Neue Lektionen sollen SOL standardmässig **nicht** aktiv haben. Prüfen ob `sol: false` der Default ist in `plannerStore.ts` bei neuen Einträgen.
3. **Kategorie default "Lektion":** Neue Lektionen sollen Kategorie "Lektion" als Default haben (nicht leer).
4. **Dauer default 90 min:** Neue Lektionen sollen 90 min als Default-Dauer haben.
5. **Sequenz verschwindet beim Schliessen:** Bug — wenn das SidePanel geschlossen wird, verschwindet die Sequenz-Zuordnung der selektierten Zellen. Prüfen ob `editingSequenceId` beim Panel-Close fälschlicherweise Daten löscht statt nur die Ansicht zu schliessen.

**Commit:** `v3.64: Bugfixes — Dauer in min, SOL/Kategorie/Dauer Defaults, Sequenz-Persistenz`

---

### Auftrag B: Toolbar aufräumen (Klein)

**Kontext:** Screenshot Bild 8 zeigt eine überladene Toolbar mit vielen Icons. Vereinfachung nötig.

**Aufgabe:**

1. **Icons ausrichten:** Einheitliche Höhe/Grösse für alle Toolbar-Icons. Vertikale Zentrierung prüfen.
2. **Import/Export nur in Einstellungen:** Falls Import/Export-Buttons noch in der Toolbar sind → entfernen (nur über ⚙️ Settings erreichbar). *Prüfen ob das in v3.24 bereits erledigt wurde.*
3. **"+ Neu" Button:** In den Sequenzen-Tab verschieben (nicht in Toolbar). Der Sequenzen-Tab im SidePanel soll einen prominenten "+ Neue Sequenz"-Button haben.
4. **TaF-Toggle:** Rechts bei den Kursfilter-Buttons (SF, EWR, IN, KS) platzieren statt separat.
5. **Kursfilter nicht hardcoded:** Die Filter-Buttons (SF, EWR, IN, KS) sollen aus den konfigurierten Kursen (`plannerSettings.courses`) dynamisch generiert werden — nicht hardcoded. Gruppierung nach `typ`-Feld der Kurse.

**Commit:** `v3.65: Toolbar aufräumen — Icons, dynamische Kursfilter, + Neu in Sequenzen`

---

### Auftrag C: Kurs-Einstellungen verbessern (Klein)

**Kontext:** Screenshots Bild 6 + 9 zeigen Probleme bei der Kurs-Konfiguration in den Einstellungen.

**Aufgabe:**

1. **Endzeit automatisch berechnen:** Wenn Anfangszeit und Dauer gesetzt sind → Endzeit automatisch ausfüllen. Formel: `endTime = startTime + duration`. Endzeit-Feld wird read-only/disabled wenn automatisch berechnet, mit "manuell"-Toggle.
2. **Mehrere Wochentage pro Kurs:** Das Wochentag-Dropdown soll mehrere Tage erlauben (z.B. Di + Do für einen 2-Tages-Kurs). Aktuell erstellt man 2 separate Kurs-Einträge → stattdessen ein Kurs mit mehreren Zeitslots. *Alternativ:* Kurs-Gruppierung beibehalten aber UI vereinfachen mit "Tag hinzufügen"-Button.
3. **Zeit-Felder grösser:** Min-Felder breiter machen damit "09:15" vollständig sichtbar ist (aktuell abgeschnitten laut Bild 9).

**Commit:** `v3.66: Kurs-Settings — Endzeit auto, Mehrtages-UI, grössere Zeitfelder`

---

### Auftrag D: Ferien-Einstellungen vereinfachen (Klein)

**Kontext:** Bild 5 zeigt Ferien mit Tagesauswahl (Mo–Fr), Bild 7 zeigt die kompakte Variante ohne Tage. User findet Tagesauswahl bei ganzen Ferienwochen unnötig.

**Aufgabe:**

1. **Tagesauswahl nur bei Bedarf:** Standard-Ansicht zeigt nur Name + KW-Bereich (wie Bild 7). Tagesauswahl nur anzeigen wenn KW-Start = KW-Ende (Einzelwoche, z.B. Auffahrt, Pfingstmontag) oder per Klick auf "Details ▸".
2. **"Einstellungen anwenden" entfernen:** Prüfen ob der Button "Ferien & Sonderwochen erneut eintragen" (Bild 4) bei aktivem Auto-Save noch nötig ist. Falls Auto-Save aktiv → Button entfernen oder auf seltene Fälle beschränken (z.B. nur anzeigen wenn Ferien/Sonderwochen geändert wurden seit letztem Apply).

**Commit:** `v3.67: Ferien vereinfacht — Tage nur bei Einzelwochen, Apply-Button prüfen`

---

### Auftrag E: Batch→Sequenz Workflow (Mittel)

**Kontext:** Bild 1 + 14 zeigen die Batch-Bearbeitung mit "Neue Sequenz" und "Zu bestehender". Feature-Request: Wenn im Batch Fachbereich/Kategorie/Dauer gesetzt werden und dann "Neue Sequenz" geklickt wird, sollen diese Einstellungen in die neue Sequenz übernommen werden.

**Aufgabe:**

1. **Batch-Einstellungen → Sequenz:** Wenn "✨ Neue Sequenz (X UE)" geklickt wird: Fachbereich aus Batch-Tab als `subjectArea` der neuen Sequenz setzen. Oberthema-Vorschlag aus den selektierten Zellen (falls gleich).
2. **Auto-Sequenz bei Mehrfachauswahl im Planer:** Wenn 4+ leere Zellen markiert werden und "Neue Sequenz" in der Toolbar (Bild 3) geklickt wird: Sofort eine Default-Sequenz erstellen (analog Unterrichtseinheit-Erstellung bei Einzelzelle) statt nur den Button zu zeigen.
3. **Toolbar-Menü im Sichtfeld:** Das Kontextmenü bei markierten Zellen (Bild 3: "4 markiert | Neue Sequenz | Verschieben | Einfügen | Aufheben") soll im sichtbaren Bereich des Users positioniert werden (nicht am oberen Rand wenn die markierten Zellen unten sind).

**Commit:** `v3.68: Batch→Sequenz Workflow — Einstellungen übernehmen, Auto-Sequenz, Menü-Position`

---

### Auftrag F: Sammlung im Detail-Tab (Klein)

**Kontext:** Bild 2 zeigt den Sammlung-Bereich in den Settings. Feature-Request: Die Sammlung soll auch im Detail-Tab (Unterrichtseinheit) zugänglich sein — z.B. um eine einzelne UE in die Sammlung zu speichern oder aus der Sammlung zu laden.

**Aufgabe:**

1. **"📥 In Sammlung"-Button im DetailPanel:** Wenn eine einzelne Zelle selektiert ist (DetailsTab), unten einen Button "In Sammlung speichern" hinzufügen. Speichert die aktuelle UE (Fachbereich, Thema, Beschreibung, Material, SOL-Details) als CollectionUnit.
2. **"📚 Aus Sammlung laden"-Button:** Button im DetailPanel der ein Dropdown mit passenden Sammlung-Items zeigt (gefiltert nach Fachbereich wenn möglich). Bei Auswahl: überschreibt die Felder der aktuellen UE.

**Commit:** `v3.69: Sammlung im Detail-Tab — Speichern/Laden einzelner UE`

---

### Auftrag G: Sequenz-Felder Klarheit (Klein)

**Kontext:** Bild 13 zeigt den Sequenz-Editor mit Bezeichnung, Oberthema, Unterthema. User fragt: "Welchen Zweck hat Bezeichnung zusätzlich zum Oberthema?"

**Aufgabe:**

1. **Erklärtext bei Sequenz-Feldern:** Unter "Bezeichnung" einen Hilfetext anzeigen: "Interner Name der Sequenz (z.B. für Sammlung und Navigation). Wird aus Oberthema übernommen falls leer."
2. **Reihe-Tab Zweck erklären:** Im "Reihe"-Tab (Bild 13) einen Erklärtext: "Reihe = übergreifende Einheit mehrerer Sequenzen (z.B. ein ganzes Semester oder Themenblock). Optional."
3. **Feld-Hierarchie visualisieren:** Optional: Kleine Einrückung oder Farb-Akzent der zeigt: Reihe > Sequenz > Block > Lektion.

**Commit:** `v3.70: Sequenz-Felder — Erklärtexte und Feld-Hierarchie`

---

## Backlog (niedrigere Priorität)

### Aus früheren Runden
1. **Template-System erweitern:** Komplette Planer-Daten als Template, Vorlagen-Bibliothek.
2. **Event-Overlay Name-Verschiebung:** Bei partiellen Sonderwochen Name verschieben.
3. **IW-Plan Auto-Verknüpfung:** Automatische IW-Event-Erkennung im DetailPanel.
4. **Automatischer Lehrplanbezug:** Lehrplanziele aus Thema/Fachbereich vorschlagen.
5. **Zoom 1 (Multi-Year):** Weitere Verbesserungen der Jahrgänge-Ansicht.

---

## Architektur

- **Stack:** React + TypeScript + Vite + Zustand + PWA
- **Store:** `plannerStore.ts` (~1240 Z.), `settingsStore.ts` (~256 Z.), `instanceStore.ts` (~204 Z.)
- **Hook:** `usePlannerData.ts` — liest Kurse/Wochen reaktiv aus `plannerStore.plannerSettings` (pro Instanz) → Fallback auf globale Settings → Fallback auf hardcoded WEEKS/COURSES. Gibt `isLegacy`-Flag zurück.
- **Multi-Planer:** `instanceStore.ts` verwaltet Planer-Instanzen (Tabs). Jeder Planer hat eigenen localStorage-Slot (`planner-data-{id}`) inkl. `plannerSettings`. `plannerStore.ts` speichert/lädt Daten pro Instanz via `switchInstance()`.
- **Hauptkomponenten:** WeekRows (~1021 Z.), SequencePanel (~660 Z.), DetailPanel (~1027 Z.), ZoomYearView (~569 Z.), Toolbar (~463 Z.), SettingsPanel (~494 Z.), CollectionPanel (~295 Z.), PlannerTabs (~263 Z.)

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
- v3.8: Lektionsliste toggelbar, usePlannerData Hook-Migration SequencePanel
- v3.9: Settings → Weeks-Generierung, Planerdaten Export/Import UI
- v3.10: Print-Optimierung (Button-Hiding, Farb-Tiles, Print-Titel)
- v3.11: Helligkeit/Kontrast, Panel-Resize, Bug-Fixes, Cross-Semester Shift-Klick
- v3.12: Flache Sequenz-Darstellung (FlatBlockCard), -460Z
- v3.13: Batch-Editing bei Multi-Select, Sequenz-Highlighting mit Block-Präzision
- v3.14: Legende, Sequenz-Bar 5px/sticky/hover, Tab-Styling, Fachbereich-Klick Fix
- v3.15: Kontextmenü, Sequenz-Klick/Doppelklick, Tag-Vererbung, "Zu Sequenz hinzufügen"
- v3.16: Fachbereich-Mismatch-Warnung, Reihe-UX
- v3.17: Hover-Preview 800ms, Feiertag-Erkennung bei Import
- v3.18: Delete-Taste, Scroll-to-Current (◉), geerbter Fachbereich-Hinweis
- v3.19: Materialsammlung (CollectionPanel)
- v3.20: Zoom 2 neu (KW-Zeilen-Layout, usePlannerData Migration)
- v3.21: Zoom 2 rowSpan-Einheiten, BlockSpan-Datenstruktur
- v3.22: Zoom 1 Ist-Zustand, Labels Deutsch, globale Feiertag-Erkennung
- v3.23: Enhanced HoverPreview (farbig, Notizen prominent, smarte Positionierung)
- v3.24: UX-Kontrast, Bundle halbiert, Deploy-Fix
- v3.25: Notizen-Spalte (aufklappbar, inline-editierbar)
- v3.26: HoverPreview oben/unten, Notizen-Spalte breiter + resizable
- v3.27: Zoom 2 farbige Blöcke Dark-Mode, breitere Spalten
- v3.28: Zoom 2 → Jahresansicht (ganzes SJ, cls+typ gruppiert)
- v3.29: SOL-Total (Σ-Badge, utils/solTotal.ts)
- v3.30: SidePanel schliesst bei Abwahl
- v3.31: Noten-Vorgaben-Tracking (MiSDV Art. 4, utils/gradeRequirements.ts)
- v3.32: UX-Verbesserungen (leere Zellen klickbar, Zoom 2 grösser, Shift-Klick Mehrtag)
- v3.33: Batch-Edit Active-State, ZoomYearView sticky header Fix
- v3.34: Klick+Drag bleibt markiert, dimPastWeeks-Toggle, Shift-Klick Popup, Zoom 2 Einzellektionen, Pin-Card
- v3.35: Sequenz-Bar Farbcode=Fachbereich, Ferien in Lektionsliste, Sammlung-Buttons umbenannt
- v3.36: Shift-Klick Mehrtages-Fix, Sequenz-Feldordnung, Material vereinfacht, Zoom 2 loose fix
- v3.37: Zoom 2 + Ferien Fixes (Header, Block-Farben, dimPastWeeks)
- v3.38: Ferien/Events Zoom 2 Overhaul (rowSpan, colspan, Mini-Blöcke)
- v3.39: Zoom 3 Ferien/Events Overhaul (rowSpan+colspan analog Zoom 2)
- v3.40: Ferien/Events/Sonderwochen differenziert (grau vs amber, klickbar)
- v3.41: Batch-Sequenzen, Toolbar-Tabs, Events mit LESSON-Kategorie
- v3.42: Multi-Planer Leerer Start (dynamische Wochen, Legacy-Erkennung)
- v3.43: Settings pro Planer-Instanz
- v3.44: Template-System + Empty State
- v3.45: Schuljahr-Presets + Ferien-Automatik
- v3.46: Legacy-Auto-Migration
- v3.47: Flexible Kategorien Phase 1+2
- v3.48: Block-Label UX
- v3.49: Flexible Kategorien Phase 3 (SubjectsEditor)
- v3.50: UX-Feedback Runde 1 (Zoom 2 entfernt, Auto-Save, SOL-Checkbox, Tagesauswahl)
- v3.51: UE-Workflow (Lektionsname-Fallback, "↑ Auf Sequenz"-Button)
- v3.52: Sonderwochen GYM-Stufen + IW-Preset
- v3.53: Klick&Drag auf gefüllte Zellen
- v3.54: Kurs-Konfiguration Export/Import in Settings
- v3.55: Aus Sammlung laden für Settings-Konfigurationen
- v3.56: Kachel-Badge für Prüfungen und Spezialanlässe
- v3.57: Warnung bei gestörter 1L/2L Rhythmisierung nach Push
- v3.58: Drag&Drop Verschieben von Lektionen innerhalb eines Kurses
- v3.59: Doppelklick auf Spaltentitel als Kursfilter
- v3.60: Google Calendar Phase 1 — OAuth + Kalender-Auswahl
- v3.61: Google Calendar Phase 2 — Planer→Kalender Sync
- v3.62: Google Calendar Phase 3 — Kalender→Planer Import
- v3.63: Google Calendar Phase 4 — Kollisionswarnungen
