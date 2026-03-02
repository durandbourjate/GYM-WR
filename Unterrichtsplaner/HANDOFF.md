# Unterrichtsplaner – Handoff v3.60

## Status: ✅ Deployed (v3.60)
- **Commit:** (pending)
- **Datum:** 2026-03-02
- **Deploy:** https://durandbourjate.github.io/GYM-WR-DUY/Unterrichtsplaner/

## Auftrags-Warteschlange

Aufträge in empfohlener Reihenfolge. Jeden Auftrag einzeln umsetzen, dann committen und pushen. HANDOFF.md nach jedem Auftrag aktualisieren (Status auf ✅, Changelog-Eintrag hinzufügen).

**Wichtig: Nach jeder Umsetzung `git add -A && git commit -m "v3.XX: Kurzbeschreibung" && git push` ausführen.**

---

### Auftrag A: v3.54 — Kurs-Export/Import (Klein)

**Kontext:** Aktuell kann man ganze Planer exportieren/importieren (PlannerTabs.tsx, `handleExport`/`handleImport`). Es fehlt die Möglichkeit, nur die **Kurs-Konfiguration** (Settings: Kurse, Ferien, Sonderwochen) einzeln zu exportieren/importieren — z.B. um die Kursstruktur eines Schuljahres mit einem Kollegen zu teilen oder als Backup zu sichern.

**Aufgabe:**

1. **SettingsPanel.tsx** — Zwei Buttons am Ende des Settings-Panels hinzufügen:
   - **"📤 Konfiguration exportieren"**: Exportiert `plannerSettings` (Kurse, Ferien, Sonderwochen, Fächer, Semesterbruch) als JSON-Datei. Filename: `planer-config-{planername}-{datum}.json`.
   - **"📥 Konfiguration importieren"**: File-Input für JSON. Beim Import: bestehende Settings mit den importierten ersetzen. Confirm-Dialog: "Bestehende Einstellungen werden überschrieben. Fortfahren?"

2. **Datenformat:** Reines `PlannerSettings`-Objekt (aus `settingsStore.ts`). Keine Planer-Daten (Wochen, Sequenzen etc.) — nur die Konfiguration.

3. **Validierung beim Import:** Prüfen ob das JSON-Objekt die erwarteten Felder hat (`courses`, `holidays`, `specialWeeks`). Bei ungültigem Format: Fehlermeldung.

**Nicht ändern:** PlannerTabs Export/Import (ganzer Planer) bleibt wie gehabt.

**Commit:** `v3.54: Kurs-Konfiguration Export/Import in Settings`

---

### Auftrag B: v3.55 — "Aus Sammlung laden" bei Settings (Mittel)

**Kontext:** Die Sammlung (CollectionPanel) enthält archivierte UE, Sequenzen und Schuljahre. Der Wunsch ist, beim Erstellen/Bearbeiten in den Settings auf die Sammlung zurückgreifen zu können — z.B. Sonderwochen aus dem letzten Jahr laden oder Kurs-Presets aus der Sammlung.

**Aufgabe:**

1. **Neuer CollectionItem-Typ: `settings`** — In `types.ts` einen neuen `CollectionItemType` hinzufügen: `'settings'`. Ein Settings-Collection-Item speichert ein `PlannerSettings`-Snapshot (Kurse, Ferien, Sonderwochen).

2. **"📥 In Sammlung"-Button im SettingsPanel** — Am Ende der Settings: Button "Aktuelle Konfiguration in Sammlung speichern". Erstellt ein CollectionItem vom Typ `settings` mit Titel "Konfiguration {Planername} {Datum}".

3. **"📚 Aus Sammlung laden"-Button im SettingsPanel** — Öffnet ein Modal/Dropdown mit allen Settings-Items aus der Sammlung. Bei Auswahl: importiert Kurse, Ferien, Sonderwochen (mit Confirm-Dialog).

4. **Sammlung-Filter:** CollectionPanel zeigt den neuen Typ `settings` mit eigenem Icon (⚙️) und Filter-Button.

**Bestehende Architektur:** `CollectionItem` in `types.ts` hat `units: CollectionUnit[]`. Für Settings-Items: `units` enthält ein einzelnes Element mit den serialisierten Settings im `details`-Feld (oder ein neues `settings`-Feld im CollectionItem).

**Commit:** `v3.55: Aus Sammlung laden für Settings-Konfigurationen`

---

### Auftrag C: v3.56 — Halbklassen-Badge auf Kacheln (Klein)

**Kontext:** Prüfungen und Spezialanlässe sollen auf den Kacheln im Wochenplan ein kompaktes Badge zeigen (z.B. rotes "P" für Prüfung, blaues "E" für Exkursion) — zusätzlich zum Farbcode.

**Aufgabe:**

1. **Datenmodell** — `LessonEntry` (in `types.ts`) erweitern um optionales `badge?: { text: string; color: string }`. Max 3 Zeichen.

2. **DetailPanel.tsx (DetailsTab)** — Badge-Feld hinzufügen: Text-Input (max 3 Zeichen) + Farbwähler (5-6 Preset-Farben: rot, blau, grün, amber, lila, grau). Nur sichtbar wenn Lektion eine Kategorie hat (Prüfung, Event etc.) oder manuell gesetzt.

3. **WeekRows.tsx** — In der Kachel-Render-Logik: wenn `badge` vorhanden, kleines farbiges Badge (absolute positioniert, top-right der Kachel) mit dem Text anzeigen. `text-[7px]`, `px-1`, `rounded-sm`, `font-bold`.

4. **Automatik (optional):** Wenn die Kategorie auf "Prüfung schriftlich" gesetzt wird, Badge automatisch auf `{ text: 'P', color: '#ef4444' }` setzen. Manuell überschreibbar.

**Commit:** `v3.56: Kachel-Badge für Prüfungen und Spezialanlässe`

---

### Auftrag D: v3.57 — Warnung bei 1L↔2L Rhythmisierung (Klein)

**Kontext:** Mehrtages-Kurse haben oft eine Rhythmisierung (z.B. Di 1L Theorie, Do 2L Übung). Wenn Lektionen verschoben werden (`pushLessons`), kann diese Rhythmisierung gestört werden. Der Benutzer wünscht eine Warnung.

**Aufgabe:**

1. **Erkennung:** Wenn `pushLessons` oder `batchShiftDown` aufgerufen wird, prüfen ob der Kurs Teil eines Mehrtages-Kurses ist (gleiche `cls+typ`, verschiedene `day`). Falls ja: prüfen ob die Lektionsdauer (aus `lessonDetails.duration` oder Kurs-Default) pro Tag konsistent bleibt.

2. **Warnung anzeigen:** Wenn nach dem Push ein Kurs mit 1L am Dienstag plötzlich eine 2L-Lektion hat (oder umgekehrt): Toast-Warnung oder gelbes ⚠️ in der Toolbar. Text: "Achtung: Rhythmisierung 1L/2L bei {Kursname} nach Verschiebung gestört."

