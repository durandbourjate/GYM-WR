# Unterrichtsplaner – Handoff v3.80

## Status: 🔜 v3.80 — 8 Tasks offen

---

## Originalauftrag v3.80 (04.03.2026)

| # | Typ | Beschreibung |
|---|-----|-------------|
| C1 | UX | Settings-Rubriken: Buttons in Kopfzeile (Hinzufügen + Speichern + Laden + Import) |
| C2 | Bug | Hardcoded Stundenplan-Import-Hint bei leeren Kursen entfernen |
| C3 | Bug | Hardcoded Ferien + Lehrplanziele bei neuem Planer entfernen |
| C4 | Feature | Fachbereich-Import: Vorlagen für andere Fächer anbieten (nicht nur W&R) |
| C5 | UX | Kurs-Header: Stufe anzeigen (z.B. SF GYM2 2L), GK-Badge weglassen, nur HK anzeigen |
| C6 | Feature | Stoffverteilung-Import für alle Fächer anbieten (Mehrjahresübersicht) |
| C7 | Feature | TaF-Phasenmodell: Import aus JSON (statt nur manuell + hinzufügen) |
| C8 | Feature | Startbildschirm: Import-Buttons für Ferien, Sonderwochen, Beurteilungen, Stundenplan etc. |

**Empfohlene Reihenfolge:** C3 → C2 → C1 → C5 → C4 → C6 → C7 → C8

---

### Task C1: UX — Settings-Rubriken: alle Buttons in Kopfzeile

**Betrifft:** Alle Rubriken in `SettingsPanel` (Fachbereiche, Kurse, Ferien, Sonderwochen, Lehrplanziele, Beurteilungsregeln)

**Ist-Zustand (Screenshot `bei_allen_einstellungen...`):**
- Kopfzeile zeigt nur «💾 Speichern» + «📂 Laden»
- «+ Hinzufügen» und «📥 Import» sind nur unten in der Rubrik als separate Buttons

**Ziel — Kopfzeile jeder Rubrik (links → rechts):**
```
[Rubrik-Titel + Anzahl]   [+ Hinzufügen] [💾 Speichern] [📂 Laden] [📥 Import]  [▼]
```
- Alle Buttons gleiche kompakte Grösse wie bestehende Speichern/Laden-Buttons
- Buttons nur anzeigen wenn die Rubrik die jeweilige Aktion unterstützt
- «+ Hinzufügen»-Button unten (gestrichelt) kann bleiben oder entfernt werden — Hauptsache oben vorhanden

**Hinweis:** `Section`-Komponente hat bereits `actions`-Prop (eingeführt in B9). Falls vorhanden, darauf aufbauen. Buttons für alle 6 Rubriken ergänzen.

---

### Task C2: Bug — Hardcoded Stundenplan-Import-Hint bei leeren Kursen entfernen

**Betrifft:** Kurse-Rubrik in `SettingsPanel` (oder Kurs-Leer-Zustand)

**Ist-Zustand (Screenshot `das_ist_auch_hardcoded_stundenplan...`):**
Wenn keine Kurse konfiguriert sind, erscheint ein blauer Hinweis-Banner:
> «Keine Kurse konfiguriert. Du kannst den aktuellen Stundenplan importieren oder von Grund auf neu anfangen.»
> [📋 Aktuellen Stundenplan (DUY SJ 25/26) importieren]

**Problem:** Dieser Hinweis ist hardcoded auf DUY/SJ 25/26. In einem generischen Planer ist das irreführend.

**Lösung:**
- Hinweis-Banner und den hardcoded Import-Button komplett entfernen
- Leer-Zustand der Kurse-Rubrik: neutral lassen (kein spezifischer Stundenplan erwähnt)
- Der normale «+ Kurs hinzufügen» + «📥 Import»-Button reichen

---

### Task C3: Bug — Hardcoded Ferien + Lehrplanziele bei neuem Planer entfernen

**Betrifft:** `plannerStore` / `settingsStore` — Initialisierungsdaten beim Erstellen eines neuen Planers