3. **Implementierung:** In `WeekRows.tsx` nach `handleMiniPush` — nach dem Push ein Check durchführen. Neuer State `rhythmWarning: string | null` mit auto-dismiss nach 5 Sekunden.

**Nicht:** Kein Blocking (der Push wird trotzdem ausgeführt, nur die Warnung erscheint).

**Commit:** `v3.57: Warnung bei gestörter 1L/2L Rhythmisierung nach Push`

---

### ✅ Auftrag E: v3.58 — Drag&Drop Verschieben von Lektionen (Mittel)

**Kontext:** Aktuell kann man Kacheln nur per Push (→-Button) nach unten verschieben. Direktes Drag&Drop einer Lektion von einer Woche in eine andere ist nicht möglich. Der Store hat bereits `swapLessons` und `moveLessonToEmpty`.

**Aufgabe:**

1. **Drag-Start:** Langer Klick (300ms Hold) auf eine gefüllte Kachel startet den Drag-Modus (unterscheidbar vom normalen Klick/Drag-Select durch die Hold-Dauer). Visuell: Kachel wird halbtransparent, Cursor ändert sich zu `grabbing`.

2. **Drag-Over:** Beim Ziehen über Zellen im selben Kurs: Zielzelle wird hervorgehoben (blauer Border). Nur Zellen im selben Kurs (gleiche Spalte) sind gültige Drop-Targets. Ferien/Events sind keine gültigen Targets.

3. **Drop:**
   - Auf **leere Zelle**: `moveLessonToEmpty(col, fromWeek, toWeek)` aufrufen
   - Auf **gefüllte Zelle**: `swapLessons(col, fromWeek, toWeek)` aufrufen (Tausch)
   - Undo via `pushUndo()` vor der Aktion

4. **State:** Neuer `dragMove`-State in WeekRows: `{ fromWeek: string; col: number } | null`. Separiert vom bestehenden Drag-Select-State (`isDragSelecting`).

5. **Abgrenzung:** Normaler Klick = Selektion, kurzer Drag (< 300ms) = Multi-Select (v3.53), langer Hold + Drag = Verschieben.

**Commit:** `v3.58: Drag&Drop Verschieben von Lektionen innerhalb eines Kurses`

---

### ✅ Auftrag F: v3.59 — Doppelklick Spaltentitel als Kursfilter (Klein)

**Kontext:** Im Wochenplan (Zoom 3) werden alle Kurse als Spalten angezeigt. Doppelklick auf einen Spaltentitel (Klassenname) soll alle anderen Spalten ausblenden — als schneller Kursfilter.

**Aufgabe:**

1. **State:** Neuer `visibleCourseFilter: string | null` im plannerStore (oder lokal in WeekRows). `null` = alle sichtbar, `string` = nur Kurse mit dieser `cls+typ`-Kombination.

2. **WeekRows.tsx Spaltentitel:** `onDoubleClick` auf die Kopfzeile-`<th>`-Elemente: setzt `visibleCourseFilter` auf `cls+typ` des Kurses (oder auf `null` wenn bereits gefiltert auf diesen Kurs → Toggle).

3. **Rendering:** Wenn Filter aktiv: `courses.filter(...)` vor dem Rendern. Visueller Hinweis: Badge "Gefiltert: 29c SF" in der Toolbar mit ✕-Button zum Aufheben.

4. **Keyboard:** Escape hebt den Filter auf (zusätzlich zum bestehenden Esc-Verhalten).

**Commit:** `v3.59: Doppelklick auf Spaltentitel als Kursfilter`

---

### Auftrag G: Google Calendar Integration (Gross — mehrere Versionen)

**Kontext:** Konzept in HANDOFF.md dokumentiert (siehe "Feature-Spec: Google Calendar Integration"). Drei Funktionen: Planer→Kalender Sync, Kalender→Planer Import, Kollisionswarnungen. Benötigt Google Calendar API via OAuth.

**Dieser Auftrag ist zu gross für eine einzelne Version.** Empfohlene Aufteilung:

**✅ Phase 1 (v3.60): OAuth + Kalender-Auswahl**
- Google Calendar API OAuth-Flow in Settings (Login-Button, Kalender-Liste laden, Schreib-/Lese-Kalender wählen)
- Neuer Abschnitt "📅 Google Calendar" im SettingsPanel
- Token-Persistierung im localStorage

**Phase 2 (v3.61): Planer→Kalender Sync**
- Lektionen als Calendar-Events erstellen (`planer-managed` Tag)
- Sync bei Änderungen (Create/Update/Delete)
- eventId-Mapping im plannerStore

**Phase 3 (v3.62): Kalender→Planer Import**
- Events aus Lese-Kalendern lesen
- IW/Sonderwochen erkennen und als SpecialWeekConfig importieren

**Phase 4 (v3.63): Kollisionswarnungen**
- ⚠️ in Zellen wenn Nicht-Planer-Events auf gleichen Zeitslot fallen
- Tooltip mit kollidierendem Event

**Hinweis:** Google Calendar API benötigt ein Google Cloud Projekt mit OAuth Client ID. Die Client ID muss als Environment-Variable oder in den Settings konfigurierbar sein.

**Commit pro Phase:** `v3.6X: Google Calendar Phase X — {Beschreibung}`
---

## Erledigte Aufträge

### ✅ v3.59 — Doppelklick auf Spaltentitel als Kursfilter
### ✅ v3.58 — Drag&Drop Verschieben von Lektionen innerhalb eines Kurses
### ✅ v3.57 — Warnung bei gestörter 1L/2L Rhythmisierung nach Push
### ✅ v3.56 — Kachel-Badge für Prüfungen und Spezialanlässe
### ✅ v3.55 — Aus Sammlung laden für Settings-Konfigurationen
### ✅ v3.54 — Kurs-Konfiguration Export/Import in Settings
### ✅ v3.53 — Klick&Drag auf gefüllte Zellen
### ✅ v3.52 — Sonderwochen GYM-Stufen + IW-Preset

---

## Offene UX-Feedback-Punkte

**Erledigte Punkte:**
1. ~~Zoom 2 entfernen~~ ✅ (v3.50)
2. ~~Settings Auto-Save (kein "Anwenden"-Button)~~ ✅ (v3.50)
3. ~~Kurs: SOL-Checkbox, grössere Zeit-Inputs~~ ✅ (v3.50)
4. ~~Ferien: Tagesauswahl für partielle Wochen~~ ✅ (v3.50)
5. ~~Sequenz-Name = Oberthema Sync~~ ✅ (v3.50)
6. **Kurs speichern/exportieren/archivieren** — Button zum Exportieren/Importieren einzelner Kurs-Konfigurationen (nicht ganze Settings). Verlinken mit Sammlung.
7. **Sonderwochen hierarchisch pro GYM-Stufe** — IW-Konzept: verschiedene Sonderwochen pro GYM-Stufe in gleicher KW. Struktur: KW → GYM-Stufe → Details. Bestehende SpecialWeeksEditor hat Basis-Hierarchie (KW-Gruppierung), braucht aber GYM-Stufen-Feld und "In Planer übernehmen"-Button statt Auto-Apply.
8. **"Aus Sammlung laden"** bei Hinzufügen (Kurse, Sonderwochen, Ferien) — Verknüpfung zwischen Settings-Editoren und CollectionPanel.
9. ~~UE-Details auf Sequenz übertragen~~ ✅ (v3.51) — "↑ Auf Sequenz"-Button im DetailPanel überträgt Fachbereich/Oberthema auf den Block.
10. ~~UE-Name = Unterthema als Default~~ ✅ (v3.51) — Lektion-Fallback in LessonsList: title → topicSub → topicMain → block.topicSub → '—'
11. **Klick&Drag auch auf nicht-leere Zellen** für Mehrfachauswahl und Sequenz-Erstellung (aktuell nur Shift+Klick/Cmd+Klick).