**Ist-Zustand (Screenshot `ferien_und_lehrplanziele_bei_neuem_planer_schon_drin...`):**
Ein frisch erstellter Planer enthält bereits:
- **Ferien (4):** Herbstferien KW39–41, Winterferien KW52–01, Sportferien KW06, Frühlingsferien KW15–16
- **Lehrplanziele (40):** Vermutlich hardcoded W&R-Lehrplanziele

**Problem:** Diese Daten sind spezifisch für Gymnasium Bern SJ 25/26 und sollten nicht automatisch in jeden neuen Planer eingefügt werden.

**Lösung:**
1. Neuer Planer startet mit **leeren** Ferien, Sonderwochen, Lehrplanzielen, Beurteilungsregeln
2. Einzige Ausnahme: Wenn auf dem Startbildschirm «✅ Ferien eintragen» aktiviert ist **und** ein Ferienpreset ausgewählt wurde → nur dann Ferien eintragen
3. Lehrplanziele: komplett leer bei neuem Planer. Import über «📥 Import»-Button oder Sammlung
4. In `plannerStore` / `settingsStore` den Default-State auf leere Arrays setzen (`holidays: []`, `curriculumGoals: []`)

---

### Task C4: Feature — Fachbereich-Import: Vorlagen für andere Fächer

**Betrifft:** Fachbereiche-Rubrik in `SettingsPanel`, Import-Button

**Ist-Zustand (Screenshot `fur_fachbereich_import_auch_andere_facher...`):**
Fachbereiche zeigen W&R-Vorlage (VWL orange, BWL blau, Recht grün). Import-Button existiert, aber keine Vorlagen für andere Fächer.

**Ziel:** Beim Klick auf «📥 Import» in der Fachbereiche-Rubrik ein **Vorlagen-Dropdown** oder **Vorlagen-Dialog** anbieten:

```
📥 Import
  ├── 📂 Aus Datei (JSON)
  ├── ── Vorlagen ──
  ├── 🎓 W&R (VWL / BWL / Recht)
  ├── 🔬 Naturwissenschaften (Bio / Chemie / Physik)
  ├── 🌍 Sprachen (Deutsch / Englisch / Französisch)
  ├── 📐 Mathematik & Informatik
  └── ✏️ Leer (nur Vorlage-Struktur)
```

- Vorlagen als hardcoded Array in einer Datei `data/subjectPresets.ts`
- Klick auf Vorlage → öffnet Bestätigungs-Dialog («Bestehende ersetzen» / «Ergänzen»)
- Duplikat-Prüfung wie bei normalem Import (by `id` oder `name`)

---

### Task C5: UX — Kurs-Header: Stufe anzeigen, GK weglassen, nur HK anzeigen

**Betrifft:** Kurs-Spaltenheader in `WeekRows` (Hauptplaner-Ansicht)

**Ist-Zustand (Screenshot `hier_auch_stufe_angeben_z_b_SF_GYM2_2L...`):**
Kurs-Header zeigt: `[SF] [GK] [2L] [14 frei]`

**Probleme:**
1. «GK» (Gesamtklasse) ist uninformativ — wird nie gebraucht, immer klar
2. Keine GYM-Stufe sichtbar (z.B. GYM2)
3. HK (Halbklasse) ist relevant → soll angezeigt werden

**Ziel-Format:**
```
[SF] [GYM2] [2L] [14 frei]   ← wenn Stufe vorhanden, kein GK/HK-Badge nötig
[IN] [HK] [2L] [14 frei]     ← wenn hk=true, HK-Badge anzeigen (kein GK)
[EWR] [GYM1] [1L] [20 frei]
```

**Regeln:**
- `hk: true` → Badge «HK» anzeigen (lila oder eigene Farbe)
- `hk: false` → **kein** GK-Badge
- `gymLevel` (z.B. «GYM2») → Badge anzeigen falls vorhanden, kein separates GK
- Reihenfolge: Typ → Stufe/HK → Lektionen → Frei-Zähler

---

### Task C6: Feature — Stoffverteilung-Import für alle Fächer

**Betrifft:** `ZoomYearView` / Mehrjahresübersicht, «Stoffverteilung»-Tab

**Ist-Zustand (Screenshot `import_stoffverteilung_fur_alle_facher...`):**
Leer-Zustand zeigt: «Keine Stoffverteilung konfiguriert» + Button «📥 Stoffverteilung importieren (JSON)»