Weitere Optionen: Google Calendar Integration (Konzept steht), Automatischer Lehrplanbezug, Template-System erweitern.

## Architektur
- **Stack:** React + TypeScript + Vite + Zustand + PWA
- **Store:** `plannerStore.ts` (~1240 Z.), `settingsStore.ts` (~256 Z.), `instanceStore.ts` (~204 Z.)
- **Hook:** `usePlannerData.ts` — liest Kurse/Wochen reaktiv aus `plannerStore.plannerSettings` (pro Instanz) → Fallback auf globale Settings → Fallback auf hardcoded WEEKS/COURSES. Gibt `isLegacy`-Flag zurück.
- **Multi-Planer:** `instanceStore.ts` verwaltet Planer-Instanzen (Tabs). Jeder Planer hat eigenen localStorage-Slot (`planner-data-{id}`) inkl. `plannerSettings`. `plannerStore.ts` speichert/lädt Daten pro Instanz via `switchInstance()`.
- **Hauptkomponenten:** WeekRows (~1021 Z.), SequencePanel (~660 Z.), DetailPanel (~1027 Z.), ZoomYearView (~569 Z.), Toolbar (~463 Z.), SettingsPanel (~494 Z.), CollectionPanel (~295 Z.), PlannerTabs (~263 Z.)

## Changelog v3.0–v3.14
- v3.0–v3.7: Grundfunktionen (siehe frühere Handoffs)
- v3.8: Lektionsliste toggelbar, usePlannerData Hook-Migration SequencePanel
- v3.9: Settings → Weeks-Generierung, Planerdaten Export/Import UI
- v3.10: Print-Optimierung (Button-Hiding, Farb-Tiles, Print-Titel)
- v3.11: Helligkeit/Kontrast, Panel-Resize (320–700px), Bug-Fixes, Cross-Semester Shift-Klick
- v3.12: Flache Sequenz-Darstellung (FlatBlockCard), SequenceCard+BlockEditor entfernt (-460Z)
- v3.13: Batch-Editing bei Multi-Select, Sequenz-Highlighting mit Block-Präzision, suggestSubjectArea
- v3.14: UX-Fixes: Legende (BWL/VWL/Recht separat + Event grau), Sequenz-Bar 5px/sticky/hover, Tab-Styling Felder/Lektionen/Reihe, Fachbereich-Klick Collapse-Fix
- v3.15: Kontextmenü bei Cursor, Sequenz-Klick=Highlight/Doppelklick=Edit, Tag-Vererbung Sequenz→Lektion, "Zu Sequenz hinzufügen"-Button im DetailPanel
- v3.16: Fachbereich-Mismatch-Warnung mit Korrigieren-Button, Reihe-UX (Erklärtext, editierbarer Titel, Sequenz-Zähler)
- v3.17: Hover-Preview 800ms (statt 2s), Feiertag-Erkennung bei Import (partielle Feiertage wie Auffahrt/Pfingsten)
- v3.18: Delete-Taste löscht Zelleninhalt, Scroll-to-Current-Button (◉), geerbter Fachbereich-Hinweis, Keyboard-Hilfe aktualisiert
- v3.19: Materialsammlung (CollectionPanel) — neuer Tab "📚 Sammlung" im Seitenpanel. Archivieren von UE, Sequenzen, Schuljahren, Bildungsgängen. Import mit Optionen (Notizen/Materiallinks). Persistierung in localStorage.
- v3.20: Zoom 2 komplett neu — KW-Zeilen-Layout statt Block-Matrix. Migration auf usePlannerData(). Sequenzen als farbige Balken (Label auf 1. Zeile, gerundete Ecken). Ferien/IW kollabiiert. Past-Wochen abgedunkelt. Klick→Sequenz, Doppelklick→Zoom3.
- v3.21: Zoom 2 — Sequenzen als rowSpan-Einheiten (verschmolzene Zellen statt Zeile-pro-KW). Farbcode-Inferenz aus weekData-Lektionstyp wenn Sequenz keinen Fachbereich hat. BlockSpan-Datenstruktur mit skipSet.
- v3.22: Zoom 1 — Ist-Zustand: ActualDataCard nutzt s2StartIndex für korrekte Semester-Zuordnung, filtert nach SF-Kurs-IDs. Labels auf Deutsch ("Mehrjahresübersicht", "Stoffverteilung"). getAvailableWeeks blockiert Feiertage (type 6) und Events (type 5) explizit — auch wenn der Kurs selbst keinen Eintrag in dieser Woche hat (globale Feiertag-Erkennung).
- v3.23: Enhanced HoverPreview — farbiger Header mit Fachbereich-Akzent, Notizen prominent (6 Zeilen statt 2), Beschreibung (3 Zeilen), SOL-Details, Materiallinks (max 4), Lernziel (2 Zeilen). Smarte Positionierung (links bei Spalten >60%). Dynamische Breite (280px wenn Extras vorhanden, sonst 224px). Block-Vererbung für SubjectArea/Topic.
- v3.24: UX-Kontrast verbessert (gray-500→gray-400 für Labels/Text in DetailPanel, SequencePanel, SettingsPanel, CollectionPanel). Zoom 2 Block-Index fix (Klick→Sequenz öffnet korrekten Block). Toolbar: Excel-Import-Button entfernt (Settings via SidePanel), ⓘ-Icon auf Kacheln entfernt. Bundle-Grösse halbiert (743→398KB). Deploy-Workflow repariert (kombinierte Site: Uebungen + Unterrichtsplaner). SW-Scope auf /Unterrichtsplaner/ beschränkt.
- v3.25: Aufklappbare Notizen-Spalte pro Kurs. Toggle-Button (▸/◂) im Spaltenheader. Inline-editierbare NoteCell (100px) zeigt/bearbeitet Notizen aus lessonDetails.
- v3.26: HoverPreview zeigt nach oben bei Zellen im unteren Bildschirmdrittel. Notizen-Spalte: breiterer Default (200px), grösserer Toggle-Button mit 📝-Icon, Zeilenumbrüche (whitespace-pre-line), grössere Schrift.
- v3.27: Zoom 2 — farbige Blöcke mit Dark-Mode-Palette (VWL=orange-braun, BWL=dunkelblau, Recht=dunkelgrün), grössere Schrift (10px Labels, 8px Details), breitere Spalten (110px). Notizen-Spalte resizable (Drag-Handle im Header, 80-400px Range, noteColWidth im Store). ZoomYearView Placeholder-Datei.