**Ziel:** Analog zu C4 — beim Import-Button **Vorlagen** für gängige Fächer anbieten:

```
📥 Stoffverteilung importieren
  ├── 📂 Aus Datei (JSON)
  ├── ── Vorlagen ──
  ├── 📘 W&R Schwerpunktfach (DUY, Lehrplan 17 Kt. Bern)
  ├── 📗 W&R Ergänzungsfach
  └── ✏️ Leere Vorlage
```

- W&R-SF-Vorlage entspricht der `DUY_Grobzuteilung`-Tabelle aus dem Projektdokument (S1–S8, Recht/BWL/VWL-Gewichtungen)
- Vorlage als hardcoded JSON in `data/stoffverteilungPresets.ts`
- Format muss zum bestehenden Import-Format der Mehrjahresübersicht passen

**W&R SF Vorlage (DUY):**
```json
[
  { "semester": 1, "gymLevel": "GYM1", "subjects": { "BWL": 3, "Recht": 0, "VWL": 0 } },
  { "semester": 2, "gymLevel": "GYM1", "subjects": { "BWL": 2, "Recht": 1, "VWL": 0 } },
  { "semester": 3, "gymLevel": "GYM2", "subjects": { "BWL": 1, "Recht": 2, "VWL": 2 } },
  { "semester": 4, "gymLevel": "GYM2", "subjects": { "BWL": 0, "Recht": 3, "VWL": 2 } },
  { "semester": 5, "gymLevel": "GYM3", "subjects": { "BWL": 0, "Recht": 2, "VWL": 2 } },
  { "semester": 6, "gymLevel": "GYM3", "subjects": { "BWL": 2, "Recht": 0, "VWL": 2 } },
  { "semester": 7, "gymLevel": "GYM4", "subjects": { "BWL": 0, "Recht": 2, "VWL": 2 } },
  { "semester": 8, "gymLevel": "GYM4", "subjects": { "BWL": 2, "Recht": 0, "VWL": 2 } }
]
```

---

### Task C7: Feature — TaF-Phasenmodell: JSON-Import

**Betrifft:** `TaFPanel` (Modal «TaF Phasenmodell»)

**Ist-Zustand (Screenshot `Phasen_aus_Phasenplan_importieren_als_json`):**
Modal zeigt «Noch keine TaF-Phasen definiert» + «+ Phase hinzufügen» (nur manuell)

**Ziel:** Import-Button «📥 Import (JSON)» hinzufügen

**Format:**
```json
[
  { "name": "Phase 1", "startKW": 33, "endKW": 38, "semester": 1 },
  { "name": "Phase 2", "startKW": 47, "endKW": 5,  "semester": 1 },
  { "name": "Phase 3", "startKW": 7,  "endKW": 12, "semester": 2 },
  { "name": "Phase 4", "startKW": 17, "endKW": 25, "semester": 2 }
]
```

- Preset «SJ 25/26 Hofwil» als Vorlage direkt im Dialog anbieten (hardcoded, einmaliger Klick)
- Preset-Daten: Phase 1 KW33–38, Phase 2 KW47–5, Phase 3 KW7–12, Phase 4 KW17–25
- Duplikat-Prüfung by `name + startKW`

---

### Task C8: Feature — Startbildschirm: Import-Optionen erweitern

**Betrifft:** Startbildschirm (leerer Zustand, kein Planer vorhanden), `PlannerTabs` oder `App.tsx`

**Ist-Zustand (Screenshot `startbildschirm_import_von_jsons...`):**
Startbildschirm zeigt nur: Name-Eingabe + SJ-Dropdown + «✅ Ferien eintragen» + «+ Neuen Planer erstellen»
Hinweis: «Oder importiere einen bestehenden Planer via JSON-Datei (Tab-Leiste → 📥 Import)»

**Ziel:** Direkt auf dem Startbildschirm zusätzliche Import-Schnellzugriffe anbieten:

```
+ Neuen Planer erstellen

── oder direkt importieren ──
[📥 Ferien]  [📥 Sonderwochen]  [📥 Stundenplan]  [📥 Beurteilungsregeln]
```

- Diese Buttons öffnen direkt den Datei-Picker für das jeweilige JSON-Format
- Nach dem Import + «Planer erstellen» werden die importierten Daten direkt in den neuen Planer übernommen
- Alternativ: Die Buttons erscheinen erst **nach** «Neuen Planer erstellen» als Onboarding-Schritt

---

### Commit-Anweisung (nach allen 8 Tasks)

```bash
npm run build 2>&1 | tail -20
git add -A
git commit -m "v3.80: Settings-Buttons (C1), Hardcoded-Daten entfernt (C2+C3), Fachbereich-Vorlagen (C4), Kurs-Header (C5), Stoffverteilung-Vorlagen (C6), TaF-Import (C7), Startscreen-Import (C8)"
git push
# HANDOFF.md: Status auf ✅, alle Tasks dokumentieren
```

---

## Status: ✅ v3.79 — 7 Tasks erledigt (Import, Bugs, UX, Auto-Zoom)
- **Datum:** 2026-03-04
- **Basis:** v3.78 (gebaut + deployed)
- **Deploy:** https://durandbourjate.github.io/GYM-WR-DUY/Unterrichtsplaner/

---

## ✅ Erledigte Tasks v3.79

| # | Task | Status |
|---|------|--------|
| B5 | Duplikat-Prüfung beim Import (Ferien, Sonderwochen, Beurteilungsregeln) | ✅ |
| B6 | Import-Button für Fachbereiche (JSON) | ✅ |
| B7 | Import-Button für Kurse (JSON) | ✅ |
| B8 | Bug — Jahrgänge-Tab weisse Seite (SUBJECT_COLORS Fallback) | ✅ |
| B9 | UX — Settings-Rubriken Buttons in Kopfzeile (Section actions-Prop) | ✅ |
| B10 | Bug — Side-Panel Scroll-Verhalten (overscroll-behavior: contain) | ✅ |
| B11 | Auto-Zoom an Bildschirmbreite (autoFitZoom Toggle + table-fixed) | ✅ |

### Änderungen im Detail

**B5:** Import-Handler für Ferien (`label+startWeek`), Sonderwochen (`label+week`), Beurteilungsregeln (`label+semester+stufe`) prüfen auf Duplikate. Feedback: "X importiert, Y übersprungen".

**B6:** `📥 Import`-Button im SubjectsEditor. Format: `SubjectConfig[]` oder `{subjects: [...]}`. Duplikat-Prüfung by id/label.

**B7:** `📥 Import`-Button im CourseEditor. Format: `CourseConfig[]` oder `{kurse: [...]}` oder `{courses: [...]}`. Duplikat-Prüfung by `cls+day+from`.

**B8:** `SUBJECT_COLORS[area]` konnte `undefined` zurückgeben bei custom SubjectAreas → Crash. Fix: `sc(area)` Helper mit `FALLBACK_SC` Fallback-Farben.

**B9:** `Section`-Komponente erweitert um `actions`-Prop (React.ReactNode). `RubricCollectionButtons` aus Section-Body in Section-Header verschoben für alle 6 Rubriken.

**B10:** `overscroll-behavior: contain` auf Panel-Root, SettingsPanel, BatchOrDetailsTab, SequencePanel. Verhindert Scroll-Propagation zum Planer.

**B11:** `autoFitZoom` Boolean im plannerStore. Toggle-Button `⟷` in Toolbar (nur bei Zoom 3). Tabellen wechseln zwischen `w-max min-w-full` (normal) und `table-fixed w-full` (Auto-Fit).

---

## Aufgaben-Details (Originaltext)

---

## Originalauftrag v3.79

### Vorbereitung abgeschlossen (in diesem Chat)

Folgende Datendateien wurden bereits erstellt/aktualisiert:
- `src/data/iwPresets.ts` — IW-Presets v2 (detailiert nach GYM-Stufe, korrekte Labels)
- `src/data/stundenplan_alle_phasen.md` — Stundenplan-Dokumentation alle 4 Phasen
- `src/data/kurse_duy_2526.json` — Import-Vorlage für Kurs-Import (JSON, 16 Einträge)

### Task B5: Duplikat-Prüfung beim Import (Ferien + Sonderwochen + Beurteilungsregeln)

**Betrifft:** Alle Import-Handler in SettingsPanel (oder deren Store-Funktionen)