- v3.28: Zoom 2 komplett umgebaut → Jahresansicht (ZoomYearView). Ganzes Schuljahr in einer Tabelle statt S1/S2 separat. Kurse nach cls+typ gruppiert. 2-Tage-Kurse: breiter Balken bei geteilter Sequenz (courseIds), 2 schmale Sub-Spalten bei separaten Sequenzen. Semester-Trennlinie (goldener Border). ZoomBlockView (alte Semesteransicht) bleibt als Komponente erhalten, wird aber nicht mehr in App.tsx verwendet.

- v3.29: SOL-Total — Σ-Badge neben "📚 SOL (Reihe)" zeigt Summe aller Lektion-SOL-Einträge (count + formatierte Dauer). Neue utils/solTotal.ts mit parseDurationToMinutes (erkennt min/h/Lektionen/Halbtag/Ganztag), formatMinutes, computeSeqSolTotal. Duplikat-Funktionen aus SequencePanel entfernt.

- v3.30: SidePanel schliesst bei Abwahl — Klick leere Zelle und Klick gleiche Zelle (toggle) schliessen Panel + clearing editingSequenceId.

- v3.31: Noten-Vorgaben-Tracking (MiSDV Art. 4) — Neue utils/gradeRequirements.ts mit Mindestanzahl-Beurteilungsprüfung pro Kursgruppe/Semester/GYM-Stufe. Rotes Badge (Zahl) am 📊-Button bei offenen Warnungen. StatsPanel zeigt Section "📋 Beurteilungsvorgaben" mit Warnungen (🔴 critical, 🟡 warning) und OK-Status. GYM-Stufe wird aus Klassenname abgeleitet (Maturjahrgang → GYM1-5).

- v3.32: UX-Verbesserungen — (1) Leere Zellen klickbar mit blauer Markierung statt nur Deselect. (2) SidePanel schliesst zuverlässig bei Abwahl + Klick leere Zelle. (3) Zoom 2 grössere Schrift: ROW_H 26px, Labels 12/10/9px, Spalten 140/70px. (4) Sequenz-Klick in Zoom 2 scrollt die SequenceCard im Panel automatisch in View (scrollIntoView). (5) Shift-Klick bei Mehrtages-Kursen wählt nur den angeklickten Tag; Shift+Alt wählt beide Tage. (6) SequencePanel cardRef-Duplikat bereinigt.

- v3.33: Batch-Edit Active-State — Fachbereich/Kategorie/Dauer/SOL-Buttons im Batch-Tab zeigen den aktuellen Wert der selektierten Zellen mit farblicher Hervorhebung (ring + stärkerer Hintergrund). "(gemischt)"-Hinweis bei unterschiedlichen Werten. ZoomYearView sticky header Positionsfix.

- v3.34: UX-Verbesserungen #2 — (1) Klick+Drag leere Zellen bleiben nach mouseup markiert (lila Outline bleibt). (2) Zoom 3: Toggle vergangene Wochen dim/hell (◐-Button in Toolbar, `dimPastWeeks` in Store). (3) Shift-Klick Mehrtages-Kurse: Popup fragt "Auch [anderer Tag] auswählen?" statt Shift+Alt. (4) Zoom 2: Einzellektionen ohne Sequenz werden angezeigt (gestrichelter Border, halbtransparent, Klick→Details, DblClick→Zoom3). (5) SequencePanel: aktive Sequenz als Pin-Card oben angepinnt (unter Klassenbuttons); Felder+Lektionen standardmässig ausgeklappt wenn aktiv.

- v3.35: UX-Fixes #3 — (1) Sequenz-Bar + Label Farbcode = Fachbereich statt Kurstyp (VWL=orange, BWL=blau, Recht=grün, IN=grau, INTERDISZ=violett). (2) Ferien-Wochen (type 6) in Sequenz-Lektionsliste als graue nicht-editierbare Zeile. (3) Felder/Lektionen in FlatBlockCard default ausgeklappt. (4) Aktive Sequenz Pin-Card: excluded aus normaler Sequenzliste (Doppel-Anzeige-Bug). (5) Sammlung-Buttons umbenannt: "📥 In Sammlung" / "📥 Reihe → Sammlung".

- v3.36: UX-Fixes #4 — (1) Shift-Klick Mehrtages-Bug fix: "Ja, beide Tage" expandiert gesamte multiSelection um andere Tage. Kein Popup wenn anderer Tag bereits selektiert. Popup schliesst bei Click-Outside/Esc. (2) Sequenz-Detail Feldordnung: Oberthema→Unterthema→Beschreibung→Lehrplanziel (kleiner). (3) Material vereinfacht: LearningView+Materiallinks → ein "Material"-Feld. (4) Zoom 2 loose lessons fix: entry.title-Prüfung, type 0 korrekt, Holidays/Events gefiltert.

- v3.37: Zoom 2 + Ferien Fixes — (1) Ferien/Events zeigen keinen Sequenz-Balken/Label in Zoom 3. (2) Zoom 2 loose lessons bei multi-day Kursen (looseKey-Fallback). (3) Header top:0 + padding → Klassen-Beschriftungen voll lesbar. (4) Block-Farben aufgehellt, Default-Block heller, Ferien/KW-Labels heller. (5) dimPastWeeks-Toggle wirkt in Zoom 2.

- v3.38: Ferien/Events Zoom 2 Overhaul — (1) Aufeinanderfolgende Ferien-Wochen als zusammengefasste rowSpan-Blöcke (KW-Range, 🏖, Name, Wochenzähler). (2) Ganztags-Events als colspan-Block mit 📅 + amber-Farbe. (3) Partielle Events pro Kurs-Zelle als Mini-Blöcke. (4) Multi-day Sub-Columns Events/Holidays ebenso.

- v3.35: UX-Fixes #3 — (1) Sequenz-Bar + Label Farbcode = Fachbereich statt Kurstyp (VWL=orange, BWL=blau, Recht=grün, IN=grau, INTERDISZ=violett). (2) Ferien-Wochen (type 6) in Sequenz-Lektionsliste als graue nicht-editierbare Zeile statt klickbar. (3) Felder/Lektionen in FlatBlockCard default ausgeklappt (useState(true)). (4) Aktive Sequenz Pin-Card: wird aus der normalen Sequenzliste excluded um Doppel-Anzeige zu vermeiden. (5) Sammlung-Buttons umbenannt: "💾 UE speichern" → "📥 In Sammlung", "💾 Reihe" → "📥 Reihe → Sammlung".