**Problem:** Wenn man Ferien oder Sonderwochen zweimal importiert, entstehen Duplikate.

**Lösung:** Vor dem Hinzufügen eines Eintrags prüfen, ob ein Eintrag mit identischen Schlüsselfeldern bereits existiert. Duplikate überspringen.

**Duplikat-Keys:**
- Ferien: `label + week` (z.B. "Herbstferien" + "41")
- Sonderwochen (SpecialWeekConfig): `label + week + gymLevel`
- Beurteilungsregeln: `courseId + semester` (falls vorhanden; sonst `label + courseId`)

**Feedback nach Import:** Statt nur "X Einträge importiert" → "X importiert, Y übersprungen (bereits vorhanden)"
- Toast-Meldung (wie bestehende Import-Toasts) mit beiden Zahlen
- Y=0 → normales Feedback ohne "übersprungen"

**Hinweis:** Ferien-Import ist in `SettingsPanel.tsx` (handleHolidayImport o.ä.), Sonderwochen-Import ebenfalls. Beurteilungsregeln-Import (JSON) analog.

---

### Task B6: Import-Button für Fachbereiche

**Betrifft:** Fachbereiche-Rubrik in SettingsPanel

**Problem:** Fachbereiche haben nur Speichern/Laden via Sammlung. Kein direkter Datei-Import.

**Lösung:** `📥 Import`-Button zur Fachbereiche-Rubrik hinzufügen (gleiche Position wie bei Ferien/Sonderwochen — kleiner Button links der Rubrik-Überschrift oder bei den anderen Buttons).

**Format:** JSON-Array von `SubjectConfig[]`
```json
[
  { "id": "vwl", "name": "VWL", "color": "#f97316", "active": true },
  { "id": "bwl", "name": "BWL", "color": "#3b82f6", "active": true },
  { "id": "recht", "name": "Recht", "color": "#22c55e", "active": true }
]
```

**Duplikat-Prüfung (B5 integriert):** Prüfen ob `id` oder `name` bereits existiert → überspringen.

**Toast-Feedback:** "X Fachbereiche importiert, Y übersprungen."

**Hinweis:** `SubjectConfig` Typ in `settingsStore.ts` nachschauen. Import-Handler analog zu Ferien-Import.

---

### Task B7: Import-Button für Kurse

**Betrifft:** Kurse-Rubrik in SettingsPanel

**Problem:** Kurse können exportiert werden, aber nicht direkt aus JSON importiert (nur via manuelle Eingabe oder GCal).

**Lösung:** `📥 Import`-Button zur Kurse-Rubrik.

**Format:** JSON-Objekt mit `kurse`-Array (entspricht `kurse_duy_2526.json` in `src/data/`):
```json
{
  "_meta": { ... },
  "kurse": [ { "id": "c11", "cls": "29c", "typ": "SF", ... }, ... ]
}
```
Alternativ auch direkt `CourseConfig[]` (Array ohne Wrapper) unterstützen.

**Duplikat-Key:** `cls + day + from` (gleiche Klasse, gleicher Tag, gleiche Anfangszeit = Duplikat)
- Falls `id` identisch → ebenfalls Duplikat

**Toast-Feedback:** "X Kurse importiert, Y übersprungen."

**Hinweis:** `Course`-Typ (oder `CourseConfig`) in `types.ts` / `settingsStore.ts` nachschauen. `COURSES`-Array in `courses.ts` ist das Format-Referenz. Importierte Kurse landen im plannerSettings (nicht in der hardcoded `COURSES`-Liste).

---

---

### Task B8: Bug — «Jahrgänge»-Tab zeigt weisse Seite

**Betrifft:** ZoomMultiYearView (oder die Komponente hinter dem «Jahrgänge»-Button in der Zoom-Leiste)

**Problem:** Klick auf «Jahrgänge»-Tab (neben «Stoffverteilung» und «Ist-Zustand») → die gesamte Seite wird weiss (vermutlich ungefangener Render-Fehler / uncaught exception).