- v3.37: Zoom 2 + Ferien Fixes — (1) Ferien/Events (isFixed) zeigen keinen Sequenz-Balken und kein Sequenz-Label mehr in Zoom 3. (2) Zoom 2 loose lessons: Multi-day-Kurse zeigen jetzt auch Einzellektionen (looseKey-Fallback bei Sub-Columns fehlte). (3) Zoom 2 Header: `top: 0` statt `top: -1`, mehr Padding (`py-1`) → Klassen-Beschriftungen voll lesbar. (4) Zoom 2 Schrift heller: Block-Farben aufgehellt (VWL fg `#fde6cc`, BWL `#dbeafe`, Recht `#d1fae5`), Default-Block `#cbd5e1`, Ferien-Label `text-gray-300`, KW-Labels `text-gray-400`. (5) dimPastWeeks-Toggle wirkt jetzt in Zoom 2 (war vorher hardcoded opacity 0.5).

- v3.36: UX-Fixes #4 — (1) Shift-Klick Mehrtages-Bug fix: "Ja, beide Tage" expandiert jetzt die GESAMTE aktuelle multiSelection um die anderen Tage (nicht nur letzte Woche). Kein Popup wenn anderer Tag bereits manuell selektiert. Popup schliesst bei Klick daneben oder Esc. (2) Sequenz-Detail Feldordnung: Oberthema→Unterthema→Beschreibung→Lehrplanziel (kleiner, dezenter). (3) Material vereinfacht: LearningView-Feld + Materiallinks → ein "Material"-Feld. LV-URLs werden intern erkannt und in learningviewUrl gespeichert (Rückwärtskompatibilität). (4) Zoom 2 loose lessons fix: entry.title-Prüfung statt nur entry, type 0 korrekt behandelt (nicht mehr als empty string), Holidays/Events gefiltert, Label zeigt Titel statt Type-Nummer.

### Offene Feature-Requests v3.35+

#### 🔴 Sofort (v3.35) — ✅ Erledigt
1. ✅ Sequenz-Bar Farbcode = Fachbereich
2. ✅ Ferien aus Lektionsliste filtern
3. ✅ Felder/Lektionen default ausgeklappt
4. ✅ Doppelte Sequenz-Anzeige Bug fix
5. ✅ Sammlung-Buttons umbenannt

#### 🟡 Bald (v3.36) — ✅ Erledigt
6. ✅ Shift-Klick Mehrtages-Bug fix (voller Range, kein Popup bei manueller Auswahl, Click-Outside/Esc)
7. ✅ Popup UX Mehrtages-Kurse (integriert in #6)
8. ✅ Lehrplanziel weniger prominent (Reihenfolge: Oberthema→Unterthema→Beschreibung→Lehrplanziel)
9. ✅ Material vereinfacht (LV+Material → 1 Feld)
10. ✅ Zoom 2 loose lessons Bug fix

- v3.38: Ferien/Events Zoom 2 Overhaul — (1) Aufeinanderfolgende Ferien-Wochen (type 6) werden als zusammengefasste rowSpan-Blöcke gerendert mit KW-Range-Label (z.B. "KW42–KW43"), 🏖-Icon, Name und Wochenzähler. (2) Ganztags-Events (type 5, alle Kurse betroffen) ebenso als colspan-Block mit 📅-Icon und amber-Farbe. (3) Partielle Events (nur einzelne Kurse betroffen): pro Kurs-Zelle als kleiner grauer Block mit Icon statt leere Zelle. (4) Multi-day Sub-Columns: Events/Holidays werden dort ebenfalls als Mini-Blöcke gerendert.

- v3.39: Zoom 3 Ferien/Events Overhaul — (1) Aufeinanderfolgende Ferien-Wochen (type 6) werden als zusammengefasste rowSpan+colspan-Blöcke gerendert (analog Zoom 2). KW-Range-Label, 🏖-Icon, Name und Wochenzähler (z.B. "2W"). (2) Ganztags-Events (type 5, alle Kurse betroffen) ebenso als colspan-Block mit 📅-Icon. (3) Partielle Events (nur einzelne Kurse) bleiben als individuelle Zellen. (4) holidaySpans/holidaySkipSet/holidaySpanStart useMemo in WeekRows.tsx.

- v3.40: Ferien/Events/Sonderwochen differenziert — (1) Ferien (type 6) bleiben als zusammengefasste rowSpan-Blöcke (grau, nicht klickbar). (2) Events/Sonderwochen (type 5) werden separat behandelt: amber-Hintergrund, klickbar+doppelklickbar (Studienreisen, IW, Besuchstage brauchen Detailplanung). (3) Event-Wochen: amber-Akzent auf ganzer Zeile + 📅 am KW-Label. (4) Kurse mit Unterricht in Event-Wochen: Normale Kacheln über dem Event-Hintergrund. (5) ESC-Taste löscht Suchfeld-Inhalt und defokussiert.

- v3.41: Batch-Sequenzen + UX-Verbesserungen — (1) **Batch-Sequenzen:** Bei Mehrfachauswahl (Shift/Cmd-Klick) kann aus dem BatchEditTab eine neue Sequenz erstellt oder die selektierten Wochen zu einer bestehenden Sequenz hinzugefügt werden. Warnung bei kursübergreifender Auswahl. (2) **Toolbar-Tabs:** Tab-Shortcuts (📖 UE, 📚 Sammlung) in Kopfzeile wenn SidePanel offen. (3) **Shift-Klick eingeschränkt:** Range-Select nur innerhalb desselben Kurses (cls+typ) möglich; verschiedene unverknüpfte Kurse werden blockiert. (4) **Auftrag-Unterricht:** Events (type 5) mit Category LESSON werden als normaler Unterricht mit 📋 Icon dargestellt, nicht als amber Event-Block. (5) **Event-Overlay:** Event-Name (gekürzt) im KW-Label sichtbar. (6) **IW-Plan:** Empfehlung Material-Links für IW-Events zu nutzen (bestehende Infrastruktur).

- v3.42: **Multi-Planer Leerer Start (Phase 1 Abschluss)** — (1) `usePlannerData()` generiert Wochen dynamisch aus `instanceStore`-Metadaten (`generateWeekIds`) statt immer auf hardcoded `WEEKS` zurückzufallen. Neuer Rückgabewert `isLegacy` unterscheidet Legacy- und neue Planer. (2) `App.tsx`: Wochen-Init nutzt `hookWeeks` aus dem Data-Hook statt direkten `WEEKS`-Import. `migrateStaticSequences()` nur für Legacy-Planer. (3) Legacy-Erkennung: Planer mit Default-Range (KW33/2025–KW27/2026) und ohne Custom-Kurse werden als Legacy erkannt und nutzen weiterhin hardcoded `WEEKS`/`COURSES`. (4) Neue Planer starten komplett leer — leeres Wochenraster wird aus Meta-Daten generiert, keine Fallback-Daten. (5) `CURRENT_WEEK` wird live berechnet statt als Konstante.

- v3.43: **Settings pro Planer-Instanz (Phase 2 Start)** — (1) `plannerSettings: PlannerSettings | null` als neues Feld im `plannerStore`. Wird pro Instanz persistiert via `partialize`, `extractPersistedState`, `loadFromInstance`, `resetToEmpty`. (2) `usePlannerData()` liest Settings reaktiv aus dem Store (statt `loadSettings()`). Priority: Store → Global localStorage → Hardcoded. Kurs-Änderungen wirken sofort (kein Page-Reload nötig). (3) `SettingsPanel` schreibt via `setPlannerSettings()` in den Store UND weiterhin in globalen localStorage (Rückwärtskompatibilität). (4) **Onboarding:** Neuer leerer Planer öffnet automatisch SidePanel mit Settings-Tab, wenn keine Kurse konfiguriert sind. (5) Legacy-Erkennung erweitert: Planer mit `storeSettings === null` + Default-Range gelten als Legacy.

- v3.44: **Neue Planer starten wirklich leer + Template-System + Empty State** — (1) `usePlannerData()` Legacy-Erkennung als eigenes `useMemo` separiert. Neue Planer ohne `storeSettings` erhalten leeres Kurs-Array (`[]`) statt Fallback auf `COURSES`. Nur Legacy-Planer (Default-Range + globale Settings + kein storeSettings) nutzen hardcoded Daten. (2) **Empty State UI:** Wenn `allCourses.length === 0`, zeigt die App eine hilfreiche Meldung mit Button zum Öffnen der Einstellungen statt leerem Raster. (3) **Template bei Planer-Erstellung:** Neuer-Planer-Dialog hat Dropdown "Kurse von: [bestehender Planer]". Kopiert `plannerSettings` (Kurse, Ferien, Sonderwochen) vom gewählten Template-Planer in den neuen.

- v3.45: **Schuljahr-Presets + Ferien-Automatik + Zeitraum-Konfiguration** — (1) Neue Datei `data/holidayPresets.ts` mit Ferien-Presets für Gym Agglomeration Bern (SJ 2025/26, 2026/27, 2027/28). Enthält Herbst-, Winter-, Sport-, Frühlingsferien als KW-Bereiche. (2) **Neuer-Planer-Dialog:** Schuljahr-Dropdown (Preset-Auswahl), Ferien-Checkbox (🏖), Template-Dropdown (Kurse von bestehendem Planer). Start-/Endwoche und Semesterbruch werden aus Preset übernommen. (3) **WelcomeScreen:** Gleiche Optionen bei Ersteinrichtung. Auto-Detect des passenden Presets basierend auf aktuellem Datum. (4) WeekData-Init reagiert auf `plannerSettings`-Änderungen (Template-Ferien werden nachträglich angewendet).

- v3.46: **Legacy-Auto-Migration** — Kritischer Bug behoben: Bestehende Nutzer mit Daten in `unterrichtsplaner-storage` aber ohne Instanzen im `instanceStore` sahen den WelcomeScreen statt ihren Planer. Fix: `onRehydrateStorage`-Callback im instanceStore prüft nach Hydration, ob Legacy-Daten existieren und erstellt automatisch eine Instanz "SJ 25/26" mit den bestehenden Daten.

- v3.51: **UE-Workflow** — (1) **Lektionsname-Fallback auf Unterthema:** LessonsList in SequencePanel zeigt jetzt `title → detail.topicSub → detail.topicMain → block.topicSub → '—'` statt vorher `title → detail.topicMain → block.topicSub`. (2) **"↑ Auf Sequenz"-Button im DetailPanel:** Wenn eine Lektion Teil einer Sequenz ist, erscheint ein Button neben der Sequenz-Badge, der UE-Felder (Fachbereich, Oberthema) auf den übergeordneten Sequenz-Block überträgt. Aktualisiert auch den Reihen-Titel wenn er noch Default ist.

- v3.50: **UX-Feedback Runde 1** — (1) **Zoom 2 entfernt:** Toolbar zeigt nur noch 2 Zoom-Stufen (◫ Jahresübersicht, ▦ Wochenansicht). Zoom 2 (Semesteransicht) wurde als zu komplex/unklar empfunden. ZoomYearView-Komponente bleibt im Code (Zoom 2 leitet auf Zoom 1 weiter). (2) **Settings Auto-Save:** `ApplySettingsButton` entfernt, auto-save mit 400ms debounce war bereits implementiert. `setDirty`-Referenz im Import-Flow durch `doSave` ersetzt. (3) **Kurs SOL-Checkbox:** Neues `sol?: boolean` Feld in `CourseConfig`. Checkbox im CourseEditor neben HK/S1/S2. (4) **Zeit-Inputs grösser:** `w-24 text-[11px]` statt `w-[5.5rem]` für time-Inputs. (5) **Ferien Tagesauswahl:** `days?: number[]` (1=Mo..5=Fr) in `HolidayConfig`. HolidaysEditor zeigt Mo–Fr Buttons analog zu SpecialWeeksEditor. Für partielle Ferien wie Auffahrt. (6) **Sequenz-Name = Oberthema Sync:** Beim Ändern des Oberthemas im FlatBlockCard wird der Reihen-Titel automatisch synchronisiert (wenn Titel leer oder gleich dem alten Oberthema).

- v3.49: **Flexible Kategorien Phase 3 (Abschluss)** — (1) **SubjectsEditor** im SettingsPanel: Fachbereiche erstellen/bearbeiten/entfernen mit Farbwähler und Live-Badge-Vorschau. W&R-Standard-Laden-Button. (2) ZoomMultiYearView: Record-Initialisierer dynamisch (emptyCountRecord/emptyArrayRecord/emptyGoalRecord). (3) DetailPanel: autoMap entfernt, Fachbereich-Erkennung über categories. (4) PlannerTabs: LessonEntry type-Fix (text→title, number→LessonType), unused Import entfernt. (5) categories.ts: generateColorVariants exportiert. Alle Phase-1-bis-3-Migrationen abgeschlossen.

- v3.48: **Block-Label UX** — (1) Default-Label bei neuer Sequenz von `'Neuer Block'` auf leeren String geändert (4 Stellen: Toolbar, WeekRows, DetailPanel ×2). (2) FlatBlockCard-Header zeigt Fallback-Kette: `block.label || block.topicMain || "Block N"` (Placeholder in grau/kursiv). (3) Confirm-Dialog nutzt gleichen Fallback. (4) Neues editierbares "Bezeichnung"-Feld im Felder-Bereich der FlatBlockCard (vor Oberthema), mit dynamischem Placeholder (Oberthema oder "Block N").

- v3.47: **Flexible Kategorien Phase 1+2 — Zentralisierung + Zoom-Views** — (1) Neue Datei `data/categories.ts`: `CategoryDefinition`-Interface, `WR_CATEGORIES` als Default, `subjectConfigsToCategories()` für benutzerdefinierte Fachbereiche, `generateColorVariants()` für automatische bg/fg/border aus Primärfarbe, `getCategoryColors()`, `categoriesToColorMap()`, `inferSubjectAreaFromLessonType()`, `getBlockColors()`, `WR_BLOCK_COLORS`. (2) `usePlannerData()` gibt `categories: CategoryDefinition[]` zurück (aus plannerSettings oder WR-Default). INTERDISZ wird automatisch ergänzt. (3) **Phase 1:** Lokale `SUBJECT_AREAS`-Konstanten entfernt aus: DetailPanel (DetailsTab + BatchEditTab), SequencePanel (FlatBlockCard + Hauptkomponente), CollectionPanel (Filter-Buttons). (4) **Phase 2:** `colors.ts` SUBJECT_AREA_COLORS generiert aus WR_CATEGORIES. Toolbar Legend dynamisch aus categories. ZoomYearView/ZoomBlockView: lokale BLOCK_COLORS/inferSubjectArea entfernt, importiert aus categories.ts. ZoomMultiYearView: SUBJECT_COLORS generiert, MAIN_AREAS-Konstante. WeekRows: SUBJECT_AREA_COLORS_PREVIEW generiert. (5) **Verbleibend (Phase 3):** Record-Initialisierer in ZoomMultiYearView, ExcelImport typeLabels, autoMap in DetailPanel — diese sind WR-spezifisch und werden erst bei UI für eigene Kategorien migriert.

#### 🔵 Nächste Runde (v3.37+) — ✅ Erledigt
11. ✅ Ferien als durchgehende Blöcke (rowSpan, zusammengefasst, normalgross)
12. ✅ Studienreisen/Sonderwochen visuell (colspan für Ganz-Events, pro-Kurs-Blöcke für partielle)
13. **Google Calendar Integration** — Konzept steht, Umsetzung bei Gelegenheit

### Feature-Spec: Google Calendar Integration (geplant)

**Kernidee:** Planer wird zur Quelle für Unterrichtslektionen im Kalender. Keine Doppelpflege mehr.

**3 Funktionen:**

1. **Planer→Kalender Sync (automatisch bei jeder Änderung)**
   - Lektionen/Prüfungen werden als Google-Calendar-Events erstellt
   - Wählbar: alle Lektionen (wöchentlich) ODER nur Prüfungen/Spezialanlässe
   - Events mit Tag `planer-managed` markiert, damit Planer sie wiedererkennt
   - Update/Delete bei Änderungen im Planer (bidirektional nur Planer→Kalender)
   - Event enthält: Titel, Fachbereich, Thema, Klasse, Zeitslot (aus Kursdaten)

2. **Kalender→Planer Import (Sonderwochen)**
   - Events aus Schul-Kalender mit Keywords (IW, Besuchstag, Sonderwoche) → Holiday/Event-Blöcke
   - Per "Importieren"-Aktion oder automatisch bei erkannten Keywords
   - Multi-Kalender-Support: Benutzer wählt in Settings welche Kalender gelesen werden

3. **Kollisionswarnungen (⚠️ in Zellen)**
   - Nur für Events aus Nicht-Planer-Kalendern (keine Warnungen für selbst gepushte Lektionen)
   - ⚠️ wenn Schul-Kalender-Event (Sitzung, Konferenz) auf gleichen Zeitslot fällt
   - Tooltip zeigt kollidierenden Event

**Multi-Kalender-Architektur:**
- Schreib-Kalender: 1 Kalender konfigurierbar (z.B. "Unterricht") — hier pushed der Planer hin
- Lese-Kalender: N Kalender konfigurierbar (z.B. "Schule allgemein", "Privat") — für Import + Kollision
- planer-managed Events werden bei Kollisionscheck ausgeschlossen

**Technisch:**
- Google Calendar API via OAuth (Settings-Flow)
- Sync-State im plannerStore (eventId-Mapping pro Lektion)
- Settings: Kalender-Auswahl, Sync-Modus (alle/nur Prüfungen), Auto-Sync on/off Klick zum Editieren, Enter/Blur zum Speichern, Escape zum Abbrechen.

## Architekturentscheidungen v3.11–v3.19
- **editingSequenceId Format:** Jetzt `seqId-blockIndex` (z.B. `abc123-0`) statt nur `seqId`. WeekRows parsed dieses Format mit Regex und highlightet nur den spezifischen Block.
- **panelWidth:** Im plannerStore persistiert, über Resize-Handle (320–700px) einstellbar.
- **allWeeks Prop:** WeekRows erhält optionale `allWeeks`-Prop mit allen Kalenderwochen beider Semester für Cross-Semester Shift-Select.
- **BatchOrDetailsTab:** Switcher-Komponente — zeigt BatchEditTab bei multiSelection.length > 1, sonst normaler DetailsTab.
- **FlatBlockCard:** Ersetzt alte SequenceCard. Zeigt Blöcke direkt flach, mit Parent-Sequenz-Kontext. Aufklappbare Sections: Felder, Lektionen, Reihen-Einstellungen.
- **CollectionPanel (v3.19):** Eigenständige Komponente als 4. Tab. Datenmodell: `CollectionItem` mit `CollectionUnit[]`. Jede Unit enthält einen Block (ohne Wochen), Lesson-Detail-Snapshots und Original-Lektionstitles. Archiv-Hierarchie: UE < Sequenz < Schuljahr < Bildungsgang. Import erstellt neue Sequenz ohne Wochen-Zuweisung; Optionen für Notizen/Materiallinks. `collection[]` im plannerStore persistiert via `partialize`.
- **ZoomBlockView v3.20–v3.21:** Komplett umgebaut. KW-Zeilen-Layout mit rowSpan für zusammenhängende Sequenz-Blöcke. Nutzt `usePlannerData()`. BlockSpan-Datenstruktur: für jeden Kurs werden kontiguitive Wochenläufe eines Blocks berechnet und als `Map<"startIdx:courseId", BlockSpan>` gespeichert. `skipSet` (Set<string>) trackt welche Zellen von einem rowSpan überdeckt sind. Farbcode: `subjectArea` wird aus Block → Sequenz → weekData-Lektionstyp inferiert (Fallback-Kette). Spaltenbreite 80px.
- **sidePanelTab:** Erweitert auf `'details' | 'sequences' | 'collection' | 'settings'`.

## Offenes Feedback (noch nicht umgesetzt)

### 🔴 Nächste Phase: Multi-Planer Generalisierung (Phase 2+)
1. ~~**Kurs-Management-UI (Phase 2):**~~ ✅ Erledigt (v3.43–v3.44)
2. **Konfigurierbare Kategorien (Phase 3):** ✅ **Vollständig erledigt (v3.47–v3.49).** Phase 1: `data/categories.ts` als Single Source of Truth. Phase 2: Alle Komponenten migriert (SidePanel, Zoom-Views, Toolbar, WeekRows). Phase 3: Settings-UI (SubjectsEditor) mit Farbwähler. Einzige verbleibende WR-spezifische Stelle: `TYPE_LABELS` in ExcelImport.tsx (Legacy, bewusst belassen).
3. **Template-System (Phase 6):** ~~Bestehenden Planer als Vorlage für neuen verwenden.~~ Basis implementiert (v3.44: Kurse/Ferien kopieren). Erweiterung: Komplette Planer-Daten als Template, Vorlagen-Bibliothek.

### 🟡 Geplant (mittlere Priorität)
1. **Google Calendar Integration** — Konzept dokumentiert (siehe Feature-Spec oben). Planer→Kalender Sync, Kalender→Planer Import, Kollisionswarnungen.
2. **Dauer-Warnung bei Verschieben (1L↔2L):** Relevant wenn cross-column oder Sequenz-Auto-Place erweitert wird.

### 🔴 Offen (niedrige Priorität)
3. **Event-Overlay Name-Verschiebung:** Bei partielle Sonderwochen, wenn eine Unterrichts-Kachel genau über dem Event-Namen liegt, soll der Name nach links/rechts verschoben und in beiden Teilen gezeigt werden. (Komplex, CSS-Technik nötig)
4. **IW-Plan Auto-Verknüpfung:** Automatische Erkennung von IW-Events und Einblendung eines konfigurierbaren IW-Plan-Links im DetailPanel. Aktuell Empfehlung: Material-Links nutzen.

### 🔵 Ideen (niedrige Priorität)
3. **Automatischer Lehrplanbezug:** Lehrplanziele automatisch aus Thema/Fachbereich vorschlagen.
4. **Zoom 1 (Multi-Year):** Weitere Verbesserungen der Jahrgänge-Ansicht.

### 🟢 Erledigt (v3.11–v3.29)
- ✅ Helligkeit vergangene Wochen (0.4→0.6)
- ✅ Panel-Kontrast (hellerer Hintergrund #151b2e)
- ✅ Panel-Resize mit Handle (320–700px)
- ✅ Bug: Sequenz-Abwahl bei Esc/Klick leere Zelle
- ✅ Shift-Klick über Semesterwechsel
- ✅ Flache Sequenz-Darstellung (FlatBlockCard)
- ✅ Tab "Sequenz" → "Sequenzen"
- ✅ Batch-Editing bei Mehrfachauswahl (Fachbereich, Kategorie, Dauer, SOL)
- ✅ Panel öffnet bei Multi-Select
- ✅ Sequenz-Highlighting mit Block-Präzision
- ✅ Neue Sequenz aus EmptyCellMenu setzt korrektes Block-Format
- ✅ Legende: BWL/VWL/Recht separat, Event grau, Ferien weiss
- ✅ Sequenz-Bar: 5px breit, hover-Effekt, sticky bei Kachel (nicht bei leeren Zellen)
- ✅ SequencePanel Felder/Lektionen/Reihe: Tab-Styling (aktiv hervorgehoben)
- ✅ Fachbereich-Klick in Sequenz: Modal bleibt offen (Collapse-Fix via useEffect)
- ✅ Kontextmenü bei Cursor-Position (auch bei Doppelklick leere Zelle)
- ✅ Sequenz-Bar/Label: Klick = nur Highlight im Planer, Doppelklick = Sequenz-Tab öffnen
- ✅ Lektion in Sequenz klicken: Fachbereich wird von Block/Sequenz geerbt
- ✅ "Zu Sequenz hinzufügen"-Button im DetailPanel (neue oder bestehende Sequenz)
- ✅ Fachbereich-Mismatch-Warnung: ⚠ Topic passt zu VWL (geerbt: RECHT) + Korrigieren-Button
- ✅ Reihe-Konzept UX: Erklärtext, editierbarer Titel, Sequenz-Zähler im Header
- ✅ Hover-Preview Timer reduziert (2s → 800ms)
- ✅ Feiertag-Erkennung bei Settings-Import (Auffahrt, Pfingsten etc.)
- ✅ Delete/Backspace-Taste löscht selektierte Zelle (mit Undo)
- ✅ Scroll-to-Current-Button (◉) in Toolbar
- ✅ Geerbter Fachbereich: Label-Hinweis "(geerbt von Sequenz)"
- ✅ Keyboard-Hilfe: Delete, Pfeiltasten dokumentiert
- ✅ Materialsammlung (Sammlung-Tab): 4. Tab "📚 Sammlung" mit Archivieren (UE, Sequenz, Schuljahr, Bildungsgang) und Import (Notizen/Materiallinks optional). 💾-Buttons in FlatBlockCard.
- ✅ Zoom 2 (Mittlere Ansicht): Komplett neu als KW-Zeilen-Layout mit Sequenz-Balken, Ferien-Kollabierung, usePlannerData()-Migration, Klick→Sequenz/Doppelklick→Zoom3.
- ✅ Zoom 1 Ist-Zustand: ActualDataCard mit Semester-Zuordnung via s2StartIndex + Kurs-Filterung. Labels Deutsch.
- ✅ Zoom 1 Labels: "Multi-Year Overview"→"Mehrjahresübersicht", "Lehrplan"→"Stoffverteilung".
- ✅ Feiertage blockieren: getAvailableWeeks überspringt Wochen mit type 5/6 explizit (auch globale Feiertage). Settings auto-apply bei Speichern und App-Init.
- ✅ HoverPreview v2: Farbiger Header, Notizen prominent (6 Zeilen), Beschreibung, SOL, Materiallinks, smarte Positionierung, Block-Vererbung.
- ✅ UX-Kontrast: gray-500→gray-400 für bessere Lesbarkeit aller Labels in allen Panels.
- ✅ Zoom 2 Block-Index: Klick auf Sequenz-Block öffnet korrekten Block (nicht nur Sequenz).
- ✅ Toolbar Cleanup: Excel-Import-Button entfernt, Settings über SidePanel. ⓘ-Icon entfernt. Bundle halbiert.
- ✅ Deploy-Fix: Kombinierte Site (Uebungen + Unterrichtsplaner). SW-Scope korrigiert.
- ✅ Notizen-Spalte (v3.25–v3.26): Aufklappbar pro Kurs via 📝-Toggle im Header. Inline-editierbare NoteCell, 200px Default, resizable (80–400px), Zeilenumbrüche. Löst "Detailspalte / Notiz-Ansicht" Feature-Request.
- ✅ HoverPreview Positionierung (v3.26): Zeigt nach oben bei Zellen im unteren Bildschirmdrittel.
- ✅ Zoom 2 Farbpalette (v3.27): Dark-Mode-Farben (VWL=orange, BWL=blau, Recht=grün), grössere Schrift, breitere Spalten.
- ✅ Zoom 2 Jahresansicht (v3.28): Ganzes Schuljahr in einer Tabelle. Kurse nach cls+typ gruppiert. 2-Tage-Kurse: breiter Balken bei geteilter Sequenz, 2 schmale Sub-Spalten bei separaten.
- ✅ SOL-Total (v3.29): Σ-Badge zeigt Summe aller Lektion-SOL-Einträge pro Sequenz. utils/solTotal.ts.