**Lösung:**
1. Fehlerursache identifizieren (fehlende Daten? leerer State? fehlender Null-Check?)
2. Absturz beheben — Komponente soll mindestens einen sinnvollen Leer-Zustand zeigen («Noch keine Daten» o.ä.) statt zu crashen
3. Optional: React Error Boundary um die Jahrgänge-Komponente, damit ein Crash nicht die ganze App reisst

**Hinweis:** Könnte mit fehlenden Fachbereichen oder leerem `plannerSettings` zusammenhängen. `ZoomYearView` oder `ZoomMultiYearView` in den Haupt-Komponenten suchen.

---

### Task B9: UX — Einstellungs-Rubriken: Buttons in Kopfzeile verschieben

**Betrifft:** Alle Rubriken in SettingsPanel (Kurse, Fachbereiche, Ferien, Sonderwochen, Lehrplanziele, Beurteilungsregeln — überall wo es Speichern/Laden/Hinzufügen/Import gibt)

**Problem:** Aktuell sind «+ Hinzufügen» und «📥 Import» als separate Buttons am unteren Ende der Rubrik, während «💾 Speichern» / «📂 Laden» oben links stehen. Das ist inkonsistent und braucht unnötig Platz.

**Ziel-Layout** (aus Screenshot — Sonderwochen als Referenz):
```
┌─────────────────────────────────────────────────┐
│ 📅 Sonderwochen (5)                          ▼  │
│  [+ Hinzufügen]  [💾 Speichern]  [📂 Laden]  [📥 Import]  │
│                                                 │
│  ... Einträge ...                               │
└─────────────────────────────────────────────────┘
```

**Reihenfolge in der Kopfzeile (links nach rechts):** `+ Hinzufügen` → `💾 Speichern` → `📂 Laden` → `📥 Import`

**Gilt für alle Rubriken** die mindestens einen dieser Buttons haben. Buttons die nicht existieren (z.B. keine Import-Funktion bei Lehrplanzielen) einfach weglassen.

**Styling:** Kleine kompakte Buttons (wie die bestehenden Speichern/Laden-Buttons), gleiche Höhe, gleicher Abstand. Der Rubrik-Header `<div>` muss `flex`+`items-center`+`justify-between` oder ähnlich werden.

**Achtung:** Der «+ Sonderwoche hinzufügen»-Button unten (gestrichelt) kann bleiben oder entfernt werden — Hauptsache der Button ist oben vorhanden.

---

### Task B10: Bug — Side-Panel scrollt nicht (Planer scrollt stattdessen)

**Betrifft:** Side-Panel (rechtes Panel: Unterrichtseinheit / Sequenzen / Sammlung / Einstellungen)

**Problem (aus Screenshot):** Wenn der Inhalt im Side-Panel länger als die Bildschirmhöhe ist, scrollt nicht das Panel, sondern der Planer-Hintergrund. Das Panel «klebt» oben und lässt sich nicht nach unten scrollen.

**Ursache (wahrscheinlich):** `overflow-hidden` oder fehlendes `overflow-y-auto` auf dem Panel-Container oder dessen Scroll-Wrapper. Evtl. fehlt `overscroll-contain` um den Scroll vom Planer zu isolieren.

**Lösung:**
1. Panel-Wrapper: `overflow-y-auto` sicherstellen + `overscroll-contain` (verhindert Scroll-Propagation zum Planer)
2. Panel-Wrapper: `max-h` muss auf Viewport-Höhe begrenzt sein (z.B. `h-full` oder `max-h-screen`)
3. Innere Scroll-Container der Tabs (Unterrichtseinheit, Sequenzen etc.) ebenfalls prüfen
4. Mousewheel-Events: `e.stopPropagation()` am Panel-Root wenn nötig, um Scroll-Bubbling zu verhindern

**Hinweis:** Dieser Bug wurde in v3.78 (#14) schon einmal angegangen. Evtl. ist das `overflow-hidden` auf dem äusseren Container korrekt, aber ein inneres Element fehlt `overflow-y-auto`. Den ganzen Panel-Stack (äusseres Div → Tab-Wrapper → Tab-Inhalt) auf Overflow-Konfiguration prüfen.

---

### Task B11: Feature — Zoom automatisch an Bildschirmbreite anpassen

**Betrifft:** Haupt-Planer-Ansicht (WeekRows / Zoom-Steuerung)

**Problem (aus Screenshot):** Die Tabelle ist breiter als der Bildschirm → horizontales Scrollen nötig. Kein automatisches Anpassen.

**Ziel:** Einen «Auto-Fit»-Modus einführen, der die Spaltenbreite (und ggf. Schriftgrösse) so skaliert, dass alle Kursspalten ohne horizontales Scrollen sichtbar sind.

**Lösung — 2 Teile:**

**Teil 1: Auto-Fit-Logik**
- `useEffect` der auf `window.innerWidth` und Anzahl der sichtbaren Kursspalten reagiert
- Berechne optimale Spaltenbreite: `verfügbare Breite / Anzahl sichtbare Spalten`
- Setze CSS-Variable oder State `colWidth` entsprechend
- Mindestbreite pro Spalte: ~80px (darunter wird es unleserlich)
- Bei weniger Spalten (z.B. nur SF gefiltert): breitere Spalten

**Teil 2: Zoom-Button erweitern**
Aktuell gibt es Zoom-Buttons (aus Screenshot: Raster-Icon, Spalten-Icon, Kreis-Icon in der Toolbar). Diese sollen um «Auto»-Modus ergänzt werden:

- Neuer Button «⊞ Auto» (oder ähnliches Icon) in der Zoom-Gruppe
- Beim Klick: Auto-Fit aktivieren (Spaltenbreite passt sich dynamisch an)
- Auto-Fit bleibt aktiv bis manueller Zoom gewählt wird
- `ResizeObserver` auf dem Planer-Container für reaktives Update beim Fenstergrössen-Ändern

**State:** `zoomMode: 'auto' | 'compact' | 'normal' | 'wide'` (oder wie die bestehenden Modi heissen)
- Auto = dynamisch berechnet
- Die anderen Modi = fixe Spaltenbreiten (bestehende Logik)

**Persistenz:** `zoomMode` im plannerStore speichern (bereits der Fall für andere Zoom-Modi).

---

### Commit-Anweisung (nach allen 7 Tasks B5–B11)

```bash
# Build prüfen:
npm run build 2>&1 | tail -20

# Committen:
git add -A
git commit -m "v3.79: Import-Duplikatprüfung, Fachbereich/Kurs-Import, Jahrgänge-Bug, Settings-Header-Buttons, Panel-Scroll, Auto-Zoom"
git push

# HANDOFF.md aktualisieren: Status auf ✅, alle 7 Tasks dokumentieren
```

**Empfohlene Reihenfolge:** B8 (Crash-Bug) → B10 (Scroll-Bug) → B9 (UX Settings) → B5 (Import-Duplikat) → B6+B7 (neue Import-Buttons) → B11 (Auto-Zoom)

---

## Erledigte Aufträge (v3.78 — Ergänzung, 7 Tasks)

| # | Typ | Beschreibung | Status |
|---|-----|-------------|--------|
| 14 | Bug | Side-Panel scrollt bei langen Inhalten (overflow-hidden auf Outer, Tab-Inhalte scrollen eigenständig) | ✅ |
| 15 | Bug | Neue UE erscheint oben statt in der Mitte (justify-start, Button zuerst) | ✅ |
| 16 | Bug | UE-Beschriftung im Sequenz-Detailmenü zeigt Thema statt "Neue UE"; 📌-Tooltip hinzugefügt | ✅ |
| 17 | Bug | Notenanzahl-Berechnung korrigiert: Schwelle ≤3L/\>3L (statt ≤2L/\>2L), Default-Regeln aktualisiert | ✅ |
| 18 | UX | Fachbereich-Speichern/Laden-Buttons konsistent links oben (wie andere Rubriken) | ✅ |
| 19 | Feature | Sequenz per Klick+Drag: UE erben Fachbereich aus Settings, blockCategory+duration auto-gesetzt | ✅ |
| 20 | UX | Breadcrumb bereinigt: "Sequenz › Unterrichtseinheit" (statt "Reihe › Sequenz › Block › Lektion") | ✅ |

## Erledigte Aufträge (v3.77 — Auftrag v3.77, 13 Tasks)

| # | Typ | Beschreibung | Status |
|---|-----|-------------|--------|
| 1 | Bug | Linksklick öffnet Modal nicht mehr kurz (nur Doppelklick zeigt EmptyCellMenu) | ✅ |
| 2 | Bug | ESC schliesst Kontextmenü bei Mehrfachauswahl | ✅ |
| 3 | Bug | Wiki-Button entfernt (vermied Duplikat-Tab), Hilfe über ?-Button | ✅ |
| 4+13 | Bug+Feature | Ferien/Sonderwochen werden im Planer korrekt angezeigt (colIdx-Fix in applySettingsToWeekData) | ✅ |
| 5 | UX | Toolbar in 5 logische Gruppen reorganisiert (Add, Filter, Suche, Navigation, Einstellungen) | ✅ |
| 6 | UX | "Seq"-Button entfernt, +-Button mit Dropdown (Neue Sequenz / Neue UE) | ✅ |
| 7 | UX | Import-Button aus Tab-Leiste entfernt (nur noch in Einstellungen) | ✅ |
| 8 | UX | W&R-Vorlage-Button entfernt, ersetzt durch Sammlung-Speichern/Laden für Fachbereiche | ✅ |
| 9 | Feature | Einzelne Rubriken separat in Sammlung speichern/laden (Fachbereiche, Kurse, Ferien, Sonderwochen, Lehrplanziele, Beurteilungsregeln) | ✅ |
| 10 | Feature | Sammlung-Speichern: Dialog "Bestehende ersetzen" oder "Als neue speichern" | ✅ |
| 11 | Feature | Beurteilungsregeln erweitert: Stufe-Dropdown, "Andere…"-Semester mit Datepicker, Lektionenzahl-Schwellenwerte, JSON-Import | ✅ |
| 12 | UX | Zeit-Eingabefelder (Beginn/Ende) auf gleicher Höhe, Pause-Warnung in eigener Zeile | ✅ |

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

## Erledigte Aufträge (v3.76 — Auftrag v3.76, 10 Tasks Bug-Fixes & UX)

| # | Typ | Beschreibung | Status |
|---|-----|-------------|--------|
| 1 | Feature | Kurstyp-Dropdown dynamisch (WR-Typen nur bei WR-Fachbereichen, sonst Freitext) | ✅ |
| 2 | Bug | Doppelklick schliesst Detailfenster nicht mehr (verzögerter Single-Click) | ✅ |
| 3 | UX | «Neue Sequenz»-Button inline wie UE (nicht mehr sticky bottom) | ✅ |
| 4 | Bug | W&R-Vorlage immer sichtbar (mit Tooltip zur Herkunft) | ✅ |
| 5 | UX | Default-Platzhalter «Ende SJ» / «Ende Sem X» bei leerer Deadline | ✅ |
| 6 | Bug | Scrolling im Side-Panel: pb-12 auf allen Scroll-Containern | ✅ |
| 7 | Bug+UX | Ferien erscheinen nach Settings-Änderung + Expand/✕-Buttons vergrössert | ✅ |
| 8 | Bug | Sonderwoche-Formular springt nicht mehr weg (stabiler Key + expandedWeek-Sync) | ✅ |
| 9 | Bug | Neue Sequenz: Platzhalter-Lektionen werden automatisch erstellt | ✅ |
| 10 | UX | Fachbereich-Badge zeigt Herkunft (↓ + gestrichelt = geerbt) | ✅ |

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
- **Wiki:** `wiki.html` (Standalone-HTML, kein Build nötig). Nicht mehr direkt verlinkt (v3.77 #3).
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
- v3.76: Auftrag v3.76 — 10 Tasks (Bug-Fixes & UX: Doppelklick, Ferien, Sonderwoche, Sequenz, Scrolling, Kurstyp, Vorlage, Deadline, Badge)
- v3.77: Auftrag v3.77 — 13 Tasks (Bugs: Klick/ESC/Wiki/Ferien; UX: Toolbar-Reorg, Sammlung-Rubrik, Zeit-Alignment; Features: Rubrik-Collection, Replace/New-Dialog, Assessment-Erweiterung)
- v3.78: Ergänzung v3.78 — 7 Tasks (Panel-Scroll, UE-Position, UE-Beschriftung, Notenberechnung, Fachbereich-Buttons, Drag-Sequenz-Vererbung, Breadcrumb)
